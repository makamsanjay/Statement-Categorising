// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function auth(req, res, next) {
  try {
    // 🍪 READ TOKEN FROM COOKIE (NOT HEADER)
    const token = req.cookies.auth;

    if (!token) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    // ✅ VERIFY JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(401).json({
        error: "Invalid session"
      });
    }

    // ✅ LOAD USER (SAFE FIELDS ONLY)
    const user = await User.findById(decoded.userId)
      .select("_id email plan subscriptionStatus isDisabled")
      .lean();

    if (!user) {
      return res.status(401).json({
        error: "Account no longer exists"
      });
    }

    if (user.isDisabled) {
      return res.status(403).json({
        error: "Account is disabled"
      });
    }

    // ✅ ATTACH USER TO REQUEST
    req.user = {
      userId: user._id,
      email: user.email,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus
    };

    next();
  } catch (err) {
    // 🔒 SILENT FAIL (NO TOKEN LEAKS)
    return res.status(401).json({
      error: "Session expired"
    });
  }
};
