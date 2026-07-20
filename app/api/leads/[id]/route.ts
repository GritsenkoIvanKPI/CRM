import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, leadStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { leadUpdateSchema } from "@/lib/validation/lead";
import { getLeadById } from "@/lib/queries/leads";
import { syncLeadCalendarEvent } from "@/lib/calendar";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "Лід не знайдено" }, { status: 404 });
  }
  return NextResponse.json({ lead });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await getLeadById(id);
  if (!existing) {
    return NextResponse.json({ error: "Лід не знайдено" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = leadUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Невірні дані" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const statusChanged = data.status && data.status !== existing.status;

  const [lead] = await db
    .update(leads)
    .set({
      ...(data.businessName !== undefined && { businessName: data.businessName }),
      ...(data.telegram !== undefined && { telegram: data.telegram }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.instagram !== undefined && { instagram: data.instagram }),
      ...(data.niche !== undefined && { niche: data.niche }),
      ...(data.geo !== undefined && { geo: data.geo }),
      ...(data.website !== undefined && { website: data.website }),
      ...(data.account !== undefined && { account: data.account }),
      ...(data.leadGenMethod !== undefined && { leadGenMethod: data.leadGenMethod }),
      ...(data.leadGenSource !== undefined && { leadGenSource: data.leadGenSource }),
      ...(data.dealValue !== undefined && {
        dealValue: data.dealValue !== null ? String(data.dealValue) : null,
      }),
      ...(data.nextFollowupAt !== undefined && {
        nextFollowupAt: data.nextFollowupAt ? new Date(data.nextFollowupAt) : null,
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id))
    .returning();

  if (statusChanged && data.status) {
    await db.insert(leadStatusHistory).values({ leadId: id, status: data.status });
  }

  const calendarEventId = await syncLeadCalendarEvent(lead);
  if (calendarEventId !== lead.calendarEventId) {
    await db.update(leads).set({ calendarEventId }).where(eq(leads.id, id));
    lead.calendarEventId = calendarEventId;
  }

  return NextResponse.json({ lead });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await getLeadById(id);
  if (!existing) {
    return NextResponse.json({ error: "Лід не знайдено" }, { status: 404 });
  }
  await syncLeadCalendarEvent({ ...existing, nextFollowupAt: null });
  await db.delete(leads).where(eq(leads.id, id));
  return NextResponse.json({ ok: true });
}
