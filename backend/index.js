/**
 * @file index.js
 * @description Express server entry point for the portfolio backend API.
 * Configures middleware for security, logging, rate limiting, and CORS,
 * then mounts the contact form route.
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const personalData = require("./routes/personalData");

const app = express();

/**
 * @description CORS configuration — restricts allowed origins to the
 * value set in the CORS_ORIGIN environment variable.
 */
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  methods: ["POST"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

/** @description Helmet sets secure HTTP headers automatically. */
app.use(helmet());

/** @description HTTP request logger (combined format for production, dev for development). */
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/** @description Parse incoming JSON and URL-encoded request bodies. */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

/**
 * @description Global rate limiter — allows a maximum of 50 requests per
 * 15-minute window from a single IP address.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

app.use(globalLimiter);

/**
 * @route /personaldata
 * @description Contact form endpoint — accepts POST requests with customer
 * messages and forwards them via SendGrid email.
 */
app.use("/personaldata", personalData);

/**
 * @route GET /health
 * @description Health-check endpoint for uptime monitoring.
 * @returns {{ status: string }} JSON object with status "ok"
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * @description Global error handler — catches unhandled errors from any
 * middleware or route and returns a generic 500 response.
 * @param {Error} err - The error object.
 * @param {import('express').Request} _req - Express request (unused).
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} _next - Express next (unused).
 */
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 2000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
