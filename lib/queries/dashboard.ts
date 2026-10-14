import { db } from "@/lib/db";
import { leads, leadStatusHistory } from "@/db/schema";
import { and, eq, gte, lte, lt, sql, asc } from "drizzle-orm";
import { revenueByCurrency, parseTotals } from "@/lib/queries/revenue";
import { startOfDay, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [upcomingFollowups, overdueFollowups, kpiRow, revenueRow, totalRow] =
    await Promise.all([
      db
        .select()
        .from(leads)
        .where(
          and(
            gte(leads.nextFollowupAt, todayStart),
            lte(leads.nextFollowupAt, weekEnd),
          ),
        )
        .orderBy(asc(leads.nextFollowupAt), asc(leads.id)),

      db
        .select()
        .from(leads)
        .where(
          and(
            lt(leads.nextFollowupAt, todayStart),
            sql`${leads.status} not in ('won', 'not_interested')`,
          ),
        )
        .orderBy(asc(leads.nextFollowupAt), asc(leads.id)),

      db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where ${leads.status} not in ('won', 'not_interested'))::int`,
          won: sql<number>`count(*) filter (where ${leads.status} = 'won')::int`,
          lost: sql<number>`count(*) filter (where ${leads.status} = 'not_interested')::int`,
          thisMonth: sql<number>`count(*) filter (where ${leads.createdAt} >= ${monthStart} and ${leads.createdAt} <= ${monthEnd})::int`,
        })
        .from(leads),

      db
        .select({
          revenue: revenueByCurrency(),
        })
        .from(leads)
        .innerJoin(
          leadStatusHistory,
          eq(leadStatusHistory.leadId, leads.id),
        )
        .where(
          and(
            eq(leadStatusHistory.status, "won"),
            gte(leadStatusHistory.changedAt, monthStart),
            lte(leadStatusHistory.changedAt, monthEnd),
          ),
        ),

      db
        .select({
          revenueAll: revenueByCurrency(sql`${leads.status} = 'won'`),
        })
        .from(leads),
    ]);

  const kpi = kpiRow[0];
  const revenueThisMonth = parseTotals(revenueRow[0]?.revenue);
  const totalRevenue = parseTotals(totalRow[0]?.revenueAll);
  const closeRate = kpi.total > 0 ? Math.round((kpi.won / kpi.total) * 100) : 0;

  return {
    upcomingFollowups,
    overdueFollowups,
    kpi: {
      ...kpi,
      revenueThisMonth,
      totalRevenue,
      closeRate,
    },
  };
}
