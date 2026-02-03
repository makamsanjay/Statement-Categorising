const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function aiExtractTransactions(rawText, model = "gpt-4o-mini") {
  const response = await client.chat.completions.create({
    model,
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

3. Amount rules (CRITICAL):
- EVERY amount MUST include a sign (+ or -)
- Card purchases, payments, withdrawals, fees = NEGATIVE
- Zelle received, salary, deposits, credits = POSITIVE
- NEVER output an unsigned amount
- NEVER output a balance amount

4. Date rules:
- Infer year ONLY from statement date range
- Output YYYY-MM-DD only

5. If a line does NOT clearly represent a real transaction, SKIP IT.

STATEMENT TEXT:
${rawText}
        `.trim()
      }
    ]
  });

  let content = response.choices[0].message.content.trim();
  content = content.replace(/```/g, "").trim();

 const lines = content.split("\n");
const transactions = [];

for (const line of lines) {
  const lastCommaIndex = line.lastIndexOf(",");

  if (lastCommaIndex === -1) continue;

  const firstCommaIndex = line.indexOf(",");

  if (firstCommaIndex === -1 || firstCommaIndex === lastCommaIndex) continue;

  const date = line.slice(0, firstCommaIndex).trim();
  const description = line
    .slice(firstCommaIndex + 1, lastCommaIndex)
    .trim();

  const rawAmount = line.slice(lastCommaIndex + 1).trim();
  const amount = Number(rawAmount.replace(/,/g, ""));

  if (!date || !description || Number.isNaN(amount)) continue;

  transactions.push({
    date,
    description,
    amount
  });
}
  return transactions;
}

module.exports = { aiExtractTransactions };
