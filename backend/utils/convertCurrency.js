const rates = require("./currencyRates");

function convert(amount, from, to) {
  if (from === to) return amount;
  const usd = amount * (rates[from] || 1);
  return usd / (rates[to] || 1);
}

module.exports = { convert };
