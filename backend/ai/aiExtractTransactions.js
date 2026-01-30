const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function aiExtractTransactions(rawText) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a data extraction engine. You output ONLY CSV rows. No explanations."
      },
      {
        role: "user",
        content: `
Extract bank transactions and return ONLY CSV lines.

Format (EXACT):
YYYY-MM-DD,Description,Amount

Rules:
- One transaction per line
- Debit = negative
- Credit = positive
- No headers
- No markdown
- No extra text
- Ignore balances, totals, page numbers

Example:
2025-01-09,Mobile Recharge,-399
2025-01-10,Interest,120
2025-01-11,Salary,50000

Bank statement text:
${rawText}
`
      }
    ]
  });

  let content = response.choices[0].message.content.trim();

  content = content.replace(/```/g, "").trim();

  const lines = content.split("\n");
  const transactions = [];

  for (const line of lines) {
    const parts = line.split(",");

    if (parts.length < 3) continue;

    const date = parts[0].trim();
    const amount = Number(parts[parts.length - 1]);
    const description = parts.slice(1, -1).join(",").trim();

    if (!date || !description || isNaN(amount)) continue;

    transactions.push({
      date,
      description,
      amount
    });
  }

  if (!transactions.length) {
  console.warn("AI returned no transactions");
  return [];
}

  return transactions;
}

module.exports = { aiExtractTransactions };
