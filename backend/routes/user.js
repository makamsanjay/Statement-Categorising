const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Card = require("../models/Card");
const Budget = require("../models/Budget");
const CardSuggestion = require("../models/CardSuggestion");
const EmailOTP = require("../models/EmailOTP");
const sendEmail = require("../utils/sendEmail");
const auth = require("../middleware/auth");

/* ===========================
   GET LOGGED-IN USER PROFILE
   =========================== */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("PROFILE LOAD ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===========================
   UPDATE PROFILE
   =========================== */
router.put("/me", auth, async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      message: "Profile updated",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        plan: user.plan
      }
    });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/delete/send-otp", auth, async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await EmailOTP.findOneAndUpdate(
    { email: user.email },
    {
      email: user.email,
      otpHash,
      verified: false,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    },
    { upsert: true }
  );

  await sendEmail({
    to: user.email,
    subject: "Account deletion verification",
    html: `
      <p>You requested to delete your account.</p>
      <p>Your verification code is:</p>
      <h2>${otp}</h2>
      <p>This code expires in 5 minutes.</p>
    `
  });

  res.json({ success: true });
});

/* ---------------- VERIFY DELETE OTP ---------------- */
router.post("/delete/verify-otp", auth, async (req, res) => {
  const { otp } = req.body;
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const record = await EmailOTP.findOne({ email: user.email });
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
});

/* ---------------- DELETE ACCOUNT ---------------- */
router.delete("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const otpRecord = await EmailOTP.findOne({ email: user.email });
  if (!otpRecord || !otpRecord.verified) {
    return res.status(403).json({ error: "OTP verification required" });
  }

  await Transaction.deleteMany({ userId: user._id });
  await Card.deleteMany({ userId: user._id });
  await Budget.deleteMany({ userId: user._id });
  await CardSuggestion.deleteMany({ userId: user._id });
  await EmailOTP.deleteOne({ email: user.email });
  await User.deleteOne({ _id: user._id });

  res.json({ deleted: true });
});


module.exports = router;
