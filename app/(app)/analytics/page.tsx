import {
  getFunnelData,
  getBreakdownBy,
  getMonthlyTrend,
  resolveDateRange,
  DateRangePreset,
} from "@/lib/queries/analytics";
import { listLeads } from "@/lib/queries/leads";
import { AnalyticsFilterBar } from "@/components/analytics/AnalyticsFilterBar";
import { FunnelSection } from "@/components/analytics/FunnelSection";
import { BreakdownSection } from "@/components/analytics/BreakdownSection";
import { TrendCharts } from "@/components/analytics/TrendCharts";
import { SegmentList } from "@/components/analytics/SegmentList";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { formatTotals } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const preset = (rangeParam as DateRangePreset) ?? "all";
  const range = resolveDateRange(preset);

  const [funnelData, methodBreakdown, nicheBreakdown, geoBreakdown, trend, interestedLeads, wonLeads] =
    await Promise.all([
      getFunnelData(range),
      getBreakdownBy("leadGenMethod", range),
      getBreakdownBy("niche", range),
      getBreakdownBy("geo", range),
      getMonthlyTrend(6),
      listLeads({ status: "interested", sort: "nextFollowupAt", order: "asc" }),
      listLeads({ status: "won", sort: "createdAt", order: "desc" }),
    ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="animate-rise flex flex-col gap-1">
        <h1 className="font-display text-2xl tracking-tight text-text">Аналітика</h1>
        <p className="text-sm text-text-muted">
          Конверсія, канали лідогенерації та динаміка продажів.
        </p>
      </div>

      <AnalyticsFilterBar />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Лідів у вибірці" value={funnelData.total} />
        <KpiCard
          label="Конверсія в продаж"
          value={`${funnelData.closeRate}%`}
          hint={`${funnelData.won} продажів`}
          accent
        />
        <KpiCard label="Дохід" value={formatTotals(funnelData.revenue)} />
        <KpiCard label="Не цікаво" value={funnelData.notInterested} />
      </section>

      <FunnelSection {...funnelData} />

      <TrendCharts data={trend} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BreakdownSection title="За методом лідогенерації" rows={methodBreakdown} limit={5} />
        <BreakdownSection title="За нішею" rows={nicheBreakdown} limit={5} />
        <BreakdownSection title="За ГЕО" rows={geoBreakdown} limit={5} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SegmentList
          title="Цікаво зараз"
          leads={interestedLeads}
          emptyLabel="Немає лідів у статусі «Цікаво»."
        />
        <SegmentList
          title="Продано"
          leads={wonLeads}
          emptyLabel="Ще немає продажів у цій вибірці."
        />
      </section>
    </div>
  );
}
