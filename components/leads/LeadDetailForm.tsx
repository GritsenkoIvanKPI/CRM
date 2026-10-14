"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lead, LeadStatusHistoryEntry } from "@/db/schema";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";
import { Combobox } from "@/components/Combobox";
import { CurrencySelect } from "@/components/CurrencySelect";
import { DEFAULT_BUDGET_CURRENCY, DEFAULT_DEAL_CURRENCY, toCurrency } from "@/lib/currency";
import { formatDateTime, formatMonth } from "@/lib/format";
import { getLeadsHref } from "@/lib/leads-return";

const AUTOSAVE_DELAY_MS = 700;

type Props = {
  lead: Lead;
  history: LeadStatusHistoryEntry[];
  niches: string[];
  geos: string[];
  methods: string[];
  leadGenSources: string[];
};

function toDateTimeLocal(value: Date | string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// UTC getters (not local) so this date-only field renders identically during
// server-side rendering (UTC) and client hydration (viewer's timezone) —
// mismatched getters here can trigger a React hydration error for leads
// whose stored time sits near a day boundary. Paired with the "Z" suffix
// in the save() UTC round-trip below.
function toDateInput(value: Date | string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function buildForm(lead: Lead) {
  return {
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
    budget: lead.budget ?? "",
    budgetCurrency: toCurrency(lead.budgetCurrency, DEFAULT_BUDGET_CURRENCY),
    dealCurrency: toCurrency(lead.dealCurrency, DEFAULT_DEAL_CURRENCY),
    isTarget: lead.isTarget,
    dealValue: lead.dealValue ?? "",
    nextFollowupAt: toDateTimeLocal(lead.nextFollowupAt),
    lastPushedAt: toDateInput(lead.lastPushedAt),
    status: lead.status,
    notes: lead.notes ?? "",
  };
}

type FormState = ReturnType<typeof buildForm>;

function isDirty(a: FormState, b: FormState) {
  return (
    a.businessName !== b.businessName ||
    a.telegram !== b.telegram ||
    a.phone !== b.phone ||
    a.instagram !== b.instagram ||
    a.niche !== b.niche ||
    a.geo !== b.geo ||
    a.website !== b.website ||
    a.account !== b.account ||
    a.leadGenMethod !== b.leadGenMethod ||
    a.leadGenSource !== b.leadGenSource ||
    a.budget !== b.budget ||
    a.budgetCurrency !== b.budgetCurrency ||
    a.dealCurrency !== b.dealCurrency ||
    a.isTarget !== b.isTarget ||
    String(a.dealValue) !== String(b.dealValue) ||
    a.nextFollowupAt !== b.nextFollowupAt ||
    a.lastPushedAt !== b.lastPushedAt ||
    a.status !== b.status ||
    a.notes !== b.notes
  );
}

export function LeadDetailForm({
  lead,
  history,
  niches,
  geos,
  methods,
  leadGenSources,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildForm(lead));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const formRef = useRef(form);
  formRef.current = form;
  const savedSnapshotRef = useRef<FormState>(form);
  const savingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);

    const toSave = formRef.current;
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...toSave,
        dealValue: toSave.dealValue === "" ? null : Number(toSave.dealValue),
        nextFollowupAt: toSave.nextFollowupAt
          ? new Date(toSave.nextFollowupAt).toISOString()
          : null,
        lastPushedAt: toSave.lastPushedAt
          ? new Date(`${toSave.lastPushedAt}T00:00:00Z`).toISOString()
          : null,
      }),
    });

    savingRef.current = false;
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не вдалося зберегти зміни");
      return;
    }

    savedSnapshotRef.current = toSave;
    setSavedAt(Date.now());
    router.refresh();

    if (isDirty(formRef.current, toSave)) {
      void save();
    }
  }

  // Debounced autosave: wait for a pause in editing, then persist.
  useEffect(() => {
    if (!isDirty(form, savedSnapshotRef.current)) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => void save(), AUTOSAVE_DELAY_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  async function handleDelete() {
    if (!confirm(`Видалити лід «${lead.businessName}»? Цю дію не можна скасувати.`)) {
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDeleting(true);
    const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push(getLeadsHref());
      router.refresh();
    } else {
      setDeleting(false);
      setError("Не вдалося видалити лід");
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
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
              <Combobox
                value={form.leadGenSource}
                onChange={(v) => update("leadGenSource", v)}
                options={leadGenSources}
                placeholder="Почніть вводити..."
              />
            </Field>
            <Field label="Бюджет">
              <div className="flex gap-2">
                <input
                  className="input min-w-0 flex-1"
                  value={form.budget}
                  onChange={(e) => update("budget", e.target.value)}
                  placeholder="Назвав на дзвінку"
                />
                <CurrencySelect
                  label="Валюта бюджету"
                  value={form.budgetCurrency}
                  onChange={(c) => update("budgetCurrency", c)}
                />
              </div>
            </Field>
            <Field label="Чек">
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  className="input min-w-0 flex-1"
                  value={form.dealValue}
                  onChange={(e) => update("dealValue", e.target.value)}
                />
                <CurrencySelect
                  label="Валюта чека"
                  value={form.dealCurrency}
                  onChange={(c) => update("dealCurrency", c)}
                />
              </div>
            </Field>
            <Field label="Наступний пуш">
              <input
                type="datetime-local"
                className="input"
                value={form.nextFollowupAt}
                onChange={(e) => update("nextFollowupAt", e.target.value)}
              />
            </Field>
            <Field label="Останній пуш">
              <input
                type="date"
                className="input"
                value={form.lastPushedAt}
                onChange={(e) => update("lastPushedAt", e.target.value)}
              />
            </Field>
            <Field label="Статус">
              <select
                className="input"
                value={form.status}
                onChange={(e) => update("status", e.target.value as FormState["status"])}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Цільовий лід">
              <select
                className="input"
                value={form.isTarget === null ? "" : String(form.isTarget)}
                onChange={(e) =>
                  update("isTarget", e.target.value === "" ? null : e.target.value === "true")
                }
              >
                <option value="">Не визначено</option>
                <option value="true">Так</option>
                <option value="false">Ні</option>
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
          <SaveStatus saving={saving} savedAt={savedAt} />
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
    </div>
  );
}

function SaveStatus({ saving, savedAt }: { saving: boolean; savedAt: number | null }) {
  if (saving) {
    return <span className="text-sm text-text-faint">Збереження...</span>;
  }
  if (savedAt) {
    return <span className="text-sm text-success">Збережено</span>;
  }
  return null;
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
