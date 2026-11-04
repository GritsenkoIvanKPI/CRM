import { db } from "@/lib/db";
import { leads, leadStatusHistory } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

// Every lead currently in «Продаж», with the moment it was marked sold — the
// latest «Продаж» entry in its status history (a lead can be re-marked).
export async function listCustomers() {
  const soldAt = sql<Date | null>`max(${leadStatusHistory.changedAt}) filter (where ${leadStatusHistory.status} = 'won')`;

  const rows = await db
    .select({ lead: leads, soldAt })
    .from(leads)
    .leftJoin(leadStatusHistory, eq(leadStatusHistory.leadId, leads.id))
    .where(eq(leads.status, "won"))
    .groupBy(leads.id)
    .orderBy(sql`${desc(soldAt)} nulls last`, leads.id);

  return rows.map(({ lead, soldAt }) => ({
    lead,
    // fall back to the last edit if the history entry is somehow missing
    soldAt: new Date(soldAt ?? lead.updatedAt).toISOString(),
  }));
}

export type Customer = Awaited<ReturnType<typeof listCustomers>>[number];
