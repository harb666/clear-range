import type { CaseInputs, ConsumptionMethod, UsePattern } from "./pk/types";

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultCaseInputs(): CaseInputs {
  const now = new Date();
  const use = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const activity = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const bloodDraw = new Date(now.getTime() - 30 * 60 * 1000);

  return {
    useTime: toLocalInputValue(use),
    amountGrams: 0.3,
    doseMg: 10,
    potencyPercent: 15,
    method: "smoked-joint",
    usePattern: "occasional",
    activityTime: toLocalInputValue(activity),
    bloodDrawTime: toLocalInputValue(bloodDraw),
    measuredConcentrationNgMl: null,
    measurementCv: 0.2,
    bodyWeightKg: 75,
    sex: "unspecified",
    sampleSize: 3000,
  };
}

export const METHOD_LABELS: Record<ConsumptionMethod, string> = {
  "smoked-joint": "Smoked — joint / roll-up",
  "smoked-pipe-bong": "Smoked — pipe / bong",
  vaporized: "Vaporized",
  "oral-edible": "Oral — edible / ingested",
};

/** Short chip text for the method-of-consumption dial picker. */
export const METHOD_SHORT_LABELS: Record<ConsumptionMethod, string> = {
  "smoked-joint": "Joint",
  "smoked-pipe-bong": "Pipe / bong",
  vaporized: "Vaporizer",
  "oral-edible": "Edible",
};

export const METHOD_ORDER: ConsumptionMethod[] = ["smoked-joint", "smoked-pipe-bong", "vaporized", "oral-edible"];

export const USE_PATTERN_LABELS: Record<UsePattern, string> = {
  single: "Single consumption event (isolated use)",
  occasional: "Occasional use (no regular recent use)",
  moderate: "Repeated use (roughly weekly)",
  frequent: "Regular / daily use (near-daily or daily)",
};

/** UK Drug Driving (Specified Limits)(England and Wales) Regulations 2014 specified limit for THC, shown for context only. */
export const UK_THC_SPECIFIED_LIMIT_NG_ML = 2;
