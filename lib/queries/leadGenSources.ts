import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leadGenSources } from "@/db/schema";

export async function listLeadGenSources() {
  return db.select().from(leadGenSources).orderBy(desc(leadGenSources.createdAt));
}

export async function getLeadGenSourceNames() {
  const rows = await listLeadGenSources();
  return rows.map((r) => r.name);
}

export async function createLeadGenSource(name: string) {
  const [row] = await db.insert(leadGenSources).values({ name }).returning();
  return row;
}

export async function deleteLeadGenSource(id: string) {
  await db.delete(leadGenSources).where(eq(leadGenSources.id, id));
}
