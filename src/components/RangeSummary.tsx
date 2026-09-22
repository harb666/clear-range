import { formatNgMl } from "../lib/format";
import type { EstimationResult } from "../lib/pk/types";

interface Props {
  result: EstimationResult;
}

const FIT_LABEL: Record<EstimationResult["calibrationFit"], string> = {
  "not-applicable": "No lab result supplied — showing the model's prior predictive range only.",
  good: "The measured lab result is well explained by these assumptions.",
  moderate: "The measured lab result is only moderately consistent with these assumptions — treat the range with some extra caution.",
  poor: "The measured lab result is hard to reconcile with these assumptions. Review the inputs, or treat this range as low-confidence.",
};

export function RangeSummary({ result }: Props) {
  const { atActivityTime, calibrated, calibrationFit } = result;

  return (
    <div className="card-glass rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-1)] shadow-[0_20px_60px_-24px_rgba(0,0,0,0.6)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        Modelled THC estimate at the activity time (T1)
      </h2>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
        A statistical output from a pharmacokinetic model — not a laboratory measurement of this person at this time.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <div className="text-xs text-[var(--text-muted)]">Central estimate (median)</div>
          <div className="text-3xl font-semibold text-[var(--text-primary)]">
            ≈ {formatNgMl(atActivityTime.p50)} <span className="text-base font-normal text-[var(--text-secondary)]">ng/mL</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--text-muted)]">Likely range (50% credible interval)</div>
          <div className="text-lg text-[var(--text-primary)]">
            {formatNgMl(atActivityTime.p25)}–{formatNgMl(atActivityTime.p75)} ng/mL
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--text-muted)]">Wider plausible range (90% credible interval)</div>
          <div className="text-lg text-[var(--text-primary)]">
            {formatNgMl(atActivityTime.p05)}–{formatNgMl(atActivityTime.p95)} ng/mL
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-md bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-secondary)]">
        {FIT_LABEL[calibrationFit]}
      </p>

      <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
        Report this as a <strong>modelled range</strong>, e.g. "approximately {formatNgMl(atActivityTime.p25)}–
        {formatNgMl(atActivityTime.p75)} ng/mL", never as a single measured figure. It reflects genuine, well-documented
        variability between individuals in cannabinoid absorption and elimination
        {calibrated ? ", combined with the measured laboratory result" : ""}. It cannot establish an exact historical blood
        THC concentration, and it does not determine whether any legal threshold was or was not exceeded — a forensic blood
        analysis is the only way to establish an actual measured concentration.
      </p>
    </div>
  );
}
