/**
 * "Explain this result": turns the actual simulation ensemble into an
 * auditable, per-factor account of how the case inputs produced the
 * headline estimate. Every number here is read directly off
 * `RawSimulationOutput` (the same weighted Monte Carlo draws used for the
 * credible intervals) — nothing is invented for display purposes, and
 * nothing here is computed a second time with different logic than the
 * engine actually used.
 */
import { formatHours } from "../format";
import { ROUTE_DESCRIPTIONS, ROUTE_PRIORS, SEX_KSLOW_MULTIPLIER, USE_PATTERN_DESCRIPTIONS } from "./parameters";
import { weightedQuantile } from "./random";
import { hoursBetween, type RawSimulationOutput } from "./simulate";
import type { CaseInputs, ExplanationFactor } from "./types";

function formatMg(mg: number): string {
  if (!Number.isFinite(mg)) return "—";
  return mg < 10 ? `${mg.toFixed(1)} mg` : `${mg.toFixed(0)} mg`;
}

function weightedRange(values: number[], weights: number[], loQ: number, hiQ: number) {
  return { low: weightedQuantile(values, weights, loQ), high: weightedQuantile(values, weights, hiQ) };
}

export function buildExplanation(inputs: CaseInputs, sim: RawSimulationOutput): ExplanationFactor[] {
  const factors: ExplanationFactor[] = [];
  const activityH = hoursBetween(inputs.useTime, inputs.activityTime);
  const bloodDrawH = hoursBetween(inputs.useTime, inputs.bloodDrawTime);
  const { paramSets, weights } = sim;

  factors.push({
    key: "timing",
    label: "Time since consumption",
    value: `${formatHours(Math.max(activityH, 0))} to the activity time · ${formatHours(Math.max(bloodDrawH, 0))} to blood collection`,
    detail:
      "Modelled concentration falls fastest in the first couple of hours after use, then declines more slowly. The estimate is most sensitive to timing when the activity time is close to the use time, and least sensitive once several half-lives have passed.",
  });

  const absorbedDoses = paramSets.map((p) => p.absorbedDoseMg);
  const doseRange = weightedRange(absorbedDoses, weights, 0.1, 0.9);
  const route = ROUTE_PRIORS[inputs.method];
  factors.push({
    key: "dose",
    label: "Estimated absorbed dose",
    value: `≈ ${formatMg(doseRange.low)}–${formatMg(doseRange.high)} reaching the bloodstream (80% range)`,
    detail: `Derived from the amount/potency (or labelled edible dose) entered, scaled by an assumed ${Math.round(route.bioavailabilityMedian * 100)}% average bioavailability for this route with substantial modelled variability (±${Math.round(route.bioavailabilityCv * 100)}% CV) — actual absorption efficiency varies a great deal between people, sessions, and how the dose/potency was itself estimated.`,
  });

  factors.push({
    key: "route",
    label: "Route of administration",
    value: METHOD_SHORT[inputs.method],
    detail: ROUTE_DESCRIPTIONS[inputs.method],
  });

  factors.push({
    key: "frequency",
    label: "Frequency / pattern of use",
    value: USE_PATTERN_SHORT[inputs.usePattern],
    detail: USE_PATTERN_DESCRIPTIONS[inputs.usePattern],
  });

  const kFasts = paramSets.map((p) => Math.log(2) / p.kFast);
  const kSlows = paramSets.map((p) => Math.log(2) / p.kSlow);
  const fastRange = weightedRange(kFasts, weights, 0.25, 0.75);
  const slowRange = weightedRange(kSlows, weights, 0.25, 0.75);
  factors.push({
    key: "elimination",
    label: "Elimination assumptions",
    value: `fast phase ≈ ${formatHours(fastRange.low)}–${formatHours(fastRange.high)} half-life, then a slower phase ≈ ${formatHours(slowRange.low)}–${formatHours(slowRange.high)} half-life`,
    detail:
      "The model uses a two-phase decline: a faster initial drop (redistribution out of blood into tissue) followed by a slower terminal decline (metabolism and clearance). Both half-life ranges shown are the actual weighted spread across the simulation, driven mainly by the pattern-of-use setting above.",
  });

  const sexMultiplier = SEX_KSLOW_MULTIPLIER[inputs.sex];
  const weightNote =
    inputs.bodyWeightKg === 70
      ? "matches the 70 kg reference the model's dose-scaling is calibrated against, so it has no adjustment effect here."
      : inputs.bodyWeightKg > 70
        ? `is above the 70 kg reference the model's dose-scaling is calibrated against, which lowers the estimated concentration per mg absorbed relative to that reference.`
        : `is below the 70 kg reference the model's dose-scaling is calibrated against, which raises the estimated concentration per mg absorbed relative to that reference.`;
  factors.push({
    key: "body",
    label: "Body-related variables",
    value: `${inputs.bodyWeightKg} kg body weight${inputs.sex !== "unspecified" ? ` · sex: ${inputs.sex}` : ""}`,
    detail: `Body weight of ${inputs.bodyWeightKg} kg ${weightNote}${
      sexMultiplier !== 1
        ? " The sex adjustment applied is small and explicitly low-confidence — evidence for a forensically-significant sex effect on THC back-calculation specifically is limited and mixed."
        : ""
    }`,
  });

  if (sim.calibrated) {
    factors.push({
      key: "calibration",
      label: "Effect of the measured lab result",
      value: sim.effSize != null ? `effective sample size ≈ ${Math.round(sim.effSize).toLocaleString()} of ${paramSets.length.toLocaleString()} simulated draws` : "applied",
      detail:
        "Every simulated curve was re-weighted by how well it would have predicted the measured concentration at the blood-draw time. Curves inconsistent with that measurement are down-weighted rather than discarded, which is what narrows the credible interval compared with the no-lab-result case.",
    });
  }

  return factors;
}

const METHOD_SHORT: Record<CaseInputs["method"], string> = {
  "smoked-joint": "Smoked — joint/roll-up",
  "smoked-pipe-bong": "Smoked — pipe/bong",
  vaporized: "Vaporized",
  "oral-edible": "Oral — edible",
};

const USE_PATTERN_SHORT: Record<CaseInputs["usePattern"], string> = {
  single: "Single consumption event",
  occasional: "Occasional use",
  moderate: "Repeated use (roughly weekly)",
  frequent: "Regular / daily use",
};
