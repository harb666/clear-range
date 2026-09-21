/**
 * Forward pharmacokinetic model: given one sampled parameter set, compute
 * whole-blood THC concentration (ng/mL) at any elapsed time since use.
 *
 * Structure: first-order absorption (with lag) feeding a two-phase
 * (fast distribution + slow terminal) exponential decline. This is a
 * simplified, forensic-timescale-appropriate stand-in for the
 * multi-compartment models reported in the literature (see citations.ts) —
 * adequate for representing the shape and uncertainty of the curve over
 * the minutes-to-~48h window relevant to a driving/blood-draw scenario, not
 * a claim of mechanistic completeness.
 */

import type { PkParameterSample } from "./types";

/**
 * Concentration at elapsed time `tHours` since use.
 *
 * For t < lag: zero.
 * For lag <= t: a Bateman-like absorption rising to a peak, then a
 * two-exponential decline referenced from the peak (not from t=0), so the
 * fast/slow split describes the post-peak elimination phases as reported
 * in the literature rather than the absorption phase itself.
 */
export function concentrationAt(params: PkParameterSample, tHours: number): number {
  const { absorbedDoseMg, ka, lagH, doseToConcentration, kFast, fastFraction, kSlow } = params;
  const t = tHours - lagH;
  if (t <= 0) return 0;

  // Theoretical instantaneous-input peak scale (what the compartment would
  // reach if elimination did not compete with absorption at all).
  const peakScale = absorbedDoseMg * doseToConcentration;

  // Fraction of the dose absorbed by time t (first-order absorption).
  const fractionAbsorbed = 1 - Math.exp(-ka * t);

  // Post-absorption decline shape: a weighted sum of a fast and a slow
  // exponential, both anchored so their sum is 1 at t=0 (i.e. right when
  // material has notionally arrived), which combined with fractionAbsorbed
  // produces a realistic rapid-rise-then-decline curve without a separate
  // free-standing peak-detection step.
  const declineShape = fastFraction * Math.exp(-kFast * t) + (1 - fastFraction) * Math.exp(-kSlow * t);

  return peakScale * fractionAbsorbed * declineShape;
}

/** Convenience: evaluate a curve across an array of elapsed hours. */
export function concentrationSeries(params: PkParameterSample, timesH: number[]): number[] {
  return timesH.map((t) => concentrationAt(params, t));
}
