const express = require("express");
const router = express.Router();
const stripe = require("../stripe/stripe");
const auth = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");

router.post("/create-checkout-session", auth, loadUser, async (req, res) => {
  try {
    if (req.user.plan === "pro") {
      return res.status(400).json({ error: "Already on Pro plan" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: req.user.email,

      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID, // 👈 env var
          quantity: 1
        }
      ],

      success_url: `${process.env.FRONTEND_URL}/billing-success`,
      cancel_url: `${process.env.FRONTEND_URL}/billing-cancel`,

      metadata: {
        userId: req.user._id.toString()
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err.message);
    res.status(500).json({ error: "Failed to start checkout" });
  }
});

module.exports = router;
