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
        content: `
You are a financial statement transaction extraction engine.

You must extract ONLY real, individual transactions.
You must NOT invent data.
You must NOT include statement summaries, balances, rewards, APRs, fees, interest tables, legal text, or totals.

Your output MUST follow the exact format requested.
Any deviation is a failure.
        `.trim()
      },
      {
        role: "user",
        content: `
Extract individual TRANSACTIONS from the statement below.

OUTPUT FORMAT (EXACT — NO DEVIATION):
YYYY-MM-DD,Description,Amount

ABSOLUTE RULES (MANDATORY):
1. Output ONLY CSV rows — no headers, no explanations, no markdown.
2. One transaction per line.
SIGN INFERENCE RULE (NON-NEGOTIABLE):
You MUST determine whether the transaction is CREDIT or DEBIT from the description text BEFORE extracting the amount.
The sign decision takes priority over numeric formatting.

CHASE FORMAT RULE (MANDATORY):
Chase statements show a RUNNING BALANCE after each transaction.
The running balance MUST NEVER be extracted.
Only extract the transaction AMOUNT that appears NEXT TO the description.
If two numbers appear on a line or block, the SMALLER currency value is the transaction.

AMOUNT VALIDATION RULE:
A valid amount MUST:
- Be a realistic currency value (typically under 50,000)
- Contain at most ONE decimal point
- NOT contain more than 2 decimal places
- NOT be longer than 10 characters including decimals

If the number looks like an ID, reference number, or concatenation, SKIP the transaction.

3. Amount rules (CRITICAL):
   - EVERY amount MUST include a sign (+ or -)
   - Card purchases, payments to card, withdrawals, fees = NEGATIVE
   - Zelle received, salary, deposits, credits = POSITIVE
   - If the statement explicitly shows a minus sign, YOU MUST KEEP IT.
Otherwise, determine the sign ONLY from transaction semantics.
   - NEVER output an unsigned amount
   - NEVER output a balance amount
   - If the transaction text contains ANY of the following keywords, it MUST be POSITIVE (+):
"credit", "deposit", "salary", "payroll", "ppd", "zelle payment from", "received", "recd", "real time payment credit", "rtp credit"

Only mark NEGATIVE (-) if the text contains:
"card purchase", "payment to", "withdrawal", "debit", "fee"

- Balance-after-transaction lines (running balances) MUST NEVER be extracted as transactions.
Only extract lines where the amount represents money MOVING IN or OUT.

The transaction amount is NEVER equal to the ending balance.

4. Date rules:
   - If a transaction shows MM/DD, infer the YEAR from the statement date range
   - The statement date range ALWAYS determines the year
   - NEVER guess a year outside the statement range
   - Output date MUST be normalized to YYYY-MM-DD
5. Description rules:
   - Use merchant name or transaction description only
   - Remove card numbers, reference IDs, page numbers, rewards text, legal text
   - Keep description concise but meaningful
6. STRICT EXCLUSIONS (DO NOT OUTPUT THESE):
   - Statement headers
   - Account summaries
   - “New Balance”, “Minimum Payment”, “Credit Limit”
   - Rewards, points, cashback, APR, interest tables
   - Fees summaries or totals
   - Page numbers or legal disclosures
7. If a line does NOT clearly represent a real transaction, SKIP IT.
8. If amount or date is unclear, SKIP IT.
9. NEVER merge multiple transactions into one line.

EXAMPLE (VALID OUTPUT):
2025-04-13,TARGET ROCHESTER NY,-18.78
2025-04-17,MICHAEL KORS WATERLOO NY,-976.57
2025-05-06,TARGET ROCHESTER NY,-52.65
2025-05-02,COSTCO WHSE ROCHESTER NY,-135.39

STATEMENT TEXT:
${rawText}
        `.trim()
      }
    ]
  });

  let content = response.choices[0].message.content.trim();

  // Remove accidental markdown fences
  content = content.replace(/```/g, "").trim();

  const lines = content.split("\n");
  const transactions = [];

  for (const line of lines) {
    const parts = line.split(",");

    if (parts.length < 3) continue;

    const date = parts[0].trim();
    const amount = Number(parts[parts.length - 1]);
    const description = parts.slice(1, -1).join(",").trim();

    if (!date || !description || Number.isNaN(amount)) continue;

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
