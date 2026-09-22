import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { UK_THC_SPECIFIED_LIMIT_NG_ML } from "../lib/defaults";
import { formatHours, formatHoursCompact, formatNgMl } from "../lib/format";
import { hoursBetween } from "../lib/pk/simulate";
import type { EstimationResult } from "../lib/pk/types";

interface Props {
  result: EstimationResult;
  /** Elapsed hours since use to mark on the chart, e.g. from the Timeline scrubber. Omit for no marker. */
  selectedHoursSinceUse?: number;
}

function TooltipContent({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--surface-1)] px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-[var(--text-primary)]">{formatHours(Number(label))} after use</div>
      <div className="mt-1 space-y-0.5 text-[var(--text-secondary)]">
        <div>Median: {formatNgMl(row.p50)} ng/mL</div>
        <div>
          50% interval: {formatNgMl(row.p25)}–{formatNgMl(row.p75)} ng/mL
        </div>
        <div>
          90% interval: {formatNgMl(row.p05)}–{formatNgMl(row.p95)} ng/mL
        </div>
      </div>
    </div>
  );
}

export function ConcentrationChart({ result, selectedHoursSinceUse }: Props) {
  const { inputs, curve } = result;
  const activityH = hoursBetween(inputs.useTime, inputs.activityTime);
  const bloodDrawH = hoursBetween(inputs.useTime, inputs.bloodDrawTime);

  const data = curve.map((p) => ({
    hoursSinceUse: Math.round(p.hoursSinceUse * 100) / 100,
    p05: p.band.p05,
    p25: p.band.p25,
    p50: p.band.p50,
    p75: p.band.p75,
    p95: p.band.p95,
    bandOuter: Math.max(0, p.band.p95 - p.band.p05),
    bandInner: Math.max(0, p.band.p75 - p.band.p25),
  }));

  const scrubPoint =
    selectedHoursSinceUse != null
      ? data.reduce((best, d) => (Math.abs(d.hoursSinceUse - selectedHoursSinceUse) < Math.abs(best.hoursSinceUse - selectedHoursSinceUse) ? d : best), data[0])
      : null;

  const rawMaxY = Math.max(...data.map((d) => d.p95), UK_THC_SPECIFIED_LIMIT_NG_ML) * 1.1;
  const tickStep = Math.pow(10, Math.floor(Math.log10(Math.max(rawMaxY, 1)))) / 2 || 1;
  const maxY = Math.ceil(rawMaxY / tickStep) * tickStep;

  // Fixed, small tick count so labels never crowd on a narrow (phone-width) chart.
  const horizonH = data[data.length - 1]?.hoursSinceUse ?? 1;
  const xTicks = Array.from({ length: 5 }, (_, i) => Math.round(((horizonH * i) / 4) * 100) / 100);

  return (
    <div>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={data} margin={{ top: 26, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="var(--border-hairline)" vertical={false} />
          <XAxis
            dataKey="hoursSinceUse"
            type="number"
            domain={[0, horizonH]}
            ticks={xTicks}
            interval={0}
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            tickFormatter={(h) => formatHoursCompact(h)}
            label={{ value: "Time since use", position: "insideBottom", offset: -6, fill: "var(--text-muted)", fontSize: 12 }}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            tickFormatter={(v) => formatNgMl(Number(v))}
            domain={[0, maxY]}
            label={{ value: "THC, ng/mL", angle: -90, position: "insideLeft", fill: "var(--text-muted)", fontSize: 12 }}
          />
          <Tooltip content={<TooltipContent />} />

          <Area dataKey="p05" stackId="outer" stroke="none" fill="transparent" isAnimationActive={false} />
          <Area
            dataKey="bandOuter"
            stackId="outer"
            stroke="none"
            fill="var(--series-1)"
            fillOpacity={0.12}
            isAnimationActive={false}
            name="90% credible interval"
          />
          <Area dataKey="p25" stackId="inner" stroke="none" fill="transparent" isAnimationActive={false} />
          <Area
            dataKey="bandInner"
            stackId="inner"
            stroke="none"
            fill="var(--series-1)"
            fillOpacity={0.28}
            isAnimationActive={false}
            name="50% credible interval"
          />
          <Line
            dataKey="p50"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Median estimate"
          />

          <ReferenceLine
            x={Math.round(activityH * 100) / 100}
            stroke="var(--text-secondary)"
            strokeDasharray="4 3"
            label={{ value: "T1", position: "top", fill: "var(--text-secondary)", fontSize: 11 }}
          />
          <ReferenceLine
            x={Math.round(bloodDrawH * 100) / 100}
            stroke="var(--text-secondary)"
            strokeDasharray="4 3"
            label={{ value: "T2", position: "top", fill: "var(--text-secondary)", fontSize: 11 }}
          />
          {inputs.measuredConcentrationNgMl != null && (
            <ReferenceDot
              x={Math.round(bloodDrawH * 100) / 100}
              y={inputs.measuredConcentrationNgMl}
              r={5}
              fill="var(--series-2)"
              stroke="var(--surface-1)"
              strokeWidth={2}
            />
          )}
          <ReferenceLine y={UK_THC_SPECIFIED_LIMIT_NG_ML} stroke="var(--text-muted)" strokeDasharray="2 4" />
          {scrubPoint && (
            <ReferenceDot x={scrubPoint.hoursSinceUse} y={scrubPoint.p50} r={4} fill="var(--series-4)" stroke="var(--surface-1)" strokeWidth={1.5} />
          )}
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--series-1)", opacity: 0.9 }} />
          Median estimate
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--series-1)", opacity: 0.28 }} />
          50% credible interval
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--series-1)", opacity: 0.12 }} />
          90% credible interval
        </span>
        {inputs.measuredConcentrationNgMl != null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--series-2)" }} />
            Measured lab value at T2
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-0 w-3.5 border-t-2 border-dotted"
            style={{ borderColor: "var(--text-muted)" }}
          />
          UK specified limit (2 µg/L) — context only, not a compliance determination
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">T1 = time of driving/activity. T2 = time of blood collection.</p>
    </div>
  );
}
