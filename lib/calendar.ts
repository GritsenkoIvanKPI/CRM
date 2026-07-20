import { google } from "googleapis";
import { db } from "@/lib/db";
import { googleTokens } from "@/db/schema";
import { Lead } from "@/db/schema";
import { STATUS_LABELS } from "@/lib/status";
import { isTerminalStatus } from "@/lib/status";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const FOLLOWUP_DURATION_MINUTES = 30;
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

function buildEventBody(lead: Lead) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const start = new Date(lead.nextFollowupAt as Date);
  const end = new Date(start.getTime() + FOLLOWUP_DURATION_MINUTES * 60_000);

  return {
    summary: `Пуш: ${lead.businessName}`,
    description: `Статус: ${STATUS_LABELS[lead.status]}\n\nЛід у CRM: ${appUrl}/leads/${lead.id}`,
    start: { dateTime: start.toISOString(), timeZone: TIME_ZONE },
    end: { dateTime: end.toISOString(), timeZone: TIME_ZONE },
  };
}

/**
 * Creates, updates, or removes the Google Calendar event tied to a lead's
 * follow-up date, based on its current nextFollowupAt/status. Returns the
 * calendarEventId that should be persisted on the lead (null if none).
 * No-ops (returns the existing id unchanged) if Calendar isn't connected.
 */
export async function syncLeadCalendarEvent(lead: Lead): Promise<string | null> {
  const client = await getAuthorizedClient();
  if (!client) return lead.calendarEventId;

  const calendar = google.calendar({ version: "v3", auth: client });
  const shouldHaveEvent = Boolean(lead.nextFollowupAt) && !isTerminalStatus(lead.status);

  try {
    if (!shouldHaveEvent) {
      if (lead.calendarEventId) {
        await calendar.events
          .delete({ calendarId: "primary", eventId: lead.calendarEventId })
          .catch(() => {});
      }
      return null;
    }

    const eventBody = buildEventBody(lead);

    if (lead.calendarEventId) {
      await calendar.events.update({
        calendarId: "primary",
        eventId: lead.calendarEventId,
        requestBody: eventBody,
      });
      return lead.calendarEventId;
    }

    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventBody,
    });
    return created.data.id ?? null;
  } catch {
    // Calendar sync is a best-effort enhancement — never block lead writes.
    return lead.calendarEventId;
  }
}
