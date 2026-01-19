const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const { calculateHealthScore } = require("../services/healthScore.js");

router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find();
    const result = calculateHealthScore(transactions);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      score: 0,
      insights: ["Health score calculation failed"]
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find();
    const result = calculateHealthScore(transactions);

    console.log("Health result:", result); // 👈 ADD THIS

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      score: 0,
      insights: ["Health score calculation failed"]
    });
  }
});


module.exports = router;
