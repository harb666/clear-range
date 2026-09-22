# ClearRange

ClearRange is a UK-focused forensic THC blood-level estimation tool. Given a
cannabis use event, a later activity time (e.g. driving), a blood draw time,
and an optional lab result, it estimates the **plausible range** of THC blood
concentration at the activity time — not a single definitive number.

It is built for solicitors, forensic/toxicology professionals, insurers,
researchers, and individuals trying to understand a laboratory result. It
does **not** determine whether a legal threshold was met or exceeded.

## Why a range, not a number

Retrospective ("back-calculation") estimation of blood THC from limited data
cannot establish an exact historical concentration — individual cannabinoid
pharmacokinetics vary considerably between people, and even for the same
person, between occasions. ClearRange is built around that fact: it runs a
Monte Carlo simulation over literature-informed parameter distributions,
optionally recalibrated against a measured lab result via
sampling-importance-resampling, and reports credible intervals, a
concentration-vs-time curve, and a sensitivity analysis showing how much the
result depends on each assumption — rather than a single deterministic
back-extrapolated figure.

See `src/lib/pk/parameters.ts` and `src/lib/pk/citations.ts` for the
literature basis, and `src/lib/pk/modelRegistry.ts` for how the scientific
model is meant to be replaced as better, validated data becomes available
(the project's long-term goal is to validate/refit this against a large
timed-use + blood-THC dataset).

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static
production build (`dist/`); `npm run lint` runs Oxlint; `npx tsc -b`
type-checks.

## Architecture

Layered so the scientific model can be replaced or refitted without touching
the UI (see `src/lib/pk/modelRegistry.ts` for the intended upgrade path):

- **Inputs** — `CaseInputs` in `src/lib/pk/types.ts`; collected by
  `src/components/InputForm.tsx`. `src/lib/validate.ts` does pre-simulation
  sanity checks (e.g. a zero dose) independently of the model.
- **Model / calculation engine** — `src/lib/pk/parameters.ts` (literature-
  informed prior distributions, by route and pattern-of-use),
  `src/lib/pk/sampleParameters.ts` (turns inputs + priors into one sampled
  parameter set), `src/lib/pk/model.ts` (the forward concentration-time
  equation for one parameter set). Framework-agnostic, no UI dependencies.
- **Uncertainty handling** — `src/lib/pk/simulate.ts`: the Monte Carlo engine
  and sampling-importance-resampling calibration against a measured lab
  value. `src/lib/pk/random.ts` holds the sampling/quantile primitives.
- **Results** — `src/lib/pk/estimate.ts` assembles the public `EstimationResult`
  (credible intervals, sensitivity analysis, case notices) from the engine's
  output; `src/lib/pk/explain.ts` derives the auditable "Explain this result"
  breakdown from the same weighted simulation ensemble, and
  `src/lib/pk/sensitivity.ts` runs the one-at-a-time sensitivity analysis.
- **Visualisation** — `src/lib/timeline.ts` (derives phase boundaries from a
  result's curve for the timeline view) plus the chart-building logic inside
  `ConcentrationChart.tsx`, `Timeline.tsx`, and `SensitivityChart.tsx`.
- **UI** — `src/components/` (input form, results dashboard — range summary,
  concentration-over-time chart, timeline scrubber, "Explain this result",
  sensitivity tornado chart, expandable "Model & assumptions" and "Technical
  / methodology" sections — and the printable/exportable report view) and
  `src/App.tsx`. `src/hooks/useEstimation.ts` wires form state to the engine
  with a short debounce so changing an assumption updates the result live.

## Using it on an iPhone

ClearRange is a installable web app (PWA), not an App Store app — there is no
native iMessage extension here (that needs Xcode/Swift and Apple Developer
Program enrolment, which this project doesn't have). Once deployed to a
public URL:

1. Open the URL in Safari on the iPhone.
2. Tap the Share icon → **Add to Home Screen**. It then launches full-screen
   with its own icon, like a native app, and works offline after the first
   load (via the service worker configured in `vite.config.ts`).
3. To send it to someone: Share → **Messages**. iMessage shows a rich link
   preview (title/description/image) using the Open Graph tags in
   `index.html` and `public/og-image.png`.

Regenerate the app icons / OG image after changing the brand mark with:

```bash
node scripts/generate-icons.mjs
```

(edits `scripts/icon-source.svg`, `scripts/icon-maskable.svg`, and
`scripts/og-image.svg` — requires the `sharp` dev dependency.)

## Disclaimer

ClearRange is a prototype decision-support tool. Its default parameters are
illustrative, literature-informed approximations that have not been
validated against an independent dataset. It is not a substitute for review
by a qualified forensic toxicologist and does not provide legal advice.
