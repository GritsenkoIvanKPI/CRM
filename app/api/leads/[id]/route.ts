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

  const newNextFollowupAt =
    data.nextFollowupAt !== undefined
      ? data.nextFollowupAt
        ? new Date(data.nextFollowupAt)
        : null
      : undefined;
  const nextFollowupSetToNewValue =
    newNextFollowupAt !== undefined &&
    newNextFollowupAt !== null &&
    newNextFollowupAt.getTime() !== existing.nextFollowupAt?.getTime();

  const newLastPushedAt =
    data.lastPushedAt !== undefined
      ? data.lastPushedAt
        ? new Date(data.lastPushedAt)
        : null
      : undefined;
  const lastPushedExplicitlySet =
    newLastPushedAt !== undefined &&
    newLastPushedAt?.getTime() !== existing.lastPushedAt?.getTime();

  // Scheduling a new next-push is, in practice, evidence that you just
  // pushed this lead — auto-stamp today as the last push, unless the
  // caller is deliberately setting a different lastPushedAt in the same
  // request (e.g. backdating it from the lead detail page).
  const autoLastPushedAt =
    nextFollowupSetToNewValue && !lastPushedExplicitlySet ? new Date() : undefined;

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
      ...(data.budget !== undefined && { budget: data.budget }),
      ...(data.budgetCurrency !== undefined && { budgetCurrency: data.budgetCurrency }),
      ...(data.dealCurrency !== undefined && { dealCurrency: data.dealCurrency }),
      ...(data.isTarget !== undefined && { isTarget: data.isTarget }),
      ...(data.dealValue !== undefined && {
        dealValue: data.dealValue !== null ? String(data.dealValue) : null,
      }),
      ...(newNextFollowupAt !== undefined && { nextFollowupAt: newNextFollowupAt }),
      ...(autoLastPushedAt
        ? { lastPushedAt: autoLastPushedAt }
        : newLastPushedAt !== undefined && { lastPushedAt: newLastPushedAt }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id))
    .returning();

  if (statusChanged && data.status) {
    await db.insert(leadStatusHistory).values({ leadId: id, status: data.status });
  }

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
