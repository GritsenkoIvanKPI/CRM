function Pill({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{
        color: `var(${color})`,
        borderColor: `color-mix(in srgb, var(${color}) 35%, transparent)`,
        backgroundColor: `color-mix(in srgb, var(${color}) 14%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `var(${color})` }} />
      {label}
    </span>
  );
}

export function TargetBadge({ isTarget }: { isTarget: boolean | null }) {
  if (isTarget === null) return <Pill color="--color-text-muted" label="Не визначено" />;
  if (!isTarget) return <Pill color="--color-danger" label="Не цільовий лід" />;
  return <Pill color="--color-success" label="Цільовий" />;
}
