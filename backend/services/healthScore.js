function calculateHealthScore(transactions) {
  // Only consider valid numeric transactions
  const valid = transactions.filter(
    t => typeof t.amount === "number" && t.amount !== 0
  );

  if (valid.length === 0) {
    return {
      score: 0,
      insights: ["Add transactions to calculate health score"]
    };
  }

  const incomeTxns = valid.filter(t => t.amount > 0);
  const expenseTxns = valid.filter(t => t.amount < 0);

  const totalIncome = incomeTxns.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenseTxns.reduce((s, t) => s + Math.abs(t.amount), 0);

  // 🚨 HARD STOP CONDITIONS
  if (totalIncome === 0 || totalExpense === 0) {
    return {
      score: 0,
      insights: ["Add income and expense transactions to calculate health score"]
    };
  }

  /* ===============================
     1️⃣ Savings Rate (40%)
     =============================== */
  const savingsRate = (totalIncome - totalExpense) / totalIncome;
  const savingsScore = Math.max(0, Math.min(1, savingsRate)) * 40;

  /* ===============================
     2️⃣ Category Balance (25%)
     =============================== */
  const categoryMap = {};
  expenseTxns.forEach(t => {
    categoryMap[t.category] =
      (categoryMap[t.category] || 0) + Math.abs(t.amount);
  });

  const categoryCount = Object.keys(categoryMap).length;
  const categoryScore = Math.min(categoryCount / 6, 1) * 25;

  /* ===============================
     3️⃣ Expense Volatility (20%)
     =============================== */
  const avgExpense = totalExpense / expenseTxns.length;
  const variance =
    expenseTxns.reduce(
      (s, t) => s + Math.pow(Math.abs(t.amount) - avgExpense, 2),
      0
    ) / expenseTxns.length;

  const volatilityPenalty = Math.min(variance / avgExpense, 1);
  const volatilityScore = (1 - volatilityPenalty) * 20;

  /* ===============================
     4️⃣ Unusual Spending (15%)
     =============================== */
  const unusualCount = expenseTxns.filter(
    t => Math.abs(t.amount) > avgExpense * 3
  ).length;

  const unusualScore =
    Math.max(0, 1 - unusualCount / expenseTxns.length) * 15;

  /* ===============================
     FINAL SCORE
     =============================== */
  const score = Math.round(
    savingsScore + categoryScore + volatilityScore + unusualScore
  );

  const insights = [];
  if (savingsRate < 0.2) insights.push("Low savings rate");
  if (categoryCount < 3) insights.push("Spending not diversified");
  if (unusualCount > 0) insights.push("Unusual spending detected");

  return {
    score,
    insights
  };
}

module.exports = { calculateHealthScore };
