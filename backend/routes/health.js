const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Card = require("../models/Card");
const { calculateHealthScore } = require("../services/healthScore");

router.get("/", async (req, res) => {
  try {
    // 1️⃣ Get all transactions
    const transactions = await Transaction.find();

    // 2️⃣ Calculate total spent (expenses only)
    const spent = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // 3️⃣ Calculate total budget from cards
    const cards = await Card.find();
    const budget = cards.reduce(
      (sum, c) => sum + (c.monthlyBudget || 0),
      0
    );

    // 4️⃣ Calculate health score correctly
    const score = calculateHealthScore(spent, budget);

    res.json(score);
  } catch (err) {
    console.error(err);
    res.status(500).json(100);
  }
});

module.exports = router;
