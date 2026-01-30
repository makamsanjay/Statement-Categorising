const express = require("express");
const router = express.Router();

const Transaction = require("../models/Transaction");
const Card = require("../models/Card"); // ⚠️ REQUIRED (was missing)

const auth = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");

/* ============================
   GET ALL TRANSACTIONS (USER-SCOPED)
============================ */
router.get("/", auth, loadUser, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id
    }).sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   TRANSACTION SUMMARY (USER-SCOPED)
============================ */
router.get("/summary", auth, loadUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const { from, to } = req.query;
    const filter = { userId };

    if (from && to) {
      filter.date = {
        $gte: new Date(from),
        $lte: new Date(to)
      };
    }

    const cards = await Card.find({ userId }).select("_id");
    const cardIds = cards.map(c => c._id);

    const txns = await Transaction.find({
      userId,
      cardId: { $in: cardIds }
    });

    let income = 0;
    let expense = 0;
    const categories = {};

    txns.forEach(t => {
      if (t.amount > 0) {
        income += t.amount;
      } else {
        expense += Math.abs(t.amount);
      }

      categories[t.category] =
        (categories[t.category] || 0) + Math.abs(t.amount);
    });

    res.json({ income, expense, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   UPDATE SINGLE TRANSACTION
============================ */
router.put("/:id", auth, loadUser, async (req, res) => {
  try {
    const { date, description, amount, category } = req.body;
    const update = {};

    if (date !== undefined) update.date = date;
    if (description !== undefined) update.description = description;
    if (amount !== undefined) update.amount = amount;

    if (category !== undefined) {
      update.category = category;
      update.categorySource = "user";
      update.confidence = 1;
      update.userOverridden = true;
    }

    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   BULK DELETE TRANSACTIONS
============================ */
router.post("/bulk-delete", auth, loadUser, async (req, res) => {
  try {
    const { ids } = req.body;

    const result = await Transaction.deleteMany({
      _id: { $in: ids },
      userId: req.user._id
    });

    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   GET TRANSACTIONS BY CARD
============================ */
router.get("/card/:cardId", auth, loadUser, async (req, res) => {
  try {
    const { cardId } = req.params;

    const transactions = await Transaction.find({
      cardId,
      userId: req.user._id
    }).sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
