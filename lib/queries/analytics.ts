import { db } from "@/lib/db";
import { leads, leadStatusHistory } from "@/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { LEAD_STATUSES, LeadStatus } from "@/lib/status";
import { subDays, startOfYear, startOfMonth, subMonths, format } from "date-fns";

export type DateRangePreset = "all" | "30d" | "90d" | "year";

export function resolveDateRange(preset: DateRangePreset) {
  const now = new Date();
  switch (preset) {
    case "30d":
      return { from: subDays(now, 30), to: now };
    case "90d":
      return { from: subDays(now, 90), to: now };
    case "year":
      return { from: startOfYear(now), to: now };
    default:
      return null;
  }
}

async function leadCreatedFilter(range: { from: Date; to: Date } | null) {
  return range ? and(gte(leads.createdAt, range.from), lte(leads.createdAt, range.to)) : undefined;
}

export async function getFunnelData(range: { from: Date; to: Date } | null) {
  const dateFilter = await leadCreatedFilter(range);

  const totalRow = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(dateFilter);
  const total = totalRow[0]?.count ?? 0;

  const reachedRows = await db
    .select({
      status: leadStatusHistory.status,
      count: sql<number>`count(distinct ${leadStatusHistory.leadId})::int`,
    })
    .from(leadStatusHistory)
    .innerJoin(leads, eq(leads.id, leadStatusHistory.leadId))
    .where(dateFilter)
    .groupBy(leadStatusHistory.status);

  const reachedMap = new Map<LeadStatus, number>();
  for (const row of reachedRows) reachedMap.set(row.status, row.count);

  const sequential: LeadStatus[] = [
    "contacted",
    "call",
    "proposal",
    "thinking",
    "interested",
  ];

  const funnel = sequential.map((status, i) => {
    const reached = reachedMap.get(status) ?? 0;
    const prevReached = i === 0 ? total : (reachedMap.get(sequential[i - 1]) ?? 0);
    const dropOff = Math.max(prevReached - reached, 0);
    return {
      status,
      reached,
      pctOfTotal: total > 0 ? Math.round((reached / total) * 100) : 0,
      dropOff,
    };
  });

  const won = reachedMap.get("won") ?? 0;
  const notInterested = reachedMap.get("not_interested") ?? 0;
  const closeRate = total > 0 ? Math.round((won / total) * 100) : 0;

  return { total, funnel, won, notInterested, closeRate };
}

export async function getBreakdownBy(
  dimension: "leadGenMethod" | "niche" | "geo",
  range: { from: Date; to: Date } | null,
) {
  const dateFilter = await leadCreatedFilter(range);
  const column = leads[dimension];

  const rows = await db
    .select({
      value: column,
      count: sql<number>`count(*)::int`,
      won: sql<number>`count(*) filter (where ${leads.status} = 'won')::int`,
      revenue: sql<string>`coalesce(sum(${leads.dealValue}) filter (where ${leads.status} = 'won'), 0)`,
    })
    .from(leads)
    .where(dateFilter ? and(dateFilter, sql`${column} is not null`) : sql`${column} is not null`)
    .groupBy(column)
    .orderBy(sql`count(*) desc`);

  return rows.map((r) => ({
    value: r.value as string,
    count: r.count,
    won: r.won,
    revenue: Number(r.revenue),
    conversionRate: r.count > 0 ? Math.round((r.won / r.count) * 100) : 0,
  }));
}

export async function getMonthlyTrend(monthsBack = 6) {
  const now = new Date();
  const months = Array.from({ length: monthsBack }, (_, i) =>
    startOfMonth(subMonths(now, monthsBack - 1 - i)),
  );

  const leadsRows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${leads.createdAt}), 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(leads)
    .where(gte(leads.createdAt, months[0]))
    .groupBy(sql`date_trunc('month', ${leads.createdAt})`);

  const salesRows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${leadStatusHistory.changedAt}), 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
      revenue: sql<string>`coalesce(sum(${leads.dealValue}), 0)`,
    })
    .from(leadStatusHistory)
    .innerJoin(leads, eq(leads.id, leadStatusHistory.leadId))
    .where(and(eq(leadStatusHistory.status, "won"), gte(leadStatusHistory.changedAt, months[0])))
    .groupBy(sql`date_trunc('month', ${leadStatusHistory.changedAt})`);

  const leadsMap = new Map(leadsRows.map((r) => [r.month, r.count]));
  const salesMap = new Map(salesRows.map((r) => [r.month, { count: r.count, revenue: Number(r.revenue) }]));

  return months.map((m) => {
    const key = format(m, "yyyy-MM");
    const sales = salesMap.get(key);
    return {
      month: key,
      label: format(m, "LLL"),
      leads: leadsMap.get(key) ?? 0,
      sales: sales?.count ?? 0,
      revenue: sales?.revenue ?? 0,
    };
  });
}

export { LEAD_STATUSES };
