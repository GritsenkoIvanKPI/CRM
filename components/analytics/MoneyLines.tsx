import { CURRENCIES, CurrencyTotals, DEFAULT_DEAL_CURRENCY } from "@/lib/currency";
import { formatMoney } from "@/lib/format";

// One currency per line — a sum like "8 400 ₴ · 1 450 $ · 3 400 €" wraps
// mid-amount at KPI size. Currencies are never added together.
export function MoneyLines({ totals }: { totals: CurrencyTotals }) {
  const used = CURRENCIES.filter((c) => totals[c] !== 0);
  if (used.length <= 1) return <>{formatMoney(totals[used[0] ?? DEFAULT_DEAL_CURRENCY], used[0])}</>;
  return (
    <span className="flex flex-col gap-1.5 text-[22px]">
      {used.map((c) => (
        <span key={c} className="whitespace-nowrap">
          {formatMoney(totals[c], c)}
        </span>
      ))}
    </span>
  );
}
