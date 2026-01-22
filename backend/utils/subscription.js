const User = require("../models/User");

async function autoDowngradeIfExpired(user) {
  if (!user.planExpiresAt) return user;

  const now = new Date();

  if (
    user.plan !== "free" &&
    user.planExpiresAt < now
  ) {
    await User.findByIdAndUpdate(user._id, {
      plan: "free",
      subscriptionStatus: "expired",
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
      planExpiresAt: null
    });

    return {
      ...user.toObject(),
      plan: "free"
    };
  }

  return user;
}

module.exports = { autoDowngradeIfExpired };
