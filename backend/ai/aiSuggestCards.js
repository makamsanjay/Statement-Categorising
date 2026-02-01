const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function aiSuggestCards({
  category,
  currency,
  totalSpent = 0,
  country = "US"
}) {
  const prompt = `
You are a REAL credit card cashback expert.

Return JSON ONLY. No markdown. No backticks.

Rules:
- NEVER return 0% cashback
- Cashback must be realistic for ${country}
- If category-specific exists → use it
- Else fallback to flat-rate (>=1.5%)

Return EXACT format:

{
  "summary": "",
  "cards": [
    {
      "name": "",
      "issuer": "",
      "cardType": "free | paid",
      "annualFee": 0,
      "cashbackRate": 3,
      "reason": ""
    },
    {
      "name": "",
      "issuer": "",
      "cardType": "free | paid",
      "annualFee": 95,
      "cashbackRate": 2,
      "reason": ""
    }
  ]
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });

  let raw = completion.choices[0].message.content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("❌ AI RAW:", raw);
    throw new Error("AI JSON invalid");
  }

  // 🔒 HARD VALIDATION (but NOT override)
  parsed.cards = parsed.cards.slice(0, 2).map(c => ({
    ...c,
    cashbackRate: Math.max(Number(c.cashbackRate), 1.5)
  }));

  return parsed;
}

module.exports = { aiSuggestCards };
