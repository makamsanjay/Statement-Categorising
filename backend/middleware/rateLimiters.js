const rateLimit = require("express-rate-limit");

/* =========================
   GENERIC LIMITER
========================= */
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200, // overall API safety
  standardHeaders: true,
  legacyHeaders: false
});

/* =========================
   AUTH-SENSITIVE LIMITERS
========================= */

// Login brute force
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many login attempts. Try again in 15 minutes."
  }
});

// Signup flooding
exports.signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    error: "Too many signup attempts. Please try later."
  }
});

// OTP sending abuse
exports.sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many OTP requests. Please try later."
  }
});

// OTP guessing
exports.verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many OTP attempts. Please try later."
  }
});
