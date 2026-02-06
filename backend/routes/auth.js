const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Card = require("../models/Card");
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
   HELPERS
============================ */
const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

/* ============================
   SIGNUP
============================ */
router.post("/signup", signupLimiter, async (req, res) => {
  try {
    let { name, email, password } = req.body;
    email = normalizeEmail(email);

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const otpRecord = await EmailOTP.findOne({ email, verified: true });
    if (!otpRecord) {
      return res.status(403).json({ error: "Email not verified" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Account already exists" });
    }

    const hashed = await bcrypt.hash(password, 12);
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

    res.cookie("auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000
    });

    // 🔥 CRITICAL FIX
    res.json({
      success: true,
      authenticated: true
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

/* ============================
   LOGIN
============================ */
router.post("/login", loginLimiter, async (req, res) => {
  try {
    let { email, password } = req.body;
    email = normalizeEmail(email);

    if (!email || !password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.cookie("auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000
    });

    // 🔥 CONSISTENT RESPONSE
    res.json({
      success: true,
      authenticated: true
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ============================
   LOGOUT
============================ */
router.post("/logout", (req, res) => {
  res.clearCookie("auth", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  res.json({ success: true });
});

/* ============================
   SEND OTP
============================ */
router.post("/send-signup-otp", sendOtpLimiter, async (req, res) => {
  try {
    let { email } = req.body;
    email = normalizeEmail(email);

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

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
      { upsert: true, new: true }
    );

    await sendEmail({
      to: email,
      subject: "Your verification code",
      html: `<h2>Your OTP: ${otp}</h2><p>Expires in 5 minutes.</p>`
    });

    res.json({ message: "OTP sent" });
  } catch {
    res.status(500).json({ error: "OTP send failed" });
  }
});

/* ============================
   VERIFY OTP
============================ */
router.post("/verify-signup-otp", verifyOtpLimiter, async (req, res) => {
  try {
    let { email, otp } = req.body;
    email = normalizeEmail(email);

    const record = await EmailOTP.findOne({ email });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP expired or invalid" });
    }

    const ok = await bcrypt.compare(otp, record.otpHash);
    if (!ok) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    record.verified = true;
    await record.save();

    res.json({ verified: true });
  } catch {
    res.status(500).json({ error: "OTP verification failed" });
  }
});

/* ============================
   SESSION CHECK
============================ */
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies.auth;
    if (!token) {
      return res.json({ authenticated: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("_id email plan");

    if (!user) {
      return res.json({ authenticated: false });
    }

    res.json({ authenticated: true, user });
  } catch {
    res.json({ authenticated: false });
  }
});

module.exports = router;
