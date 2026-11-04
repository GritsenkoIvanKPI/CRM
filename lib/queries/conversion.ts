import { db } from "@/lib/db";
import { leads, leadStatusHistory } from "@/db/schema";
import { and, eq, gte, lt, sql, SQL } from "drizzle-orm";
import { LeadStatus } from "@/lib/status";
import { DEFAULT_DEAL_CURRENCY, emptyTotals, toCurrency } from "@/lib/currency";
import {
  CONVERSION_DIMENSIONS,
  ConversionDimension,
  ConversionRow,
  NO_GROUP_LABEL,
} from "@/lib/conversion";
import { formatMonth } from "@/lib/format";

// How far along the pipeline a status proves the lead got. History has gaps
// (imported leads, manual jumps), so a later stage implies every earlier one:
// a sold lead was written to, called and sent a proposal even if those steps
// were never logged. Думає/Цікаво come after the КП in the pipeline.
const STAGE_RANK: Partial<Record<LeadStatus, number>> = {
  contacted: 1,
  call: 2,
  proposal: 3,
  thinking: 3,
  interested: 3,
  won: 4,
};

function emptyRow(key: string, label: string): ConversionRow {
  return {
    key,
    label,
    leads: 0,
    contacted: 0,
    call: 0,
    proposal: 0,
    won: 0,
    lostInChat: 0,
    lostAfterCall: 0,
    lostAfterProposal: 0,
    noReply: 0,
    thinking: 0,
    interested: 0,
    open: 0,
    target: 0,
    targetAssessed: 0,
    revenue: emptyTotals(),
  };
}

export type ConversionGrouping = ConversionDimension | "month";

// Narrow the cohort to one value per dimension; NO_GROUP_LABEL means "empty".
export type ConversionFilters = Partial<Record<ConversionDimension, string>>;

// Leads are grouped into the month they were created in (a cohort), matching
// the per-month tabs of the old spreadsheet. `month` narrows to one cohort.
export async function getConversionTable(
  groupBy: ConversionGrouping,
  { month = null, filters = {} }: { month?: string | null; filters?: ConversionFilters } = {},
) {
  const monthFilter = month ? monthRange(month) : null;
  const conditions: SQL[] = [];
  if (monthFilter) {
    conditions.push(gte(leads.createdAt, monthFilter.from), lt(leads.createdAt, monthFilter.to));
  }
  for (const [dimension, value] of Object.entries(filters) as [ConversionDimension, string][]) {
    if (!value) continue;
    conditions.push(
      value === NO_GROUP_LABEL
        ? sql`coalesce(trim(${leads[dimension]}), '') = ''`
        : eq(leads[dimension], value),
    );
  }

  const rows = await db
    .select({
      group: groupBy === "month" ? sql<string>`''` : leads[groupBy],
      createdAt: leads.createdAt,
      status: leads.status,
      isTarget: leads.isTarget,
      dealValue: leads.dealValue,
      dealCurrency: leads.dealCurrency,
      history: sql<string[]>`coalesce(array_agg(distinct ${leadStatusHistory.status}::text) filter (where ${leadStatusHistory.status} is not null), '{}')`,
    })
    .from(leads)
    .leftJoin(leadStatusHistory, eq(leadStatusHistory.leadId, leads.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(leads.id);

  const total = emptyRow("__total", "Усього");
  const groups = new Map<string, ConversionRow>();

  function rowFor(key: string) {
    let row = groups.get(key);
    if (!row) {
      row = emptyRow(key, groupBy === "month" ? monthLabel(key) : key);
      groups.set(key, row);
    }
    return row;
  }

  for (const lead of rows) {
    const key =
      groupBy === "month" ? monthKey(lead.createdAt) : lead.group?.trim() || NO_GROUP_LABEL;
    const row = rowFor(key);

    const statuses = [...lead.history, lead.status] as LeadStatus[];
    const rank = Math.max(0, ...statuses.map((s) => STAGE_RANK[s] ?? 0));
    const currency = toCurrency(lead.dealCurrency, DEFAULT_DEAL_CURRENCY);

    for (const target of [row, total]) {
      target.leads += 1;
      if (rank >= 1) target.contacted += 1;
      if (rank >= 2) target.call += 1;
      if (rank >= 3) target.proposal += 1;
      if (lead.status === "won") {
        target.won += 1;
        target.revenue[currency] += Number(lead.dealValue ?? 0);
      } else if (lead.status === "not_interested") {
        if (rank >= 3) target.lostAfterProposal += 1;
        else if (rank === 2) target.lostAfterCall += 1;
        else target.lostInChat += 1;
      } else {
        target.open += 1;
      }
      if (lead.status === "contacted") target.noReply += 1;
      if (lead.status === "thinking") target.thinking += 1;
      if (lead.status === "interested") target.interested += 1;
      if (lead.isTarget !== null) {
        target.targetAssessed += 1;
        if (lead.isTarget) target.target += 1;
      }
    }
  }

  if (groupBy === "month") {
    // Fill gaps so a quiet month shows as zeros instead of silently vanishing.
    const keys = [...groups.keys()].sort();
    if (keys.length > 1) {
      for (let key = keys[0]; key < keys[keys.length - 1]; key = nextMonth(key)) rowFor(key);
    }
    const monthRows = [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
    return { total, rows: monthRows };
  }

  const groupRows = [...groups.values()].sort((a, b) => b.leads - a.leads);
  return { total, rows: groupRows };
}

// Values available for each filter, independent of the current selection.
export async function getConversionFilterOptions() {
  const entries = await Promise.all(
    (Object.keys(CONVERSION_DIMENSIONS) as ConversionDimension[]).map(async (dimension) => {
      const rows = await db
        .select({ value: sql<string | null>`nullif(trim(${leads[dimension]}), '')`, count: sql<number>`count(*)::int` })
        .from(leads)
        .groupBy(sql`nullif(trim(${leads[dimension]}), '')`)
        .orderBy(sql`count(*) desc`);
      return [
        dimension,
        rows.map((r) => ({ value: r.value ?? NO_GROUP_LABEL, count: r.count })),
      ] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<ConversionDimension, { value: string; count: number }[]>;
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function nextMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const label = formatMonth(`${key}-01T00:00:00Z`).replace(/\s*р\.$/, "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export async function getConversionMonths() {
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${leads.createdAt}), 'YYYY-MM')`,
    })
    .from(leads)
    .groupBy(sql`date_trunc('month', ${leads.createdAt})`)
    .orderBy(sql`date_trunc('month', ${leads.createdAt}) desc`);
  return rows.map((r) => r.month);
}

function monthRange(month: string) {
  const [year, m] = month.split("-").map(Number);
  if (!year || !m || m < 1 || m > 12) return null;
  return { from: new Date(Date.UTC(year, m - 1, 1)), to: new Date(Date.UTC(year, m, 1)) };
}
