// middleware/loadUser.js
const User = require("../models/User");

module.exports = async function loadUser(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user; // full user doc
    next();
  } catch (err) {
    console.error("loadUser error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
