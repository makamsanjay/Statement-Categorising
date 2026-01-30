function preprocessOCR(rawText) {
  if (!rawText) return rawText;

  let text = rawText;

  // 1️⃣ Remove long numeric IDs (10+ digits = NOT money)
  // Examples: Zelle refs, transaction IDs, phone numbers
  text = text.replace(/\b\d{10,}\b/g, " ");

  // 2️⃣ Break amount + balance pairs onto separate lines
  // Example: "489.50 4,835.81" → "489.50\n4,835.81"
  text = text.replace(
    /(\d{1,7}(?:,\d{3})*\.\d{2})\s+(\d{1,7}(?:,\d{3})*\.\d{2})/g,
    "$1\n$2"
  );

  // 3️⃣ Normalize spacing (avoid token glue)
  text = text.replace(/[ \t]+/g, " ");

  // 4️⃣ Clean up excessive blank lines
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

module.exports = { preprocessOCR };
