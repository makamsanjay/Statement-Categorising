const Stripe = require("stripe");
const User = require("../models/User");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  let event;

  // 1️⃣ Verify signature
  try {
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("⚡ Stripe event:", event.type);

  try {
    // 2️⃣ HANDLE CHECKOUT COMPLETION (SOURCE OF TRUTH)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const userId = session.metadata?.userId;
      if (!userId) {
        console.error("❌ userId missing in checkout session metadata");
        return res.json({ received: true });
      }

      if (!session.subscription) {
        console.error("❌ No subscription on checkout session");
        return res.json({ received: true });
      }

      // Fetch subscription for plan + expiry
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );

      const interval =
        subscription.items.data[0].price.recurring.interval;

      const update = {
        plan: interval === "year" ? "yearly" : "monthly",
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status
      };

      if (subscription.current_period_end) {
        update.planExpiresAt = new Date(
          subscription.current_period_end * 1000
        );
      }

      await User.findByIdAndUpdate(userId, update);

      console.log("✅ USER UPGRADED:", userId, update.plan);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler failed:", err);
    res.status(500).send("Webhook handler failed");
  }
};
