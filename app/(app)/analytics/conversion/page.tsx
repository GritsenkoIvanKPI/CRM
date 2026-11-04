import {
  getConversionFilterOptions,
  getConversionMonths,
  getConversionTable,
} from "@/lib/queries/conversion";
import { CONVERSION_DIMENSIONS, readFilters, toDimension } from "@/lib/conversion";
import { AnalyticsTabs } from "@/components/analytics/AnalyticsTabs";
import { ConversionFilters } from "@/components/analytics/ConversionFilters";
import { ConversionSummary } from "@/components/analytics/ConversionSummary";
import { ConversionTable } from "@/components/analytics/ConversionTable";

export const dynamic = "force-dynamic";

export default async function ConversionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const dimension = toDimension(params.by);
  const filters = readFilters(params);
  // grouping by a dimension and filtering by the same one would leave one row
  delete filters[dimension];
  const [months, options] = await Promise.all([getConversionMonths(), getConversionFilterOptions()]);
  const month = params.month && months.includes(params.month) ? params.month : null;
  const { total, rows } = await getConversionTable(dimension, { month, filters });

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="animate-rise flex flex-col gap-1">
        <h1 className="font-display text-2xl tracking-tight text-text">Аналітика</h1>
        <p className="text-sm text-text-muted">Яке джерело приводить ліда до продажу.</p>
      </div>

      <AnalyticsTabs />

      <ConversionFilters
        dimension={dimension}
        filterBy={["leadGenMethod", "leadGenSource"]}
        options={options}
        months={months}
      />

      {total.leads === 0 ? (
        <div className="shadow-elevated rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-sm text-text-muted">За цими фільтрами лідів немає.</p>
        </div>
      ) : (
        <>
          <ConversionSummary total={total} />
          <ConversionTable total={total} rows={rows} groupLabel={CONVERSION_DIMENSIONS[dimension]} />
          <p className="text-xs leading-relaxed text-text-faint">
            Біля кожного етапу — скільки відсотків перейшло з попереднього. Наведіть на число, щоб
            побачити кількість.
          </p>
        </>
      )}
    </div>
  );
}
