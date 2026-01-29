const Stripe = require("stripe");
const User = require("../models/User");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  let event;

  try {
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error`);
  }

  console.log("⚡ Stripe event:", event.type);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (!session.subscription) {
        console.log("❌ No subscription on session");
        return res.json({ received: true });
      }

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );

      const userId = subscription.metadata?.userId;

      if (!userId) {
        console.error("❌ userId missing in subscription metadata");
        return res.json({ received: true });
      }

      const interval =
        subscription.items.data[0].price.recurring.interval;

      const plan = interval === "year" ? "yearly" : "monthly";

      await User.findByIdAndUpdate(userId, {
        plan,
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        planExpiresAt: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null
      });

      console.log("✅ USER UPGRADED:", userId, plan);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler failed:", err);
    res.status(500).send("Webhook failed");
  }
};
