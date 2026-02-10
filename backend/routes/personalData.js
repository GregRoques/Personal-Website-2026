/**
 * @file routes/personalData.js
 * @description Handles contact form submissions. Validates and sanitizes
 * user input, formats a phone number, builds an HTML email, and sends
 * it to the business owner via Nodemailer with Gmail SMTP.
 */

const express = require("express");
const { body, validationResult } = require("express-validator");
const xss = require("xss");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * @description Stricter rate limiter for the contact endpoint — allows a
 * maximum of 5 submissions per 15-minute window from a single IP.
 */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions. Please try again later." },
});

/**
 * @description Formats a raw phone string into XXX-XXX-XXXX.
 * Returns "None Provided" when the input does not contain exactly 10 digits.
 * @param {string} phone - Raw phone input from the user.
 * @returns {string} Formatted phone number or "None Provided".
 */
const formatPhone = (phone) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return "None Provided";
};

/**
 * @description Validation rules applied before the route handler runs.
 * Trims whitespace, enforces length limits, and checks email format.
 */
const validationRules = [
  body("name").trim().notEmpty().withMessage("Name is required.").isLength({ max: 100 }),
  body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("phone").trim().isLength({ max: 30 }),
  body("message").trim().notEmpty().withMessage("Message is required.").isLength({ max: 5000 }),
  body("subject").trim().notEmpty().withMessage("Subject is required.").isLength({ max: 200 }),
];

/**
 * @route   POST /personaldata
 * @desc    Receives contact form data, validates it, sanitizes all fields
 *          against XSS, and sends a formatted email via Nodemailer/Gmail.
 * @access  Public
 *
 * @param {import('express').Request}  req - Express request object.
 * @param {string} req.body.name    - Sender's full name.
 * @param {string} req.body.email   - Sender's email address.
 * @param {string} req.body.phone   - Sender's phone number.
 * @param {string} req.body.message - Message body.
 * @param {string} req.body.subject - Email subject line.
 * @param {import('express').Response} res - Express response object.
 *
 * @returns {{ success: boolean, message: string }} JSON confirmation or error.
 */
router.post("/", contactLimiter, validationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const name = xss(req.body.name);
    const email = xss(req.body.email);
    const phone = xss(req.body.phone || "");
    const message = xss(req.body.message);
    const subject = xss(req.body.subject);

    const formattedPhone = formatPhone(phone);
    const sendDate = new Date().toISOString().slice(0, 10);

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.EMAIL_TO,
      subject,
      html: `
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${formattedPhone}</p>
        <p><strong>Date:</strong> ${sendDate}</p>
        <hr>
        <p>${message}</p>
      `,
    });
    return res.status(200).json({ success: true, message: "Message sent successfully." });
  } catch (err) {
    console.error("Email error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to send message." });
  }
});

module.exports = router;
