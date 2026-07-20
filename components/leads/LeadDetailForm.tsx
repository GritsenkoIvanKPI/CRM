"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lead, LeadStatusHistoryEntry } from "@/db/schema";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime, formatMonth } from "@/lib/format";

type Props = {
  lead: Lead;
  history: LeadStatusHistoryEntry[];
  niches: string[];
  geos: string[];
  methods: string[];
};

function toDateTimeLocal(value: Date | string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LeadDetailForm({ lead, history, niches, geos, methods }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: lead.businessName,
    telegram: lead.telegram ?? "",
    phone: lead.phone ?? "",
    instagram: lead.instagram ?? "",
    niche: lead.niche ?? "",
    geo: lead.geo ?? "",
    website: lead.website ?? "",
    account: lead.account ?? "",
    leadGenMethod: lead.leadGenMethod ?? "",
    leadGenSource: lead.leadGenSource ?? "",
    dealValue: lead.dealValue ?? "",
    nextFollowupAt: toDateTimeLocal(lead.nextFollowupAt),
    status: lead.status,
    notes: lead.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = useMemo(() => {
    return (
      form.businessName !== lead.businessName ||
      form.telegram !== (lead.telegram ?? "") ||
      form.phone !== (lead.phone ?? "") ||
      form.instagram !== (lead.instagram ?? "") ||
      form.niche !== (lead.niche ?? "") ||
      form.geo !== (lead.geo ?? "") ||
      form.website !== (lead.website ?? "") ||
      form.account !== (lead.account ?? "") ||
      form.leadGenMethod !== (lead.leadGenMethod ?? "") ||
      form.leadGenSource !== (lead.leadGenSource ?? "") ||
      String(form.dealValue) !== String(lead.dealValue ?? "") ||
      form.nextFollowupAt !== toDateTimeLocal(lead.nextFollowupAt) ||
      form.status !== lead.status ||
      form.notes !== (lead.notes ?? "")
    );
  }, [form, lead]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        dealValue: form.dealValue === "" ? null : Number(form.dealValue),
        nextFollowupAt: form.nextFollowupAt
          ? new Date(form.nextFollowupAt).toISOString()
          : null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не вдалося зберегти зміни");
      return;
    }

    setSavedAt(Date.now());
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Видалити лід «${lead.businessName}»? Цю дію не можна скасувати.`)) {
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/leads");
      router.refresh();
    } else {
      setDeleting(false);
      setError("Не вдалося видалити лід");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 space-y-6">
        <div className="shadow-elevated rounded-2xl border border-border bg-surface p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg tracking-tight text-text">
              Основна інформація
            </h2>
            <StatusBadge status={form.status} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Назва бізнесу" required span2>
              <input
                className="input"
                value={form.businessName}
                onChange={(e) => update("businessName", e.target.value)}
              />
            </Field>
            <Field label="Телефон">
              <input
                className="input"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </Field>
            <Field label="Telegram">
              <input
                className="input"
                value={form.telegram}
                onChange={(e) => update("telegram", e.target.value)}
              />
            </Field>
            <Field label="Instagram">
              <input
                className="input"
                value={form.instagram}
                onChange={(e) => update("instagram", e.target.value)}
              />
            </Field>
            <Field label="Сайт">
              <input
                className="input"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </Field>
            <Field label="Ніша">
              <input
                list="niche-options"
                className="input"
                value={form.niche}
                onChange={(e) => update("niche", e.target.value)}
              />
              <datalist id="niche-options">
                {niches.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </Field>
            <Field label="ГЕО бізнесу">
              <input
                list="geo-options"
                className="input"
                value={form.geo}
                onChange={(e) => update("geo", e.target.value)}
              />
              <datalist id="geo-options">
                {geos.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </Field>
            <Field label="Аккаунт">
              <input
                className="input"
                value={form.account}
                onChange={(e) => update("account", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="shadow-elevated rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-5 font-display text-lg tracking-tight text-text">
            Лідогенерація та угода
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Метод лідогенерації">
              <input
                list="method-options"
                className="input"
                value={form.leadGenMethod}
                onChange={(e) => update("leadGenMethod", e.target.value)}
              />
              <datalist id="method-options">
                {methods.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
            <Field label="Лідген (хто/що)">
              <input
                className="input"
                value={form.leadGenSource}
                onChange={(e) => update("leadGenSource", e.target.value)}
              />
            </Field>
            <Field label="Чек, ₴">
              <input
                type="number"
                min="0"
                className="input"
                value={form.dealValue}
                onChange={(e) => update("dealValue", e.target.value)}
              />
            </Field>
            <Field label="Дата пушу">
              <input
                type="datetime-local"
                className="input"
                value={form.nextFollowupAt}
                onChange={(e) => update("nextFollowupAt", e.target.value)}
              />
            </Field>
            <Field label="Статус">
              <select
                className="input"
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value as typeof form.status)
                }
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Дата створення">
              <div className="input flex items-center text-text-muted">
                {formatDateTime(lead.createdAt)} · {formatMonth(lead.createdAt)}
              </div>
            </Field>
          </div>
        </div>

        <div className="shadow-elevated rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 font-display text-lg tracking-tight text-text">
            Нотатки
          </h2>
          <textarea
            className="input min-h-32 w-full resize-y"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Контекст, історія спілкування, заперечення..."
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!dirty || saving}
            className="shadow-accent-glow rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-ink transition-transform duration-200 ease-out hover:bg-accent-strong active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {saving ? "Збереження..." : "Зберегти зміни"}
          </button>
          {!dirty && savedAt ? (
            <span className="text-xs text-success">Збережено</span>
          ) : null}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto rounded-lg border border-danger-soft px-4 py-3 text-sm font-medium text-danger transition-colors duration-200 hover:bg-danger-soft disabled:opacity-50"
          >
            {deleting ? "Видалення..." : "Видалити лід"}
          </button>
        </div>
      </div>

      <div className="w-full lg:w-72 lg:shrink-0">
        <div className="shadow-elevated rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 font-display text-base tracking-tight text-text">
            Історія статусів
          </h2>
          <ol className="flex flex-col gap-4">
            {history.map((entry) => (
              <li key={entry.id} className="relative flex gap-3 pl-4">
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-accent" />
                <div>
                  <p className="text-sm font-medium text-text">
                    {STATUS_LABELS[entry.status]}
                  </p>
                  <p className="text-xs text-text-faint">
                    {formatDateTime(entry.changedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  span2,
  children,
}: {
  label: string;
  required?: boolean;
  span2?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-2 ${span2 ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-text-faint">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
