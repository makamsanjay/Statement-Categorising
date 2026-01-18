const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

router.get("/overview", async (req, res) => {
  const { userId, month } = req.query;

  const start = new Date(month);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const data = await Transaction.aggregate([
    { $match: { userId, date: { $gte: start, $lt: end } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } }
  ]);

  res.json(data.map(d => ({ category: d._id, total: d.total })));
});

router.get("/cards", async (req, res) => {
  const { userId, month } = req.query;

  const start = new Date(month);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const rows = await Transaction.aggregate([
    { $match: { userId, date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { cardId: "$cardId", category: "$category" },
        total: { $sum: "$amount" }
      }
    }
  ]);

  const result = {};
  rows.forEach(r => {
    if (!result[r._id.cardId]) result[r._id.cardId] = {};
    result[r._id.cardId][r._id.category] = r.total;
  });

  res.json(result);
});

module.exports = router;
