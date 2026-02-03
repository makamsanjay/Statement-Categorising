const crypto = require("crypto");
const User = require("../models/User");

module.exports = async function razorpayWebhook(req, res) {
  try {
    console.log("🔥 WEBHOOK HIT");

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (receivedSignature !== expectedSignature) {
      console.error("❌ Invalid Razorpay webhook signature");
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());
    console.log("📩 Razorpay Event:", event.event);

    if (
      event.event === "subscription.activated" ||
      event.event === "subscription.authenticated"
    ) {
      const sub = event.payload.subscription.entity;
      const userId = sub.notes?.userId;

      if (!userId) {
        console.warn("⚠️ userId missing in notes");
        return res.sendStatus(200);
      }

      await User.findByIdAndUpdate(userId, {
        plan: "monthly",
        razorpaySubscriptionId: sub.id,
        subscriptionStatus: "active",
        planExpiresAt: new Date(sub.current_end * 1000)
      });

      console.log("✅ USER UPGRADED TO MONTHLY:", userId);
    }

    if (event.event === "subscription.cancelled") {
      const sub = event.payload.subscription.entity;

      await User.findOneAndUpdate(
        { razorpaySubscriptionId: sub.id },
        {
          plan: "free",
          subscriptionStatus: "canceled",
          razorpaySubscriptionId: null,
          planExpiresAt: null
        }
      );

      console.log("⚠️ Subscription cancelled");
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.sendStatus(500);
  }
};
