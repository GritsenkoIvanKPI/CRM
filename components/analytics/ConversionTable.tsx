"use client";

import { useMemo, useState } from "react";
import { ConversionRow } from "@/lib/conversion";
import { formatMoney, formatPercent } from "@/lib/format";
import { CURRENCIES } from "@/lib/currency";

// Below this many leads a percentage swings wildly (1 of 2 = 50%), so it is
// dimmed — and in the grouped view such groups are folded away by default.
const SMALL_SAMPLE = 5;

// A recent month with this share of leads still open will keep converting,
// so its numbers are flagged as not final yet.
const MATURING_SHARE = 0.3;

type Mode = "group" | "month";
type SortKey = "leads" | "contacted" | "call" | "proposal" | "won" | "conversion";

// Funnel stages: each shows its count and, next to it, the share of the
// previous stage that made it here.
const STAGES: {
  key: Exclude<SortKey, "conversion" | "leads">;
  label: string;
  from: "leads" | "contacted" | "call" | "proposal";
  hint: string;
}[] = [
  { key: "contacted", label: "Написали", from: "leads", hint: "% — від усіх лідів" },
  { key: "call", label: "Колл", from: "contacted", hint: "% — від тих, кому написали" },
  { key: "proposal", label: "КП", from: "call", hint: "% — від тих, хто був на дзвінку" },
  { key: "won", label: "Продаж", from: "proposal", hint: "% — від тих, хто отримав КП" },
];

function conversion(row: ConversionRow) {
  return row.contacted === 0 ? -1 : row.won / row.contacted;
}

function sortValue(row: ConversionRow, key: SortKey) {
  return key === "conversion" ? conversion(row) : row[key];
}

export function ConversionTable({
  total,
  rows,
  groupLabel,
  mode = "group",
  maturingSince,
}: {
  total: ConversionRow;
  rows: ConversionRow[];
  groupLabel: string;
  mode?: Mode;
  // month view: first "YYYY-MM" that can still be maturing
  maturingSince?: string;
}) {
  // months keep calendar order until a column is clicked
  const [sortKey, setSortKey] = useState<SortKey | null>(mode === "month" ? null : "leads");
  const [desc, setDesc] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      // a 1-of-2 group must not outrank a 30-of-100 one on conversion
      if (sortKey === "conversion") {
        const small = Number(a.contacted < SMALL_SAMPLE) - Number(b.contacted < SMALL_SAMPLE);
        if (small !== 0) return small;
      }
      const diff = sortValue(a, sortKey) - sortValue(b, sortKey);
      return (desc ? -diff : diff) || b.leads - a.leads;
    });
  }, [rows, sortKey, desc]);

  const hidden = mode === "group" && !showAll ? sorted.filter((r) => r.leads < SMALL_SAMPLE) : [];
  const visible = hidden.length > 0 ? sorted.filter((r) => r.leads >= SMALL_SAMPLE) : sorted;

  function toggleSort(key: SortKey) {
    if (key === sortKey) setDesc((d) => !d);
    else {
      setSortKey(key);
      setDesc(true);
    }
  }

  const header = (key: SortKey, label: string, hint?: string) => (
    <button
      type="button"
      title={hint}
      onClick={() => toggleSort(key)}
      className="inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-wide transition-colors duration-200 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft active:opacity-80"
    >
      {label}
      {sortKey === key ? <span className="text-accent">{desc ? "↓" : "↑"}</span> : null}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="shadow-elevated overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-faint">
              <th className="sticky left-0 z-10 bg-surface px-5 py-3.5 text-left font-medium uppercase tracking-wide">
                {groupLabel}
              </th>
              <th className="px-3 py-3.5 text-right font-medium">{header("leads", "Лідів")}</th>
              {STAGES.map((s) => (
                <th key={s.key} className="px-3 py-3.5 text-right font-medium">
                  {header(s.key, s.label, s.hint)}
                </th>
              ))}
              <th className="border-l border-border px-4 py-3.5 text-right font-medium">
                {header("conversion", "Конверсія", "Конверсія в продаж — від тих, кому написали")}
              </th>
              <th className="px-5 py-3.5 text-right font-medium uppercase tracking-wide">Дохід</th>
            </tr>
          </thead>
          <tbody>
            <Row row={total} mode={mode} isTotal />
            {visible.map((row) => (
              <Row key={row.key} row={row} mode={mode} maturingSince={maturingSince} />
            ))}
          </tbody>
        </table>
      </div>

      {hidden.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="self-start rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft active:opacity-80"
        >
          Показати ще {hidden.length} з малою кількістю лідів (менше {SMALL_SAMPLE})
        </button>
      ) : null}
    </div>
  );
}

