module.exports = function currencyToCountry(currency) {
  switch (currency) {
    case "USD":
      return "US";
    case "INR":
      return "IN";
    case "EUR":
      return "EU";
    case "GBP":
      return "UK";
    default:
      return "US";
  }
};
