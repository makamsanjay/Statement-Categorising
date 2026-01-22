module.exports = async function autoDowngradeIfExpired(user) {
  if (
    user.plan !== "free" &&
    user.planExpiresAt &&
    new Date(user.planExpiresAt) <= new Date()
  ) {
    user.plan = "free";
    user.stripeSubscriptionId = null;
    user.subscriptionStatus = "expired";
    user.cancelAtPeriodEnd = false;
    user.planExpiresAt = null;
    await user.save();
  }

  return user;
};
