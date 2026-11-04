"use client";

import { useMemo, useState } from "react";
import { ConversionRow } from "@/lib/conversion";
import { formatPercent, formatTotals } from "@/lib/format";
import { CURRENCIES } from "@/lib/currency";

// Below this many leads in the denominator a percentage swings wildly
// (1 of 2 = 50%), so it is shown dimmed as a hint not to over-read it.
const SMALL_SAMPLE = 5;

type Tone = "accent" | "danger";

type Column =
  | {
      kind: "count";
      key: string;
      label: string;
      hint: string;
      get: (r: ConversionRow) => number;
    }
  | {
      kind: "rate";
      key: string;
      label: string;
      hint: string;
      tone: Tone;
      get: (r: ConversionRow) => { num: number; den: number };
    };

const GROUPS: { label: string; columns: Column[] }[] = [
  {
    label: "Воронка",
    columns: [
      { kind: "count", key: "leads", label: "Лідів", hint: "Усі ліди за період", get: (r) => r.leads },
      {
        kind: "count",
        key: "contacted",
        label: "Написали",
        hint: "Дійшли щонайменше до «Написав»",
        get: (r) => r.contacted,
      },
      {
        kind: "count",
        key: "call",
        label: "Колл",
        hint: "Погодились на дзвінок (або пройшли далі)",
        get: (r) => r.call,
      },
      {
        kind: "count",
        key: "proposal",
        label: "КП",
        hint: "Отримали комерційну пропозицію (або пройшли далі)",
        get: (r) => r.proposal,
      },
      { kind: "count", key: "won", label: "Продаж", hint: "Зараз у статусі «Продаж»", get: (r) => r.won },
    ],
  },
  {
    label: "Конверсія",
    columns: [
      {
        kind: "rate",
        key: "contactedToCall",
        label: "Написав → Колл",
        hint: "Яка частка тих, кому написали, погодилась на дзвінок",
        tone: "accent",
        get: (r) => ({ num: r.call, den: r.contacted }),
      },
      {
        kind: "rate",
        key: "callToProposal",
        label: "Колл → КП",
        hint: "Яка частка після дзвінка отримала КП",
        tone: "accent",
        get: (r) => ({ num: r.proposal, den: r.call }),
      },
      {
        kind: "rate",
        key: "proposalToWon",
        label: "КП → Продаж",
        hint: "Яка частка після КП купила",
        tone: "accent",
        get: (r) => ({ num: r.won, den: r.proposal }),
      },
      {
        kind: "rate",
        key: "callToWon",
        label: "Колл → Продаж",
        hint: "Яка частка після дзвінка купила",
        tone: "accent",
        get: (r) => ({ num: r.won, den: r.call }),
      },
      {
        kind: "rate",
        key: "contactedToWon",
        label: "Написав → Продаж",
        hint: "Наскрізна конверсія: з усіх, кому написали",
        tone: "accent",
        get: (r) => ({ num: r.won, den: r.contacted }),
      },
    ],
  },
  {
    label: "Відмови",
    columns: [
      {
        kind: "rate",
        key: "lostInChat",
        label: "У переписці",
        hint: "«Не цікаво» ще до дзвінка — частка від тих, кому написали",
        tone: "danger",
        get: (r) => ({ num: r.lostInChat, den: r.contacted }),
      },
      {
        kind: "rate",
        key: "lostAfterCall",
        label: "Після колу",
        hint: "«Не цікаво» після дзвінка, до КП — частка від тих, хто був на дзвінку",
        tone: "danger",
        get: (r) => ({ num: r.lostAfterCall, den: r.call }),
      },
      {
        kind: "rate",
        key: "lostAfterProposal",
        label: "Після КП",
        hint: "«Не цікаво» після КП — частка від тих, хто отримав КП",
        tone: "danger",
        get: (r) => ({ num: r.lostAfterProposal, den: r.proposal }),
      },
    ],
  },
  {
    label: "Зараз у роботі",
    columns: [
      {
        kind: "count",
        key: "open",
        label: "Відкриті",
        hint: "Ще не «Продаж» і не «Не цікаво» — з цих лідів ще можуть бути продажі",
        get: (r) => r.open,
      },
      {
        kind: "count",
        key: "noReply",
        label: "Без відповіді",
        hint: "Зараз у статусі «Написав» — ще не відповіли",
        get: (r) => r.noReply,
      },
      { kind: "count", key: "thinking", label: "Думають", hint: "Зараз у статусі «Думає»", get: (r) => r.thinking },
      {
        kind: "count",
        key: "interested",
        label: "Цікаво",
        hint: "Зараз у статусі «Цікаво» — гарячі ліди",
        get: (r) => r.interested,
      },
    ],
  },
  {
    label: "Якість",
    columns: [
      {
        kind: "rate",
        key: "target",
        label: "Цільових",
        hint: "Частка цільових серед лідів, для яких це вже визначено",
        tone: "accent",
        get: (r) => ({ num: r.target, den: r.targetAssessed }),
      },
    ],
  },
];

