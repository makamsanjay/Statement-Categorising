function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values, avg) {
  return Math.sqrt(
    values.map(v => (v - avg) ** 2).reduce((a, b) => a + b) / values.length
  );
}

async function detectUnusualTransaction(txn, userId) {
  const past = await Transaction.find({
    userId,
    category: txn.category
  }).limit(100);

  if (past.length < 10) return null;

  const amounts = past.map(t => Math.abs(t.amount));
  const avg = mean(amounts);
  const sd = stdDev(amounts, avg);

  const z = (Math.abs(txn.amount) - avg) / sd;

  if (z > 3) {
    return {
      type: "UNUSUAL_TXN",
      message: `Unusual transaction detected: ₹${txn.amount} at ${txn.description}`
    };
  }

  return null;
}
