function calculateHealthScore(transactions = []) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      score: 0,
      insights: ["No transactions available"]
    };
  }

  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    const amt = Number(t.amount);
    if (isNaN(amt)) return;

    if (amt > 0) income += amt;
    else expense += Math.abs(amt);
  });

  if (income === 0) {
    return {
      score: 10,
      insights: ["No income detected"]
    };
  }

  const savingsRate = (income - expense) / income;

  let score =
    savingsRate >= 0.3 ? 90 :
    savingsRate >= 0.2 ? 75 :
    savingsRate >= 0.1 ? 60 :
    savingsRate > 0 ? 40 : 20;

  return {
    score,
    insights: [
      savingsRate < 0.1 && "Low savings rate",
      expense > income && "Spending exceeds income"
    ].filter(Boolean)
  };
}

module.exports = { calculateHealthScore };
