import {
  CURRENCIES,
  CURRENCY_SYMBOLS,
  CurrencyTotals,
  DEFAULT_BUDGET_CURRENCY,
  DEFAULT_DEAL_CURRENCY,
  toCurrency,
} from "@/lib/currency";

// Intl's currency style resolves the UAH symbol inconsistently between
// server (Node ICU) and browser ICU — "₴" vs "грн" — which breaks SSR
// hydration. Format the number plainly and append the symbol ourselves.
const numberFormatter = new Intl.NumberFormat("uk-UA", {
  style: "decimal",
  maximumFractionDigits: 0,
});

export function formatMoney(
  value: number | string | null | undefined,
  currency: string | null | undefined,
) {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  const symbol = CURRENCY_SYMBOLS[toCurrency(currency, DEFAULT_DEAL_CURRENCY)];
  return `${numberFormatter.format(num)} ${symbol}`;
}

// Per-currency sums, e.g. "12 000 ₴ · 2 700 $". Currencies with nothing in
// them are skipped; an all-zero total falls back to the default currency.
export function formatTotals(totals: CurrencyTotals) {
  const parts = CURRENCIES.filter((c) => totals[c] !== 0).map((c) =>
    formatMoney(totals[c], c),
  );
  return parts.length > 0 ? parts.join(" · ") : formatMoney(0, DEFAULT_DEAL_CURRENCY);
}

// Budget is free text ("350-500", "1600+"), so only the symbol is appended.
export function formatBudget(
  budget: string | null | undefined,
  currency: string | null | undefined,
) {
  if (!budget) return "—";
  return `${budget} ${CURRENCY_SYMBOLS[toCurrency(currency, DEFAULT_BUDGET_CURRENCY)]}`;
}

// timeZone is pinned to UTC on every formatter below for the same reason as
// numberFormatter above: several of these run in client components, and an
// unpinned zone resolves to the server's zone during SSR but the viewer's
// zone during hydration, which breaks hydration for dates near a day/hour
// boundary.
const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("uk-UA", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  const hasTime = date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0;
  return hasTime ? dateTimeFormatter.format(date) : dateFormatter.format(date);
}

export function formatMonth(value: Date | string | null | undefined) {
  if (!value) return "—";
  return monthFormatter.format(new Date(value));
}
