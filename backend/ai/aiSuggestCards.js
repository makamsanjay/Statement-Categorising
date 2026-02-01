const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function aiSuggestCards({
  category,
  currency,
  country = "US",
  totalSpent = 0
}) {
  const prompt = `
You are a real-world credit card expert.

IMPORTANT RULES (STRICT):
- DO NOT apply rotating bonus rates (5%, 10%, etc.)
- Treat ALL rotating cards as BASE RATE ONLY
- Example:
  - Chase Freedom Flex → 1% base
  - Discover It → 1% base
- Only recommend category bonuses that are ALWAYS active

Your task:
- Select the BEST 2 cards in ${country} for "${category}"
- Cards may be free or paid
- CashbackRate must reflect ONLY guaranteed, always-on rates

Return JSON ONLY in this format:

{
  "summary": "One clear sentence",
  "cards": [
    {
      "name": "Card name",
      "issuer": "Bank",
      "cardType": "free | paid",
      "annualFee": 0,
      "cashbackRate": 2,
      "reason": "Why this card is good for this category"
    },
    {
      "name": "Card name",
      "issuer": "Bank",
      "cardType": "paid",
      "annualFee": 95,
      "cashbackRate": 3,
      "reason": "Why this card is good for this category"
    }
  ]
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });

  return JSON.parse(completion.choices[0].message.content);
}

module.exports = { aiSuggestCards };
