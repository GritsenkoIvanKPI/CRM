import { checkCalendarConnection, isCalendarConfigured } from "@/lib/calendar";
import { listLeadGenSources } from "@/lib/queries/leadGenSources";
import { DisconnectCalendarButton } from "@/components/settings/DisconnectCalendarButton";
import { LeadGenSourcesManager } from "@/components/settings/LeadGenSourcesManager";
import { ChartIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string }>;
}) {
  const { calendar } = await searchParams;
  const [connectionStatus, configured, leadGenSources] = await Promise.all([
    checkCalendarConnection(),
    Promise.resolve(isCalendarConfigured()),
    listLeadGenSources(),
  ]);
  const connected = connectionStatus === "connected";
  const needsReauth = connectionStatus === "needs_reauth";
  const statusLabel = connected
    ? "Підключено"
    : needsReauth
      ? "Потрібне перепідключення"
      : "Не підключено";
  const statusColor = connected
    ? "var(--color-success)"
    : needsReauth
      ? "var(--color-stage-thinking)"
      : "var(--color-text-faint)";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="animate-rise flex flex-col gap-1">
        <h1 className="font-display text-2xl tracking-tight text-text">
          Налаштування
        </h1>
        <p className="text-sm text-text-muted">
          Інтеграції та параметри CRM.
        </p>
      </div>

      {calendar === "connected" ? (
        <p className="rounded-lg border border-success-soft bg-success-soft px-4 py-3 text-sm text-success">
          Google Calendar підключено.
        </p>
      ) : null}
      {calendar === "error" ? (
        <p className="rounded-lg border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger">
          Не вдалося підключити Google Calendar. Спробуйте ще раз.
        </p>
      ) : null}
      {needsReauth && calendar !== "connected" ? (
        <p
          className="rounded-lg border px-4 py-3 text-sm leading-relaxed"
          style={{
            color: "var(--color-stage-thinking)",
            borderColor: "color-mix(in srgb, var(--color-stage-thinking) 35%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--color-stage-thinking) 14%, transparent)",
          }}
        >
          Google втратив дозвіл — Дата Пушу більше не створює події в
          календарі. Натисніть «Перепідключити», щоб відновити синхронізацію.
        </p>
      ) : null}

      <div className="shadow-elevated rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent-soft bg-accent-soft">
              <ChartIcon className="h-5 w-5 text-accent-strong" />
            </div>
            <div>
              <h2 className="font-display text-lg tracking-tight text-text">
                Google Calendar
              </h2>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-text-muted">
                Дата Пушу автоматично створює та оновлює подію у вашому
                основному календарі.
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                <span style={{ color: statusColor }}>{statusLabel}</span>
              </p>
            </div>
          </div>

          {connected ? (
            <DisconnectCalendarButton />
          ) : needsReauth ? (
            <a
              href="/api/calendar/oauth"
              className="shadow-accent-glow rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-transform duration-200 ease-out hover:bg-accent-strong active:scale-[0.98]"
            >
              Перепідключити
            </a>
          ) : (
            <a
              href="/api/calendar/oauth"
              className={`shadow-accent-glow rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform duration-200 ease-out active:scale-[0.98] ${
                configured
                  ? "bg-accent text-accent-ink hover:bg-accent-strong"
                  : "pointer-events-none bg-surface-2 text-text-faint"
              }`}
            >
              Підключити
            </a>
          )}
        </div>

        {!configured ? (
          <p className="mt-4 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs leading-relaxed text-text-faint">
            Потрібно задати GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET та
            GOOGLE_REDIRECT_URI в змінних середовища.
          </p>
        ) : null}
      </div>

      <LeadGenSourcesManager sources={leadGenSources} />
    </div>
  );
}
