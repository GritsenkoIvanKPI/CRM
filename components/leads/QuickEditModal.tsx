"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lead } from "@/db/schema";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/status";
import { CloseIcon } from "@/components/icons";
import { Combobox } from "@/components/Combobox";
import { CurrencySelect } from "@/components/CurrencySelect";
import { DEFAULT_BUDGET_CURRENCY, DEFAULT_DEAL_CURRENCY, toCurrency } from "@/lib/currency";

const AUTOSAVE_DELAY_MS = 700;

type Props = {
  lead: Lead;
  niches: string[];
  geos: string[];
  methods: string[];
  leadGenSources: string[];
  onClose: () => void;
};

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
    status: lead.status,
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
    a.status !== b.status
  );
}

export function QuickEditModal({
  lead,
  niches,
  geos,
  methods,
  leadGenSources,
  onClose,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildForm(lead));
  const [saving, setSaving] = useState(false);
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

  // Debounced autosave: wait for a pause in typing, then persist.
  useEffect(() => {
    if (!isDirty(form, savedSnapshotRef.current)) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => void save(), AUTOSAVE_DELAY_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  async function handleClose() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isDirty(formRef.current, savedSnapshotRef.current)) {
      await save();
    }
    onClose();
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") void handleClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) void handleClose();
      }}
    >
      <div className="shadow-elevated animate-rise max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface">
        <div className="flex flex-col">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-6 py-4">
            <h2 className="truncate font-display text-lg tracking-tight text-text">
              {lead.businessName}
            </h2>
            <div className="flex items-center gap-3">
              <SaveStatus saving={saving} savedAt={savedAt} />
              <button
                type="button"
                onClick={() => void handleClose()}
                className="rounded-lg p-1.5 text-text-faint transition-colors duration-200 hover:bg-surface-2 hover:text-text"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <Field label="Назва бізнесу" required span2>
              <input
                autoFocus
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
                list="quick-edit-niche-options"
                className="input"
                value={form.niche}
                onChange={(e) => update("niche", e.target.value)}
              />
              <datalist id="quick-edit-niche-options">
                {niches.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </Field>
            <Field label="ГЕО бізнесу">
              <input
                list="quick-edit-geo-options"
                className="input"
                value={form.geo}
                onChange={(e) => update("geo", e.target.value)}
              />
              <datalist id="quick-edit-geo-options">
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
            <Field label="Метод лідогенерації">
              <input
                list="quick-edit-method-options"
                className="input"
                value={form.leadGenMethod}
                onChange={(e) => update("leadGenMethod", e.target.value)}
              />
              <datalist id="quick-edit-method-options">
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
          </div>

          {error ? (
            <p className="mx-6 mb-4 rounded-lg border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <div className="sticky bottom-0 flex items-center justify-end border-t border-border bg-surface px-6 py-4">
            <button
              type="button"
              onClick={() => void handleClose()}
              className="rounded-lg border border-border px-5 py-3 text-sm font-medium text-text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-text"
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveStatus({ saving, savedAt }: { saving: boolean; savedAt: number | null }) {
  if (saving) {
    return <span className="text-xs text-text-faint">Збереження...</span>;
  }
  if (savedAt) {
    return <span className="text-xs text-success">Збережено</span>;
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
