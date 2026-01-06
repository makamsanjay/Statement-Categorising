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

/**
 * GET /transactions
 * Fetch all transactions
 */
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
