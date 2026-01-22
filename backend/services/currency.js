function detectCurrency(text) {
  if (!text) return null;

  if (text.includes("₹") || text.includes("INR")) return "INR";
  if (text.includes("$") || text.includes("USD")) return "USD";
  if (text.includes("€") || text.includes("EUR")) return "EUR";
  if (text.includes("£") || text.includes("GBP")) return "GBP";

  return null;
}

module.exports = { detectCurrency };
