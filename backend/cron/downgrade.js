const User = require("../models/User");

async function downgradeExpiredUsers() {
  const now = new Date();

  await User.updateMany(
    {
      plan: { $ne: "free" },
      planExpiresAt: { $lt: now }
    },
    {
      $set: {
        plan: "free",
        subscriptionStatus: "expired",
        stripeSubscriptionId: null,
        cancelAtPeriodEnd: false,
        planExpiresAt: null
      }
    }
  );
}

module.exports = downgradeExpiredUsers;
