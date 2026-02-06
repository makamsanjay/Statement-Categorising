// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function auth(req, res, next) {
  try {
    const header = req.header("Authorization");

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const token = header.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    // ✅ Verify token (checks expiry automatically)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Load user from DB
    const user = await User.findById(decoded.userId).select(
      "_id email plan subscriptionStatus"
    );

    if (!user) {
      return res.status(401).json({
        error: "Account no longer exists"
      });
    }

    // 🚫 Optional future protection
    if (user.isDisabled) {
      return res.status(403).json({
        error: "Account is disabled"
      });
    }

    // ✅ Attach full user reference
    req.user = {
      userId: user._id,
      email: user.email,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus
    };

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);

    return res.status(401).json({
      error: "Invalid or expired session"
    });
  }
};
