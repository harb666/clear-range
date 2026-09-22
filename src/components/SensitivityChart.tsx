import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNgMl } from "../lib/format";
import type { SensitivityRow } from "../lib/pk/types";

interface Props {
  rows: SensitivityRow[];
}

function TooltipContent({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload as SensitivityRow & { rangeLow: number; rangeHigh: number };
  return (
    <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--surface-1)] px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-[var(--text-primary)]">{row.inputLabel}</div>
      <div className="mt-1 space-y-0.5 text-[var(--text-secondary)]">
        <div>
          {row.lowLabel}: {formatNgMl(row.low)} ng/mL
        </div>
        <div>Given value: {formatNgMl(row.base)} ng/mL</div>
        <div>
          {row.highLabel}: {formatNgMl(row.high)} ng/mL
        </div>
      </div>
    </div>
  );
}

export function SensitivityChart({ rows }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // A narrow (phone-width) card needs a narrower label column so the bars
  // themselves stay legible, at the cost of more label wrapping.
  const labelWidth = Math.round(Math.min(220, Math.max(110, containerWidth * 0.38)));

  const prepared = rows
    .map((r) => ({
      ...r,
      rangeLow: Math.min(r.low, r.high, r.base),
      rangeHigh: Math.max(r.low, r.high, r.base),
    }))
    .map((r) => ({ ...r, span: r.rangeHigh - r.rangeLow }))
    .sort((a, b) => b.span - a.span);

  const height = Math.max(160, prepared.length * 54);

  return (
    <div ref={containerRef}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={prepared} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="var(--border-hairline)" horizontal={false} />
          <XAxis
            type="number"
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="inputLabel"
            width={labelWidth}
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          />
          <Tooltip content={<TooltipContent />} cursor={{ fill: "var(--border-hairline)", opacity: 0.4 }} />
          <Bar dataKey="rangeLow" stackId="tornado" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="span" stackId="tornado" radius={4} isAnimationActive={false}>
            {prepared.map((_, i) => (
              <Cell key={i} fill="var(--series-3)" fillOpacity={0.55} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Horizontal axis: median THC at T1, ng/mL. Each bar spans the estimate produced by the labelled low/high alternative for
        that single input, holding everything else fixed — longer bars mean the result is more sensitive to that assumption.
      </p>
    </div>
  );
}
