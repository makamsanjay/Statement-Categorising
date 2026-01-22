const User = require("../models/User");

module.exports = async function loadUser(req, res, next) {
  try {
    // auth middleware must run BEFORE this
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // 🔁 overwrite req.user with full user document
    req.user = user;

    next();
  } catch (err) {
    console.error("loadUser error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
