"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LeadGenSource } from "@/db/schema";
import { CloseIcon } from "@/components/icons";

export function LeadGenSourcesManager({ sources }: { sources: LeadGenSource[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setAdding(true);
    setError(null);

    const res = await fetch("/api/lead-gen-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    setAdding(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не вдалося додати лідген");
      return;
    }

    setName("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/lead-gen-sources/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="shadow-elevated rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-display text-lg tracking-tight text-text">Лідген (хто/що)</h2>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-text-muted">
        Список лідгенів і креативів для вибору при додаванні чи редагуванні
        ліда — саме звідси беруться варіанти у випадаючому списку.
      </p>

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Наприклад: Креатив #12"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          disabled={adding || !name.trim()}
          className="shadow-accent-glow shrink-0 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-ink transition-transform duration-200 ease-out hover:bg-accent-strong active:scale-[0.98] disabled:opacity-50"
        >
          {adding ? "Додавання..." : "Додати"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-lg border border-danger-soft bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {sources.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {sources.map((source) => (
            <li
              key={source.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2"
            >
              <span className="truncate text-sm text-text">{source.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(source.id)}
                disabled={deletingId === source.id}
                title="Видалити"
                className="shrink-0 rounded-lg p-1.5 text-text-faint transition-colors duration-200 hover:bg-danger-soft hover:text-danger disabled:opacity-50"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-text-faint">Список поки порожній.</p>
      )}
    </div>
  );
}
