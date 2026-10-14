"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronRightIcon } from "@/components/icons";

function toDateParam(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function nextMonday(from: Date) {
  const day = from.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysUntil = ((1 - day + 7) % 7) || 7; // always the *coming* Monday, never today
  return addDays(from, daysUntil);
}

function endOfWeek(from: Date) {
  const day = from.getDay();
  const daysUntilSunday = (7 - day) % 7;
  return addDays(from, daysUntilSunday);
}

export function FollowupDateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const from = searchParams.get("followupFrom");
  const to = searchParams.get("followupTo");
  const active = Boolean(from || to);

  const today = useMemo(() => new Date(), []);

  // Held locally and only sent to apply() on explicit confirmation — some
  // browsers' native date pickers (Safari especially) fire a change event
  // just from clicking the month step arrows, with no day actually chosen.
  // Applying on every change closed the whole panel mid-browse.
  const [customDate, setCustomDate] = useState(from && from === to ? from : "");

  const label = useMemo(() => {
    if (!active) return "Дата пушу";
    if (!from && to) return `Прострочені (до ${to.split("-").reverse().slice(0, 2).join(".")})`;
    if (from && to && from === to) {
      const todayStr = toDateParam(today);
      const tomorrowStr = toDateParam(addDays(today, 1));
      if (from === todayStr) return "Пуш: сьогодні";
      if (from === tomorrowStr) return "Пуш: завтра";
      return `Пуш: ${from.split("-").reverse().slice(0, 2).join(".")}`;
    }
    if (from && to) {
      return `Пуш: ${from.split("-").reverse().slice(0, 2).join(".")}–${to.split("-").reverse().slice(0, 2).join(".")}`;
    }
    return "Дата пушу";
  }, [active, from, to, today]);

  function apply(nextFrom: string | null, nextTo: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextFrom) params.set("followupFrom", nextFrom);
    else params.delete("followupFrom");
    if (nextTo) params.set("followupTo", nextTo);
    else params.delete("followupTo");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  const presets = [
    {
      label: "Прострочені",
      onClick: () => apply(null, toDateParam(addDays(today, -1))),
    },
    {
      label: "Сьогодні",
      onClick: () => apply(toDateParam(today), toDateParam(today)),
    },
    {
      label: "Завтра",
      onClick: () => {
        const d = toDateParam(addDays(today, 1));
        apply(d, d);
      },
    },
    {
      label: "Цей тиждень",
      onClick: () => apply(toDateParam(today), toDateParam(endOfWeek(today))),
    },
    {
      label: "Наступний понеділок",
      onClick: () => {
        const d = toDateParam(nextMonday(today));
        apply(d, d);
      },
    },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpen((v) => {
            const next = !v;
            if (next) setCustomDate(from && from === to ? from : "");
            return next;
          })
        }
        className={`input flex items-center gap-2 ${active ? "border-accent-soft text-accent-strong" : ""}`}
      >
        {label}
        <ChevronRightIcon
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "-rotate-90" : "rotate-90"}`}
        />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="shadow-floating animate-rise absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-surface-2 p-2">
            <div className="flex flex-col">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={preset.onClick}
                  className="rounded-lg px-3 py-2 text-left text-sm text-text transition-colors duration-200 hover:bg-surface"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="mt-2 border-t border-border pt-2">
              <label className="flex flex-col gap-1.5 px-1">
                <span className="text-xs font-medium uppercase tracking-wide text-text-faint">
                  Або обрати дату
                </span>
                <input
                  type="date"
                  className="input"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customDate) {
                      e.preventDefault();
                      apply(customDate, customDate);
                    }
                  }}
                />
              </label>
              <button
                type="button"
                disabled={!customDate}
                onClick={() => apply(customDate, customDate)}
                className="shadow-accent-glow mt-2 w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink transition-transform duration-200 ease-out hover:bg-accent-strong active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                Застосувати дату
              </button>
            </div>
            {active ? (
              <button
                type="button"
                onClick={() => apply(null, null)}
                className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-danger transition-colors duration-200 hover:bg-danger-soft"
              >
                Скинути фільтр
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
