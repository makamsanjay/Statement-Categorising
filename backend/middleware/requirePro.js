module.exports = function requirePro(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.plan === "free") {
    return res.status(403).json({
      upgrade: true,
      message: "Upgrade to Pro to use this feature"
    });
  }

  next();
};