// Month view only: what closed during the month, whenever the lead came in.
const SOLD_IN_PERIOD_GROUP: { label: string; columns: Column[] } = {
  label: "Закрито за місяць",
  columns: [
    {
      kind: "count",
      key: "soldInPeriod",
      label: "Продажів",
      hint: "Скільки угод закрили саме в цьому місяці — незалежно від того, коли прийшов лід",
      get: (r) => r.soldInPeriod,
    },
  ],
};

// A recent cohort with this share of leads still open will keep converting —
// its rates are not final yet, so it is flagged rather than compared as-is.
// Older months with open leads are stale, not maturing, so they get no flag.
const MATURING_SHARE = 0.3;

type Mode = "group" | "month";

function sortValue(column: Column, row: ConversionRow) {
  if (column.kind === "count") return column.get(row);
  const { num, den } = column.get(row);
  return den === 0 ? -1 : num / den;
}

// When ranking by a percentage, a 1-of-2 group would otherwise outrank a
// 30-of-100 one — keep small samples after the groups with enough data.
function isSmallSample(column: Column, row: ConversionRow) {
  return column.kind === "rate" && column.get(row).den < SMALL_SAMPLE;
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
  const groups = mode === "month" ? [...GROUPS, SOLD_IN_PERIOD_GROUP] : GROUPS;
  const columns = groups.flatMap((g) => g.columns);
  // months keep their calendar order until a column is clicked
  const [sortKey, setSortKey] = useState<string | null>(mode === "month" ? null : "leads");
  const [desc, setDesc] = useState(true);

  const sorted = useMemo(() => {
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return rows;
    return [...rows].sort((a, b) => {
      const small = Number(isSmallSample(column, a)) - Number(isSmallSample(column, b));
      if (small !== 0) return small;
      const diff = sortValue(column, a) - sortValue(column, b);
      // ties fall back to volume, so bigger groups surface first
      return (desc ? -diff : diff) || b.leads - a.leads;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- columns derive from mode
  }, [rows, sortKey, desc, mode]);

  function toggleSort(key: string) {
    if (key === sortKey) {
      setDesc((d) => !d);
    } else {
      setSortKey(key);
      setDesc(true);
    }
  }

  return (
    <div className="shadow-elevated overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[1500px] border-collapse text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-text-faint">
            <th
              rowSpan={2}
              className="sticky left-0 z-20 w-[150px] border-b border-r border-border bg-surface px-4 sm:w-[260px] py-3 text-left font-medium"
            >
              {groupLabel}
            </th>
            {groups.map((group) => (
              <th
                key={group.label}
                colSpan={group.columns.length}
                className="whitespace-nowrap border-b border-l border-border px-3 pb-1.5 pt-3 text-left font-medium text-text-muted"
              >
                {group.label}
              </th>
            ))}
            <th
              rowSpan={2}
              className="border-b border-l border-border px-4 py-3 text-right font-medium"
            >
              {mode === "month" ? "Дохід за місяць" : "Дохід"}
            </th>
          </tr>
          <tr className="text-xs text-text-faint">
            {groups.flatMap((group) =>
              group.columns.map((column, i) => (
                <th
                  key={column.key}
                  className={`border-b border-border px-3 py-2 text-right font-medium ${
                    i === 0 ? "border-l" : ""
                  }`}
                >
                  <button
                    type="button"
                    title={column.hint}
                    onClick={() => toggleSort(column.key)}
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded transition-colors duration-200 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft active:opacity-80"
                  >
                    {column.label}
                    {sortKey === column.key ? (
                      <span className="text-accent">{desc ? "↓" : "↑"}</span>
                    ) : null}
                  </button>
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          <Row row={total} groups={groups} mode={mode} maturingSince={maturingSince} isTotal />
          {sorted.map((row) => (
            <Row key={row.key} row={row} groups={groups} mode={mode} maturingSince={maturingSince} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  row,
  groups,
  mode,
  maturingSince,
  isTotal,
}: {
  row: ConversionRow;
  groups: { label: string; columns: Column[] }[];
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
  const revenue = mode === "month" ? row.revenueInPeriod : row.revenue;
  const hasRevenue = mode === "month" ? row.soldInPeriod > 0 : row.won > 0;

  return (
    <tr className={`group ${isTotal ? "border-b-2" : "border-b"} border-border last:border-b-0`}>
      <td
        className={`sticky left-0 z-10 max-w-[150px] border-r border-border px-4 py-3 sm:max-w-[260px] transition-colors duration-200 ${base}`}
      >
        <p
          className={`truncate ${isTotal ? "font-display text-[15px] text-accent-strong" : "font-medium text-text"}`}
          title={row.label}
        >
          {row.label}
        </p>
        {maturing ? (
          <span
            className="mt-1 inline-flex rounded-full border border-accent-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent"
            title={`${row.open} з ${row.leads} лідів ще відкриті — конверсія цього місяця ще зростатиме`}
          >
            Ще в роботі
          </span>
        ) : null}
      </td>
      {groups.flatMap((group) =>
        group.columns.map((column, i) => (
          <td
            key={column.key}
            className={`px-3 py-3 text-right tabular-nums transition-colors duration-200 ${base} ${
              i === 0 ? "border-l border-border" : ""
            }`}
          >
            {column.kind === "count" ? (
              <CountCell value={column.get(row)} />
            ) : (
              <RateCell {...column.get(row)} tone={column.tone} />
            )}
          </td>
        )),
      )}
      <td
        className={`whitespace-nowrap border-l border-border px-4 py-3 text-right tabular-nums text-text-muted transition-colors duration-200 ${base}`}
      >
        {!hasRevenue ? (
          "—"
        ) : CURRENCIES.some((c) => revenue[c] !== 0) ? (
          formatTotals(revenue)
        ) : (
          <span className="text-xs text-text-faint">чек не вказано</span>
        )}
      </td>
    </tr>
  );
}

function CountCell({ value }: { value: number }) {
  return <span className={value === 0 ? "text-text-faint" : "text-text"}>{value}</span>;
}

function RateCell({ num, den, tone }: { num: number; den: number; tone: Tone }) {
  if (den === 0) return <span className="text-text-faint">—</span>;

  const small = den < SMALL_SAMPLE;
  const share = num / den;

  return (
    <div
      className={`ml-auto flex w-[88px] flex-col items-end gap-1 ${small ? "opacity-50" : ""}`}
      title={small ? `Мала вибірка: ${num} з ${den}` : `${num} з ${den}`}
    >
      <span className={tone === "danger" && num > 0 ? "text-danger" : "text-text"}>
        {formatPercent(num, den)}
      </span>
      <span className="text-[11px] leading-none text-text-faint">
        {num} / {den}
      </span>
      <span className="h-[3px] w-full overflow-hidden rounded-full bg-border">
        <span
          className={`block h-full origin-left rounded-full transition-transform duration-500 ease-out ${
            tone === "danger" ? "bg-danger" : "bg-accent"
          }`}
          style={{ transform: `scaleX(${share})` }}
        />
      </span>
    </div>
  );
}
