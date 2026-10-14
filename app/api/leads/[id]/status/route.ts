import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, leadStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { leadStatusSchema } from "@/lib/validation/lead";
import { getLeadById } from "@/lib/queries/leads";
import { syncLeadCalendarEvent } from "@/lib/calendar";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await getLeadById(id);
  if (!existing) {
    return NextResponse.json({ error: "Лід не знайдено" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = leadStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірний статус" }, { status: 400 });
  }

  const { status } = parsed.data;
  if (status === existing.status) {
    return NextResponse.json({ lead: existing });
  }

  const [lead] = await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();

  await db.insert(leadStatusHistory).values({ leadId: id, status });

  const sync = await syncLeadCalendarEvent(lead);
  if (sync.calendarEventId !== lead.calendarEventId || sync.nextFollowupAt?.getTime() !== lead.nextFollowupAt?.getTime()) {
    await db
      .update(leads)
      .set({ calendarEventId: sync.calendarEventId, nextFollowupAt: sync.nextFollowupAt })
      .where(eq(leads.id, id));
    lead.calendarEventId = sync.calendarEventId;
    lead.nextFollowupAt = sync.nextFollowupAt;
  }

  return NextResponse.json({ lead });
}
