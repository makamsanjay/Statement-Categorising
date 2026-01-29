const express = require("express");
const router = express.Router();
const loadUser = require("../middleware/loadUser");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");


/* =========================
   CREATE / UPDATE BUDGET
   ========================= */
router.post("/", auth, loadUser, async (req, res) => {
  try {
    const { category, amount, month, scope = "ALL", cardId = null } = req.body;

    if (!category || !amount || !month) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.user.id,
        category,
        month,
        cardId: scope === "ALL" ? null : cardId
      },
      {
        userId: req.user.id,
        category,
        amount,
        month,
        scope,
        cardId: scope === "ALL" ? null : cardId
      },
      { upsert: true, new: true }
    );

    res.json(budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save budget" });
  }
});

/* =========================
   GET MONTHLY SUMMARY
   ========================= */
router.get("/summary", auth, loadUser, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }

    const budgets = await Budget.find({
      userId: req.user.id,
      month
    });

    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const txns = await Transaction.find({
      userId: req.user.id,
      date: { $gte: start, $lt: end }
    });

    const spentMap = {};
    txns.forEach(t => {
      if (t.amount < 0) {
        const key = `${t.category}|${t.cardId || "ALL"}`;
        spentMap[key] = (spentMap[key] || 0) + Math.abs(t.amount);
      }
    });

    const summary = budgets.map(b => {
      const key = `${b.category}|${b.cardId || "ALL"}`;
      const spent = spentMap[key] || 0;

      return {
  _id: b._id,
  category: b.category,
  cardId: b.cardId,
  budget: b.amount,
  spent,
  over: spent > b.amount
};

    });

    res.json(summary); // ✅ ARRAY ONLY
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch budget summary" });
  }
});

/* =========================
   DELETE BUDGET
   ========================= */
router.delete("/:id", auth, loadUser, async (req, res) => {
  await Budget.deleteOne({
    _id: req.params.id,
    userId: req.user.id
  });
  res.json({ success: true });
});

module.exports = router;
