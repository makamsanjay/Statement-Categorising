// backend/utils/isProUser.js
module.exports = function isProUser(user) {
  if (!user) return false;

  // Free users never Pro
  if (user.plan === "free") return false;

  // No expiry = NOT Pro (safety)
  if (!user.planExpiresAt) return false;

  // Expired subscription
  if (new Date(user.planExpiresAt) <= new Date()) {
    return false;
  }

  // Valid Pro
  return true;
};
