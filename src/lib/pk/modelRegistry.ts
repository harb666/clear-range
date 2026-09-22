/**
 * How to replace the scientific model later without touching the UI.
 *
 * The UI only ever calls `estimate(inputs): EstimationResult` from
 * `estimate.ts`. Everything upstream of that function is the "model":
 *
 *   parameters.ts        literature-informed prior distributions
 *   sampleParameters.ts  turns CaseInputs + a prior into one parameter draw
 *   model.ts             turns one parameter draw into a concentration curve
 *   simulate.ts          Monte Carlo + SIR calibration engine
 *   sensitivity.ts        one-at-a-time sensitivity analysis
 *
 * To integrate a model fitted to a validated dataset (e.g. the ~1,000-
 * participant timed-use + blood-THC study described in the project's
 * long-term goal), the intended path is:
 *
 * 1. Fit population PK parameter distributions (by route and use-pattern,
 *    or by whatever covariate structure the data supports) from the new
 *    dataset, and express them in the same shape as `RouteAbsorptionPrior`
 *    / `UsePatternPrior` in parameters.ts — or replace those types
 *    entirely if the new model has a different structure (e.g. a proper
 *    multi-compartment ODE, or a Bayesian hierarchical model with subject-
 *    level random effects).
 * 2. Replace `sampleParameters.ts` and/or `model.ts` accordingly. The only
 *    contract the rest of the app relies on is: given `CaseInputs` and an
 *    RNG, produce a `PkParameterSample` (or a richer replacement type) and
 *    a way to evaluate concentration at any elapsed time.
 * 3. Bump `MODEL_VERSION` in parameters.ts (or wherever the new model
 *    defines it) — it is threaded through to `EstimationResult.modelVersion`
 *    and shown on every result and exported report, so past results remain
 *    attributable to the model version that produced them.
 * 4. `simulate.ts`'s SIR calibration logic (reweighting simulated curves by
 *    how well they predict a measured T2 value) is model-agnostic and can
 *    likely be reused unchanged; `sensitivity.ts` similarly only depends on
 *    `runSimulation`/`bandAtHours`.
 *
 * This separation is deliberate: it should be possible to go from "MVP
 * literature prior" to "validated population model" as a change confined to
 * `lib/pk/`, with zero changes required in `components/`.
 */
export {};
