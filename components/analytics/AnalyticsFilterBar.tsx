"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DateRangePreset } from "@/lib/queries/analytics";

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "all", label: "За весь час" },
  { value: "30d", label: "Останні 30 днів" },
  { value: "90d", label: "Останні 90 днів" },
  { value: "year", label: "Цей рік" },
];

export function AnalyticsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("range") as DateRangePreset) ?? "all";

  function setRange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("range");
    } else {
      params.set("range", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          type="button"
          onClick={() => setRange(preset.value)}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 ${
            current === preset.value
              ? "border-accent-soft bg-accent-soft text-accent-strong"
              : "border-border text-text-muted hover:bg-surface-2 hover:text-text"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
