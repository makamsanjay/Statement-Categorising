function calculateHealthScore(transactions) {
  if (!transactions.length) {
    return {
      score: 0,
      breakdown: {},
      insights: ["No transactions available"]
    };
  }

  // ---------- BASIC TOTALS ----------
  let income = 0;
  let expense = 0;
  const categoryTotals = {};
  const monthlyExpense = {};

  transactions.forEach(t => {
    const amt = Number(t.amount);
    const month = new Date(t.date).toISOString().slice(0, 7);

    if (amt > 0) income += amt;
    else expense += Math.abs(amt);

    if (amt < 0) {
      categoryTotals[t.category] =
        (categoryTotals[t.category] || 0) + Math.abs(amt);

      monthlyExpense[month] =
        (monthlyExpense[month] || 0) + Math.abs(amt);
    }
  });

  // ---------- 1. SAVINGS SCORE ----------
  const savings = income - expense;
  const savingsRate = income ? savings / income : 0;

  let savingsScore = 0;
  if (savingsRate >= 0.3) savingsScore = 25;
  else if (savingsRate >= 0.2) savingsScore = 20;
  else if (savingsRate >= 0.1) savingsScore = 15;
  else if (savingsRate > 0) savingsScore = 8;

  // ---------- 2. CATEGORY BALANCE ----------
  const maxCategoryPct =
    Math.max(...Object.values(categoryTotals)) / expense;

  let categoryScore = 0;
  if (maxCategoryPct <= 0.3) categoryScore = 25;
  else if (maxCategoryPct <= 0.4) categoryScore = 20;
  else if (maxCategoryPct <= 0.5) categoryScore = 15;
  else if (maxCategoryPct <= 0.6) categoryScore = 8;

  // ---------- 3. VOLATILITY ----------
  const monthlyValues = Object.values(monthlyExpense);
  const avg =
    monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length || 0;

  const variance =
    monthlyValues.reduce((a, v) => a + Math.pow(v - avg, 2), 0) /
    monthlyValues.length || 0;

  const volatility = avg ? Math.sqrt(variance) / avg : 0;

  let volatilityScore = 0;
  if (volatility <= 0.1) volatilityScore = 25;
  else if (volatility <= 0.2) volatilityScore = 20;
  else if (volatility <= 0.3) volatilityScore = 15;
  else if (volatility <= 0.4) volatilityScore = 8;

  // ---------- 4. UNUSUAL SPENDING ----------
  let unusualCount = 0;
  Object.values(monthlyExpense).forEach(v => {
    if (v > avg * 1.5) unusualCount++;
  });

  let anomalyScore = 0;
  if (unusualCount === 0) anomalyScore = 25;
  else if (unusualCount === 1) anomalyScore = 20;
  else if (unusualCount === 2) anomalyScore = 15;
  else if (unusualCount === 3) anomalyScore = 8;

  // ---------- FINAL ----------
  const score =
    savingsScore + categoryScore + volatilityScore + anomalyScore;

  const insights = [];
  if (savingsRate < 0.1) insights.push("Low savings rate");
  if (maxCategoryPct > 0.5) insights.push("High dependency on one category");
  if (volatility > 0.3) insights.push("Expenses are unstable month-to-month");
  if (unusualCount > 0) insights.push("Unusual spending detected");

  return {
    score,
    breakdown: {
      savings: savingsScore,
      categoryBalance: categoryScore,
      volatility: volatilityScore,
      unusualSpending: anomalyScore
    },
    insights
  };
}

function calculateHealthScore(spent, budget) {
  if (!budget || budget === 0) return 100;

  const usage = spent / budget;

  if (usage <= 0.7) return 90;
  if (usage <= 0.9) return 70;
  if (usage <= 1.0) return 50;
  return 30;
}


module.exports = { calculateHealthScore };
