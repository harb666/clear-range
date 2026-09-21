import {
  BASE_DOSE_TO_CONCENTRATION,
  DOSE_TO_CONCENTRATION_CV,
  REFERENCE_BODY_WEIGHT_KG,
  ROUTE_PRIORS,
  SEX_KSLOW_MULTIPLIER,
  USE_PATTERN_PRIORS,
} from "./parameters";
import { sampleLognormalFromMedianCv, sampleUniform } from "./random";
import type { CaseInputs, PkParameterSample } from "./types";

/** Nominal mg THC content in the consumed material/dose, before bioavailability. */
function nominalDoseMg(inputs: CaseInputs): number {
  if (inputs.method === "oral-edible") {
    return Math.max(inputs.doseMg, 0);
  }
  return Math.max(inputs.amountGrams, 0) * 1000 * (Math.max(inputs.potencyPercent, 0) / 100);
}

/**
 * Draw one plausible PK parameter set consistent with the case inputs.
 * This is the prior — before any calibration against a measured T2 value.
 */
export function samplePkParameters(inputs: CaseInputs, rng: () => number): PkParameterSample {
  const route = ROUTE_PRIORS[inputs.method];
  const usePattern = USE_PATTERN_PRIORS[inputs.usePattern];
  const nominalMg = nominalDoseMg(inputs);

  const bioavailability = Math.min(
    0.95,
    sampleLognormalFromMedianCv(rng, route.bioavailabilityMedian, route.bioavailabilityCv, 0.2, 3),
  );
  const absorbedDoseMg = nominalMg * bioavailability;

  const ka = sampleLognormalFromMedianCv(rng, route.kaMedian, route.kaCv, 0.3, 3);
  const lagH = Math.max(0, sampleLognormalFromMedianCv(rng, Math.max(route.lagMedianH, 0.005), route.lagCv, 0.2, 4));

  const weightAdjustment = REFERENCE_BODY_WEIGHT_KG / Math.max(inputs.bodyWeightKg, 30);
  const doseToConcentrationBase = sampleLognormalFromMedianCv(
    rng,
    BASE_DOSE_TO_CONCENTRATION,
    DOSE_TO_CONCENTRATION_CV,
    0.25,
    4,
  );
  const doseToConcentration = doseToConcentrationBase * usePattern.concentrationScaleMultiplier * weightAdjustment;

  const kFast = sampleLognormalFromMedianCv(rng, usePattern.kFastMedian, usePattern.kFastCv, 0.2, 4);
  const fastFraction = Math.min(
    0.97,
    Math.max(0.35, sampleLognormalFromMedianCv(rng, usePattern.fastFractionMedian, usePattern.fastFractionCv, 0.4, 1.3)),
  );
  const sexMultiplier = SEX_KSLOW_MULTIPLIER[inputs.sex];
  const kSlow = sampleLognormalFromMedianCv(rng, usePattern.kSlowMedian * sexMultiplier, usePattern.kSlowCv, 0.15, 5);

  // Small independent jitter representing residual model-structure
  // uncertainty not otherwise captured (e.g. smoking topography variability).
  const jitter = sampleUniform(rng, 0.92, 1.08);

  return {
    absorbedDoseMg: absorbedDoseMg * jitter,
    ka,
    lagH,
    doseToConcentration,
    kFast,
    fastFraction,
    kSlow,
  };
}
