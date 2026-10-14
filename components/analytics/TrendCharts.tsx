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
import { formatMoney } from "@/lib/format";
import {
  CURRENCIES,
  CURRENCY_SYMBOLS,
  Currency,
  CurrencyTotals,
  DEFAULT_DEAL_CURRENCY,
} from "@/lib/currency";

type TrendPoint = {
  month: string;
  label: string;
  leads: number;
  sales: number;
  revenue: CurrencyTotals;
};

const REVENUE_COLORS: Record<Currency, string> = {
  UAH: CHART_COLORS.accent,
  USD: CHART_COLORS.trendSales,
  EUR: CHART_COLORS.success,
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
  // Currencies are never summed: each one with revenue gets its own bar.
  const used = CURRENCIES.filter((c) => data.some((d) => d.revenue[c] !== 0));
  const revenueCurrencies = used.length > 0 ? used : [DEFAULT_DEAL_CURRENCY];

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
              formatter={(value, name) => [
                formatMoney(Number(value), String(name)),
                `Дохід, ${CURRENCY_SYMBOLS[name as Currency]}`,
              ]}
            />
            {revenueCurrencies.length > 1 ? (
              <Legend
                iconType="square"
                formatter={(name) => CURRENCY_SYMBOLS[name as Currency]}
                wrapperStyle={{ fontSize: 12, color: CHART_COLORS.textMuted }}
              />
            ) : null}
            {revenueCurrencies.map((c) => (
              <Bar
                key={c}
                dataKey={(d: TrendPoint) => d.revenue[c]}
                name={c}
                fill={REVENUE_COLORS[c]}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
