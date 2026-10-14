import { google } from "googleapis";
import { and, desc, gte, isNotNull, lte, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { googleTokens, leads } from "@/db/schema";
import { Lead } from "@/db/schema";
import { STATUS_LABELS } from "@/lib/status";
import { isTerminalStatus } from "@/lib/status";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const FOLLOWUP_DURATION_MINUTES = 15;
const TIME_ZONE = "Europe/Kyiv";

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export function isCalendarConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI,
  );
}

export function getGoogleAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error("Google не повернув повний набір токенів");
  }
  await db.delete(googleTokens);
  await db.insert(googleTokens).values({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: new Date(tokens.expiry_date),
  });
}

export async function getStoredTokens() {
  const [row] = await db.select().from(googleTokens).limit(1);
  return row ?? null;
}

export async function disconnectGoogle() {
  await db.delete(googleTokens);
}

// A stored token row isn't proof the connection still works — Google can
// revoke a refresh token independently (e.g. it silently expires after 7
// days while the OAuth consent screen is in "Testing" mode). This makes a
// live check so the settings page can tell "connected" apart from "looks
// connected but every sync is silently failing".
export async function checkCalendarConnection(): Promise<
  "disconnected" | "connected" | "needs_reauth"
> {
  const stored = await getStoredTokens();
  if (!stored) return "disconnected";

  const client = getOAuthClient();
  client.setCredentials({
    access_token: stored.accessToken,
    refresh_token: stored.refreshToken,
    expiry_date: stored.expiryDate.getTime(),
  });

  try {
    await client.getAccessToken();
    return "connected";
  } catch {
    return "needs_reauth";
  }
}

async function getAuthorizedClient() {
  const stored = await getStoredTokens();
  if (!stored) return null;

  const client = getOAuthClient();
  client.setCredentials({
    access_token: stored.accessToken,
    refresh_token: stored.refreshToken,
    expiry_date: stored.expiryDate.getTime(),
  });

  client.on("tokens", (tokens) => {
    if (!tokens.access_token || !tokens.expiry_date) return;
    db.update(googleTokens)
      .set({
        accessToken: tokens.access_token,
        expiryDate: new Date(tokens.expiry_date),
        updatedAt: new Date(),
      })
      .then(() => {});
  });

  return client;
}

function buildEventBody(lead: Lead, start: Date) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const end = new Date(start.getTime() + FOLLOWUP_DURATION_MINUTES * 60_000);

  return {
    summary: `Пуш: ${lead.businessName}`,
    description: `Статус: ${STATUS_LABELS[lead.status]}\n\nЛід у CRM: ${appUrl}/leads/${lead.id}`,
    start: { dateTime: start.toISOString(), timeZone: TIME_ZONE },
    end: { dateTime: end.toISOString(), timeZone: TIME_ZONE },
  };
}

// Other leads already scheduled the same calendar day get pushed earlier by
// this query, so a newly (re)scheduled push lands right after the last one
// instead of stacking on top of it — everyone due that day queues up
// sequentially in 15-minute slots rather than colliding at the same time.
async function findNextAvailableSlot(
  desiredStart: Date,
  excludeLeadId: string,
): Promise<Date> {
  const dayStr = desiredStart.toISOString().slice(0, 10);
  const dayStart = new Date(`${dayStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dayStr}T23:59:59.999Z`);

  const sameDay = await db
    .select({ nextFollowupAt: leads.nextFollowupAt })
    .from(leads)
    .where(
      and(
        ne(leads.id, excludeLeadId),
        isNotNull(leads.calendarEventId),
        gte(leads.nextFollowupAt, dayStart),
        lte(leads.nextFollowupAt, dayEnd),
      ),
    )
    .orderBy(desc(leads.nextFollowupAt))
    .limit(1);

  const latest = sameDay[0]?.nextFollowupAt;
  if (!latest) return desiredStart;

  const latestEnd = new Date(latest.getTime() + FOLLOWUP_DURATION_MINUTES * 60_000);
  return latestEnd > desiredStart ? latestEnd : desiredStart;
}

/**
 * Creates, updates, or removes the Google Calendar event tied to a lead's
 * follow-up date, based on its current nextFollowupAt/status. Returns the
 * calendarEventId to persist (null if none), and — when other leads already
 * occupy that day — an adjusted nextFollowupAt so the CRM and the calendar
 * agree on the actual scheduled time. No-ops if Calendar isn't connected.
 */
export async function syncLeadCalendarEvent(
  lead: Lead,
): Promise<{ calendarEventId: string | null; nextFollowupAt: Date | null }> {
  const client = await getAuthorizedClient();
  if (!client) {
    return { calendarEventId: lead.calendarEventId, nextFollowupAt: lead.nextFollowupAt };
  }

  const calendar = google.calendar({ version: "v3", auth: client });
  const shouldHaveEvent = Boolean(lead.nextFollowupAt) && !isTerminalStatus(lead.status);

  try {
    if (!shouldHaveEvent) {
      if (lead.calendarEventId) {
        await calendar.events
          .delete({ calendarId: "primary", eventId: lead.calendarEventId })
          .catch(() => {});
      }
      return { calendarEventId: null, nextFollowupAt: lead.nextFollowupAt };
    }

    const start = await findNextAvailableSlot(lead.nextFollowupAt as Date, lead.id);
    const eventBody = buildEventBody(lead, start);

    if (lead.calendarEventId) {
      await calendar.events.update({
        calendarId: "primary",
        eventId: lead.calendarEventId,
        requestBody: eventBody,
      });
      return { calendarEventId: lead.calendarEventId, nextFollowupAt: start };
    }

    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventBody,
    });
    return { calendarEventId: created.data.id ?? null, nextFollowupAt: start };
  } catch (err) {
    // Calendar sync is a best-effort enhancement — never block lead writes,
    // but do log so a broken connection doesn't fail completely silently.
    console.error("[calendar] sync failed for lead", lead.id, err);
    return { calendarEventId: lead.calendarEventId, nextFollowupAt: lead.nextFollowupAt };
  }
}
