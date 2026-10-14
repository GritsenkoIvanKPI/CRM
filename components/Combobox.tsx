"use client";

import { useLayoutEffect, useRef, useState } from "react";

type Row = { label: string; value: string };

// Matches the dropdown's max-h-56 (14rem) plus its vertical padding.
const DROPDOWN_MAX_HEIGHT = 232;

export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  emptyLabel = "—",
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlighted, setHighlighted] = useState(0);
  const [openUp, setOpenUp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-sync the visible text when the committed value changes from outside
  // (e.g. a fresh lead loaded into a reused modal) while not mid-edit.
  const [trackedValue, setTrackedValue] = useState(value);
  if (value !== trackedValue && !open) {
    setTrackedValue(value);
    setQuery(value);
  }

  // Flip the dropdown above the field when there isn't room below — this
  // form often sits inside a scrolling modal, and a downward dropdown near
  // the bottom gets clipped by the modal's own overflow instead of showing.
  useLayoutEffect(() => {
    if (!open || !inputRef.current) return;
    const fieldRect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - fieldRect.bottom;
    setOpenUp(spaceBelow < DROPDOWN_MAX_HEIGHT && fieldRect.top > DROPDOWN_MAX_HEIGHT);
  }, [open]);

  const q = query.trim().toLowerCase();
  const matches = options.filter((o) => o.toLowerCase().includes(q));
  // A value already on the lead but not (or no longer) in the managed list
  // stays visible and selectable as-is — it's just never offered as a fresh
  // choice, so typing can't recreate arbitrary free text.
  const orphan = value && !options.includes(value) ? value : null;

  const rows: Row[] = [{ label: emptyLabel, value: "" }, ...matches.map((m) => ({ label: m, value: m }))];
  if (orphan && (!q || orphan.toLowerCase().includes(q))) {
    rows.push({ label: `${orphan} (немає у списку)`, value: orphan });
  }

  function commit(v: string) {
    onChange(v);
    setQuery(v);
    setTrackedValue(v);
    setOpen(false);
    setHighlighted(0);
  }

  function handleBlur() {
    const typed = query.trim().toLowerCase();
    const exact = rows.find(
      (r) => r.value.toLowerCase() === typed || r.label.toLowerCase() === typed,
    );
    if (exact) {
      commit(exact.value);
    } else {
      // Not a real list entry — refuse it and fall back to what was last committed.
      setQuery(value);
    }
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[highlighted];
      if (row) commit(row.value);
    } else if (e.key === "Escape") {
      setQuery(value);
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className="input"
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => {
          setOpen(true);
          setHighlighted(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
      {open ? (
        <div
          className={`shadow-elevated absolute z-20 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface-2 py-1 ${
            openUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {rows.map((row, i) => (
            <button
              key={`${row.value}-${i}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(row.value)}
              className={`block w-full truncate px-3 py-2 text-left text-sm transition-colors duration-150 ${
                i === highlighted
                  ? "bg-accent-soft text-accent-strong"
                  : "text-text hover:bg-surface"
              }`}
            >
              {row.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
