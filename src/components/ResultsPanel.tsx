import { AssumptionsPanel } from "./AssumptionsPanel";
import { ConcentrationChart } from "./ConcentrationChart";
import { RangeSummary } from "./RangeSummary";
import { SensitivityChart } from "./SensitivityChart";
import type { EstimationResult } from "../lib/pk/types";

interface Props {
  result: EstimationResult;
}

export function ResultsPanel({ result }: Props) {
  return (
    <div className="space-y-6">
      <RangeSummary result={result} />

      <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-1)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Estimated THC concentration over time
        </h2>
        <div className="mt-3">
          <ConcentrationChart result={result} />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-1)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Sensitivity to assumptions
        </h2>
        <div className="mt-3">
          <SensitivityChart rows={result.sensitivity} />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-1)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Assumptions, model &amp; evidence
        </h2>
        <div className="mt-3">
          <AssumptionsPanel result={result} />
        </div>
      </div>
    </div>
  );
}
