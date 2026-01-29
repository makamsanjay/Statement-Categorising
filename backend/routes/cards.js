const express = require("express");
const router = express.Router();

const Card = require("../models/Card");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");

/* ============================
   0️⃣ GET USER CARDS (RAW)
   ============================ */

/* ============================
   1️⃣ GET USER CARDS (SUMMARY)
   ============================ */
router.get("/summary", auth, loadUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const cards = await Card.find({ userId });

    const result = [];

    for (const card of cards) {
      const agg = await Transaction.aggregate([
        {
          $match: {
            cardId: card._id,
            userId: userId   // ✅ FIX
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
        income: agg[0]?.income || 0,
        expense: agg[0]?.expense || 0
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

/* ============================
   2️⃣ CREATE CARD (FIXED LOGIC ORDER)
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

    // ❌ 1️⃣ DUPLICATE NAME CHECK (FIRST)
    const duplicate = await Card.findOne({
      userId: req.user._id,
      name
    });

    if (duplicate) {
      return res.status(409).json({
        error: `A card named "${name}" already exists. Please choose a different name.`
      });
    }

    // 🔒 2️⃣ FREE PLAN LIMIT (AFTER DUPLICATE CHECK)
    if (req.user.plan === "free") {
      const count = await Card.countDocuments({
        userId: req.user._id
      });

      if (count >= 1) {
        return res.status(403).json({
          message: "Free plan allows only 1 card. Upgrade to Pro."
        });
      }
    }

    // ✅ 3️⃣ CREATE CARD
    const card = await Card.create({
      userId: req.user._id,
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
   3️⃣ RENAME CARD
   ============================ */
router.put("/:id/rename", auth, loadUser, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name is required" });
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

module.exports = router;
