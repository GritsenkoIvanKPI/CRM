import { STATUS_LABELS } from "@/lib/status";
import { CHART_COLORS } from "@/lib/chart-colors";
import { BarRow } from "./BarRow";

type FunnelStage = {
  status: keyof typeof CHART_COLORS.stage;
  reached: number;
  pctOfTotal: number;
  dropOff: number;
};

export function FunnelSection({
  total,
  funnel,
  won,
  notInterested,
  closeRate,
}: {
  total: number;
  funnel: FunnelStage[];
  won: number;
  notInterested: number;
  closeRate: number;
}) {
  return (
    <div className="shadow-elevated rounded-2xl border border-border bg-surface p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg tracking-tight text-text">
          Воронка продажів
        </h2>
        <p className="text-xs text-text-faint">Усього лідів: {total}</p>
      </div>

      <div className="flex flex-col gap-5">
        {funnel.map((stage, i) => (
          <div key={stage.status} className="flex flex-col gap-1">
            <BarRow
              label={STATUS_LABELS[stage.status]}
              value={String(stage.reached)}
              sublabel={`${stage.pctOfTotal}%`}
              pct={stage.pctOfTotal}
              color={CHART_COLORS.stage[stage.status]}
            />
            {i < funnel.length - 1 && stage.dropOff > 0 ? (
              <p className="pl-1 text-xs text-text-faint">
                − {stage.dropOff} відсіялось на цьому етапі
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5">
        <div className="rounded-xl border border-success-soft bg-success-soft px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-success">
            Продаж
          </p>
          <p className="font-display mt-1 text-2xl text-text">{won}</p>
          <p className="mt-0.5 text-xs text-text-muted">{closeRate}% від усіх лідів</p>
        </div>
        <div className="rounded-xl border border-danger-soft bg-danger-soft px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-danger">
            Не цікаво
          </p>
          <p className="font-display mt-1 text-2xl text-text">{notInterested}</p>
          <p className="mt-0.5 text-xs text-text-muted">
            {total > 0 ? Math.round((notInterested / total) * 100) : 0}% від усіх лідів
          </p>
        </div>
      </div>
    </div>
  );
}
