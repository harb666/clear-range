import { formatHours } from "../lib/format";
import { CITATIONS } from "../lib/pk/citations";
import {
  BASE_DOSE_TO_CONCENTRATION,
  REFERENCE_BODY_WEIGHT_KG,
  ROUTE_DESCRIPTIONS,
  ROUTE_PRIORS,
  USE_PATTERN_DESCRIPTIONS,
  USE_PATTERN_PRIORS,
} from "../lib/pk/parameters";
import type { CaseNotice, EstimationResult } from "../lib/pk/types";

interface Props {
  result: EstimationResult;
}

const METHOD_ORDER = ["smoked-joint", "smoked-pipe-bong", "vaporized", "oral-edible"] as const;
const PATTERN_ORDER = ["single", "occasional", "moderate", "frequent"] as const;

function Sub({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-[var(--border-hairline)] py-3 last:border-b-0" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
        <span aria-hidden="true" className="shrink-0 text-xs text-[var(--text-muted)] transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">{children}</div>
    </details>
  );
}

function NoticeItem({ notice }: { notice: CaseNotice }) {
  const isError = notice.severity === "error";
  return (
    <li className={isError ? "text-[var(--status-critical)]" : "text-[var(--text-secondary)]"}>
      <span className="font-medium">{isError ? "Check input: " : ""}</span>
      {notice.message}
    </li>
  );
}

