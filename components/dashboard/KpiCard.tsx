import { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`shadow-elevated relative overflow-hidden rounded-2xl border p-5 ${
        accent
          ? "border-accent-soft bg-gradient-to-br from-accent-soft to-surface"
          : "border-border bg-surface"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
        {label}
      </p>
      <p className="font-display mt-2 text-[28px] leading-none tracking-tight text-text">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs leading-relaxed text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
