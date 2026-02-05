const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Card = require("../models/Card");
const crypto = require("crypto");
const EmailOTP = require("../models/EmailOTP");
const sendEmail = require("../utils/sendEmail");
const detectPricingGroupFromIP = require("../utils/detectCountry");


const {
  loginLimiter,
  signupLimiter,
  sendOtpLimiter,
  verifyOtpLimiter
} = require("../middleware/rateLimiters");

/* ============================
   SIGNUP
   ============================ */

router.post("/signup", signupLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const otpRecord = await EmailOTP.findOne({ email });
    if (!otpRecord || !otpRecord.verified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // 🌍 Detect geo safely
    const geo = await detectPricingGroupFromIP(req);

    const user = await User.create({
      name,
      email,
      password: hashed,
      country: geo.country,
      pricingGroup: geo.pricingGroup
    });

    await Card.create({
      userId: user._id,
      name: "Main Account",
      baseCurrency: "USD",
      displayCurrency: "USD"
    });

    await EmailOTP.deleteOne({ email });

  const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "12h" }
);

    res.json({ token });
  } catch (err) {
    console.error("❌ SIGNUP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});



/* ============================
   LOGIN
   ============================ */
router.post("/login",signupLimiter,async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: "No account found with this email"
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({
        error: "Incorrect password"
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/send-signup-otp", signupLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await EmailOTP.findOneAndUpdate(
      { email },
      {
        email,
        otpHash,
        verified: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      },
      { upsert: true }
    );

 const sendEmail = require("../utils/sendEmail");

await sendEmail({
  to: email,
  subject: "Your verification code",
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6">
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 4px">${otp}</h1>
      <p>This code will expire in 5 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `
});

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/verify-signup-otp", signupLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await EmailOTP.findOne({ email });
    if (!record) {
      return res.status(400).json({ error: "OTP not found" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    const ok = await bcrypt.compare(otp, record.otpHash);
    if (!ok) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    record.verified = true;
    await record.save();

    res.json({ verified: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
