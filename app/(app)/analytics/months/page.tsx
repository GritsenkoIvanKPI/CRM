import { getConversionFilterOptions, getConversionTable } from "@/lib/queries/conversion";
import { readFilters } from "@/lib/conversion";
import { AnalyticsTabs } from "@/components/analytics/AnalyticsTabs";
import { DimensionFilters } from "@/components/analytics/DimensionFilters";
import { ConversionTable } from "@/components/analytics/ConversionTable";
import { MonthTrendChart } from "@/components/analytics/MonthTrendChart";
import { formatTotals } from "@/lib/format";

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
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
      <div className="animate-rise flex flex-col gap-1">
        <h1 className="font-display text-2xl tracking-tight text-text">Аналітика</h1>
        <p className="text-sm text-text-muted">
          Порівняння місяців: скільки лідів прийшло, як вони рухались воронкою і що закрили.
        </p>
      </div>

      <AnalyticsTabs />

      <DimensionFilters options={options} />

      {total.leads === 0 && total.soldInPeriod === 0 ? (
        <div className="shadow-elevated rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-sm text-text-muted">За цими фільтрами лідів немає.</p>
        </div>
      ) : (
        <>
          <MonthTrendChart rows={rows} />

          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg tracking-tight text-text">По місяцях</h2>
            <p className="text-xs text-text-faint">
              {total.leads} лідів · {total.soldInPeriod} продажів · дохід {formatTotals(total.revenueInPeriod)}
            </p>
          </div>

          <ConversionTable
            total={total}
            rows={rows}
            groupLabel="Місяць"
            mode="month"
            maturingSince={maturingSince()}
          />
        </>
      )}

      <ul className="flex flex-col gap-1.5 text-xs leading-relaxed text-text-faint">
        <li>
          Воронка, конверсія і відмови — за когортою: ліди, створені в цьому місяці, і куди вони
          дійшли на сьогодні. Етапи рахуються за історією статусів, тому лід із продажем входить і в
          «Написали», і в «Колл», і в «КП».
        </li>
        <li>
          «Закрито за місяць» і «Дохід за місяць» — угоди, які закрили саме в цьому місяці, навіть
          якщо лід прийшов раніше. Дата продажу — момент, коли ліду поставили статус «Продаж», тому
          угоди, позначені заднім числом, потрапляють у місяць позначки. Це відповідає вкладці
          «Продажі».
        </li>
        <li>
          «Ще в роботі» — один з трьох останніх місяців, де щонайменше 30% лідів ще відкриті: його
          конверсія ще зростатиме, порівнюйте з обережністю. Напівпрозорі відсотки — вибірка менша
          за 5 лідів.
        </li>
      </ul>
    </div>
  );
}
