const rules = require("./categoryRules");

function categorize(description) {
  if (!description) {
    return { category: "Other", confidence: 0.2, source: "rule" };
  }

  const text = description.toLowerCase();

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        return {
          category: rule.category,
          confidence: 0.9,
          source: "rule"
        };
      }
    }
  }

  return {
    category: "UNKNOWN",
    confidence: 0,
    source: "rule"
  };
}

module.exports = categorize;