function Row({
  row,
  mode,
  maturingSince,
  isTotal,
}: {
  row: ConversionRow;
  mode: Mode;
  maturingSince?: string;
  isTotal?: boolean;
}) {
  const base = isTotal ? "bg-surface-2" : "bg-surface group-hover:bg-surface-2";
  const maturing =
    mode === "month" &&
    !isTotal &&
    maturingSince !== undefined &&
    row.key >= maturingSince &&
    row.leads > 0 &&
    row.open / row.leads >= MATURING_SHARE;
  const hasRevenue = CURRENCIES.some((c) => row.revenue[c] !== 0);
  const cell = `whitespace-nowrap px-3 py-3.5 text-right tabular-nums transition-colors duration-200 ${base}`;

  return (
    <tr className={`group border-b border-border last:border-b-0 ${isTotal ? "font-medium" : ""}`}>
      <td className={`sticky left-0 z-10 max-w-[220px] px-5 py-3.5 transition-colors duration-200 ${base}`}>
        <div className="flex items-center gap-2">
          <span
            className={`truncate ${isTotal ? "font-display text-[15px] text-accent-strong" : "text-text"}`}
            title={row.label}
          >
            {row.label}
          </span>
          {maturing ? (
            <span
              className="shrink-0 rounded-full border border-accent-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent"
              title={`${row.open} з ${row.leads} лідів ще відкриті — цифри місяця ще зростуть`}
            >
              Ще в роботі
            </span>
          ) : null}
        </div>
      </td>
      <td className={`${cell} text-text`}>{row.leads}</td>
      {STAGES.map((s) => {
        const count = row[s.key];
        const from = row[s.from];
        return (
          <td key={s.key} className={cell} title={from > 0 ? `${count} з ${from}` : undefined}>
            <span className={count === 0 ? "text-text-faint" : "text-text"}>{count}</span>
            <span
              className={`ml-1.5 inline-block w-11 text-xs text-text-faint ${
                from > 0 && from < SMALL_SAMPLE ? "opacity-50" : ""
              }`}
            >
              {from > 0 ? formatPercent(count, from) : ""}
            </span>
          </td>
        );
      })}
      <td
        className={`${cell} border-l border-border`}
        title={row.contacted > 0 ? `${row.won} з ${row.contacted}` : undefined}
      >
        <span
          className={`text-[15px] ${
            row.contacted >= SMALL_SAMPLE ? "text-accent-strong" : "text-text-faint"
          }`}
        >
          {formatPercent(row.won, row.contacted)}
        </span>
      </td>
      <td
        className={`whitespace-nowrap px-5 py-3.5 text-right tabular-nums text-text-muted transition-colors duration-200 ${base}`}
      >
        {row.won === 0 ? (
          "—"
        ) : hasRevenue ? (
          <span className="flex flex-col items-end gap-0.5">
            {CURRENCIES.filter((c) => row.revenue[c] !== 0).map((c) => (
              <span key={c}>{formatMoney(row.revenue[c], c)}</span>
            ))}
          </span>
        ) : (
          <span className="text-xs text-text-faint">чек не вказано</span>
        )}
      </td>
    </tr>
  );
}
