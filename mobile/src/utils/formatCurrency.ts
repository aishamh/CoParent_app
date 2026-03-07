const CURRENCY_SYMBOLS: Record<string, string> = {
  NOK: "kr",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  SEK: "kr",
  DKK: "kr",
};

export function formatCurrency(
  amount: number,
  currency = "NOK",
): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol} ${formatted}`;
}
