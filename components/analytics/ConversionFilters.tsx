"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CONVERSION_DIMENSIONS, ConversionDimension } from "@/lib/conversion";
import { formatMonth } from "@/lib/format";

export function ConversionFilters({
  dimension,
  month,
  months,
}: {
  dimension: ConversionDimension;
  month: string | null;
  months: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-faint">
          Групувати за
        </span>
        {(Object.keys(CONVERSION_DIMENSIONS) as ConversionDimension[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setParam("by", key === "leadGenSource" ? null : key)}
            aria-pressed={dimension === key}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft active:opacity-80 ${
              dimension === key
                ? "border-accent-soft bg-accent-soft text-accent-strong"
                : "border-border text-text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {CONVERSION_DIMENSIONS[key]}
          </button>
        ))}
      </div>

      <select
        className="input sm:w-56"
        aria-label="Місяць"
        value={month ?? ""}
        onChange={(e) => setParam("month", e.target.value || null)}
      >
        <option value="">Усі місяці</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {formatMonth(`${m}-01T00:00:00Z`)}
          </option>
        ))}
      </select>
    </div>
  );
}
