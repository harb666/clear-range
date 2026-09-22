/**
 * Input-level validation: sanity checks on `CaseInputs` that don't need a
 * simulation to evaluate. Kept separate from the result-level diagnostics in
 * `pk/estimate.ts` (which depend on the simulation output, e.g. calibration
 * fit) — this module only ever looks at the raw form values.
 */
import type { CaseInputs, CaseNotice } from "./pk/types";

export function validateInputs(inputs: CaseInputs): CaseNotice[] {
  const issues: CaseNotice[] = [];

  const nominalMg =
    inputs.method === "oral-edible"
      ? inputs.doseMg
      : inputs.amountGrams * 1000 * (inputs.potencyPercent / 100);

  if (!Number.isFinite(nominalMg) || nominalMg <= 0) {
    issues.push({
      severity: "error",
      field: inputs.method === "oral-edible" ? "doseMg" : "amountGrams",
      message:
        inputs.method === "oral-edible"
          ? "Estimated THC dose is zero — enter a realistic dose for a meaningful estimate."
          : "Amount consumed and/or THC potency is zero — enter realistic values for a meaningful estimate.",
    });
  }

  if (inputs.method !== "oral-edible" && inputs.potencyPercent > 0 && inputs.potencyPercent < 1) {
    issues.push({
      severity: "warning",
      field: "potencyPercent",
      message: "THC potency below 1% is unusually low for herbal cannabis or resin — check this figure.",
    });
  }

  if (!Number.isFinite(inputs.bodyWeightKg) || inputs.bodyWeightKg < 30 || inputs.bodyWeightKg > 250) {
    issues.push({
      severity: "warning",
      field: "bodyWeightKg",
      message: "Body weight looks outside a plausible adult range — check this figure.",
    });
  }

  const useTime = new Date(inputs.useTime).getTime();
  const activityTime = new Date(inputs.activityTime).getTime();
  const bloodDrawTime = new Date(inputs.bloodDrawTime).getTime();

  if (!Number.isFinite(useTime) || !Number.isFinite(activityTime) || !Number.isFinite(bloodDrawTime)) {
    issues.push({ severity: "error", message: "One of the date/time fields could not be read — check they are all filled in." });
  }

  return issues;
}
