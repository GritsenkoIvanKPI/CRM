// Intl's currency style resolves the UAH symbol inconsistently between
// server (Node ICU) and browser ICU — "₴" vs "грн" — which breaks SSR
// hydration. Format the number plainly and append the symbol ourselves.
const numberFormatter = new Intl.NumberFormat("uk-UA", {
  style: "decimal",
  maximumFractionDigits: 0,
});

export function formatUAH(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  return `${numberFormatter.format(num)} ₴`;
}

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  return hasTime ? dateTimeFormatter.format(date) : dateFormatter.format(date);
}

export function formatMonth(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" }).format(
    new Date(value),
  );
}
