import { METHOD_LABELS, USE_PATTERN_LABELS } from "../lib/defaults";
import { formatDateTime, formatNgMl } from "../lib/format";
import { CITATIONS } from "../lib/pk/citations";
import type { EstimationResult } from "../lib/pk/types";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { ConcentrationChart } from "./ConcentrationChart";
import { SensitivityChart } from "./SensitivityChart";

interface Props {
  result: EstimationResult;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[var(--border-hairline)] py-1.5 text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

export function ReportView({ result, onClose }: Props) {
  const { inputs } = result;
  const generatedAt = new Date();

  return (
    <div className="safe-top safe-bottom safe-x mx-auto max-w-3xl py-8">
      <div className="no-print mb-2 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onClose}
          className="rounded-md border border-[var(--border-strong)] px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-page)]"
        >
          ← Back to editing
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-md bg-[var(--brand)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 active:opacity-80"
        >
          Print / Save as PDF
        </button>
      </div>
      <p className="no-print mb-6 text-xs text-[var(--text-muted)]">
        On iPhone: tap Print, then pinch-open the page preview and use the Share button to save it as a PDF or send it directly.
      </p>

      <header className="mb-6 border-b border-[var(--border-strong)] pb-4">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">ClearRange — THC blood-level estimation report</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Generated {generatedAt.toLocaleString("en-GB")}</p>
        <p className="mt-3 rounded-md bg-[var(--surface-page)] p-3 text-sm text-[var(--text-secondary)]">
          This report presents a probabilistic, evidence-based estimate of plausible THC blood concentration at a stated past
          time. It is not a measurement and does not establish an exact historical concentration or determine compliance with
          any legal threshold. It should be interpreted alongside, and where appropriate reviewed by, a qualified forensic
          toxicologist.
        </p>
      </header>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Case inputs</h2>
        <Row label="Date &amp; time of use" value={formatDateTime(inputs.useTime)} />
        <Row label="Method of consumption" value={METHOD_LABELS[inputs.method]} />
        {inputs.method === "oral-edible" ? (
          <Row label="Estimated THC dose" value={`${inputs.doseMg} mg`} />
        ) : (
          <>
            <Row label="Amount consumed" value={`${inputs.amountGrams} g`} />
            <Row label="Estimated THC potency" value={`${inputs.potencyPercent}%`} />
          </>
        )}
        <Row label="Pattern of use" value={USE_PATTERN_LABELS[inputs.usePattern]} />
        <Row label="Time of driving / activity (T1)" value={formatDateTime(inputs.activityTime)} />
        <Row label="Time of blood collection (T2)" value={formatDateTime(inputs.bloodDrawTime)} />
        <Row
          label="Measured THC at T2"
          value={inputs.measuredConcentrationNgMl != null ? `${inputs.measuredConcentrationNgMl} ng/mL` : "Not supplied"}
        />
        <Row label="Body weight" value={`${inputs.bodyWeightKg} kg`} />
        <Row label="Sex" value={inputs.sex} />
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Estimated result at the activity time (T1)
        </h2>
        <div className="grid grid-cols-3 gap-4 rounded-md border border-[var(--border-hairline)] p-4 text-center">
          <div>
            <div className="text-xs text-[var(--text-muted)]">Median</div>
            <div className="text-xl font-semibold">{formatNgMl(result.atActivityTime.p50)} ng/mL</div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)]">50% interval</div>
            <div className="text-xl font-semibold">
              {formatNgMl(result.atActivityTime.p25)}–{formatNgMl(result.atActivityTime.p75)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)]">90% interval</div>
            <div className="text-xl font-semibold">
              {formatNgMl(result.atActivityTime.p05)}–{formatNgMl(result.atActivityTime.p95)}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 break-inside-avoid">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Concentration over time
        </h2>
        <ConcentrationChart result={result} />
      </section>

      <section className="mb-6 break-inside-avoid">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Sensitivity to assumptions
        </h2>
        <SensitivityChart rows={result.sensitivity} />
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Assumptions, model &amp; evidence
        </h2>
        <AssumptionsPanel result={result} />
      </section>

      <footer className="mt-8 border-t border-[var(--border-hairline)] pt-3 text-xs text-[var(--text-muted)]">
        {result.modelVersion} · References: {CITATIONS.map((c) => c.id).join(", ")}
      </footer>
    </div>
  );
}
