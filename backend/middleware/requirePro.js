module.exports = function requirePro(req, res, next) {
  if (req.user.plan !== "pro") {
    return res.status(403).json({
      upgrade: true,
      message: "This feature requires Pro plan"
    });
  }
  next();
};
