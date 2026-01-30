function shouldEscalateModel(text, rows) {
  // Rule 1: Ledger-style keywords + heavy currency density
  const currencyCount = (text.match(/\d+\.\d{2}/g) || []).length;
  const looksLedger =
    /ending balance|new balance|account summary|account activity/i.test(text) &&
    currencyCount > 50;

  if (looksLedger) return true;

  let fourDigitCount = 0;

  for (const r of rows) {
    // Rule 2: ANY zero amount
    if (r.amount === 0) return true;

    // Rule 3: absurd values
    if (!Number.isFinite(r.amount) || Math.abs(r.amount) > 100000) {
      return true;
    }

    // Rule 4: count 4+ digit values
    if (Math.abs(r.amount) >= 1000) {
      fourDigitCount++;
    }

    // Rule 5: description too numeric-heavy (IDs + balances)
    const numericTokens =
      r.description.match(/\d+/g)?.length || 0;

    if (numericTokens > 5) {
      return true;
    }
  }

  // Rule 6: 5 or more transactions with 4+ digit amounts
  if (fourDigitCount >= 5) return true;

  return false;
}

module.exports = { shouldEscalateModel };
