import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, leadStatusHistory } from "@/db/schema";
import { leadInputSchema } from "@/lib/validation/lead";
import { syncLeadCalendarEvent } from "@/lib/calendar";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = leadInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Невірні дані" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const status = data.status ?? "contacted";

  const [lead] = await db
    .insert(leads)
    .values({
      businessName: data.businessName,
      telegram: data.telegram,
      phone: data.phone,
      instagram: data.instagram,
      niche: data.niche,
      geo: data.geo,
      website: data.website,
      account: data.account,
      leadGenMethod: data.leadGenMethod,
      leadGenSource: data.leadGenSource,
      dealValue: data.dealValue !== null ? String(data.dealValue) : null,
      nextFollowupAt: data.nextFollowupAt ? new Date(data.nextFollowupAt) : null,
      status,
      notes: data.notes,
    })
    .returning();

  await db.insert(leadStatusHistory).values({
    leadId: lead.id,
    status,
  });

  const calendarEventId = await syncLeadCalendarEvent(lead);
  if (calendarEventId !== lead.calendarEventId) {
    await db.update(leads).set({ calendarEventId }).where(eq(leads.id, lead.id));
    lead.calendarEventId = calendarEventId;
  }

  return NextResponse.json({ lead }, { status: 201 });
}
