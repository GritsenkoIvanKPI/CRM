"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { formatUAH } from "@/lib/format";

type TrendPoint = {
  month: string;
  label: string;
  leads: number;
  sales: number;
  revenue: number;
};

const tooltipStyle = {
  background: CHART_COLORS.surface2,
  border: `1px solid ${CHART_COLORS.border}`,
  borderRadius: 10,
  fontSize: 12,
  color: CHART_COLORS.text,
};

const axisTick = { fill: CHART_COLORS.textFaint, fontSize: 12 };

export function TrendCharts({ data }: { data: TrendPoint[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="shadow-elevated rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-tight text-text">
            Ліди та продажі за місяць
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid
              vertical={false}
              stroke={CHART_COLORS.border}
              strokeDasharray="0"
            />
            <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: CHART_COLORS.border }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: CHART_COLORS.textMuted }}
              cursor={{ stroke: CHART_COLORS.border }}
            />
            <Legend
              iconType="plainline"
              wrapperStyle={{ fontSize: 12, color: CHART_COLORS.textMuted }}
            />
            <Line
              type="monotone"
              dataKey="leads"
              name="Ліди"
              stroke={CHART_COLORS.accent}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_COLORS.accent, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              name="Продажі"
              stroke={CHART_COLORS.trendSales}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_COLORS.trendSales, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="shadow-elevated rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-tight text-text">
            Дохід за місяць
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid
              vertical={false}
              stroke={CHART_COLORS.border}
              strokeDasharray="0"
            />
            <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: CHART_COLORS.border }} tickLine={false} />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: CHART_COLORS.textMuted }}
              cursor={{ fill: CHART_COLORS.surface2 }}
              formatter={(value) => formatUAH(Number(value))}
            />
            <Bar dataKey="revenue" name="Дохід" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
