/**
 * Domain types for the ClearRange pharmacokinetic (PK) estimation engine.
 *
 * The engine is deliberately split from the UI: `CaseInputs` is the only
 * thing a form needs to produce, `EstimationResult` is the only thing a
 * results view needs to consume, and everything in between (parameter
 * distributions, the forward model, the Monte Carlo/calibration engine) can
 * be swapped for an improved, dataset-validated version later without
 * touching the UI layer. See `lib/pk/modelRegistry.ts`.
 */

export type ConsumptionMethod =
  | "smoked-joint"
  | "smoked-pipe-bong"
  | "vaporized"
  | "oral-edible";

export type UsePattern =
  /** One isolated use, no recent prior use. Modelled identically to
   * "occasional" — see USE_PATTERN_DESCRIPTIONS in parameters.ts for why. */
  | "single"
  /** No use in the preceding month; naive or near-naive tolerance. */
  | "occasional"
  /** Roughly weekly use. */
  | "moderate"
  /** Near-daily or daily use; materially altered kinetics (larger, slower-
   * clearing peripheral/fat compartment; possible non-zero baseline). */
  | "frequent";

export type BiologicalSex = "female" | "male" | "unspecified";

export interface CaseInputs {
  /** ISO datetime string: when cannabis was used. */
  useTime: string;
  /** Grams of herbal material / concentrate smoked or vaporized. Ignored for oral route (use doseMg instead). */
  amountGrams: number;
  /** For oral edibles: labelled/estimated mg of THC in the dose. */
  doseMg: number;
  /** Estimated THC potency, % w/w (herbal/resin) — used with amountGrams for inhaled routes. */
  potencyPercent: number;
  method: ConsumptionMethod;
  usePattern: UsePattern;
  /** ISO datetime: time of driving / activity of interest (T1). */
  activityTime: string;
  /** ISO datetime: time blood was drawn (T2). */
  bloodDrawTime: string;
  /** Measured THC concentration at T2, ng/mL whole blood. Null if not (yet) available. */
  measuredConcentrationNgMl: number | null;
  /** Assumed analytical + biological measurement uncertainty, as a coefficient of variation (0-1). */
  measurementCv: number;
  bodyWeightKg: number;
  sex: BiologicalSex;
  /** Number of Monte Carlo draws used for the simulation. */
  sampleSize: number;
}

export interface PkParameterSample {
  /** Bioavailable dose reaching systemic circulation, mg THC. */
  absorbedDoseMg: number;
  /** First-order absorption rate constant, /h. */
  ka: number;
  /** Absorption lag time, h (mainly relevant to the oral route). */
  lagH: number;
  /** Volume of distribution / dose scaling constant relating absorbed dose to the initial (fast-phase) concentration, (ng/mL) per mg. */
  doseToConcentration: number;
  /** Fast distribution-phase elimination rate constant, /h. */
  kFast: number;
  /** Fraction of the initial concentration assigned to the fast phase (0-1); remainder decays at kSlow. */
  fastFraction: number;
  /** Slow (terminal) elimination-phase rate constant, /h. */
  kSlow: number;
}

/** A single simulated concentration-time trajectory plus metadata needed for calibration/reporting. */
export interface SimulatedCurve {
  params: PkParameterSample;
  /** Concentration (ng/mL) at each of the shared `timesH` timepoints (hours since use). */
  concentrations: number[];
  /** SIR importance weight after calibration against a measured value (1 for all curves if uncalibrated). */
  weight: number;
}

export interface QuantileBand {
  p05: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export interface CurvePoint {
  hoursSinceUse: number;
  isoTime: string;
  /** Quantile band across all weighted Monte Carlo draws. */
  band: QuantileBand;
}

/**
 * One entry in the "Explain this result" breakdown: a case input (or group
 * of inputs) plus a plain-language account of how it shaped the estimate.
 * `value` is a ready-to-display string rather than raw numbers so the
 * results/UI layers don't need to duplicate unit formatting — but every
 * number in it is read directly off the actual simulation ensemble
 * (`RawSimulationOutput`), never invented for display purposes.
 */
export interface ExplanationFactor {
  key: string;
  label: string;
  value: string;
  detail: string;
}

/** A flagged issue with the case as entered, or a caveat about the result. */
export interface CaseNotice {
  severity: "error" | "warning";
  message: string;
  /** Case input field this notice is about, if any — lets the form highlight the specific field. */
  field?: keyof CaseInputs;
}

export interface SensitivityRow {
  inputLabel: string;
  /** Median T1 estimate (ng/mL) with the input at its low sensitivity setting. */
  low: number;
  /** Median T1 estimate (ng/mL) with the input at its default/given setting. */
  base: number;
  /** Median T1 estimate (ng/mL) with the input at its high sensitivity setting. */
  high: number;
  lowLabel: string;
  highLabel: string;
}

export interface EstimationResult {
  modelVersion: string;
  inputs: CaseInputs;
  /** Whether a measured T2 concentration was supplied and used to calibrate (weight) the prior. */
  calibrated: boolean;
  /** Effective sample size after SIR weighting (calibration diagnostic — low values mean the measured value was surprising under the prior). */
  effectiveSampleSize: number | null;
  /** Fraction of prior mass consistent enough with the measurement to matter (diagnostic). */
  calibrationFit: "not-applicable" | "good" | "moderate" | "poor";
  curve: CurvePoint[];
  /** Quantile band of concentration at the activity time (T1), the primary output. */
  atActivityTime: QuantileBand;
  /** Quantile band of concentration at the blood-draw time (T2), for comparison against the measured value. */
  atBloodDrawTime: QuantileBand;
  sensitivity: SensitivityRow[];
  /** Auditable, per-factor account of how the inputs produced this result — see ExplanationFactor. */
  explanation: ExplanationFactor[];
  warnings: CaseNotice[];
}
