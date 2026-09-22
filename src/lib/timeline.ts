/**
 * Visualisation-layer helper: derives labelled phases (absorption window,
 * peak window) from an already-computed result curve, purely for drawing
 * the timeline. This is presentation logic, not part of the PK model
 * itself — it doesn't change any concentration value, it only picks out
 * where on the existing median curve to draw phase boundaries.
 */
import type { CurvePoint } from "./pk/types";

export interface TimelinePhases {
  /** Elapsed hours since use at which the median (p50) curve reaches its highest point. */
  peakHoursSinceUse: number;
  /** Start of the "near-peak" window: first time the median curve reaches 90% of its peak value. */
  peakWindowStartH: number;
  /** End of the "near-peak" window: last time the median curve is still at or above 90% of its peak value. */
  peakWindowEndH: number;
}

export function deriveTimelinePhases(curve: CurvePoint[]): TimelinePhases {
  if (curve.length === 0) {
    return { peakHoursSinceUse: 0, peakWindowStartH: 0, peakWindowEndH: 0 };
  }

  let peakIndex = 0;
  for (let i = 1; i < curve.length; i++) {
    if (curve[i].band.p50 > curve[peakIndex].band.p50) peakIndex = i;
  }
  const peakValue = curve[peakIndex].band.p50;
  const threshold = peakValue * 0.9;

  let startIndex = peakIndex;
  for (let i = 0; i <= peakIndex; i++) {
    if (curve[i].band.p50 >= threshold) {
      startIndex = i;
      break;
    }
  }
  let endIndex = peakIndex;
  for (let i = curve.length - 1; i >= peakIndex; i--) {
    if (curve[i].band.p50 >= threshold) {
      endIndex = i;
      break;
    }
  }

  return {
    peakHoursSinceUse: curve[peakIndex].hoursSinceUse,
    peakWindowStartH: curve[startIndex].hoursSinceUse,
    peakWindowEndH: curve[endIndex].hoursSinceUse,
  };
}

/** Nearest curve point to a given elapsed-hours position — used by the timeline scrubber readout. */
export function nearestCurvePoint(curve: CurvePoint[], hoursSinceUse: number): CurvePoint | null {
  if (curve.length === 0) return null;
  let best = curve[0];
  let bestDiff = Math.abs(curve[0].hoursSinceUse - hoursSinceUse);
  for (const point of curve) {
    const diff = Math.abs(point.hoursSinceUse - hoursSinceUse);
    if (diff < bestDiff) {
      best = point;
      bestDiff = diff;
    }
  }
  return best;
}
