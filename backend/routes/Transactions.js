const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");

/* ============================
   CREATE TRANSACTION
   ============================ */
router.get("/", auth, async (req, res) => {
  const transactions = await Transaction.find({
    userId: req.user.userId
  }).sort({ createdAt: -1 });

  res.json(transactions);
});


/* ============================
   TRANSACTION SUMMARY (USER-SCOPED)
   ============================ */
router.get("/summary", auth, async (req, res) => {
  try {
   const userId = req.user.userId;

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

/* ============================
   UPDATE CATEGORY (SAFE)
   ============================ */
router.put("/:id", auth, async (req, res) => {
  const { category } = req.body;

  const updated = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    {
      category,
      categorySource: "user",
      confidence: 1,
      userOverridden: true
    },
    { new: true }
  );

  res.json(updated);
});

/* ============================
   BULK DELETE (USER-SCOPED)
   ============================ */
router.post("/bulk-delete", auth, async (req, res) => {
  const { ids } = req.body;

  const result = await Transaction.deleteMany({
    _id: { $in: ids },
    userId: req.user.userId
  });

  res.json({ deletedCount: result.deletedCount });
});


/* ============================
   GET TRANSACTIONS BY CARD (USER-SCOPED)
   ============================ */
router.get("/card/:cardId", auth, async (req, res) => {
  try {
    const { cardId } = req.params;

    const transactions = await Transaction.find({
      cardId,
      userId: req.user.userId
    }).sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




module.exports = router;
