"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Customer } from "@/lib/queries/sales";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { LeadRowActions } from "@/components/leads/LeadRowActions";
import { DownloadIcon, SearchIcon } from "@/components/icons";
import { formatDate, formatMoney, formatMonth } from "@/lib/format";
import { CURRENCIES, CurrencyTotals, DEFAULT_DEAL_CURRENCY, emptyTotals, toCurrency } from "@/lib/currency";

const DAY_MS = 24 * 60 * 60 * 1000;
const NO_SOURCE = "Не вказано";

type Row = Customer & { cycleDays: number; month: string; hasCheck: boolean };
type SortKey = "soldAt" | "name" | "check" | "cycle";

function toRow(c: Customer): Row {
  const sold = new Date(c.soldAt);
  return {
    ...c,
    cycleDays: Math.max(0, Math.round((sold.getTime() - new Date(c.lead.createdAt).getTime()) / DAY_MS)),
    month: c.soldAt.slice(0, 7),
    hasCheck: c.lead.dealValue !== null && Number(c.lead.dealValue) > 0,
  };
}

// Only real handles become links — the field also holds notes like «Ватсап».
function telegramHref(value: string | null) {
  const handle = value?.trim().replace(/^https?:\/\/t\.me\//, "").replace(/^@/, "");
  return handle && /^[A-Za-z0-9_]{4,32}$/.test(handle) ? `https://t.me/${handle}` : null;
}

function phoneHref(value: string | null) {
  const digits = value?.replace(/[^\d+]/g, "");
  return digits && digits.replace(/\D/g, "").length >= 7 ? `tel:${digits}` : null;
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function pluralDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дні";
  return "днів";
}

export function CustomersView({
  customers,
  niches,
  geos,
  methods,
  leadGenSources,
}: {
  customers: Customer[];
  niches: string[];
  geos: string[];
  methods: string[];
  leadGenSources: string[];
}) {
  const all = useMemo(() => customers.map(toRow), [customers]);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [source, setSource] = useState("");
  const [onlyMissingCheck, setOnlyMissingCheck] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("soldAt");
  const [desc, setDesc] = useState(true);

  const months = useMemo(() => [...new Set(all.map((r) => r.month))].sort().reverse(), [all]);
  const sources = useMemo(
    () => [...new Set(all.map((r) => r.lead.leadGenSource ?? NO_SOURCE))].sort((a, b) => a.localeCompare(b, "uk")),
    [all],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter((r) => {
      if (month && r.month !== month) return false;
      if (source && (r.lead.leadGenSource ?? NO_SOURCE) !== source) return false;
      if (onlyMissingCheck && r.hasCheck) return false;
      if (!term) return true;
      return [r.lead.businessName, r.lead.telegram, r.lead.phone, r.lead.instagram, r.lead.niche]
        .some((v) => v?.toLowerCase().includes(term));
    });
  }, [all, search, month, source, onlyMissingCheck]);

  const sorted = useMemo(() => {
    const value = (r: Row): number | string => {
      if (sortKey === "name") return r.lead.businessName.toLowerCase();
      if (sortKey === "check") return r.hasCheck ? Number(r.lead.dealValue) : -1;
      if (sortKey === "cycle") return r.cycleDays;
      return r.soldAt;
    };
    return [...filtered].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      const diff = typeof va === "string" ? va.localeCompare(vb as string, "uk") : va - (vb as number);
      return desc ? -diff : diff;
    });
  }, [filtered, sortKey, desc]);

  const stats = useMemo(() => {
    const revenue = emptyTotals();
    const counts = emptyTotals();
    for (const r of filtered) {
      if (!r.hasCheck) continue;
      const c = toCurrency(r.lead.dealCurrency, DEFAULT_DEAL_CURRENCY);
      revenue[c] += Number(r.lead.dealValue);
      counts[c] += 1;
    }
    const average = emptyTotals();
    for (const c of CURRENCIES) average[c] = counts[c] ? Math.round(revenue[c] / counts[c]) : 0;
    return {
      revenue,
      average,
      withCheck: filtered.filter((r) => r.hasCheck).length,
      cycle: median(filtered.map((r) => r.cycleDays)),
    };
  }, [filtered]);

  const missingCheckTotal = all.filter((r) => !r.hasCheck).length;

  function toggleSort(key: SortKey) {
    if (key === sortKey) setDesc((d) => !d);
    else {
      setSortKey(key);
      setDesc(key !== "name");
    }
  }

  function exportCsv() {
    const header = ["Назва", "Telegram", "Телефон", "Instagram", "Дата продажу", "Чек", "Валюта", "Ніша", "ГЕО", "Метод", "Лідген", "Днів до продажу"];
    const lines = sorted.map((r) => [
      r.lead.businessName,
      r.lead.telegram,
      r.lead.phone,
      r.lead.instagram,
      r.soldAt.slice(0, 10),
      r.hasCheck ? Number(r.lead.dealValue) : "",
      r.hasCheck ? r.lead.dealCurrency : "",
      r.lead.niche,
      r.lead.geo,
      r.lead.leadGenMethod,
      r.lead.leadGenSource,
      r.cycleDays,
    ]);
    const csv = [header, ...lines]
      .map((line) => line.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    // BOM so Excel opens the Cyrillic correctly; Google Sheets ignores it
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prodazhi-${month || "usi"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtersActive = Boolean(search || month || source || onlyMissingCheck);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative flex-1 lg:min-w-[280px] lg:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за назвою, TG, телефоном..."
            className="input w-full pl-9"
          />
        </div>
        <select className="input" aria-label="Місяць продажу" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Усі місяці</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {formatMonth(`${m}-01T00:00:00Z`)}
            </option>
          ))}
        </select>
        <select
          className="input lg:max-w-xs"
          aria-label="Лідген"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="">Усі лідгени</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-pressed={onlyMissingCheck}
          onClick={() => setOnlyMissingCheck((v) => !v)}
          className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft active:opacity-80 ${
            onlyMissingCheck
              ? "border-accent-soft bg-accent-soft text-accent-strong"
              : "border-border text-text-muted hover:bg-surface-2 hover:text-text"
          }`}
        >
          Без чека · {missingCheckTotal}
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={exportCsv}
          disabled={sorted.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft active:opacity-80 disabled:opacity-40"
        >
          <DownloadIcon className="h-4 w-4" />
          Експорт CSV
        </button>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Клієнтів"
          value={filtered.length}
          hint={filtersActive ? `із ${all.length} усього` : "Ліди у статусі «Продаж»"}
          accent
        />
        <KpiCard
          label="Дохід"
          value={stats.withCheck > 0 ? <MoneyLines totals={stats.revenue} /> : "—"}
          hint={
            stats.withCheck < filtered.length
              ? `Чек вказано у ${stats.withCheck} з ${filtered.length}`
              : "Сума всіх чеків"
          }
        />
        <KpiCard
          label="Середній чек"
          value={stats.withCheck > 0 ? <MoneyLines totals={stats.average} /> : "—"}
          hint="Лише угоди з вказаним чеком"
        />
        <KpiCard
          label="Цикл угоди"
          value={stats.cycle !== null ? `${stats.cycle} ${pluralDays(stats.cycle)}` : "—"}
          hint="Медіана: від створення ліда до продажу"
        />
      </section>

      {sorted.length === 0 ? (
        <div className="shadow-elevated rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-sm text-text-muted">
            {all.length === 0 ? "Ще немає жодного продажу." : "За цими фільтрами клієнтів не знайдено."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="shadow-elevated hidden overflow-x-auto rounded-2xl border border-border bg-surface md:block">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-faint">
                  <SortHeader label="Клієнт" active={sortKey === "name"} desc={desc} onClick={() => toggleSort("name")} />
                  <th className="px-4 py-3 font-medium">Контакти</th>
                  <SortHeader label="Дата продажу" active={sortKey === "soldAt"} desc={desc} onClick={() => toggleSort("soldAt")} />
                  <SortHeader label="Чек" active={sortKey === "check"} desc={desc} onClick={() => toggleSort("check")} align="right" />
                  <th className="px-4 py-3 font-medium">Лідген</th>
                  <SortHeader label="Цикл" active={sortKey === "cycle"} desc={desc} onClick={() => toggleSort("cycle")} align="right" />
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((r) => (
                  <tr key={r.lead.id} className="transition-colors duration-200 hover:bg-surface-2">
                    <td className="max-w-[280px] px-4 py-3.5">
                      <Link
                        href={`/leads/${r.lead.id}`}
                        className="block truncate font-medium text-text transition-colors duration-200 hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
                        title={r.lead.businessName}
                      >
                        {r.lead.businessName}
                      </Link>
                      <p className="truncate text-xs text-text-faint">
                        {[r.lead.niche, r.lead.geo].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Contacts telegram={r.lead.telegram} phone={r.lead.phone} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-text-muted">{formatDate(r.soldAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums">
                      <Check row={r} />
                    </td>
                    <td className="max-w-[240px] px-4 py-3.5">
                      <p className="truncate text-text-muted" title={r.lead.leadGenSource ?? undefined}>
                        {r.lead.leadGenSource ?? "—"}
                      </p>
                      {r.lead.leadGenMethod ? (
                        <p className="truncate text-xs text-text-faint">{r.lead.leadGenMethod}</p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums text-text-muted">
                      {r.cycleDays} дн.
                    </td>
                    <td className="px-4 py-3.5">
                      <LeadRowActions lead={r.lead} niches={niches} geos={geos} methods={methods} leadGenSources={leadGenSources} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {sorted.map((r) => (
              <div key={r.lead.id} className="shadow-elevated flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/leads/${r.lead.id}`} className="block truncate font-medium text-text active:opacity-80">
                      {r.lead.businessName}
                    </Link>
                    <p className="truncate text-xs text-text-faint">
                      {formatDate(r.soldAt)} · {r.cycleDays} дн. · {r.lead.leadGenSource ?? "—"}
                    </p>
                  </div>
                  <div className="shrink-0 text-sm tabular-nums">
                    <Check row={r} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Contacts telegram={r.lead.telegram} phone={r.lead.phone} />
                  <LeadRowActions lead={r.lead} niches={niches} geos={geos} methods={methods} leadGenSources={leadGenSources} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SortHeader({
  label,
  active,
  desc,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  desc: boolean;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <th className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-wide transition-colors duration-200 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft active:opacity-80"
      >
        {label}
        {active ? <span className="text-accent">{desc ? "↓" : "↑"}</span> : null}
      </button>
    </th>
  );
}

