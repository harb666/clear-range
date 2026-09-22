import { MODEL_VERSION } from "./parameters";
import { runSensitivity } from "./sensitivity";
import { bandAtHours, hoursBetween, runSimulation, summarizeCurve } from "./simulate";
import type { CaseInputs, EstimationResult } from "./types";

function calibrationFitFrom(effSize: number | null, n: number): EstimationResult["calibrationFit"] {
  if (effSize == null) return "not-applicable";
  const ratio = effSize / n;
  if (ratio > 0.05) return "good";
  if (ratio > 0.005) return "moderate";
  return "poor";
}

function buildWarnings(inputs: CaseInputs, calibrationFit: EstimationResult["calibrationFit"]): string[] {
  const warnings: string[] = [];
  const activityH = hoursBetween(inputs.useTime, inputs.activityTime);
  const bloodDrawH = hoursBetween(inputs.useTime, inputs.bloodDrawTime);

  if (activityH < 0) {
    warnings.push("The activity time is before the recorded use time — check the entered times.");
  }
  if (bloodDrawH < activityH) {
    warnings.push("The blood draw time is before the activity time — the measured value cannot help estimate concentration at the activity time in that case.");
  }
  if (bloodDrawH > 48) {
    warnings.push(
      "The blood draw was more than 48 hours after use. Terminal-phase kinetics are the least well characterised part of this model, especially for frequent users, so treat this estimate with additional caution.",
    );
  }
  if (calibrationFit === "poor") {
    warnings.push(
      "The measured concentration is difficult to reconcile with the other inputs under this model's priors (very low effective sample size). Consider that the amount, potency, timing, or use-pattern inputs may be inaccurate, or that individual physiology falls outside the modelled range.",
    );
  }
  if (inputs.usePattern === "frequent") {
    warnings.push(
      "Frequent/daily users can retain measurable THC from previous, unrelated use. This model does not separately account for a pre-existing baseline from prior sessions, which can bias the reconstructed curve for this specific use event.",
    );
  }
  return warnings;
}

export function estimate(inputs: CaseInputs): EstimationResult {
  const sim = runSimulation(inputs);
  const activityH = hoursBetween(inputs.useTime, inputs.activityTime);
  const bloodDrawH = hoursBetween(inputs.useTime, inputs.bloodDrawTime);

  const calibrationFit = calibrationFitFrom(sim.effSize, sim.allSeries.length);

  return {
    modelVersion: MODEL_VERSION,
    inputs,
    calibrated: sim.calibrated,
    effectiveSampleSize: sim.effSize,
    calibrationFit,
    curve: summarizeCurve(sim, inputs.useTime),
    atActivityTime: bandAtHours(sim, activityH),
    atBloodDrawTime: bandAtHours(sim, bloodDrawH),
    sensitivity: runSensitivity(inputs),
    warnings: buildWarnings(inputs, calibrationFit),
  };
}
