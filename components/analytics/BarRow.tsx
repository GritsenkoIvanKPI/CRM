export function BarRow({
  label,
  sublabel,
  value,
  pct,
  color,
}: {
  label: string;
  sublabel?: string;
  value: string;
  pct: number;
  color: string;
}) {
  const clampedPct = Math.max(Math.min(pct, 100), 0);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate font-medium text-text">{label}</span>
        <span className="shrink-0 tabular-nums text-text-muted">
          {value}
          {sublabel ? (
            <span className="ml-1.5 text-xs text-text-faint">{sublabel}</span>
          ) : null}
        </span>
      </div>
      <div className="h-[10px] w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-r-full transition-[width] duration-500 ease-out"
          style={{ width: `${clampedPct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
