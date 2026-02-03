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
  allowComparison = false   // 🔒 HARD GATE FROM BACKEND
}) {
  /* ======================================================
     USER CARD CONTEXT (STRICTLY GUARDED)
     ====================================================== */
  const userCardSection = allowComparison
    ? `
USER'S EXISTING CARDS (VERY IMPORTANT):
${userCards.map(c => `- ${c.issuer} ${c.product}`).join("\n")}

MANDATORY COMPARISON RULES:
- ONLY compare against the cards listed above
- Determine their REALISTIC always-on cashback rates
- Compare NUMERICALLY with your recommendations
- If ANY user card cashback >= your BEST recommendation:
  → User ALREADY has a top-tier card
  → DO NOT suggest switching
  → Summary MUST clearly say user is already using a high cashback card
- If user card cashback < best available:
  → Recommend better cards normally
`
    : `
IMPORTANT:
- User has NOT provided official card name(s)
- DO NOT compare against user's cards
- DO NOT say user already has the best cashback
- ONLY recommend best cards normally
`;

  /* ======================================================
     PROMPT
     ====================================================== */
  const prompt = `
You are a REAL-WORLD credit card cashback expert.

========================
STRICT RULES (NON-NEGOTIABLE)
========================
- DO NOT use rotating bonus categories
- Treat rotating cards as BASE RATE ONLY
- Examples:
  - Chase Freedom Flex → 1%
  - Discover It → 1%
- NEVER guess cashback rates
- NEVER return 0% cashback
- ALWAYS return EXACTLY 2 cards
- Cashback rates must be realistic and defensible

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
DECISION LOGIC (STEP-BY-STEP)
========================
1. Identify the BEST always-on cashback rate for this category
2. ${
    allowComparison
      ? "Identify the cashback rate of the user's card(s) and compare numerically"
      : "DO NOT evaluate user's cards at all"
  }
3. ${
    allowComparison
      ? `If user card >= best available:
   - User is already optimal
   - Summary MUST say this clearly
   - Reasons must reinforce continued use`
      : `Always recommend the best available cards`
  }
4. Paid cards MUST justify annual fee clearly

========================
SUMMARY RULES
========================
- If user already has top cashback:
  Use wording like:
  "You are already using one of the highest cashback cards for this category."
- NEVER say this unless comparison is explicitly allowed
- If comparison is not allowed:
  - Do NOT mention user's cards at all

========================
RESPONSE FORMAT (JSON ONLY)
========================

{
  "summary": "Clear, honest, human explanation",
  "cards": [
    {
      "name": "Card name",
      "issuer": "Bank",
      "cardType": "free | paid",
      "annualFee": 0,
      "cashbackRate": 2,
      "reason": "Clear explanation"
    },
    {
      "name": "Card name",
      "issuer": "Bank",
      "cardType": "paid",
      "annualFee": 95,
      "cashbackRate": 3,
      "reason": "Clear explanation or comparison"
    }
  ]
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1
  });

  return JSON.parse(completion.choices[0].message.content);
}

module.exports = { aiSuggestCards };