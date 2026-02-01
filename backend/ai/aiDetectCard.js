async function aiDetectCard(rawText, model = "gpt-4o-mini") {
  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
You are a credit card statement identification engine.

Your job:
1. Extract issuer if clearly visible (Chase, American Express, Citi, Capital One, Discover, etc.)
2. Extract product ONLY if explicitly written
3. If product is not visible, leave product empty BUT issuer MUST be filled if possible
4. NEVER hallucinate product names
`
      },
      {
        role: "user",
        content: `
Extract card details from the statement text.

Return STRICT JSON only:

{
  "issuer": "",
  "product": "",
  "network": "",
  "confidence": 0.0
}

Rules:
- Issuer can be inferred from bank name text
- Product ONLY if exact name appears
- Confidence can be low (0.1 is OK)

STATEMENT TEXT:
${rawText}
`
      }
    ]
  });

  let parsed;
  try {
    parsed = JSON.parse(response.choices[0].message.content);
  } catch {
    parsed = {};
  }

  /* =========================
     🔁 FALLBACK ISSUER DETECTION
  ========================= */
  const text = rawText.toLowerCase();

  if (!parsed.issuer) {
    if (text.includes("chase")) parsed.issuer = "Chase";
    else if (text.includes("american express") || text.includes("amex"))
      parsed.issuer = "American Express";
    else if (text.includes("citi"))
      parsed.issuer = "Citi";
    else if (text.includes("capital one"))
      parsed.issuer = "Capital One";
  }

  // 🔐 FINAL SAFE FALLBACK
if (!parsed.issuer) {
  parsed.issuer = "Bank Statement";
  parsed.confidence = 0.05;
}

  // If issuer exists but product doesn't → still valid
  if (parsed.issuer && !parsed.product) {
    parsed.confidence = Math.max(parsed.confidence || 0.1, 0.1);
  }

  return {
    issuer: parsed.issuer || "",
    product: parsed.product || "",
    network: parsed.network || "",
    confidence: parsed.confidence || 0.1
  };
}

module.exports = aiDetectCard;
