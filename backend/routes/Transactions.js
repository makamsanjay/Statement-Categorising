const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

/**
 * POST /transactions
 * Save a transaction
 */
router.post("/", async (req, res) => {
  try {
    const transaction = await Transaction.create(req.body);
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = {};
    if (from && to) {
      filter.date = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const txns = await Transaction.find(filter);

    let income = 0;
    let expense = 0;
    const categories = {};

    txns.forEach((t) => {
      if (t.amount > 0) income += t.amount;
      else expense += Math.abs(t.amount);

      categories[t.category] =
        (categories[t.category] || 0) + Math.abs(t.amount);
    });

    res.json({ income, expense, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { category } = req.body;

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        category,
        categorySource: "user",
        confidence: 1,
        userOverridden: true
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/summary", async (req, res) => {
  try {
    const txns = await Transaction.find();

    let income = 0;
    let expense = 0;
    const categoryTotals = {};

    txns.forEach((txn) => {
      if (txn.amount > 0) {
        income += txn.amount;
      } else {
        expense += Math.abs(txn.amount);
      }

      if (!categoryTotals[txn.category]) {
        categoryTotals[txn.category] = 0;
      }

      categoryTotals[txn.category] += Math.abs(txn.amount);
    });

    res.json({
      income,
      expense,
      categories: categoryTotals,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
