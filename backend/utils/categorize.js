const rules = require("./categoryRules");

function categorize(description) {
  if (!description) return "Other";

  const text = description.toLowerCase();

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        return rule.category;
      }
    }
  }

  return "Other";
}

module.exports = categorize;
