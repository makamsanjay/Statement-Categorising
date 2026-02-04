const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const auth = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* ============================
   1️⃣ CREATE SUBSCRIPTION
   ============================ */
router.post("/create-subscription", auth, loadUser, async (req, res) => {
  const user = req.user;

  // 🔒 BLOCK if already active
  if (
    user.subscriptionStatus === "active" &&
    user.razorpaySubscriptionId
  ) {
    return res.status(400).json({
      error: "Subscription already active"
    });
  }

  const subscription = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID,
    customer_notify: 1,
    total_count: 12,
    notes: {
      userId: user._id.toString(),
      email: user.email
    }
  });

  res.json(subscription);
});


/* ============================
   2️⃣ CANCEL SUBSCRIPTION
   ============================ */
router.post("/cancel", auth, loadUser, async (req, res) => {
  try {
    const user = req.user;

    if (!user.razorpaySubscriptionId) {
      return res.status(400).json({ error: "No active subscription" });
    }

    const sub = await razorpay.subscriptions.cancel(
      user.razorpaySubscriptionId,
      { cancel_at_cycle_end: 1 }
    );

    // 🔥 IMPORTANT: update DB immediately
    await user.updateOne({
      subscriptionStatus: "canceled",
      planExpiresAt: new Date(sub.current_end * 1000)
    });

    res.json({
      success: true,
      expiresAt: sub.current_end * 1000
    });
  } catch (err) {
    console.error("Cancel subscription error:", err);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

/* ============================
   3️⃣ BILLING STATUS (READ-ONLY)
   ============================ */
router.get("/status", auth, loadUser, async (req, res) => {
  res.json({
    plan: req.user.plan || "free",
    subscriptionStatus: req.user.subscriptionStatus || "none",
    planExpiresAt: req.user.planExpiresAt || null
  });
});

// routes/billing.js

// routes/billing.js
router.get("/manage", auth, loadUser, async (req, res) => {
  const user = req.user;

  res.json({
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    razorpaySubscriptionId: user.razorpaySubscriptionId,
    planExpiresAt: user.planExpiresAt,
    isCanceled:
      user.subscriptionStatus === "canceled" ||
      user.subscriptionStatus === "authenticated",
    email: user.email, 
  });
});

/* ============================
   4️⃣ RESUME SUBSCRIPTION
============================ */
/* ============================
   4️⃣ RESUME SUBSCRIPTION
   ============================ */
router.post("/resume", auth, loadUser, async (req, res) => {
  try {
    // 🛑 no subscription
    if (!req.user.razorpaySubscriptionId) {
      return res.status(400).json({
        error: "No subscription to resume"
      });
    }

    // 🟢 Already active → just clear cancellation intent
    req.user.subscriptionStatus = "active";
    await req.user.save();

    return res.json({
      success: true,
      message: "Subscription will renew automatically"
    });
  } catch (err) {
    console.error("Resume logic error:", err);
    res.status(500).json({
      error: "Failed to resume subscription"
    });
  }
});



module.exports = router;
