function normalizeDate(mmdd, year) {
  const [mm, dd] = mmdd.split("/");
  return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function extractStatementYear(text) {
  const match = text.match(/(\w+ \d{1,2}, (\d{4})) through/);
  return match ? parseInt(match[2], 10) : new Date().getFullYear();
}

function cleanAmount(str) {
  const n = parseFloat(str.replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
}

function parseTransactionsFromAIRows(aiRows, rawText) {
  const year = extractStatementYear(rawText);
  const txns = [];

  for (const row of aiRows) {
    if (!row || typeof row !== "string") continue;

    // find date
    const dateMatch = row.match(/(\d{2}\/\d{2})/);
    if (!dateMatch) continue;

    // find ALL numbers
    const nums = row.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d{2})/g);
    if (!nums || nums.length === 0) continue;

    // transaction amount is FIRST signed number
    const amount = cleanAmount(nums[0]);
    if (amount === null) continue;

    // balance sanity check
    if (Math.abs(amount) > 100000) continue;

    const description = row
      .replace(dateMatch[0], "")
      .replace(/-?\d{1,3}(?:,\d{3})*(?:\.\d{2})/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!description) continue;

    txns.push({
      date: normalizeDate(dateMatch[1], year),
      description,
      amount,
      type: amount < 0 ? "Expense" : "Income",
      category: amount < 0 ? "Other" : "Income"
    });
  }

  return txns;
}

module.exports = { parseTransactionsFromAIRows };
