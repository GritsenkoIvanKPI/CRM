import { db } from "@/lib/db";
import { leads, leadStatusHistory } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql, SQL } from "drizzle-orm";
import { LeadStatus } from "@/lib/status";

export type LeadFilters = {
  status?: LeadStatus;
  niche?: string;
  geo?: string;
  leadGenMethod?: string;
  search?: string;
  sort?: "createdAt" | "businessName" | "dealValue" | "nextFollowupAt";
  order?: "asc" | "desc";
};

const SORT_COLUMNS = {
  createdAt: leads.createdAt,
  businessName: leads.businessName,
  dealValue: leads.dealValue,
  nextFollowupAt: leads.nextFollowupAt,
} as const;

export async function listLeads(filters: LeadFilters = {}) {
  const conditions: SQL[] = [];

  if (filters.status) conditions.push(eq(leads.status, filters.status));
  if (filters.niche) conditions.push(eq(leads.niche, filters.niche));
  if (filters.geo) conditions.push(eq(leads.geo, filters.geo));
  if (filters.leadGenMethod)
    conditions.push(eq(leads.leadGenMethod, filters.leadGenMethod));

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

  const query = db
    .select()
    .from(leads)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderFn(sortColumn));

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
