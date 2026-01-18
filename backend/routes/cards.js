const express = require("express");
const router = express.Router();

const Card = require("../models/Card");
const Transaction = require("../models/Transaction");
const { calculateHealthScore } = require("../services/healthScore.js");

/* ============================
   1️⃣ GET ALL CARDS (CRITICAL)
   ============================ */
router.get("/", async (req, res) => {
  try {
    const cards = await Card.find();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

/* ============================
   2️⃣ CREATE CARD
   ============================ */
router.post("/", async (req, res) => {
  try {
    const { name, last4, monthlyBudget } = req.body;

    const card = await Card.create({
      name,
      last4,
      monthlyBudget: monthlyBudget || 0
    });

    res.json(card);
  } catch (err) {
    res.status(500).json({ error: "Failed to create card" });
  }
});

/* ============================
   3️⃣ DELETE CARD
   ============================ */
router.delete("/:id", async (req, res) => {
  try {
    const cardId = req.params.id;

    await Transaction.deleteMany({ cardId });
    await Card.findByIdAndDelete(cardId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete card" });
  }
});

/* ============================
   4️⃣ CARD SUMMARY (ANALYTICS)
   ============================ */
router.get("/summary", async (req, res) => {
  try {
    const { month } = req.query;

    const start = new Date(month);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const cards = await Card.find();
    const result = [];

    for (const card of cards) {
      const agg = await Transaction.aggregate([
        {
          $match: {
            cardId: card._id.toString(),
            date: { $gte: start, $lt: end }
          }
        },
        { $group: { _id: null, spent: { $sum: "$amount" } } }
      ]);

      const spent = Math.abs(agg[0]?.spent || 0);
      const budget = card.monthlyBudget || 0;
      const healthScore = calculateHealthScore(spent, budget);

      result.push({
        _id: card._id,
        name: card.name,
        last4: card.last4,
        monthlyBudget: budget,
        spent,
        healthScore
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch card summary" });
  }
});

module.exports = router;