// One currency per line — a sum like "8 400 ₴ · 1 450 $ · 3 400 €" wraps
// mid-amount at KPI size. Currencies are never added together.
function MoneyLines({ totals }: { totals: CurrencyTotals }) {
  const used = CURRENCIES.filter((c) => totals[c] !== 0);
  if (used.length <= 1) return <>{formatMoney(totals[used[0] ?? DEFAULT_DEAL_CURRENCY], used[0])}</>;
  return (
    <span className="flex flex-col gap-1.5 text-[22px]">
      {used.map((c) => (
        <span key={c} className="whitespace-nowrap">
          {formatMoney(totals[c], c)}
        </span>
      ))}
    </span>
  );
}

function Check({ row }: { row: Row }) {
  if (!row.hasCheck) {
    return <span className="text-xs font-medium text-accent">Чек не вказано</span>;
  }
  return <span className="text-text">{formatMoney(row.lead.dealValue, row.lead.dealCurrency)}</span>;
}

function Contacts({ telegram, phone }: { telegram: string | null; phone: string | null }) {
  const tgHref = telegramHref(telegram);
  const telHref = phoneHref(phone);
  const linkClass =
    "truncate text-text-muted transition-colors duration-200 hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft active:opacity-80";

  if (!telegram && !phone) return <span className="text-text-faint">—</span>;

  return (
    <div className="flex min-w-0 flex-col gap-0.5 text-sm">
      {telegram ? (
        tgHref ? (
          <a href={tgHref} target="_blank" rel="noreferrer" className={linkClass}>
            {telegram.startsWith("@") ? telegram : `@${telegram.replace(/^https?:\/\/t\.me\//, "")}`}
          </a>
        ) : (
          <span className="truncate text-text-muted">{telegram}</span>
        )
      ) : null}
      {phone ? (
        telHref ? (
          <a href={telHref} className={`${linkClass} text-xs`}>
            {phone}
          </a>
        ) : (
          <span className="truncate text-xs text-text-faint">{phone}</span>
        )
      ) : null}
    </div>
  );
}
