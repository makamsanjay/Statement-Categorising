// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const header = req.header("Authorization");

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret"
    );

    // ✅ THIS IS WHAT loadUser EXPECTS
    req.user = { userId: decoded.userId };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
