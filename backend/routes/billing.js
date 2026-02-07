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
   PLAN MAP
============================ */
const PLAN_BY_GROUP = {
  INR: process.env.RAZORPAY_PLAN_INR,
  USD: process.env.RAZORPAY_PLAN_USD,
  EUR: process.env.RAZORPAY_PLAN_EUR,
  GBP: process.env.RAZORPAY_PLAN_GBP
};

/* ============================
   1️⃣ CREATE SUBSCRIPTION
============================ */
router.post("/create-subscription", auth, loadUser, async (req, res) => {
  try {
    const user = req.user;

    if (user.subscriptionStatus === "active") {
      return res.status(400).json({ error: "Subscription already active" });
    }

    if (user.subscriptionStatus === "pending") {
      return res.status(400).json({ error: "Subscription activation in progress" });
    }

    const pricingGroup = user.pricingGroup || "INR";
    const planId = PLAN_BY_GROUP[pricingGroup];

    if (!planId) {
      return res.status(500).json({ error: "Pricing configuration error" });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
      notes: {
        userId: user._id.toString(),
        email: user.email,
        pricingGroup
      }
    });

    // ✅ SAVE SUBSCRIPTION ID
    user.razorpaySubscriptionId = subscription.id;
    user.subscriptionStatus = "pending";
    user.subscriptionStartedAt = new Date();
    await user.save();

    res.json(subscription);
  } catch (err) {
    console.error("Create subscription error:", err);
    res.status(500).json({ error: "Failed to create subscription" });
  }
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
   3️⃣ BILLING STATUS
============================ */
router.get("/status", auth, loadUser, async (req, res) => {
  const user = req.user;

  if (
    user.subscriptionStatus === "pending" &&
    user.subscriptionStartedAt &&
    Date.now() - new Date(user.subscriptionStartedAt).getTime() > 60 * 1000
  ) {
    user.subscriptionStatus = "none";
    user.subscriptionStartedAt = null;
    await user.save();
  }

  res.json({
    plan: user.plan || "free",
    subscriptionStatus: user.subscriptionStatus || "none",
    planExpiresAt: user.planExpiresAt || null
  });
});

/* ============================
   4️⃣ MANAGE BILLING
============================ */
router.get("/manage", auth, loadUser, async (req, res) => {
  const user = req.user;

  res.json({
    plan: user.plan || "free",
    subscriptionStatus: user.subscriptionStatus || "none",
    planExpiresAt: user.planExpiresAt || null
  });
});

/* ============================
   5️⃣ RESUME SUBSCRIPTION
============================ */
router.post("/resume", auth, loadUser, async (req, res) => {
  try {
    if (!req.user.razorpaySubscriptionId) {
      return res.status(400).json({ error: "No subscription to resume" });
    }

    req.user.subscriptionStatus = "active";
    await req.user.save();

    res.json({
      success: true,
      message: "Subscription will renew automatically"
    });
  } catch (err) {
    console.error("Resume logic error:", err);
    res.status(500).json({ error: "Failed to resume subscription" });
  }
});

module.exports = router;
