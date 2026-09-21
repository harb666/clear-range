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

- `src/lib/pk/` — the estimation engine (types, priors, forward PK model,
  Monte Carlo/calibration engine, sensitivity analysis). Framework-agnostic,
  no UI dependencies.
- `src/components/` — the input form, results dashboard (range summary,
  concentration-over-time chart, sensitivity tornado chart, assumptions
  panel), and the printable/exportable report view.
- `src/hooks/useEstimation.ts` — wires form state to the engine with a short
  debounce so changing an assumption updates the result live.

## Disclaimer

ClearRange is a prototype decision-support tool. Its default parameters are
illustrative, literature-informed approximations that have not been
validated against an independent dataset. It is not a substitute for review
by a qualified forensic toxicologist and does not provide legal advice.
