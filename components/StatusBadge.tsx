import { LeadStatus, STATUS_LABELS, STATUS_COLOR_VAR } from "@/lib/status";

export function StatusBadge({ status }: { status: LeadStatus }) {
  const colorVar = STATUS_COLOR_VAR[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{
        color: `var(${colorVar})`,
        borderColor: `color-mix(in srgb, var(${colorVar}) 35%, transparent)`,
        backgroundColor: `color-mix(in srgb, var(${colorVar}) 14%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: `var(${colorVar})` }}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
