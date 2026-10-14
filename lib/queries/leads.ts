import { db } from "@/lib/db";
import { leads, leadStatusHistory } from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, lte, or, sql, SQL } from "drizzle-orm";
import { LeadStatus } from "@/lib/status";

export type LeadFilters = {
  status?: LeadStatus;
  niche?: string;
  geo?: string;
  leadGenMethod?: string;
  search?: string;
  followupFrom?: Date;
  followupTo?: Date;
  sort?: "createdAt" | "businessName" | "dealValue" | "budget" | "nextFollowupAt";
  order?: "asc" | "desc";
};

const SORT_COLUMNS = {
  createdAt: leads.createdAt,
  businessName: leads.businessName,
  dealValue: leads.dealValue,
  // Budget is free text ("350-500", "1600+") — sort by its first number.
  budget: sql`(substring(${leads.budget} from '[0-9]+'))::numeric`,
  nextFollowupAt: leads.nextFollowupAt,
} as const;

export async function listLeads(filters: LeadFilters = {}) {
  const conditions: SQL[] = [];

  if (filters.status) conditions.push(eq(leads.status, filters.status));
  if (filters.niche) conditions.push(eq(leads.niche, filters.niche));
  if (filters.geo) conditions.push(eq(leads.geo, filters.geo));
  if (filters.leadGenMethod)
    conditions.push(eq(leads.leadGenMethod, filters.leadGenMethod));
  if (filters.followupFrom)
    conditions.push(gte(leads.nextFollowupAt, filters.followupFrom));
  if (filters.followupTo)
    conditions.push(lte(leads.nextFollowupAt, filters.followupTo));

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(leads.businessName, term),
        ilike(leads.telegram, term),
        ilike(leads.phone, term),
        ilike(leads.instagram, term),
      )!,
    );
  }

  const sortColumn = SORT_COLUMNS[filters.sort ?? "createdAt"];
  const orderFn = filters.order === "asc" ? asc : desc;

  // Many imported leads share the exact same createdAt (bulk import had only
  // day-level granularity), and other sort columns tie often too. Without a
  // deterministic tiebreaker, Postgres doesn't guarantee stable order among
  // ties — an UPDATE to any tied row (e.g. changing its push date) can
  // reshuffle where it lands. id is unique, so it always breaks the tie.
  const query = db
    .select()
    .from(leads)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      // Most leads have no budget yet — keep them below the ones that do.
      filters.sort === "budget"
        ? sql`${orderFn(sortColumn)} nulls last`
        : orderFn(sortColumn),
      asc(leads.id),
    );

  return query;
}

export async function getLeadById(id: string) {
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  return lead ?? null;
}

export async function getLeadHistory(leadId: string) {
  return db
    .select()
    .from(leadStatusHistory)
    .where(eq(leadStatusHistory.leadId, leadId))
    .orderBy(asc(leadStatusHistory.changedAt));
}

export async function getDistinctFieldValues(
  column: "niche" | "geo" | "leadGenMethod" | "leadGenSource" | "account",
) {
  const rows = await db
    .selectDistinct({ value: leads[column] })
    .from(leads)
    .where(sql`${leads[column]} is not null`)
    .orderBy(asc(leads[column]));
  return rows.map((r) => r.value).filter((v): v is string => Boolean(v));
}
