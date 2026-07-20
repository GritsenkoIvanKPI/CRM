"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon } from "@/components/icons";

type Props = {
  open: boolean;
  onClose: () => void;
  niches: string[];
  methods: string[];
};

const emptyForm = {
  businessName: "",
  phone: "",
  telegram: "",
  instagram: "",
  niche: "",
  leadGenMethod: "",
};

export function QuickAddDrawer({ open, onClose, niches, methods }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.businessName.trim()) {
      setError("Вкажіть назву бізнесу");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не вдалося зберегти лід");
      return;
    }

    const { lead } = await res.json();
    setForm(emptyForm);
    onClose();
    router.refresh();
    router.push(`/leads/${lead.id}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="shadow-floating animate-rise absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface sm:right-4 sm:top-4 sm:h-[calc(100%-2rem)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-display text-lg tracking-tight text-text">
            Новий лід
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-text"
            aria-label="Закрити"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6"
        >
          <Field label="Назва бізнесу" required>
            <input
              autoFocus
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              className="input"
              placeholder="Меблі Стиль"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Телефон">
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="input"
                placeholder="+380..."
              />
            </Field>
            <Field label="Telegram">
              <input
                value={form.telegram}
                onChange={(e) => update("telegram", e.target.value)}
                className="input"
                placeholder="@handle"
              />
            </Field>
          </div>

          <Field label="Instagram">
            <input
              value={form.instagram}
              onChange={(e) => update("instagram", e.target.value)}
              className="input"
              placeholder="@handle"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Ніша">
              <input
                list="niche-options"
                value={form.niche}
                onChange={(e) => update("niche", e.target.value)}
                className="input"
                placeholder="Стоматологія"
              />
              <datalist id="niche-options">
                {niches.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </Field>
            <Field label="Метод лідогенерації">
              <input
                list="method-options"
                value={form.leadGenMethod}
                onChange={(e) => update("leadGenMethod", e.target.value)}
                className="input"
                placeholder="Холодна розсилка"
              />
              <datalist id="method-options">
                {methods.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
          </div>

          {error ? (
            <p className="rounded-lg border border-danger-soft bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <p className="text-xs leading-relaxed text-text-faint">
            Решту полів (ГЕО, чек, дата пушу, нотатки) можна додати на сторінці ліда.
          </p>

          <div className="mt-auto flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-text"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="shadow-accent-glow flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-ink transition-transform duration-200 ease-out hover:bg-accent-strong active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Збереження..." : "Зберегти лід"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-text-faint">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
