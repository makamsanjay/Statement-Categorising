const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");
const { calculateHealthScore } = require("../services/healthScore");

/**
 * GET /health
 * Returns expense health score for logged-in user
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // ✅ USER-SCOPED QUERY
    const transactions = await Transaction.find({ userId });

    // ✅ HANDLE EMPTY ACCOUNT (VERY IMPORTANT)
    if (transactions.length === 0) {
      return res.json({
        score: 0,
        empty: true,
        insights: ["Add transactions to calculate health score"]
      });
    }

    // ✅ CALCULATE HEALTH USING SERVICE
    const result = calculateHealthScore(transactions);

    res.json(result);
  } catch (err) {
    console.error("Health score error:", err);
    res.status(500).json({
      score: 0,
      insights: ["Health score calculation failed"]
    });
  }
});

module.exports = router;
