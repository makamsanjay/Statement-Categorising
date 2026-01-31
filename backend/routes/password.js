const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

/* ============================
   FORGOT PASSWORD – SEND OTP
============================ */
router.post("/forgot", async (req, res) => {
  try {
    let { email } = req.body;
email = email.trim().toLowerCase();


    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    
    const user = await User.findOne({ email });

    // SECURITY: never reveal whether user exists
  if (!user) {
  return res.status(404).json({ error: "No account found with this email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
const cleanOtp = otp.trim();

const hashedOTP = crypto
  .createHash("sha256")
  .update(cleanOtp)
  .digest("hex");


    user.forgotPasswordOTP = hashedOTP;
    user.forgotPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.forgotPasswordOTPVerified = false;

    await user.save();

    await sendEmail({
      to: email,
      subject: "Your password reset code",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>Password Reset</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 4px">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        </div>
      `
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* ============================
   VERIFY OTP
============================ */
router.post("/verify", async (req, res) => {
  try {
    let { email, otp } = req.body;
email = email.trim().toLowerCase();


    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP required" });
    }

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email,
      forgotPasswordOTP: hashedOTP,
      forgotPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    user.forgotPasswordOTPVerified = true;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

/* ============================
   RESET PASSWORD
============================ */
router.post("/reset", async (req, res) => {
  try {
    let { email, password, confirmPassword } = req.body;
email = email.trim().toLowerCase();


    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Password policy
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include one uppercase letter and one number"
      });
    }

    const user = await User.findOne({
      email,
      forgotPasswordOTPVerified: true,
      forgotPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(403).json({ error: "OTP not verified or expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.forgotPasswordOTP = undefined;
    user.forgotPasswordExpires = undefined;
    user.forgotPasswordOTPVerified = undefined;

    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

module.exports = router;
