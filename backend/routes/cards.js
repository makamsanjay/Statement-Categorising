const express = require("express");
const router = express.Router();

const Card = require("../models/Card");
const Transaction = require("../models/Transaction");

/* ============================
   1️⃣ GET ALL CARDS
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
   2️⃣ CREATE CARD (UPDATED)
   ============================ */
router.post("/", async (req, res) => {
  try {
    const { name, last4, baseCurrency, displayCurrency } = req.body;

    if (!name || !baseCurrency || !displayCurrency) {
      return res.status(400).json({
        error: "name, baseCurrency, and displayCurrency are required"
      });
    }

    const card = await Card.create({
      name,
      last4,
      baseCurrency,
      displayCurrency
    });

    res.json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create card" });
  }
});

/* ============================
   3️⃣ CHANGE DISPLAY CURRENCY (NEW)
   ============================ */
router.put("/currency/:id", async (req, res) => {
  try {
    const { displayCurrency } = req.body;

    if (!displayCurrency) {
      return res.status(400).json({ error: "displayCurrency is required" });
    }

    await Card.findByIdAndUpdate(req.params.id, {
      displayCurrency
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update display currency" });
  }
});

/* ============================
   4️⃣ DELETE CARD
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
   5️⃣ CARD SUMMARY (NO CURRENCY MIXING)
   ============================ */
router.get("/summary", async (req, res) => {
  try {
    const cards = await Card.find();
    const result = [];

    for (const card of cards) {
      const agg = await Transaction.aggregate([
        {
          $match: { cardId: card._id.toString() }
        },
        {
          $group: {
            _id: null,
            income: {
              $sum: {
                $cond: [{ $gt: ["$amount", 0] }, "$amount", 0]
              }
            },
            expense: {
              $sum: {
                $cond: [{ $lt: ["$amount", 0] }, { $abs: "$amount" }, 0]
              }
            }
          }
        }
      ]);

      result.push({
        _id: card._id,
        name: card.name,
        last4: card.last4,
        baseCurrency: card.baseCurrency,
        displayCurrency: card.displayCurrency,
        income: agg[0]?.income || 0,
        expense: agg[0]?.expense || 0
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch card summary" });
  }
});

module.exports = router;
