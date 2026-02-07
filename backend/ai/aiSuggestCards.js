const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function aiSuggestCards({
  category,
  currency,
  country = "US",
  totalSpent = 0,
  scope = "all",
  userCards = [],
  allowComparison = false
}) {

  /* ================= USER CARD CONTEXT ================= */

  const userCardSection = allowComparison
    ? `
USER'S EXISTING CARDS:
${userCards.map(c => `- ${c.issuer} ${c.product}`).join("\n")}

COMPARISON RULES:
- Evaluate user's card cashback realistically
- DO NOT stop recommendations
- DO NOT block suggestions
- Even if user's card is strong:
  → Still recommend TWO comparable cards
  → Summary must mention user's current cashback rate
`
    : `
IMPORTANT:
- User cards are NOT provided
- Do NOT reference user's existing cards
- Always recommend best available cards
`;

  /* ================= PROMPT ================= */

  const prompt = `
You are a REAL-WORLD credit card cashback expert.

========================
STRICT RULES
========================
- ALWAYS return EXACTLY 2 cards
- DO NOT block suggestions for any reason
- DO NOT invent unrealistic cards
- Prefer well-known, real cards
- Cashback rates must be defensible
- Paid cards must justify annual fee
- Annual fee MUST be a number (0 if free)

========================
USER CONTEXT
========================
Country: ${country}
Currency: ${currency}
Category: ${category}
Total Spent: ${totalSpent}
Scope: ${scope}

${userCardSection}

========================
SUMMARY LOGIC
========================
- If user's card has strong cashback:
  Say:
  "Your current card already offers X% cashback, which is strong for this category."
- Then continue with:
  "Here are two comparable options you may consider."

- NEVER say:
  - "Do not switch"
  - "You already have the best card"
  - Anything that blocks suggestions

========================
RESPONSE FORMAT (JSON ONLY)
========================

{
  "summary": "Clear explanation mentioning user's cashback if applicable",
  "cards": [
    {
      "name": "Real card name",
      "issuer": "Bank name",
      "cardType": "free | paid",
      "annualFee": 0,
      "cashbackRate": 2,
      "reason": "Why this card is good"
    },
    {
      "name": "Real card name",
      "issuer": "Bank name",
      "cardType": "paid",
      "annualFee": what is the annual fee for the suugested card,
      "cashbackRate": 3,
      "reason": "Why this card may be better or comparable"
    }
  ]
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.15
  });

  return JSON.parse(completion.choices[0].message.content);
}

module.exports = { aiSuggestCards };
