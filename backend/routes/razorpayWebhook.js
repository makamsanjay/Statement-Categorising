const crypto = require("crypto");
const User = require("../models/User");

const ALLOWED_EVENTS = new Set([
  "subscription.activated",
  "subscription.charged",
  "invoice.paid",
  "subscription.cancelled"
]);

module.exports = async function razorpayWebhook(req, res) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers["x-razorpay-signature"];

    if (!receivedSignature || !secret) {
      console.error(" Missing webhook secret or signature");
      return res.sendStatus(400);
    }

    const body = req.body.toString();

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(receivedSignature),
        Buffer.from(expectedSignature)
      )
    ) {
      console.error(" Invalid Razorpay webhook signature");
      return res.sendStatus(400);
    }

    const event = JSON.parse(body);

    if (!ALLOWED_EVENTS.has(event.event)) {
      return res.sendStatus(200);
    }

    /* ============================
       SUBSCRIPTION ACTIVATED
       ============================ */
    if (event.event === "subscription.activated") {
      const sub = event.payload.subscription.entity;
      const userId = sub.notes?.userId;

      if (!userId || !sub.id) return res.sendStatus(200);

      const existing = await User.findOne({
        razorpaySubscriptionId: sub.id,
        subscriptionStatus: "active"
      });

      if (!existing) {
        await User.findByIdAndUpdate(userId, {
          plan: "monthly",
          razorpaySubscriptionId: sub.id,
          subscriptionStatus: "active",
          planExpiresAt: new Date(sub.current_end * 1000)
        });
      }
    }

    /* ============================
       RENEWAL / CHARGE
       ============================ */
    if (
      event.event === "subscription.charged" ||
      event.event === "invoice.paid"
    ) {
      const sub = event.payload.subscription?.entity;
      if (!sub?.id) return res.sendStatus(200);

      await User.findOneAndUpdate(
        { razorpaySubscriptionId: sub.id },
        {
          subscriptionStatus: "active",
          planExpiresAt: new Date(sub.current_end * 1000)
        }
      );
    }

    /* ============================
       SUBSCRIPTION CANCELLED
       ============================ */
    if (event.event === "subscription.cancelled") {
      const sub = event.payload.subscription.entity;
      if (!sub?.id) return res.sendStatus(200);

      await User.findOneAndUpdate(
        { razorpaySubscriptionId: sub.id },
        {
          plan: "free",
          subscriptionStatus: "canceled",
          planExpiresAt: new Date(sub.current_end * 1000)
        }
      );
    }

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error(" Razorpay webhook error:", err);
    return res.sendStatus(500);
  }
};
