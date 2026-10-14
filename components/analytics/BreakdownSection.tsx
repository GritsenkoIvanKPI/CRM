import { CHART_COLORS } from "@/lib/chart-colors";
import { formatTotals } from "@/lib/format";
import { CurrencyTotals } from "@/lib/currency";
import { BarRow } from "./BarRow";

type BreakdownRow = {
  value: string;
  count: number;
  won: number;
  revenue: CurrencyTotals;
  conversionRate: number;
};

export function BreakdownSection({
  title,
  rows,
  limit,
}: {
  title: string;
  rows: BreakdownRow[];
  limit?: number;
}) {
  const shown = limit ? rows.slice(0, limit) : rows;
  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="shadow-elevated rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-5 font-display text-lg tracking-tight text-text">{title}</h2>

      {shown.length === 0 ? (
        <p className="text-sm text-text-muted">Немає даних.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {shown.map((row) => (
            <BarRow
              key={row.value}
              label={row.value}
              value={`${row.count} лід${row.count === 1 ? "" : "ів"}`}
              sublabel={`· ${row.conversionRate}% · ${formatTotals(row.revenue)}`}
              pct={(row.count / maxCount) * 100}
              color={CHART_COLORS.accent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
