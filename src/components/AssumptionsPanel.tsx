import { CITATIONS } from "../lib/pk/citations";
import type { EstimationResult } from "../lib/pk/types";

interface Props {
  result: EstimationResult;
}

export function AssumptionsPanel({ result }: Props) {
  return (
    <div className="space-y-5 text-sm">
      {result.warnings.length > 0 && (
        <div className="rounded-md border border-[var(--status-warning)]/40 bg-[var(--status-warning)]/10 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-primary)]">Flags for this case</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--text-secondary)]">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Model &amp; version</h3>
        <p className="mt-1 text-[var(--text-secondary)]">{result.modelVersion}</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Structure: literature-informed prior distributions over absorption and elimination parameters, propagated through a
          Monte Carlo simulation (n = {result.inputs.sampleSize.toLocaleString()} draws), calibrated against the measured
          laboratory value (if supplied) by sampling-importance-resampling.
          {result.calibrated && result.effectiveSampleSize != null && (
            <> Effective sample size after calibration: {Math.round(result.effectiveSampleSize).toLocaleString()}.</>
          )}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Key assumptions</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-[var(--text-secondary)]">
          <li>Absorption, distribution and elimination parameters vary between individuals; ranges reflect published inter-subject variability, not a single fixed value.</li>
          <li>Use-pattern category (occasional / moderate / frequent) is treated as the main driver of elimination-rate differences, per the cited occasional-vs-frequent comparisons.</li>
          <li>Frequent/daily users may carry a pre-existing THC baseline from earlier, unrelated use; this model does not separate that baseline from the modelled event.</li>
          <li>Body weight is used as a simple linear adjustment to the dose-to-concentration scaling; it is not a full physiologically-based model of body composition.</li>
          <li>The reported sex adjustment is small and explicitly flagged as low-confidence given limited targeted evidence.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Evidence base</h3>
        <ul className="mt-1 space-y-2 text-xs text-[var(--text-muted)]">
          {CITATIONS.map((c) => (
            <li key={c.id}>
              <span className="text-[var(--text-secondary)]">{c.citation}</span>
              <br />
              <span className="italic">{c.relevance}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--surface-page)] p-3 text-xs text-[var(--text-muted)]">
        ClearRange does not determine whether a specified legal THC threshold was met or exceeded. It reports a probabilistic
        estimate of plausible concentration, with explicit uncertainty, so the reader — and any expert instructed on the case —
        can judge what the evidence does and does not support. The current parameter set is an MVP literature-informed prior
        and has not yet been validated against an independent measured dataset.
      </div>
    </div>
  );
}
