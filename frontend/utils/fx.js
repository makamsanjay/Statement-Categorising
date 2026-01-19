export const FX = {
  USD: 1,
  INR: 0.012,   // ~ ₹83 = $1 (adjust later)
  EUR: 1.08,
  GBP: 1.27
};

export const convertToUSD = (amount, currency) => {
  return amount * (FX[currency] || 1);
};

export const convert = (amount, from, to) => {
  if (from === to) return amount;
  return (amount / FX[from]) * FX[to];
};
