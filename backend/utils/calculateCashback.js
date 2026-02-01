module.exports = function calculateCashback(totalSpent, cashbackRate) {
  const rate = Number(cashbackRate) || 0;
  return Number(((totalSpent * rate) / 100).toFixed(2));
};
