const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const { toUSD } = require("../utils/convertCurrency");
const loadUser = require("../middleware/loadUser");
const requirePro = require("../middleware/requirePro");

/* ============================
   OVERVIEW (ALL CARDS → USD)
   ============================ */
router.get("/overview", loadUser, requirePro,async (req, res) => {
  try {
    const { month } = req.query;

    const start = new Date(month);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const txns = await Transaction.find({
      date: { $gte: start, $lt: end }
    });

    const categories = {};

    txns.forEach(t => {
      const usdAmount = toUSD(t.amount, t.currency);

      categories[t.category] =
        (categories[t.category] || 0) + Math.abs(usdAmount);
    });

    res.json(
      Object.entries(categories).map(([category, total]) => ({
        category,
        total
      }))
    );
  } catch (err) {
    console.error("Overview analytics failed:", err);
    res.status(500).json({ error: "Overview analytics failed" });
  }
});

/* ============================
   CARD-WISE (NATIVE CURRENCY)
   ============================ */
router.get("/cards", loadUser, async (req, res) => {
  try {
    const { month } = req.query;

    const start = new Date(month);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const txns = await Transaction.find({
      date: { $gte: start, $lt: end }
    });

    const result = {};

    txns.forEach(t => {
      if (!result[t.cardId]) result[t.cardId] = {};
      result[t.cardId][t.category] =
        (result[t.cardId][t.category] || 0) + Math.abs(t.amount);
    });

    res.json(result);
  } catch (err) {
    console.error("Card analytics failed:", err);
    res.status(500).json({ error: "Card analytics failed" });
  }
});

module.exports = router;
