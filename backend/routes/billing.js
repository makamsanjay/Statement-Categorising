const express = require("express");
const router = express.Router();
const stripe = require("../stripe/stripe");
const auth = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");

/* ============================
   1️⃣ START CHECKOUT (UPGRADE)
   ============================ */
router.post("/create-checkout-session", auth, loadUser, async (req, res) => {
  try {
    // ⛔ Prevent duplicate subscriptions
    if (req.user.plan === "monthly" || req.user.plan === "yearly") {
      return res.status(400).json({
        error: "You already have an active Pro subscription"
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],

      // Stripe will create or reuse customer automatically
      customer_email: req.user.email,

      // 🔑 IMPORTANT: metadata for webhook
      metadata: {
        userId: req.user._id.toString()
      },

      subscription_data: {
        metadata: {
          userId: req.user._id.toString()
        }
      },

      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1
        }
      ],

      success_url: `${process.env.FRONTEND_URL}/billing-success`,
      cancel_url: `${process.env.FRONTEND_URL}/billing-cancel`
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: "Failed to start checkout" });
  }
});

/* ============================
   2️⃣ STRIPE BILLING PORTAL
   ============================ */
router.post("/portal", auth, loadUser, async (req, res) => {
  try {
    if (!req.user.stripeCustomerId) {
      return res.status(400).json({
        error: "No active subscription found"
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomerId,
      return_url: process.env.FRONTEND_URL
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Billing portal error:", err);
    res.status(500).json({ error: "Failed to open billing portal" });
  }
});

/* ============================
   3️⃣ BILLING STATUS (READ-ONLY)
   ============================ */
router.get("/status", auth, loadUser, async (req, res) => {
  res.json({
    plan: req.user.plan || "free",
    subscriptionStatus: req.user.subscriptionStatus || "none",
    cancelAtPeriodEnd: req.user.cancelAtPeriodEnd || false,
    planExpiresAt: req.user.planExpiresAt || null
  });
});

module.exports = router;
