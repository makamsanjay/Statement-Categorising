// backend/services/statementParser.js
function normalizeLines(rawText) {
  return rawText
    .replace(/\u00A0/g, " ") // remove non-breaking spaces
    .replace(/\r/g, "")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);
}


function mergeTransactionLines(lines) {
  const merged = [];
  let buffer = "";

  for (const line of lines) {
    // MM/DD anywhere at start (after whitespace)
    if (/^\s*\d{2}\/\d{2}\b/.test(line)) {
      if (buffer) merged.push(buffer.trim());
      buffer = line;
    } else if (buffer) {
      buffer += " " + line;
    }
  }

  if (buffer) merged.push(buffer.trim());
  return merged;
}



function extractAmounts(line) {
  const matches = line.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d{2})/g);
  if (!matches) return null;

  return {
    amount: parseFloat(matches[0].replace(/,/g, "")), // FIRST number
    balance:
      matches.length > 1
        ? parseFloat(matches[matches.length - 1].replace(/,/g, ""))
        : null
  };
}

function normalizeDate(mmdd, year) {
  const [mm, dd] = mmdd.split("/");
  return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function classify(amount, description) {
  if (amount < 0) {
    return { type: "Expense", category: "Other" };
  }

  if (/salary|deposit/i.test(description)) {
    return { type: "Income", category: "Income" };
  }

  if (/zelle/i.test(description)) {
    return { type: "Income", category: "Transfers" };
  }

  return { type: "Income", category: "Income" };
}

function extractStatementYear(text) {
  const match = text.match(/(\w+ \d{1,2}, (\d{4})) through/);
  return match ? parseInt(match[2], 10) : new Date().getFullYear();
}

function parseTransactions(rawText) {
  const year = extractStatementYear(rawText);

  // Normalize text: remove weird spacing and line breaks
  const text = rawText
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ");

  /**
   * Chase transaction pattern:
   * MM/DD <description> <amount> [balance]
   *
   * Examples:
   * 12/04 Zelle Payment From John Doe 4,835.81
   * 12/04 Payment To Chase Card Ending IN 4312 -192.88 4,642.93
   */
  const txnRegex =
    /(\d{2}\/\d{2})\s+(.+?)\s+(-?\d{1,3}(?:,\d{3})*(?:\.\d{2}))/g;

  const transactions = [];
  let match;

  while ((match = txnRegex.exec(text)) !== null) {
    const [, mmdd, description, amountStr] = match;

    const amount = parseFloat(amountStr.replace(/,/g, ""));
    if (Number.isNaN(amount)) continue;

    const { type, category } = classify(amount, description);

    transactions.push({
      date: normalizeDate(mmdd, year),
      description: description.trim(),
      amount,
      type,
      category
    });
  }

  return transactions;
}




module.exports = { parseTransactions };
