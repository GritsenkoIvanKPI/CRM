"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CONVERSION_DIMENSIONS, ConversionDimension, FILTER_PARAMS } from "@/lib/conversion";

const ALL_LABELS: Record<ConversionDimension, string> = {
  leadGenMethod: "Усі методи",
  leadGenSource: "Усі лідгени",
  niche: "Усі ніші",
  geo: "Усі ГЕО",
};

// Order matters: method first — it is the filter most often reached for.
const ORDER: ConversionDimension[] = ["leadGenMethod", "leadGenSource", "niche", "geo"];

export function DimensionFilters({
  options,
  exclude,
}: {
  options: Record<ConversionDimension, { value: string; count: number }[]>;
  // the dimension the table is already grouped by gets no filter
  exclude?: ConversionDimension;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function push(params: URLSearchParams) {
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function setFilter(dimension: ConversionDimension, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(FILTER_PARAMS[dimension], value);
    else params.delete(FILTER_PARAMS[dimension]);
    push(params);
  }

  function reset() {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of Object.values(FILTER_PARAMS)) params.delete(key);
    push(params);
  }

  const dimensions = ORDER.filter((d) => d !== exclude);
  const active = dimensions.some((d) => searchParams.get(FILTER_PARAMS[d]));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {dimensions.map((dimension) => {
        const value = searchParams.get(FILTER_PARAMS[dimension]) ?? "";
        return (
          <select
            key={dimension}
            aria-label={CONVERSION_DIMENSIONS[dimension]}
            className={`input sm:max-w-[240px] ${value ? "border-accent-soft text-accent-strong" : ""}`}
            value={value}
            onChange={(e) => setFilter(dimension, e.target.value)}
          >
            <option value="">{ALL_LABELS[dimension]}</option>
            {options[dimension].map((o) => (
              <option key={o.value} value={o.value}>
                {o.value} · {o.count}
              </option>
            ))}
          </select>
        );
      })}
      {active ? (
        <button
          type="button"
          onClick={reset}
          className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft active:opacity-80"
        >
          Скинути фільтри
        </button>
      ) : null}
    </div>
  );
}
