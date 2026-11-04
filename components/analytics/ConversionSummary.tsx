import { ConversionRow } from "@/lib/conversion";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MoneyLines } from "@/components/analytics/MoneyLines";
import { formatPercent } from "@/lib/format";
import { CURRENCIES } from "@/lib/currency";

export function ConversionSummary({ total }: { total: ConversionRow }) {
  const hasRevenue = CURRENCIES.some((c) => total.revenue[c] !== 0);

  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard label="Лідів" value={total.leads} hint={`Написали ${total.contacted}`} />
      <KpiCard label="Продажів" value={total.won} hint={`Ще відкритих лідів: ${total.open}`} />
      <KpiCard
        label="Конверсія в продаж"
        value={formatPercent(total.won, total.contacted)}
        hint="Від тих, кому написали"
        accent
      />
      <KpiCard
        label="Дохід"
        value={hasRevenue ? <MoneyLines totals={total.revenue} /> : "—"}
        hint="Сума вказаних чеків"
      />
    </section>
  );
}
