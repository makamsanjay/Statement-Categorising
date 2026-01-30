function shouldEscalateModel(text, rows) {
  let invalidAmountCount = 0;

  for (const r of rows) {
    const amt = r.amount;

    // 1️⃣ Zero amount is always invalid
    if (amt === 0) {
      invalidAmountCount++;
      continue;
    }

    // 2️⃣ Amount too small but looks like credit/debit
    if (
      Math.abs(amt) < 1 &&
      /zelle|salary|deposit|payment|purchase|credit|debit/i.test(
        r.description
      )
    ) {
      invalidAmountCount++;
      continue;
    }

    // 3️⃣ Impossible magnitude (ID leakage)
    if (Math.abs(amt) > 100000) {
      invalidAmountCount++;
      continue;
    }

    // 4️⃣ Decimal corruption (more than 2 decimals)
    if (!Number.isInteger(amt * 100)) {
      invalidAmountCount++;
    }
  }

  // 🔥 Escalate ONLY if clearly broken
  return invalidAmountCount >= 2;
}

module.exports = { shouldEscalateModel };
