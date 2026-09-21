/**
 * Monte Carlo forward simulation + Sampling-Importance-Resampling (SIR)
 * calibration against a measured T2 blood concentration, when available.
 *
 * Why SIR rather than a single deterministic back-calculation: a classic
 * "back-extrapolation" (take one published half-life, run the clock
 * backwards from the measured value) collapses all of the genuine
 * inter-individual and situational uncertainty into a single number, which
 * both overstates precision and hides how sensitive the result is to the
 * half-life you picked. Instead: draw many plausible parameter sets from
 * the literature-informed priors (`sampleParameters.ts`), simulate the
 * full concentration-time curve implied by each, and — if a measured
 * concentration at T2 exists — reweight each simulated curve by how well
 * it would have predicted that measurement. What remains is a posterior
 * distribution over "what the concentration plausibly was" at any time,
 * including the driving time T1, that is *consistent both* with the
 * literature and with the case's own measured data point.
 */

import { concentrationSeries } from "./model";
import { effectiveSampleSize, mulberry32, weightedQuantile } from "./random";
import { samplePkParameters } from "./sampleParameters";
import type { CaseInputs, CurvePoint, PkParameterSample, QuantileBand } from "./types";

const MS_PER_HOUR = 1000 * 60 * 60;

export function hoursBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / MS_PER_HOUR;
}

function buildTimeGrid(horizonH: number, points = 180): number[] {
  const grid: number[] = [];
  for (let i = 0; i <= points; i++) {
    grid.push((horizonH * i) / points);
  }
  return grid;
}

function quantileBandAt(
  timeIndex: number,
  allSeries: number[][],
  weights: number[],
): QuantileBand {
  const values = allSeries.map((series) => series[timeIndex]);
  return {
    p05: weightedQuantile(values, weights, 0.05),
    p25: weightedQuantile(values, weights, 0.25),
    p50: weightedQuantile(values, weights, 0.5),
    p75: weightedQuantile(values, weights, 0.75),
    p95: weightedQuantile(values, weights, 0.95),
  };
}

/** Lognormal likelihood density (up to a constant) of observing `measured` given a simulated `predicted` mean and CV. */
function lognormalLikelihood(measured: number, predicted: number, cv: number): number {
  if (predicted <= 1e-6) {
    return measured <= 0.05 ? 1 : 1e-9;
  }
  const sigma = Math.sqrt(Math.log(1 + cv * cv));
  const logRatio = Math.log(measured / predicted);
  return Math.exp(-(logRatio * logRatio) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
}

export interface RawSimulationOutput {
  timesH: number[];
  allSeries: number[][];
  weights: number[];
  paramSets: PkParameterSample[];
  effSize: number | null;
  calibrated: boolean;
}

/**
 * Run the Monte Carlo simulation for a set of case inputs and return the
 * raw (weighted) ensemble of curves, without yet condensing to summary
 * quantiles — used both for the main result and for sensitivity re-runs.
 */
export function runSimulation(inputs: CaseInputs, seed = 20240521): RawSimulationOutput {
  const rng = mulberry32(seed);
  const n = Math.max(200, Math.min(20000, Math.round(inputs.sampleSize)));

  const activityH = hoursBetween(inputs.useTime, inputs.activityTime);
  const bloodDrawH = hoursBetween(inputs.useTime, inputs.bloodDrawTime);
  const horizonH = Math.max(activityH, bloodDrawH, 1) * 1.15 + 1;

  const timesH = buildTimeGrid(horizonH);

  const paramSets: PkParameterSample[] = [];
  const allSeries: number[][] = [];
  for (let i = 0; i < n; i++) {
    const params = samplePkParameters(inputs, rng);
    paramSets.push(params);
    allSeries.push(concentrationSeries(params, timesH));
  }

  let weights = new Array(n).fill(1);
  let effSize: number | null = null;
  const calibrated = inputs.measuredConcentrationNgMl != null && inputs.measuredConcentrationNgMl >= 0;

  if (calibrated) {
    const measured = inputs.measuredConcentrationNgMl as number;
    // Nearest grid index to the blood-draw time.
    let bloodDrawIndex = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < timesH.length; i++) {
      const diff = Math.abs(timesH[i] - bloodDrawH);
      if (diff < bestDiff) {
        bestDiff = diff;
        bloodDrawIndex = i;
      }
    }
    const cv = Math.max(0.05, inputs.measurementCv || 0.2);
    weights = allSeries.map((series) => lognormalLikelihood(measured, series[bloodDrawIndex], cv));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight > 0) {
      weights = weights.map((w) => w / totalWeight);
    } else {
      weights = new Array(n).fill(1 / n);
    }
    effSize = effectiveSampleSize(weights.map((w) => w * n));
  }

  return { timesH, allSeries, weights, paramSets, effSize, calibrated };
}

export function summarizeCurve(sim: RawSimulationOutput, useTimeIso: string): CurvePoint[] {
  return sim.timesH.map((t, i) => ({
    hoursSinceUse: t,
    isoTime: new Date(new Date(useTimeIso).getTime() + t * MS_PER_HOUR).toISOString(),
    band: quantileBandAt(i, sim.allSeries, sim.weights),
  }));
}

export function bandAtHours(sim: RawSimulationOutput, hoursSinceUse: number): QuantileBand {
  let bestIndex = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < sim.timesH.length; i++) {
    const diff = Math.abs(sim.timesH[i] - hoursSinceUse);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }
  return quantileBandAt(bestIndex, sim.allSeries, sim.weights);
}
