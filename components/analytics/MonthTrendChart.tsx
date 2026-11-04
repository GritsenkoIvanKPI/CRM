"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { ConversionRow } from "@/lib/conversion";
import { formatPercent } from "@/lib/format";

// Validated with the dataviz skill's validate_palette.js against the dark
// chart surface (--pairs all): lightness, chroma, contrast and normal-vision
// pass; CVD separation sits in the 6–8 floor band, so Колл → КП is also
// dashed and every series is in the legend — identity is never color-alone.
const SERIES = [
  { key: "contactedToCall", label: "Написав → Колл", color: "#1f8fac", dash: undefined, num: "call", den: "contacted" },
  { key: "callToProposal", label: "Колл → КП", color: "#b38a36", dash: "6 4", num: "proposal", den: "call" },
  { key: "proposalToWon", label: "КП → Продаж", color: "#a07ad8", dash: undefined, num: "won", den: "proposal" },
] as const;

// Same threshold the table uses to dim a percentage.
const MIN_SAMPLE = 5;

type Point = { label: string } & Record<string, number | string | null>;

const tooltipStyle = {
  background: CHART_COLORS.surface2,
  border: `1px solid ${CHART_COLORS.border}`,
  borderRadius: 10,
  fontSize: 12,
  color: CHART_COLORS.text,
};

const axisTick = { fill: CHART_COLORS.textFaint, fontSize: 12 };

export function MonthTrendChart({ rows }: { rows: ConversionRow[] }) {
  // rows arrive newest first; the chart reads left to right in time
  const data: Point[] = [...rows].reverse().map((row) => {
    const point: Point = { label: row.label.split(" ")[0].slice(0, 3) };
    for (const s of SERIES) {
      const num = row[s.num];
      const den = row[s.den];
      // too few leads → a gap in the line rather than a misleading 0% or 100%
      const shown = den >= MIN_SAMPLE;
      point[s.key] = shown ? Math.round((num / den) * 1000) / 10 : null;
      point[`${s.key}Hint`] = shown ? `${formatPercent(num, den)} · ${num} з ${den}` : null;
    }
    return point;
  });

  return (
    <div className="shadow-elevated rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg tracking-tight text-text">Конверсія по етапах за місяцями</h2>
        <p className="text-xs text-text-faint">
          Когорта: ліди, створені в цьому місяці · точки з вибіркою менше {MIN_SAMPLE} не показано
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ left: -16, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.border} />
          <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: CHART_COLORS.border }} tickLine={false} />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: CHART_COLORS.textMuted }}
            cursor={{ stroke: CHART_COLORS.border }}
            formatter={(_value, name, item) => {
              const series = SERIES.find((s) => s.label === name);
              return [series ? (item.payload[`${series.key}Hint`] as string) : String(_value), name];
            }}
          />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: CHART_COLORS.textMuted }} />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dash}
              dot={{ r: 4, fill: s.color, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
