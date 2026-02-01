const express = require("express");
const router = express.Router();

const Card = require("../models/Card");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");

/* ============================
   1️⃣ GET USER CARDS (SUMMARY)
   ============================ */
router.get("/summary", auth, loadUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const cards = await Card.find({ userId }).sort({ createdAt: 1 });

    const result = [];

    for (const card of cards) {
      const agg = await Transaction.aggregate([
        {
          $match: {
            cardId: card._id,
            userId
          }
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

        // ✅ IMPORTANT: always return originalCard explicitly
        originalCard: card.originalCard ?? null,

        income: agg[0]?.income || 0,
        expense: agg[0]?.expense || 0
      });
    }

    res.json(result);
  } catch (err) {
    console.error("❌ Card summary failed:", err);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

/* ============================
   2️⃣ CREATE CARD
   ============================ */
router.post("/", auth, loadUser, async (req, res) => {
  try {
    const { name, last4, baseCurrency, displayCurrency } = req.body;

    if (!name || !baseCurrency || !displayCurrency) {
      return res.status(400).json({
        error: "Name and currencies are required"
      });
    }

    if (last4 && !/^\d{4}$/.test(last4)) {
      return res.status(400).json({
        error: "Last 4 digits must be exactly 4 numbers"
      });
    }

    const duplicate = await Card.findOne({
      userId: req.user._id,
      name
    });

    if (duplicate) {
      return res.status(409).json({
        error: `A card named "${name}" already exists`
      });
    }

    if (req.user.plan === "free") {
      const count = await Card.countDocuments({
        userId: req.user._id
      });

      if (count >= 1) {
        return res.status(403).json({
          message: "Free plan allows only 1 card"
        });
      }
    }

    const card = await Card.create({
      userId: req.user._id,
      name,
      last4,
      baseCurrency,
      displayCurrency,
      originalCard: null
    });

    res.json(card);
  } catch (err) {
    console.error("❌ Create card failed:", err);
    res.status(500).json({ error: "Failed to create card" });
  }
});

/* ============================
   3️⃣ RENAME CARD
   ============================ */
router.put("/:id/rename", auth, loadUser, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const card = await Card.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name },
      { new: true }
    );

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json(card);
  } catch (err) {
    res.status(500).json({ error: "Failed to rename card" });
  }
});

/* ============================
   4️⃣ UPDATE DISPLAY CURRENCY
   ============================ */
router.put("/currency/:id", auth, loadUser, async (req, res) => {
  try {
    const { displayCurrency } = req.body;

    const card = await Card.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { displayCurrency },
      { new: true }
    );

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json(card);
  } catch (err) {
    res.status(500).json({ error: "Failed to update currency" });
  }
});

/* ============================
   5️⃣ DELETE CARD
   ============================ */
router.delete("/delete/:id", auth, loadUser, async (req, res) => {
  try {
    const cardId = req.params.id;

    await Transaction.deleteMany({
      cardId,
      userId: req.user._id
    });

    await Card.findOneAndDelete({
      _id: cardId,
      userId: req.user._id
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete card" });
  }
});

/* ============================
   SET / UPDATE ORIGINAL CARD NAME
   ============================ */
router.put("/:id/original-card", auth, loadUser, async (req, res) => {
  try {
    const { issuer, product } = req.body;

    if (!issuer || !product) {
      return res.status(400).json({
        error: "Issuer and product are required"
      });
    }

    const updated = await Card.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        originalCard: {
          issuer: issuer.trim(),
          product: product.trim()
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("❌ Original card update failed:", err);
    res.status(500).json({ error: "Failed to save original card" });
  }
});

/* ============================
   REMOVE ORIGINAL CARD NAME
   ============================ */
router.delete("/:id/original-name", auth, loadUser, async (req, res) => {
  try {
    const card = await Card.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { originalCard: null },
      { new: true }
    );

    res.json(card);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove original card" });
  }
});

module.exports = router;
