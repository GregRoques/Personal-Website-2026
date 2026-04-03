/**
 * @file routes/instagram.js
 * @description Fetches and caches the 5 most recent Instagram posts.
 * Uses node-cron for a daily refresh, auto-renews the long-lived token
 * before expiration, and persists both the token and cached posts to disk
 * so data survives server restarts.
 */

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const nodemailer = require("nodemailer");

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const TOKEN_PATH = path.join(__dirname, "../util/instaToken.json");
const CACHE_PATH = path.join(__dirname, "../util/instaCache.json");

const INSTAGRAM_API = "https://graph.instagram.com";
const MEDIA_FIELDS =
  "media_url,permalink,caption,timestamp,media_type,thumbnail_url,username,children{media_url,media_type,thumbnail_url}";
const POST_LIMIT = 5;
const CAPTION_MAX_LENGTH = 75;
const TOKEN_REFRESH_DAYS = 50;
const MS_PER_DAY = 86400000;

/** @type {{ access_token: string, token_type: string, expires_at: number, user_id: string, user_name: string }} */
let tokenData = loadJson(TOKEN_PATH, {
  access_token: "",
  token_type: "bearer",
  expires_at: 0,
  user_id: "",
  user_name: "",
});

/** @type {{ userName: string, posts: Array, lastFetched: number }} */
let cache = loadJson(CACHE_PATH, { userName: "", posts: [], lastFetched: 0 });

/* =============================================================================
   UTILITY FUNCTIONS
============================================================================= */

/**
 * @description Reads and parses a JSON file. Returns fallback on failure.
 * @param {string} filePath - Absolute path to the JSON file.
 * @param {Object} fallback - Default value if the file cannot be read.
 * @returns {Object} Parsed JSON or fallback.
 */
function loadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return { ...fallback };
  }
}

/**
 * @description Writes an object to a JSON file.
 * @param {string} filePath - Absolute path to the JSON file.
 * @param {Object} data - Data to persist.
 */
function saveJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[Instagram] Failed to write ${filePath}:`, err.message);
    sendErrorEmail(err);
  }
}

/**
 * @description Truncates a caption to CAPTION_MAX_LENGTH characters,
 * breaking at the last space before the limit.
 * @param {string} caption - Raw caption text.
 * @returns {string} Truncated caption with ellipsis, or original if short enough.
 */
function truncateCaption(caption) {
  if (!caption) return "";
  const trimmed = caption.trim();
  if (trimmed.length <= CAPTION_MAX_LENGTH) return trimmed;
  const sliced = trimmed.slice(0, trimmed.lastIndexOf(" ", CAPTION_MAX_LENGTH));
  return `${sliced.length > 0 ? sliced : trimmed.slice(0, CAPTION_MAX_LENGTH)}...`;
}

/**
 * @description Formats an ISO timestamp into MM-DD-YYYY.
 * @param {string} timestamp - ISO 8601 date string.
 * @returns {string} Formatted date.
 */
function formatDate(timestamp) {
  const d = new Date(timestamp);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}-${d.getFullYear()}`;
}

/**
 * @description Extracts displayable URLs from carousel children.
 * Uses thumbnail_url for videos, media_url for images.
 * @param {Array} children - Array of child media objects from Instagram.
 * @returns {string[]} Array of image/thumbnail URLs.
 */
function extractChildMedia(children) {
  return children.map((child) =>
    child.media_type === "VIDEO" ? child.thumbnail_url : child.media_url
  );
}

/**
 * @description Sends an error-notification email via Nodemailer/Gmail.
 * Runs fire-and-forget so it never blocks the caller.
 * @param {Error} err - The caught error object.
 */
function sendErrorEmail(err) {
  transporter
    .sendMail({
      from: process.env.GMAIL_USER,
      to: "greg.roques@gmail.com",
      subject: "Error: Instagram API",
      html: `
        <p><strong>From:</strong> Instagram Error</p>
        <hr>
        <pre>${err.message || err.stack || err}</pre>
      `,
    })
    .catch((mailErr) => {
      console.error("[Instagram] Failed to send error email:", mailErr.message);
    });
}

