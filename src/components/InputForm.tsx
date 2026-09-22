import type { ChangeEvent } from "react";
import { METHOD_LABELS, USE_PATTERN_LABELS } from "../lib/defaults";
import type { CaseInputs, ConsumptionMethod, UsePattern } from "../lib/pk/types";

interface Props {
  inputs: CaseInputs;
  onChange: (next: CaseInputs) => void;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-[var(--text-primary)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
}

const inputCls =
  "mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";

export function InputForm({ inputs, onChange }: Props) {
  const set = <K extends keyof CaseInputs>(key: K, value: CaseInputs[K]) => onChange({ ...inputs, [key]: value });

  const num = (e: ChangeEvent<HTMLInputElement>) => Number(e.target.value);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Cannabis use</h2>

        <Field label="Date &amp; time of use">
          <input
            type="datetime-local"
            className={inputCls}
            value={inputs.useTime}
            onChange={(e) => set("useTime", e.target.value)}
          />
        </Field>

        <Field label="Method of consumption">
          <select
            className={inputCls}
            value={inputs.method}
            onChange={(e) => set("method", e.target.value as ConsumptionMethod)}
          >
            {(Object.keys(METHOD_LABELS) as ConsumptionMethod[]).map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </Field>

        {inputs.method === "oral-edible" ? (
          <Field label="Estimated THC dose consumed (mg)" hint="Labelled or estimated total THC content of the edible.">
            <input
              type="number"
              min={0}
              step={0.5}
              className={inputCls}
              value={inputs.doseMg}
              onChange={(e) => set("doseMg", num(e))}
            />
          </Field>
        ) : (
          <>
            <Field label="Approximate amount consumed (grams)" hint="Total herbal material / concentrate smoked or vaporized in this session.">
              <input
                type="number"
                min={0}
                step={0.05}
                className={inputCls}
                value={inputs.amountGrams}
                onChange={(e) => set("amountGrams", num(e))}
              />
            </Field>
            <Field label="Estimated THC potency (% w/w)" hint="UK herbal cannabis is commonly 10–25%; resin typically lower, concentrates much higher.">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                className={inputCls}
                value={inputs.potencyPercent}
                onChange={(e) => set("potencyPercent", num(e))}
              />
            </Field>
          </>
        )}

        <Field label="Pattern of use" hint="Frequent users show materially slower terminal clearance in the cited literature.">
          <select
            className={inputCls}
            value={inputs.usePattern}
            onChange={(e) => set("usePattern", e.target.value as UsePattern)}
          >
            {(Object.keys(USE_PATTERN_LABELS) as UsePattern[]).map((p) => (
              <option key={p} value={p}>
                {USE_PATTERN_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="space-y-4 border-t border-[var(--border-hairline)] pt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Timeline</h2>

        <Field label="Time of driving / activity (T1)">
          <input
            type="datetime-local"
            className={inputCls}
            value={inputs.activityTime}
            onChange={(e) => set("activityTime", e.target.value)}
          />
        </Field>

        <Field label="Time of blood collection (T2)">
          <input
            type="datetime-local"
            className={inputCls}
            value={inputs.bloodDrawTime}
            onChange={(e) => set("bloodDrawTime", e.target.value)}
          />
        </Field>
      </section>

      <section className="space-y-4 border-t border-[var(--border-hairline)] pt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Laboratory result</h2>

        <Field label="Measured THC concentration at T2 (ng/mL)" hint="Leave blank if not yet available — the tool will still show the prior predictive range.">
          <input
            type="number"
            min={0}
            step={0.1}
            className={inputCls}
            value={inputs.measuredConcentrationNgMl ?? ""}
            placeholder="Not available"
            onChange={(e) =>
              set("measuredConcentrationNgMl", e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </Field>

        {inputs.measuredConcentrationNgMl != null && (
          <Field
            label={`Assumed measurement uncertainty: ±${Math.round(inputs.measurementCv * 100)}%`}
            hint="Combined analytical and short-term biological variability applied when calibrating against this value."
          >
            <input
              type="range"
              min={0.05}
              max={0.5}
              step={0.01}
              className="mt-2 w-full accent-[var(--brand)]"
              value={inputs.measurementCv}
              onChange={(e) => set("measurementCv", Number(e.target.value))}
            />
          </Field>
        )}
      </section>

      <section className="space-y-4 border-t border-[var(--border-hairline)] pt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Individual variables</h2>

        <Field label="Body weight (kg)">
          <input
            type="number"
            min={30}
            max={200}
            step={1}
            className={inputCls}
            value={inputs.bodyWeightKg}
            onChange={(e) => set("bodyWeightKg", num(e))}
          />
        </Field>

        <Field label="Sex" hint="Evidence for a sex-specific effect on THC back-calculation is limited; included as a small, clearly-flagged adjustment only.">
          <select
            className={inputCls}
            value={inputs.sex}
            onChange={(e) => set("sex", e.target.value as CaseInputs["sex"])}
          >
            <option value="unspecified">Prefer not to say / unspecified</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </Field>
      </section>
    </div>
  );
}
