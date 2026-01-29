const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

/* ===========================
   GET LOGGED-IN USER PROFILE
   =========================== */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("PROFILE LOAD ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===========================
   UPDATE PROFILE
   =========================== */
router.put("/me", auth, async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      message: "Profile updated",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        plan: user.plan
      }
    });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
