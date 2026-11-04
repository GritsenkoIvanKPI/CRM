import {
  getConversionFilterOptions,
  getConversionMonths,
  getConversionTable,
} from "@/lib/queries/conversion";
import { CONVERSION_DIMENSIONS, ConversionDimension, readFilters, toDimension } from "@/lib/conversion";
import { DimensionFilters } from "@/components/analytics/DimensionFilters";
import { AnalyticsTabs } from "@/components/analytics/AnalyticsTabs";
import { ConversionFilters } from "@/components/analytics/ConversionFilters";
import { ConversionTable } from "@/components/analytics/ConversionTable";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { formatMonth, formatPercent, formatTotals } from "@/lib/format";

export const dynamic = "force-dynamic";

const HEADINGS: Record<ConversionDimension, string> = {
  leadGenSource: "За лідгеном",
  leadGenMethod: "За методом лідогенерації",
  niche: "За нішею",
  geo: "За ГЕО",
};

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

  const steps = [
    { label: "Написав → Колл", num: total.call, den: total.contacted },
    { label: "Колл → КП", num: total.proposal, den: total.call },
    { label: "КП → Продаж", num: total.won, den: total.proposal },
    { label: "Написав → Продаж", num: total.won, den: total.contacted, accent: true },
  ];

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
      <div className="animate-rise flex flex-col gap-1">
        <h1 className="font-display text-2xl tracking-tight text-text">Аналітика</h1>
        <p className="text-sm text-text-muted">
          Як кожне джерело веде ліда від першого повідомлення до продажу.
        </p>
      </div>

      <AnalyticsTabs />

      <ConversionFilters dimension={dimension} month={month} months={months} />

      <DimensionFilters options={options} exclude={dimension} />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {steps.map((step) => (
          <KpiCard
            key={step.label}
            label={step.label}
            value={formatPercent(step.num, step.den)}
            hint={`${step.num} з ${step.den}`}
            accent={step.accent}
          />
        ))}
      </section>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg tracking-tight text-text">
          {HEADINGS[dimension]}
          {month ? <span className="text-text-muted"> · {formatMonth(`${month}-01T00:00:00Z`)}</span> : null}
        </h2>
        <p className="text-xs text-text-faint">
          {total.leads} лідів · {rows.length} груп · дохід {formatTotals(total.revenue)}
        </p>
      </div>

      {total.leads === 0 ? (
        <div className="shadow-elevated rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-sm text-text-muted">За цими фільтрами лідів немає.</p>
        </div>
      ) : (
        <ConversionTable total={total} rows={rows} groupLabel={CONVERSION_DIMENSIONS[dimension]} />
      )}

      <ul className="flex flex-col gap-1.5 text-xs leading-relaxed text-text-faint">
        <li>
          Етапи рахуються за історією статусів: лід, який дійшов до продажу, враховується і в
          «Написали», і в «Колл», і в «КП», навіть якщо проміжні статуси не ставили.
        </li>
        <li>
          Відмови розкладені за етапом, на якому лід став «Не цікаво». Кожен відсоток — від тих, хто
          дійшов до цього етапу.
        </li>
        <li>
          Ліди групуються за місяцем створення. Напівпрозорі відсотки — вибірка менша за 5 лідів, на
          них не варто робити висновки. Натисніть заголовок колонки, щоб відсортувати.
        </li>
      </ul>
    </div>
  );
}
