export const CURRENCIES = ["UAH", "USD", "EUR"] as const;

export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  UAH: "₴",
  USD: "$",
  EUR: "€",
};

export const DEFAULT_DEAL_CURRENCY: Currency = "UAH";
export const DEFAULT_BUDGET_CURRENCY: Currency = "USD";

// Sums are kept per currency — there is no exchange rate in the CRM, so
// amounts in different currencies are never added together.
export type CurrencyTotals = Record<Currency, number>;

export function emptyTotals(): CurrencyTotals {
  return { UAH: 0, USD: 0, EUR: 0 };
}

export function toCurrency(value: string | null | undefined, fallback: Currency): Currency {
  return CURRENCIES.includes(value as Currency) ? (value as Currency) : fallback;
}

export function sumDealValues(
  items: { dealValue: string | null; dealCurrency: string }[],
): CurrencyTotals {
  const totals = emptyTotals();
  for (const item of items) {
    totals[toCurrency(item.dealCurrency, DEFAULT_DEAL_CURRENCY)] += Number(item.dealValue ?? 0);
  }
  return totals;
}
