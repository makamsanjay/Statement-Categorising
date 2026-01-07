const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

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

router.post("/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No transaction IDs provided" });
    }

    const result = await Transaction.deleteMany({
      _id: { $in: ids }
    });

    res.json({
      message: "Transactions deleted successfully",
      deletedCount: result.deletedCount
    });

  } catch (err) {
    console.error("Bulk delete failed:", err);
    res.status(500).json({ error: "Bulk delete failed" });
  }
});


module.exports = router;
