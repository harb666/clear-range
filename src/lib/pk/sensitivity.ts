/**
 * One-at-a-time sensitivity analysis: for each input worth flagging, hold
 * everything else at the case's given values and recompute the median
 * estimated concentration at the activity time (T1) with that input moved
 * to a "low" and "high" plausible alternative. Rendered as a tornado chart
 * so a reader can see at a glance which assumptions the result actually
 * depends on — central to the project's "show how sensitive the result is
 * to the assumptions" requirement.
 */

import { bandAtHours, hoursBetween, runSimulation } from "./simulate";
import type { CaseInputs, SensitivityRow, UsePattern } from "./types";

const SENSITIVITY_SAMPLE_SIZE = 600;

function medianAtActivity(inputs: CaseInputs): number {
  const sim = runSimulation({ ...inputs, sampleSize: SENSITIVITY_SAMPLE_SIZE }, 777);
  const activityH = hoursBetween(inputs.useTime, inputs.activityTime);
  return bandAtHours(sim, activityH).p50;
}

function shiftIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}

export function runSensitivity(inputs: CaseInputs): SensitivityRow[] {
  const rows: SensitivityRow[] = [];

  const isOral = inputs.method === "oral-edible";

  if (isOral) {
    const lowDose = inputs.doseMg * 0.6;
    const highDose = inputs.doseMg * 1.4;
    rows.push({
      inputLabel: "Estimated THC dose (edible)",
      low: medianAtActivity({ ...inputs, doseMg: lowDose }),
      base: medianAtActivity(inputs),
      high: medianAtActivity({ ...inputs, doseMg: highDose }),
      lowLabel: `${lowDose.toFixed(0)} mg`,
      highLabel: `${highDose.toFixed(0)} mg`,
    });
  } else {
    const lowAmount = inputs.amountGrams * 0.7;
    const highAmount = inputs.amountGrams * 1.3;
    rows.push({
      inputLabel: "Amount consumed",
      low: medianAtActivity({ ...inputs, amountGrams: lowAmount }),
      base: medianAtActivity(inputs),
      high: medianAtActivity({ ...inputs, amountGrams: highAmount }),
      lowLabel: `${lowAmount.toFixed(2)} g`,
      highLabel: `${highAmount.toFixed(2)} g`,
    });

    const lowPotency = Math.max(1, inputs.potencyPercent * 0.7);
    const highPotency = inputs.potencyPercent * 1.3;
    rows.push({
      inputLabel: "THC potency",
      low: medianAtActivity({ ...inputs, potencyPercent: lowPotency }),
      base: medianAtActivity(inputs),
      high: medianAtActivity({ ...inputs, potencyPercent: highPotency }),
      lowLabel: `${lowPotency.toFixed(0)}%`,
      highLabel: `${highPotency.toFixed(0)}%`,
    });
  }

  const patternOrder: UsePattern[] = ["occasional", "moderate", "frequent"];
  const lowPattern = patternOrder[0];
  const highPattern = patternOrder[patternOrder.length - 1];
  rows.push({
    inputLabel: "Use-pattern category (elimination rate)",
    low: medianAtActivity({ ...inputs, usePattern: lowPattern }),
    base: medianAtActivity(inputs),
    high: medianAtActivity({ ...inputs, usePattern: highPattern }),
    lowLabel: "Occasional user",
    highLabel: "Frequent user",
  });

  const lowWeight = Math.max(35, inputs.bodyWeightKg - 15);
  const highWeight = inputs.bodyWeightKg + 15;
  rows.push({
    inputLabel: "Body weight",
    low: medianAtActivity({ ...inputs, bodyWeightKg: highWeight }),
    base: medianAtActivity(inputs),
    high: medianAtActivity({ ...inputs, bodyWeightKg: lowWeight }),
    lowLabel: `${highWeight} kg`,
    highLabel: `${lowWeight} kg`,
  });

  rows.push({
    inputLabel: "Estimated time of use (±30 min)",
    low: medianAtActivity({ ...inputs, useTime: shiftIso(inputs.useTime, 30) }),
    base: medianAtActivity(inputs),
    high: medianAtActivity({ ...inputs, useTime: shiftIso(inputs.useTime, -30) }),
    lowLabel: "30 min later",
    highLabel: "30 min earlier",
  });

  if (inputs.measuredConcentrationNgMl != null) {
    rows.push({
      inputLabel: "Time of blood draw (±15 min)",
      low: medianAtActivity({ ...inputs, bloodDrawTime: shiftIso(inputs.bloodDrawTime, -15) }),
      base: medianAtActivity(inputs),
      high: medianAtActivity({ ...inputs, bloodDrawTime: shiftIso(inputs.bloodDrawTime, 15) }),
      lowLabel: "15 min earlier",
      highLabel: "15 min later",
    });
  }

  return rows;
}
