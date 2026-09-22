import { useEffect, useMemo, useState } from "react";
import { formatHours, formatNgMl } from "../lib/format";
import { hoursBetween } from "../lib/pk/simulate";
import type { EstimationResult } from "../lib/pk/types";
import { deriveTimelinePhases, nearestCurvePoint } from "../lib/timeline";

interface Props {
  result: EstimationResult;
  onScrub?: (hoursSinceUse: number) => void;
}

function phaseLabel(hours: number, peakStart: number, peakEnd: number): string {
  if (hours < peakStart) return "Absorption phase";
  if (hours <= peakEnd) return "Near-peak window";
  return "Declining phase";
}

export function Timeline({ result, onScrub }: Props) {
  const { curve, inputs } = result;
  const activityH = hoursBetween(inputs.useTime, inputs.activityTime);
  const bloodDrawH = hoursBetween(inputs.useTime, inputs.bloodDrawTime);
  const horizonH = curve[curve.length - 1]?.hoursSinceUse ?? 1;
  const phases = useMemo(() => deriveTimelinePhases(curve), [curve]);

  const [selectedHour, setSelectedHour] = useState(() => Math.min(Math.max(activityH, 0), horizonH));

  // Re-sync the scrubber to the activity time whenever the underlying case changes.
  useEffect(() => {
    setSelectedHour(Math.min(Math.max(activityH, 0), horizonH));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.useTime, inputs.activityTime]);

  const point = nearestCurvePoint(curve, selectedHour);
  const currentPhase = phaseLabel(selectedHour, phases.peakWindowStartH, phases.peakWindowEndH);

  const move = (hours: number) => {
    const clamped = Math.min(Math.max(hours, 0), horizonH);
    setSelectedHour(clamped);
    onScrub?.(clamped);
  };

  const pct = (h: number) => `${(Math.min(Math.max(h, 0), horizonH) / horizonH) * 100}%`;

  return (
    <div>
      <div className="relative mt-6 mb-8">
        {/* Phase track */}
        <div className="flex h-2.5 overflow-hidden rounded-full">
          <div style={{ width: pct(phases.peakWindowStartH) }} className="bg-[var(--series-3)]/50" />
          <div
            style={{ width: `calc(${pct(phases.peakWindowEndH)} - ${pct(phases.peakWindowStartH)})` }}
            className="bg-[var(--series-1)]"
          />
          <div className="flex-1 bg-[var(--border-hairline)]" />
        </div>

        {/* Event ticks: use / T1 / T2 */}
        <div className="relative h-9">
          <TickMark leftPct={pct(0)} label="Use" />
          <TickMark leftPct={pct(activityH)} label="T1" emphasis />
          {bloodDrawH >= 0 && bloodDrawH <= horizonH && <TickMark leftPct={pct(bloodDrawH)} label="T2" emphasis />}
        </div>

        {/* Scrubber */}
        <input
          type="range"
          min={0}
          max={horizonH}
          step={horizonH / 300 || 0.01}
          value={selectedHour}
          onChange={(e) => move(Number(e.target.value))}
          aria-label="Scrub through time since use to see the estimate at that moment"
          className="mt-1 w-full accent-[var(--brand)]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => move(0)}
          className="rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-[var(--text-secondary)] hover:bg-[var(--surface-page)]"
        >
          Jump to use
        </button>
        <button
          type="button"
          onClick={() => move(activityH)}
          className="rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-[var(--text-secondary)] hover:bg-[var(--surface-page)]"
        >
          Jump to T1 (activity)
        </button>
        {bloodDrawH >= 0 && bloodDrawH <= horizonH && (
          <button
            type="button"
            onClick={() => move(bloodDrawH)}
            className="rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-[var(--text-secondary)] hover:bg-[var(--surface-page)]"
          >
            Jump to T2 (blood draw)
          </button>
        )}
      </div>

      <div className="mt-4 rounded-md bg-[var(--surface-page)] p-3 text-sm">
        <div className="font-medium text-[var(--text-primary)]">
          {formatHours(selectedHour)} after use — {currentPhase}
        </div>
        {point && (
          <div className="mt-1 text-[var(--text-secondary)]">
            Modelled estimate: ≈ {formatNgMl(point.band.p50)} ng/mL (50% range {formatNgMl(point.band.p25)}–
            {formatNgMl(point.band.p75)}; 90% range {formatNgMl(point.band.p05)}–{formatNgMl(point.band.p95)})
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--text-secondary)]">
        <LegendSwatch color="var(--series-3)" opacity={0.5} label="Absorption phase" />
        <LegendSwatch color="var(--series-1)" opacity={1} label="Near-peak window (within 90% of the modelled peak)" />
        <LegendSwatch color="var(--border-hairline)" opacity={1} label="Declining phase" />
      </div>
    </div>
  );
}

function TickMark({ leftPct, label, emphasis }: { leftPct: string; label: string; emphasis?: boolean }) {
  return (
    <div className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: leftPct }}>
      <div className={`h-2 w-px ${emphasis ? "bg-[var(--text-secondary)]" : "bg-[var(--text-muted)]"}`} />
      <div className={`mt-0.5 text-[10px] ${emphasis ? "font-medium text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}`}>
        {label}
      </div>
    </div>
  );
}

function LegendSwatch({ color, opacity, label }: { color: string; opacity: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color, opacity }} />
      {label}
    </span>
  );
}
