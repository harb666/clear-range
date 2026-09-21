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
    <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-1)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        Estimated THC concentration at the activity time (T1)
      </h2>

      <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <div className="text-xs text-[var(--text-muted)]">Median estimate</div>
          <div className="text-3xl font-semibold text-[var(--text-primary)]">
            {formatNgMl(atActivityTime.p50)} <span className="text-base font-normal text-[var(--text-secondary)]">ng/mL</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--text-muted)]">50% credible interval</div>
          <div className="text-lg text-[var(--text-primary)]">
            {formatNgMl(atActivityTime.p25)}–{formatNgMl(atActivityTime.p75)} ng/mL
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--text-muted)]">90% credible interval</div>
          <div className="text-lg text-[var(--text-primary)]">
            {formatNgMl(atActivityTime.p05)}–{formatNgMl(atActivityTime.p95)} ng/mL
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-md bg-[var(--surface-page)] px-3 py-2 text-sm text-[var(--text-secondary)]">
        {FIT_LABEL[calibrationFit]}
      </p>

      <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
        This is a probabilistic estimate from a pharmacokinetic model, not a measurement. It reflects genuine, well-documented
        variability between individuals in cannabinoid absorption and elimination{calibrated ? ", combined with the measured laboratory result" : ""}.
        It cannot establish an exact historical blood THC concentration, and it does not determine whether any legal threshold
        was or was not exceeded.
      </p>
    </div>
  );
}
