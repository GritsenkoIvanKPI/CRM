"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  CONVERSION_DIMENSIONS,
  ConversionDimension,
  FILTER_PARAMS,
} from "@/lib/conversion";
import { formatMonth } from "@/lib/format";

const ALL_LABELS: Record<ConversionDimension, string> = {
  leadGenMethod: "Усі методи",
  leadGenSource: "Усі лідгени",
  niche: "Усі ніші",
  geo: "Усі ГЕО",
};

type Option = { value: string; count: number };

// One row of controls for the analytics tabs: optional grouping pills, the
// lead-gen filters, optional month. Everything lives in the URL.
export function ConversionFilters({
  dimension,
  filterBy,
  options,
  months,
}: {
  dimension?: ConversionDimension;
  filterBy: ConversionDimension[];
  options: Record<ConversionDimension, Option[]>;
  months?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const shownFilters = filterBy.filter((d) => d !== dimension);
  const month = searchParams.get("month") ?? "";
  const active = month || shownFilters.some((d) => searchParams.get(FILTER_PARAMS[d]));

  function reset() {
    const changes: Record<string, null> = { month: null };
    for (const d of filterBy) changes[FILTER_PARAMS[d]] = null;
    update(changes);
  }

  const pill = (on: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft active:opacity-80 ${
      on
        ? "border-accent-soft bg-accent-soft text-accent-strong"
        : "border-border text-text-muted hover:bg-surface-2 hover:text-text"
    }`;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      {dimension ? (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Групувати за">
          {(Object.keys(CONVERSION_DIMENSIONS) as ConversionDimension[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={dimension === key}
              onClick={() =>
                update({ by: key === "leadGenSource" ? null : key, [FILTER_PARAMS[key]]: null })
              }
              className={pill(dimension === key)}
            >
              {CONVERSION_DIMENSIONS[key]}
            </button>
          ))}
          <span className="mx-2 hidden h-6 w-px bg-border lg:block" aria-hidden />
        </div>
      ) : null}

      {shownFilters.map((d) => {
        const value = searchParams.get(FILTER_PARAMS[d]) ?? "";
        return (
          <select
            key={d}
            aria-label={CONVERSION_DIMENSIONS[d]}
            className={`input lg:max-w-[220px] ${value ? "border-accent-soft text-accent-strong" : ""}`}
            value={value}
            onChange={(e) => update({ [FILTER_PARAMS[d]]: e.target.value || null })}
          >
            <option value="">{ALL_LABELS[d]}</option>
            {options[d].map((o) => (
              <option key={o.value} value={o.value}>
                {o.value} · {o.count}
              </option>
            ))}
          </select>
        );
      })}

      {months ? (
        <select
          aria-label="Місяць"
          className={`input lg:w-48 ${month ? "border-accent-soft text-accent-strong" : ""}`}
          value={month}
          onChange={(e) => update({ month: e.target.value || null })}
        >
          <option value="">Усі місяці</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {formatMonth(`${m}-01T00:00:00Z`)}
            </option>
          ))}
        </select>
      ) : null}

      {active ? (
        <button
          type="button"
          onClick={reset}
          className="self-start rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft active:opacity-80 lg:self-auto"
        >
          Скинути
        </button>
      ) : null}
    </div>
  );
}
