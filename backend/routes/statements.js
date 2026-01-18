const express = require("express");
const router = express.Router();
const Statement = require("../models/Statement");
const { detectCurrency } = require("../services/currency.js");

router.post("/upload", async (req, res) => {
  const { extractedText, userId } = req.body;

  const detectedCurrency = detectCurrency(extractedText) || "USD";

  const statement = await Statement.create({
    userId,
    currency: detectedCurrency,
    detectedCurrency
  });

  res.json(statement);
});

router.patch("/:id/currency", async (req, res) => {
  const { currency } = req.body;

  await Statement.findByIdAndUpdate(req.params.id, {
    currency
  });

  res.json({ success: true });
});

module.exports = router;