/* =============================================================================
   INSTAGRAM API CALLS
============================================================================= */

/**
 * @description Fetches the 5 most recent posts from the Instagram Graph API
 * and updates the in-memory + disk cache.
 */
async function fetchPosts() {
  const { access_token } = tokenData;
  if (!access_token) {
    console.warn("[Instagram] No access token configured — skipping fetch.");
    return;
  }

  try {
    const { data } = await axios.get(`${INSTAGRAM_API}/${tokenData.user_id}/media`, {
      params: {
        fields: MEDIA_FIELDS,
        limit: POST_LIMIT,
        access_token,
      },
    });

    const posts = data.data;
    if (!posts || posts.length === 0) return;

    const userName = posts[0].username || tokenData.user_name;

    if (userName && userName !== tokenData.user_name) {
      tokenData.user_name = userName;
      saveJson(TOKEN_PATH, tokenData);
    }

    cache = {
      userName,
      posts: posts.map((post) => ({
        mediaUrl:
          post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url,
        caption: truncateCaption(post.caption),
        date: formatDate(post.timestamp),
        permalink: post.permalink,
        children: post.children ? extractChildMedia(post.children.data) : null,
      })),
      lastFetched: Date.now(),
    };

    saveJson(CACHE_PATH, cache);
    console.log(`[Instagram] Cache refreshed — ${cache.posts.length} posts.`);
  } catch (err) {
    console.error(
      "[Instagram] Fetch failed:",
      err.response?.status || err.message,
      err.response?.data
    );
    sendErrorEmail(err);
  }
}

/**
 * @description Refreshes the long-lived Instagram access token and
 * persists the updated token data to disk.
 */
async function refreshToken() {
  const { access_token } = tokenData;
  if (!access_token) return;

  try {
    const { data } = await axios.get(
      `${INSTAGRAM_API}/refresh_access_token`,
      {
        params: {
          grant_type: "ig_refresh_token",
          access_token,
        },
      }
    );

    tokenData = {
      access_token: data.access_token,
      token_type: data.token_type || "bearer",
      expires_at: Date.now() + data.expires_in * 1000,
      user_id: tokenData.user_id,
      user_name: tokenData.user_name,
    };

    saveJson(TOKEN_PATH, tokenData);
    console.log("[Instagram] Token refreshed successfully.");
  } catch (err) {
    console.error(
      "[Instagram] Token refresh failed:",
      err.response?.status || err.message
    );
    sendErrorEmail(err);
  }
}

/**
 * @description Checks if the token is approaching expiration and refreshes
 * it if within TOKEN_REFRESH_DAYS of the issue date. Then fetches posts.
 */
async function dailyJob() {
  const now = Date.now();
  const { expires_at, access_token } = tokenData;

  if (!access_token) return;

  if (expires_at > 0 && now > expires_at) {
    console.warn("[Instagram] Token has expired — cannot refresh.");
    sendErrorEmail(new Error("Instagram token has expired — cannot refresh."));
    return;
  }

  const daysUntilExpiry = (expires_at - now) / MS_PER_DAY;
  if (expires_at > 0 && daysUntilExpiry <= 60 - TOKEN_REFRESH_DAYS) {
    await refreshToken();
  }

  await fetchPosts();
}

/* =============================================================================
   INITIALIZATION & SCHEDULING
============================================================================= */

dailyJob();

// Run daily at 3:00 AM server time
cron.schedule("0 3 * * *", () => {
  console.log("[Instagram] Running scheduled daily job...");
  dailyJob();
});

/* =============================================================================
   ROUTE
============================================================================= */

/**
 * @route   GET /instagram
 * @desc    Returns cached Instagram posts and username.
 * @access  Public
 * @returns {{ userName: string, posts: Array }} Cached Instagram data.
 */
router.get("/", (_req, res) => {
  const { userName, posts } = cache;
  return res.json({
    userName: userName || tokenData.user_name || "",
    posts: Array.isArray(posts) ? posts : [],
  });
});

module.exports = router;
