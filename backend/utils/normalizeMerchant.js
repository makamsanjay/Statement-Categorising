function normalizeMerchant(description) {
  return description
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(" ")
    .slice(0, 2)
    .join(" ");
}

module.exports = normalizeMerchant;
