export function formatNgMl(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value < 1) return value.toFixed(2);
  if (value < 10) return value.toFixed(1);
  return value.toFixed(0);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`;
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins === 0 ? `${whole} h` : `${whole} h ${mins} min`;
}

/** Compact form for tight spaces (chart axis ticks): "45m", "1.5h", "6h". */
export function formatHoursCompact(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  const rounded = Math.round(h * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded.toFixed(1)}h`;
}
