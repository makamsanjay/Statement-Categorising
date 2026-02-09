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
    const signature = req.headers["x-razorpay-signature"];

    if (!secret || !signature) {
      console.error("❌ Missing Razorpay webhook secret or signature");
      return res.sendStatus(400);
    }

    /* ============================
       VERIFY SIGNATURE (RAW BODY)
    ============================ */
    const rawBody = req.body.toString();

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      console.error("❌ Invalid Razorpay webhook signature");
      return res.sendStatus(400);
    }

    const event = JSON.parse(rawBody);

    if (!ALLOWED_EVENTS.has(event.event)) {
      return res.sendStatus(200);
    }

    /* ============================
       SUBSCRIPTION ACTIVATED
       (First successful auth)
    ============================ */
    if (event.event === "subscription.activated") {
      const sub = event.payload.subscription.entity;
      const userId = sub.notes?.userId;

      if (!sub?.id || !userId) {
        console.warn("⚠️ subscription.activated missing userId");
        return res.sendStatus(200);
      }

      await User.findByIdAndUpdate(
        userId,
        {
          plan: "monthly",
          razorpaySubscriptionId: sub.id,
          subscriptionStatus: "active",
          planExpiresAt: new Date(sub.current_end * 1000)
        },
        { new: true }
      );
    }

    /* ============================
       SUBSCRIPTION CHARGED
       (Recurring payment)
    ============================ */
    if (event.event === "subscription.charged") {
      const sub = event.payload.subscription?.entity;
      if (!sub?.id) return res.sendStatus(200);

      await User.findOneAndUpdate(
        { razorpaySubscriptionId: sub.id },
        {
          plan: "monthly",
          subscriptionStatus: "active",
          planExpiresAt: new Date(sub.current_end * 1000)
        }
      );
    }

    /* ============================
       INVOICE PAID
       (MOST IMPORTANT EVENT)
    ============================ */
    if (event.event === "invoice.paid") {
      const invoice = event.payload.invoice.entity;
      const subscriptionId = invoice.subscription_id;

      if (!subscriptionId) {
        console.warn("⚠️ invoice.paid missing subscription_id");
        return res.sendStatus(200);
      }

      await User.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionId },
        {
          plan: "monthly",
          subscriptionStatus: "active",
          planExpiresAt: new Date(invoice.current_end * 1000)
        }
      );
    }

    /* ============================
       SUBSCRIPTION CANCELLED
       (Auto-pay stopped)
       ⚠️ DO NOT DOWNGRADE IMMEDIATELY
    ============================ */
    if (event.event === "subscription.cancelled") {
      const sub = event.payload.subscription.entity;
      if (!sub?.id) return res.sendStatus(200);

      await User.findOneAndUpdate(
        { razorpaySubscriptionId: sub.id },
        {
          subscriptionStatus: "canceled",
          // ⛔ Keep plan until expiry
          planExpiresAt: new Date(sub.current_end * 1000)
        }
      );
    }

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("🔥 Razorpay webhook error:", err);
    return res.sendStatus(500);
  }
};
