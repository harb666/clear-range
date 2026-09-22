import { useState } from "react";
import { ConcentrationChart } from "./ConcentrationChart";
import { ExplainResult } from "./ExplainResult";
import { Methodology } from "./Methodology";
import { ModelAssumptions } from "./ModelAssumptions";
import { RangeSummary } from "./RangeSummary";
import { SensitivityChart } from "./SensitivityChart";
import { Timeline } from "./Timeline";
import type { EstimationResult } from "../lib/pk/types";

interface Props {
  result: EstimationResult;
}

export function ResultsPanel({ result }: Props) {
  const [selectedHour, setSelectedHour] = useState<number | undefined>(undefined);
  const hasErrors = result.warnings.some((w) => w.severity === "error");

  return (
    <div className="space-y-6">
      {hasErrors && (
        <div
          role="alert"
          className="rounded-lg border border-[var(--status-critical)]/50 bg-[var(--status-critical)]/10 p-4 text-sm text-[var(--status-critical)]"
        >
          <p className="font-medium">Some inputs need attention before this estimate is meaningful:</p>
          <ul className="mt-1 list-disc pl-5">
            {result.warnings
              .filter((w) => w.severity === "error")
              .map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
          </ul>
        </div>
      )}

      <RangeSummary result={result} />

      <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-1)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Estimated THC concentration over time
        </h2>
        <div className="mt-3">
          <ConcentrationChart result={result} selectedHoursSinceUse={selectedHour} />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-1)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Timeline</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Drag to move through time since use and see how the modelled estimate changes. The marker also appears on the chart
          above.
        </p>
        <div className="mt-2">
          <Timeline result={result} onScrub={setSelectedHour} />
        </div>
      </div>

      <ExplainResult result={result} />

      <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-1)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Sensitivity to assumptions
        </h2>
        <div className="mt-3">
          <SensitivityChart rows={result.sensitivity} />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-1)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Model &amp; assumptions</h2>
        <div className="mt-3">
          <ModelAssumptions result={result} />
        </div>
      </div>

      <Methodology />
    </div>
  );
}
