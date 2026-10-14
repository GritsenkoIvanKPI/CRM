"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Uses UTC getters (not local ones) so the displayed day is identical
// whether computed during server-side rendering (UTC) or during client
// hydration (the viewer's local timezone) — mismatched getters here caused
// an intermittent React hydration error for leads whose stored time sits
// near a day boundary.
function toDateInputValue(value: Date | string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function toCompactDisplay(value: Date | string | null) {
  if (!value) return "—";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}`;
}

// Preserves the original time-of-day (or defaults to 09:00 for a brand new
// date) so re-saving doesn't silently reset an existing reminder's time.
// Built from UTC components to match toDateInputValue/toCompactDisplay above —
// otherwise the day picked in the calendar (shown as a UTC day) could shift
// by one when written back using the viewer's local timezone.
function toIsoAtSameTime(dateStr: string, previous: Date | string | null) {
  const prev = previous ? new Date(previous) : null;
  const hours = prev ? prev.getUTCHours() : 9;
  const minutes = prev ? prev.getUTCMinutes() : 0;
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d, hours, minutes));
  return next.toISOString();
}

type DateField = "nextFollowupAt" | "lastPushedAt";

export function InlineDateCell({
  leadId,
  field,
  value,
  title,
}: {
  leadId: string;
  field: DateField;
  value: Date | string | null;
  title: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-sync when fresh server data arrives (e.g. another cell's edit
  // triggers a router.refresh() that also changed this field server-side —
  // setting a new next-push date auto-stamps last-pushed, for instance).
  // Adjusting state from a prop change during render (React's documented
  // pattern for this) rather than in an effect avoids an extra render pass.
  const [trackedValueTime, setTrackedValueTime] = useState(
    value ? new Date(value).getTime() : null,
  );
  const valueTime = value ? new Date(value).getTime() : null;
  if (valueTime !== trackedValueTime) {
    setTrackedValueTime(valueTime);
    setCurrent(value);
  }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = toDateInputValue(current);
    }
  }, [current]);

  function openPicker() {
    const el = inputRef.current;
    if (!el) return;
    if ("showPicker" in el && typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        // fall through to focus/click fallback
      }
    }
    el.focus();
    el.click();
  }

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const dateStr = event.target.value;
    const iso = dateStr ? toIsoAtSameTime(dateStr, current) : null;
    setSaving(true);

    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: iso }),
    });

    setSaving(false);

    if (res.ok) {
      setCurrent(iso);
      router.refresh();
    }
  }

  return (
    <div className="relative block h-full w-full" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={openPicker}
        disabled={saving}
        className={`block h-full w-full px-4 py-3.5 text-left tabular-nums transition-colors duration-200 hover:bg-surface-2 hover:text-accent-strong disabled:opacity-50 ${
          current ? "text-text" : "text-text-faint"
        }`}
        title={title}
      >
        {saving ? "…" : toCompactDisplay(current)}
      </button>
      <input
        ref={inputRef}
        type="date"
        defaultValue={toDateInputValue(current)}
        onChange={handleChange}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}
