import { CITATIONS } from "../lib/pk/citations";
import {
  BASE_DOSE_TO_CONCENTRATION,
  DOSE_TO_CONCENTRATION_CV,
  MODEL_VERSION,
  REFERENCE_BODY_WEIGHT_KG,
  ROUTE_PRIORS,
  SEX_KSLOW_MULTIPLIER,
  USE_PATTERN_PRIORS,
} from "../lib/pk/parameters";

const METHOD_ORDER = ["smoked-joint", "smoked-pipe-bong", "vaporized", "oral-edible"] as const;
const METHOD_NAMES: Record<(typeof METHOD_ORDER)[number], string> = {
  "smoked-joint": "Smoked, joint",
  "smoked-pipe-bong": "Smoked, pipe/bong",
  vaporized: "Vaporized",
  "oral-edible": "Oral, edible",
};
const PATTERN_ORDER = ["single", "occasional", "moderate", "frequent"] as const;

export function Methodology() {
  return (
    <details className="card-glass rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-1)] shadow-[0_20px_60px_-24px_rgba(0,0,0,0.6)] open:pb-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Technical / methodology
          </span>
          <span className="mt-0.5 block text-xs font-normal normal-case text-[var(--text-muted)]">
            Equations, parameters, units, sources, and what would be needed to validate this model.
          </span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-xs text-[var(--text-muted)]">
          ▾
        </span>
      </summary>

      <div className="space-y-6 px-5 text-sm">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Model version</h3>
          <p className="mt-1 font-mono text-xs text-[var(--text-secondary)]">{MODEL_VERSION}</p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Forward equation</h3>
          <p className="mt-2 rounded bg-[var(--surface-page)] p-3 font-mono text-xs leading-relaxed">
            t' = t − lag
            <br />
            C(t) = 0 for t' ≤ 0, otherwise:
            <br />
            C(t) = D<sub>abs</sub> · S · (1 − e<sup>−ka·t'</sup>) · [F · e<sup>−k_fast·t'</sup> + (1−F) · e<sup>−k_slow·t'</sup>]
          </p>
          <table className="mt-2 w-full min-w-[420px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-left text-[var(--text-muted)]">
                <th className="py-1 pr-3 font-medium">Symbol</th>
                <th className="py-1 pr-3 font-medium">Meaning</th>
                <th className="py-1 font-medium">Unit</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-secondary)]">
              {[
                ["C(t)", "Whole-blood THC concentration at elapsed time t since use", "ng/mL"],
                ["D_abs", "Absorbed dose = nominal dose × sampled bioavailability", "mg"],
                ["S", "Dose-to-concentration scaling constant (assumption, not a measured volume of distribution)", "ng/mL per mg"],
                ["ka", "First-order absorption rate constant", "/h"],
                ["lag", "Absorption lag time", "h"],
                ["F", "Fraction of the post-absorption decline attributed to the fast phase", "unitless, 0–1"],
                ["k_fast", "Fast (distribution-phase) elimination rate constant", "/h"],
                ["k_slow", "Slow (terminal-phase) elimination rate constant", "/h"],
              ].map(([sym, meaning, unit]) => (
                <tr key={sym} className="border-b border-[var(--border-hairline)] last:border-b-0">
                  <td className="py-1.5 pr-3 font-mono">{sym}</td>
                  <td className="py-1.5 pr-3">{meaning}</td>
                  <td className="py-1.5">{unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Half-life relation used throughout: t½ = ln(2) / k. Every symbol above is sampled per Monte Carlo draw from the
            distributions in the tables below (lognormal, parameterised by a median and a coefficient of variation, truncated
            to a plausible multiple of the median) — the equation is evaluated thousands of times per estimate, not once.
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Parameters — absorption, by route
          </h3>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full min-w-[520px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-left text-[var(--text-muted)]">
                  <th className="py-1 pr-3 font-medium">Route</th>
                  <th className="py-1 pr-3 font-medium">Bioavailability median (CV)</th>
                  <th className="py-1 pr-3 font-medium">ka median (CV), /h</th>
                  <th className="py-1 font-medium">Lag median (CV), h</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-secondary)]">
                {METHOD_ORDER.map((m) => {
                  const r = ROUTE_PRIORS[m];
                  return (
                    <tr key={m} className="border-b border-[var(--border-hairline)] last:border-b-0">
                      <td className="py-1.5 pr-3">{METHOD_NAMES[m]}</td>
                      <td className="py-1.5 pr-3">
                        {r.bioavailabilityMedian} ({r.bioavailabilityCv})
                      </td>
                      <td className="py-1.5 pr-3">
                        {r.kaMedian} ({r.kaCv})
                      </td>
                      <td className="py-1.5">
                        {r.lagMedianH} ({r.lagCv})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Parameters — elimination, by pattern of use
          </h3>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full min-w-[560px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-left text-[var(--text-muted)]">
                  <th className="py-1 pr-3 font-medium">Pattern</th>
                  <th className="py-1 pr-3 font-medium">Conc. scale ×</th>
                  <th className="py-1 pr-3 font-medium">k_fast median (CV), /h</th>
                  <th className="py-1 pr-3 font-medium">Fast fraction median (CV)</th>
                  <th className="py-1 font-medium">k_slow median (CV), /h</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-secondary)]">
                {PATTERN_ORDER.map((p) => {
                  const u = USE_PATTERN_PRIORS[p];
                  return (
                    <tr key={p} className="border-b border-[var(--border-hairline)] last:border-b-0">
                      <td className="py-1.5 pr-3 capitalize">{p}</td>
                      <td className="py-1.5 pr-3">{u.concentrationScaleMultiplier}</td>
                      <td className="py-1.5 pr-3">
                        {u.kFastMedian.toFixed(2)} ({u.kFastCv})
                      </td>
                      <td className="py-1.5 pr-3">
                        {u.fastFractionMedian} ({u.fastFractionCv})
                      </td>
                      <td className="py-1.5">
                        {u.kSlowMedian.toFixed(4)} ({u.kSlowCv})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Other constants
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--text-secondary)]">
            <li>
              Base dose-to-concentration scaling (S): median {BASE_DOSE_TO_CONCENTRATION} ng/mL per mg, CV{" "}
              {DOSE_TO_CONCENTRATION_CV}, calibrated for a {REFERENCE_BODY_WEIGHT_KG} kg reference adult — an assumption fitted
              to produce plausible Cmax values for a typical smoked dose, not itself a cited measured constant.
            </li>
            <li>
              Body-weight adjustment: S is scaled by {REFERENCE_BODY_WEIGHT_KG} ÷ (case body weight in kg) — a simple linear
              proxy for volume-of-distribution differences, not a physiologically-based body-composition model.
            </li>
            <li>
              Sex adjustment to k_slow: female × {SEX_KSLOW_MULTIPLIER.female}, male × {SEX_KSLOW_MULTIPLIER.male}, unspecified
              × {SEX_KSLOW_MULTIPLIER.unspecified} — flagged low-confidence; see limitations below.
            </li>
            <li>Measurement/calibration likelihood: lognormal, centred on each simulated curve's value at T2, with the user-set or default 20% CV.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Sources</h3>
          <ul className="mt-2 space-y-2 text-xs text-[var(--text-muted)]">
            {CITATIONS.map((c) => (
              <li key={c.id}>
                <span className="text-[var(--text-secondary)]">
                  [{c.id}] {c.citation}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            The specific numeric medians and spreads above are order-of-magnitude-correct approximations informed by these
            studies, not a re-extraction of their individual-subject data. Where a parameter has no direct citation behind its
            exact value (the dose-to-concentration constant, the body-weight scaling, the sex adjustment, the measurement CV
            default), it is labelled an assumption above rather than attributed to a source.
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Known limitations</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--text-secondary)]">
            <li>No published dataset has been used to fit or validate this specific parameter set — it is a literature-informed prior, not a calibrated or peer-reviewed model.</li>
            <li>The two-phase exponential structure is a simplification of the multi-compartment kinetics reported in the cited literature.</li>
            <li>Dose estimation assumes the user's reported amount/potency (or edible label) is accurate; error there propagates directly into the estimate.</li>
            <li>The model simulates one consumption event; it does not accumulate multiple doses over time for chronic-use scenarios.</li>
            <li>Frequent/daily users may carry a pre-existing baseline THC concentration this model does not separately represent.</li>
            <li>The sex adjustment is a small, low-confidence nudge, not a validated correction.</li>
            <li>Terminal-phase (long-delay) behaviour is the least constrained part of the model, particularly beyond ~48 hours.</li>
            <li>Calibration against a measured lab value re-weights the prior but cannot fully correct for a case that falls outside the modelled parameter ranges.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            What would be required to validate this properly
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--text-secondary)]">
            <li>A dataset of paired, timed cannabis-use events and timed, GC-MS/LC-MS-confirmed blood THC measurements across routes, doses, and use-pattern categories — the ~1,000-participant dataset described as this project's long-term goal.</li>
            <li>Fitting population PK parameter distributions (ideally a proper hierarchical/mixed-effects model with subject-level random effects) to that dataset, replacing the illustrative priors in this file.</li>
            <li>Out-of-sample cross-validation: holding out a subset of participants and checking the fitted model's credible intervals actually contain the held-out measurements at the stated rate.</li>
            <li>Independent review by forensic toxicologists of both the model structure and the fitted parameters before any forensic/legal use.</li>
            <li>Characterising instrument/assay measurement uncertainty empirically, rather than using a user-adjustable default CV.</li>
          </ul>
        </section>
      </div>
    </details>
  );
}
