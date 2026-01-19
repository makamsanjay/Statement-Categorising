async function detectSpendingSpike(userId) {
  const now = new Date();

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const data = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: lastMonthStart }
      }
    },
    {
      $group: {
        _id: {
          category: "$category",
          month: { $month: "$date" }
        },
        total: { $sum: { $abs: "$amount" } }
      }
    }
  ]);

  const map = {};

  data.forEach(d => {
    const key = d._id.category;
    map[key] ??= {};
    map[key][d._id.month] = d.total;
  });

  const alerts = [];

  for (const category in map) {
    const current = map[category][now.getMonth() + 1] || 0;
    const previous = map[category][now.getMonth()] || 0;

    if (previous > 0) {
      const change = ((current - previous) / previous) * 100;

      if (change > 30) {
        alerts.push({
          type: "SPENDING_SPIKE",
          message: `${category} spending is ${Math.round(change)}% higher than last month`
        });
      }
    }
  }

  return alerts;
}
