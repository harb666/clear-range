/**
 * Literature-informed PRIOR distributions for THC blood pharmacokinetic
 * parameters, by route of administration and use-pattern (occasional /
 * moderate / frequent).
 *
 * IMPORTANT — read before trusting a number out of this file:
 * The point values and spreads here are order-of-magnitude-correct,
 * illustrative approximations of the ranges reported in the studies listed
 * in `citations.ts` (Huestis 1992; Toennes 2008; Karschner 2009; Newmeyer
 * 2016; Schwope 2012; Desrosiers 2014; Grotenhermen 2003 review). They are
 * NOT a precise digitisation of those papers' individual-subject data, and
 * they have NOT been validated against an independent dataset. This is
 * exactly the gap the project's stated long-term goal (a ~1,000-participant
 * timed-use + blood-THC dataset) is meant to close — see `modelRegistry.ts`
 * for how a future validated parameter set replaces this file without
 * touching the simulation engine or UI.
 *
 * Every distribution is deliberately wide (see `random.sampleLognormalFromMedianCv`
 * CVs below) because true inter-individual variability in cannabinoid PK is
 * large — that width is what makes the tool's output a *range*, not a
 * point estimate.
 */

import type { ConsumptionMethod, UsePattern } from "./types";

export interface RouteAbsorptionPrior {
  /** Fraction of nominal dose (smoked/vaporized content, or oral label dose) reaching systemic circulation. */
  bioavailabilityMedian: number;
  bioavailabilityCv: number;
  /** First-order absorption rate constant, /h. */
  kaMedian: number;
  kaCv: number;
  /** Absorption lag time, h. */
  lagMedianH: number;
  lagCv: number;
}

export interface UsePatternPrior {
  /** Multiplier on the base dose->concentration scaling (captures reported lower Cmax-per-dose in frequent users). */
  concentrationScaleMultiplier: number;
  /** Fast (distribution) phase elimination rate constant, /h. */
  kFastMedian: number;
  kFastCv: number;
  /** Fraction of the initial concentration attributed to the fast phase. */
  fastFractionMedian: number;
  fastFractionCv: number;
  /** Slow (terminal) elimination phase rate constant, /h — this is what differs most between occasional and frequent users. */
  kSlowMedian: number;
  kSlowCv: number;
}

export const ROUTE_PRIORS: Record<ConsumptionMethod, RouteAbsorptionPrior> = {
  "smoked-joint": {
    bioavailabilityMedian: 0.27,
    bioavailabilityCv: 0.35,
    kaMedian: 40,
    kaCv: 0.3,
    lagMedianH: 0.01,
    lagCv: 0.3,
  },
  "smoked-pipe-bong": {
    bioavailabilityMedian: 0.3,
    bioavailabilityCv: 0.35,
    kaMedian: 45,
    kaCv: 0.3,
    lagMedianH: 0.01,
    lagCv: 0.3,
  },
  vaporized: {
    bioavailabilityMedian: 0.33,
    bioavailabilityCv: 0.3,
    kaMedian: 35,
    kaCv: 0.3,
    lagMedianH: 0.01,
    lagCv: 0.3,
  },
  "oral-edible": {
    bioavailabilityMedian: 0.08,
    bioavailabilityCv: 0.5,
    kaMedian: 1.1,
    kaCv: 0.45,
    lagMedianH: 0.4,
    lagCv: 0.5,
  },
};

export const USE_PATTERN_PRIORS: Record<UsePattern, UsePatternPrior> = {
  occasional: {
    concentrationScaleMultiplier: 1.0,
    kFastMedian: 1.3,
    kFastCv: 0.35,
    fastFractionMedian: 0.8,
    fastFractionCv: 0.15,
    kSlowMedian: Math.log(2) / 5, // terminal t1/2 ~ 5h
    kSlowCv: 0.5,
  },
  moderate: {
    concentrationScaleMultiplier: 0.9,
    kFastMedian: 1.15,
    kFastCv: 0.35,
    fastFractionMedian: 0.75,
    fastFractionCv: 0.15,
    kSlowMedian: Math.log(2) / 9, // terminal t1/2 ~ 9h
    kSlowCv: 0.55,
  },
  frequent: {
    concentrationScaleMultiplier: 0.75,
    kFastMedian: 1.0,
    kFastCv: 0.35,
    fastFractionMedian: 0.65,
    fastFractionCv: 0.2,
    kSlowMedian: Math.log(2) / 20, // terminal t1/2 ~ 20h, long right tail (fat redistribution)
    kSlowCv: 0.7,
  },
};

/**
 * Base scaling from an absorbed mg dose to the initial (post-distribution)
 * concentration, in (ng/mL) per mg, for a reference 70kg adult. Calibrated
 * so a typical ~0.3g joint at ~15% THC (bioavailable dose roughly 12mg)
 * produces an initial concentration broadly consistent with reported
 * smoked-cannabis Cmax ranges (tens to ~100+ ng/mL) before individual and
 * use-pattern scaling is applied.
 */
export const BASE_DOSE_TO_CONCENTRATION = 5.5;
export const DOSE_TO_CONCENTRATION_CV = 0.4;

/** Reference body weight (kg) the base dose->concentration scaling is calibrated for. */
export const REFERENCE_BODY_WEIGHT_KG = 70;

/**
 * Small, explicitly-flagged adjustment for biological sex, reflecting
 * average differences in adipose tissue proportion relevant to a lipophilic
 * drug's volume of distribution. Evidence for a forensically-significant
 * sex effect on THC back-calculation specifically is limited and mixed;
 * this is a minor, conservative nudge rather than a validated correction —
 * see the assumptions panel in the UI.
 */
export const SEX_KSLOW_MULTIPLIER: Record<"female" | "male" | "unspecified", number> = {
  female: 0.93,
  male: 1.0,
  unspecified: 1.0,
};

export const MODEL_VERSION = "ClearRange PK prior v0.1 (literature-informed, unvalidated)";
