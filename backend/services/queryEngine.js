const Transaction = require("../models/Transaction");

async function runQuery(intent, userId) {
  const filter = {
    userId,
    date: {
      $gte: new Date(intent.from),
      $lte: new Date(intent.to)
    }
  };

  if (intent.category) {
    filter.category = intent.category;
  }

  const txns = await Transaction.find(filter);

  if (intent.intent === "CATEGORY_SUM" || intent.intent === "TOTAL_SPEND") {
    const total = txns.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    return { total };
  }

  if (intent.intent === "TOP_EXPENSE") {
    const top = txns.sort(
      (a, b) => Math.abs(b.amount) - Math.abs(a.amount)
    )[0];
    return top || null;
  }

  return null;
}

module.exports = { runQuery };
