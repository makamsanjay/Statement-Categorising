const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function aiCategorize(description) {
  const prompt = `
You are a finance assistant.
Categorize the following transaction into ONE of these categories only:

Food & Dining
Groceries
Transportation
Shopping
Entertainment
Utilities
Healthcare
Education
Income
Taxes
Transfers
Subscriptions
Credit Card Payment
Other

Transaction description:
"${description}"

Respond ONLY with the category name.
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0
  });

  return response.choices[0].message.content.trim();
}

module.exports = { aiCategorize };
