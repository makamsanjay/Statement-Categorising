const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  const { category, amount, month } = req.body;

  const budget = await Budget.findOneAndUpdate(
    { category, month },
    { amount },
    { upsert: true, new: true }
  );

  res.json(budget);
});

router.get("/summary", async (req, res) => {
  const month = req.query.month; 

  const budgets = await Budget.find({ month });
  const txns = await Transaction.find({
    date: {
      $gte: new Date(`${month}-01`),
      $lt: new Date(`${month}-31`)
    }
  });

  const spentByCategory = {};
  txns.forEach(t => {
    if (t.amount < 0) {
      spentByCategory[t.category] =
        (spentByCategory[t.category] || 0) + Math.abs(t.amount);
    }
  });

  const result = budgets.map(b => ({
    category: b.category,
    budget: b.amount,
    spent: spentByCategory[b.category] || 0,
    remaining: b.amount - (spentByCategory[b.category] || 0),
    over: (spentByCategory[b.category] || 0) > b.amount
  }));

  res.json(result);
});

module.exports = router;