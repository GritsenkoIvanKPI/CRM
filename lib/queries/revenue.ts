import { sql, SQL } from "drizzle-orm";
import { leads } from "@/db/schema";
import { CURRENCIES, Currency, CurrencyTotals, emptyTotals } from "@/lib/currency";

type RawTotals = Partial<Record<Currency, number | string>> | null;

// One JSON object of deal-value sums keyed by currency, so a single aggregate
// column carries every currency without converting between them.
export function revenueByCurrency(condition?: SQL) {
  const pairs = CURRENCIES.map((currency) => {
    const filter = condition
      ? sql`${leads.dealCurrency} = ${currency} and ${condition}`
      : sql`${leads.dealCurrency} = ${currency}`;
    return sql`${currency}::text, coalesce(sum(${leads.dealValue}) filter (where ${filter}), 0)`;
  });
  return sql<RawTotals>`json_build_object(${sql.join(pairs, sql`, `)})`;
}

export function parseTotals(raw: RawTotals | undefined): CurrencyTotals {
  const totals = emptyTotals();
  for (const currency of CURRENCIES) {
    totals[currency] = Number(raw?.[currency] ?? 0);
  }
  return totals;
}
