const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function parseUserQuery(question) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
You convert finance questions into structured JSON.
ONLY return valid JSON.
`
      },
      {
        role: "user",
        content: `
Question: "${question}"

Return JSON in this exact format:
{
  "intent": "CATEGORY_SUM | TOTAL_SPEND | TOP_EXPENSE",
  "category": "Food & Dining | null",
  "from": "YYYY-MM-DD",
  "to": "YYYY-MM-DD"
}
`
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = { parseUserQuery };
