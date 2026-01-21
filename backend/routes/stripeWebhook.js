const express = require("express");
const router = express.Router();
const stripe = require("../stripe/stripe");
const User = require("../models/User");

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error`);
    }

    // ✅ Payment success
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata.userId;

      await User.findByIdAndUpdate(userId, {
        plan: "pro",
        stripeCustomerId: session.customer
      });

      console.log("User upgraded to PRO:", userId);
    }

    res.json({ received: true });
  }
);

module.exports = router;
