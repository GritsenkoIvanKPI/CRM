import { getConversionFilterOptions, getConversionTable } from "@/lib/queries/conversion";
import { readFilters } from "@/lib/conversion";
import { AnalyticsTabs } from "@/components/analytics/AnalyticsTabs";
import { ConversionFilters } from "@/components/analytics/ConversionFilters";
import { ConversionSummary } from "@/components/analytics/ConversionSummary";
import { ConversionTable } from "@/components/analytics/ConversionTable";

export const dynamic = "force-dynamic";

// The current month and the two before it: leads that recent are still
// realistically moving through the funnel.
function maturingSince() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
  return d.toISOString().slice(0, 7);
}

export default async function MonthsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters = readFilters(params);
  const [{ total, rows }, options] = await Promise.all([
    getConversionTable("month", { filters }),
    getConversionFilterOptions(),
  ]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="animate-rise flex flex-col gap-1">
        <h1 className="font-display text-2xl tracking-tight text-text">Аналітика</h1>
        <p className="text-sm text-text-muted">Як працював кожен місяць.</p>
      </div>

      <AnalyticsTabs />

      <ConversionFilters filterBy={["leadGenMethod", "leadGenSource"]} options={options} />

      {total.leads === 0 ? (
        <div className="shadow-elevated rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-sm text-text-muted">За цими фільтрами лідів немає.</p>
        </div>
      ) : (
        <>
          <ConversionSummary total={total} />
          <ConversionTable
            total={total}
            rows={rows}
            groupLabel="Місяць"
            mode="month"
            maturingSince={maturingSince()}
          />
          <p className="text-xs leading-relaxed text-text-faint">
            Ліди рахуються за місяцем, коли їх додали. «Ще в роботі» — багато лідів місяця ще
            відкриті, тож його цифри ще зростуть.
          </p>
        </>
      )}
    </div>
  );
}