export function ModelAssumptions({ result }: Props) {
  return (
    <div className="text-sm">
      {result.warnings.length > 0 && (
        <div className="mb-4 rounded-md border border-[var(--status-warning)]/40 bg-[var(--status-warning)]/10 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-primary)]">Flags for this case</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {result.warnings.map((w, i) => (
              <NoticeItem key={i} notice={w} />
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-md border border-[var(--border-hairline)] px-4">
        <Sub title="What mathematical model is being used" defaultOpen>
          <p>
            A forward pharmacokinetic curve — first-order absorption feeding a two-phase (fast + slow) exponential decline —
            evaluated many times with randomly-sampled, literature-informed parameters (a Monte Carlo simulation), then, if a
            measured lab value was supplied, re-weighted by how well each simulated curve would have predicted that
            measurement (sampling-importance-resampling). The result is a <em>distribution</em> of plausible concentrations at
            any time, not one calculated number.
          </p>
          <p className="rounded bg-[var(--surface-page)] p-2 font-mono text-xs">
            C(t) = D<sub>abs</sub> × S × (1 − e<sup>−ka·t</sup>) × [F × e<sup>−k_fast·t</sup> + (1−F) × e<sup>−k_slow·t</sup>]
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            where D<sub>abs</sub> = absorbed dose (mg), S = a dose-to-concentration scaling constant, ka = absorption rate, F =
            fraction of the decline attributed to the fast phase, k_fast/k_slow = fast/slow elimination rate constants, and t =
            hours since use (minus any absorption lag). Every one of these is sampled from a distribution, not fixed — see the
            sections below for what each distribution is based on. This is a simplified two-compartment-style stand-in for the
            fuller multi-compartment models reported in the literature, chosen because it can represent the shape and
            uncertainty of the curve over the minutes-to-~48h window relevant to a driving/blood-draw scenario without
            requiring data this project doesn't have to fit a higher-order model.
          </p>
        </Sub>

        <Sub title="Assumptions about absorption">
          <p>
            Absorption is modelled as first-order uptake (a single rate constant) with a short lag, using route-specific
            medians and spreads:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-left text-[var(--text-muted)]">
                  <th className="py-1 pr-3 font-medium">Route</th>
                  <th className="py-1 pr-3 font-medium">Bioavailability</th>
                  <th className="py-1 font-medium">Time to peak absorption</th>
                </tr>
              </thead>
              <tbody>
                {METHOD_ORDER.map((m) => {
                  const r = ROUTE_PRIORS[m];
                  return (
                    <tr key={m} className="border-b border-[var(--border-hairline)] last:border-b-0">
                      <td className="py-1.5 pr-3 text-[var(--text-secondary)]">{ROUTE_DESCRIPTIONS[m].split(":")[0]}</td>
                      <td className="py-1.5 pr-3">
                        {Math.round(r.bioavailabilityMedian * 100)}% (±{Math.round(r.bioavailabilityCv * 100)}% CV)
                      </td>
                      <td className="py-1.5">
                        median ka = {r.kaMedian}/h → practically complete within {formatHours(3 / r.kaMedian)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Inhaled routes (smoking/vaporizing) are modelled as reaching the bloodstream almost immediately. The oral/edible
            route is modelled with slower, delayed, and far more variable absorption, reflecting gut absorption plus
            first-pass liver metabolism.
          </p>
        </Sub>

        <Sub title="Assumptions about distribution and elimination">
          <p>
            After absorption, concentration is modelled as declining in two phases: a faster initial drop (redistribution from
            blood into tissue) followed by a slower terminal decline (metabolism and clearance). The pattern-of-use category
            sets which half-lives apply:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-left text-[var(--text-muted)]">
                  <th className="py-1 pr-3 font-medium">Pattern of use</th>
                  <th className="py-1 pr-3 font-medium">Fast-phase half-life</th>
                  <th className="py-1 font-medium">Terminal (slow-phase) half-life</th>
                </tr>
              </thead>
              <tbody>
                {PATTERN_ORDER.map((p) => {
                  const u = USE_PATTERN_PRIORS[p];
                  return (
                    <tr key={p} className="border-b border-[var(--border-hairline)] last:border-b-0">
                      <td className="py-1.5 pr-3 text-[var(--text-secondary)] capitalize">{p}</td>
                      <td className="py-1.5 pr-3">{formatHours(Math.log(2) / u.kFastMedian)} (median)</td>
                      <td className="py-1.5">{formatHours(Math.log(2) / u.kSlowMedian)} (median)</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            These medians are each sampled with substantial spread (coefficients of variation of 20–70%) every simulation
            draw — the table shows the centre of each distribution, not a value the model treats as certain.
          </p>
        </Sub>

        <Sub title="How consumption dose is estimated">
          <p>
            For smoked/vaporized routes: nominal dose (mg) = amount consumed (g) × 1000 × potency (%) ÷ 100. For edibles: the
            labelled/estimated mg figure is used directly. In both cases only a fraction of that nominal dose reaches the
            bloodstream — the <em>absorbed</em> dose used by the model is the nominal dose × a randomly-sampled
            bioavailability draw from the route's distribution (see the absorption table above), reflecting that inhalation
            efficiency and gut/liver first-pass loss both vary a great deal between people and sessions.
          </p>
          <p>
            The initial (pre-decline) concentration scale is then absorbed dose × a dose-to-concentration constant (median{" "}
            {BASE_DOSE_TO_CONCENTRATION} ng/mL per mg for a {REFERENCE_BODY_WEIGHT_KG} kg reference adult, itself sampled with
            spread), adjusted for the case's own body weight and pattern-of-use category.
          </p>
        </Sub>

        <Sub title="How time since consumption affects the estimate">
          <p>
            Concentration rises quickly after use, peaks, then declines — so the model's uncertainty is not constant over
            time. In the minutes just after use the estimate is most sensitive to exactly when use occurred and how fast
            absorption is assumed to be. Hours later, the estimate is dominated by which elimination half-lives apply. Very
            long after use (this tool flags anything past 48 hours), the terminal decline is the least well-characterised part
            of the model — especially for frequent users, where a long, slow, fat-tissue-release tail is plausible but not
            tightly constrained by the cited studies.
          </p>
        </Sub>

        <Sub title="How repeated / chronic use is treated">
          <p>These are modelling assumptions about elimination rate, not diagnoses of any individual:</p>
          <ul className="list-disc space-y-1 pl-5">
            {PATTERN_ORDER.map((p) => (
              <li key={p}>
                <span className="text-[var(--text-primary)]">{p}:</span> {USE_PATTERN_DESCRIPTIONS[p]}
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--text-muted)]">
            Important limitation: this model simulates a single consumption event's rise and decline. It does not simulate
            multiple discrete doses accumulating over days or weeks — a true chronic-use accumulation model would need
            longitudinal dosing data this project does not have. The pattern-of-use setting is a proxy (via a faster or slower
            assumed elimination rate) for how a person's history is likely to affect clearance of <em>this</em> use event, not
            a simulation of their full dosing history.
          </p>
        </Sub>

        <Sub title="Which inputs have the greatest influence on the result">
          <p>
            This varies case by case — see the "Sensitivity to assumptions" chart above, which is generated from this exact
            case, not a general claim. As a rule of thumb in this model's structure: the pattern-of-use category (via the
            elimination half-life it selects) and the estimated dose/potency tend to move the result the most; body weight and
            small timing shifts typically move it less. When a measured lab value is supplied, how tightly that value
            constrains the plausible parameter combinations (the calibration fit shown below) also matters a great deal.
          </p>
        </Sub>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Model &amp; version</h3>
        <p className="mt-1 text-[var(--text-secondary)]">{result.modelVersion}</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Monte Carlo simulation (n = {result.inputs.sampleSize.toLocaleString()} draws)
          {result.calibrated && result.effectiveSampleSize != null && (
            <>, calibrated against the measured laboratory value — effective sample size after calibration:{" "}
              {Math.round(result.effectiveSampleSize).toLocaleString()}.</>
          )}
          {!result.calibrated && " — no lab result supplied, so this is the prior predictive range only."}
        </p>
      </div>

      <div className="mt-4">
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

      <div className="mt-4 rounded-md border border-[var(--border-hairline)] bg-[var(--surface-page)] p-3 text-xs text-[var(--text-muted)]">
        ClearRange does not determine whether a specified legal THC threshold was met or exceeded. It reports a probabilistic
        estimate of plausible concentration, with explicit uncertainty, so the reader — and any expert instructed on the case —
        can judge what the evidence does and does not support. The current parameter set is an MVP literature-informed prior
        and has not yet been validated against an independent measured dataset.
      </div>
    </div>
  );
}
