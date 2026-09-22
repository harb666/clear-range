import { useEffect, useState, type InputHTMLAttributes } from "react";
import { METHOD_ORDER, METHOD_SHORT_LABELS, USE_PATTERN_LABELS } from "../lib/defaults";
import { validateInputs } from "../lib/validate";
import type { CaseInputs, CaseNotice, ConsumptionMethod, UsePattern } from "../lib/pk/types";
import { ArcPicker } from "./ArcPicker";

type NumberFieldExtras = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">;

/**
 * A number input that isn't fully controlled by the parsed numeric value.
 * A plain `<input type="number" value={n} onChange={e => set(Number(e.target.value))}>`
 * can never actually be cleared: as soon as the field becomes empty,
 * `Number("")` is `0`, not `NaN`, so the parent's numeric state snaps to 0
 * and the input re-renders showing "0" — backspacing further does nothing
 * visible, so the field feels stuck. This keeps its own text buffer so the
 * field can be freely emptied/edited while focused, and only commits (and
 * re-syncs to the canonical value) once the text is a real, different number
 * or the field loses focus.
 */
function NumberField({ value, onChange, ...rest }: { value: number; onChange: (n: number) => void } & NumberFieldExtras) {
  const [text, setText] = useState(String(value));

  // Re-sync the displayed text when `value` changes for a reason other than
  // this field's own typing (e.g. a reset, or another control changing it).
  // Only overwrites `text` when it doesn't already represent `value`, so
  // in-progress typing that hasn't committed yet (empty, "-", trailing ".")
  // isn't clobbered on every keystroke's own round-trip through the parent.
  useEffect(() => {
    setText((prev) => {
      const parsed = Number(prev);
      if (prev === "" || !Number.isFinite(parsed) || parsed !== value) return String(value);
      return prev;
    });
  }, [value]);

  return (
    <input
      type="number"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw === "" || raw === "-" || raw.endsWith(".")) return;
        const n = Number(raw);
        if (Number.isFinite(n)) onChange(n);
      }}
      onBlur={() => setText(String(value))}
      {...rest}
    />
  );
}

/** Same idea as NumberField, for the one input whose domain value can be null (not "not yet entered" = 0). */
function NullableNumberField({
  value,
  onChange,
  ...rest
}: { value: number | null; onChange: (n: number | null) => void } & NumberFieldExtras) {
  const [text, setText] = useState(value == null ? "" : String(value));

  useEffect(() => {
    setText((prev) => {
      if (value == null) return prev === "" ? prev : "";
      const parsed = Number(prev);
      if (prev === "" || !Number.isFinite(parsed) || parsed !== value) return String(value);
      return prev;
    });
  }, [value]);

  return (
    <input
      type="number"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw === "") {
          onChange(null);
          return;
        }
        if (raw === "-" || raw.endsWith(".")) return;
        const n = Number(raw);
        if (Number.isFinite(n)) onChange(n);
      }}
      onBlur={() => setText(value == null ? "" : String(value))}
      {...rest}
    />
  );
}

interface Props {
  inputs: CaseInputs;
  onChange: (next: CaseInputs) => void;
}

function Field({
  label,
  hint,
  notice,
  children,
}: {
  label: string;
  hint?: string;
  notice?: CaseNotice;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-[var(--text-primary)]">{label}</span>
      {children}
      {notice && (
        <span className={`mt-1 block text-xs ${notice.severity === "error" ? "text-[var(--status-critical)]" : "text-[var(--status-warning)]"}`}>
          {notice.message}
        </span>
      )}
      {hint && !notice && <span className="mt-1 block text-xs text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
}

const inputCls =
  "mt-1 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";
const inputErrorCls =
  "mt-1 w-full rounded-md border border-[var(--status-critical)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--status-critical)] focus:outline-none focus:ring-1 focus:ring-[var(--status-critical)]";

export function InputForm({ inputs, onChange }: Props) {
  const set = <K extends keyof CaseInputs>(key: K, value: CaseInputs[K]) => onChange({ ...inputs, [key]: value });

  const issues = validateInputs(inputs);
  const issueFor = (field: keyof CaseInputs) => issues.find((i) => i.field === field);
  const clsFor = (field: keyof CaseInputs) => (issueFor(field)?.severity === "error" ? inputErrorCls : inputCls);

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

        <div>
          <span className="block text-sm font-medium text-[var(--text-primary)]">Method of consumption</span>
          <div className="mt-1">
            <ArcPicker
              ariaLabel="Method of consumption"
              value={inputs.method}
              onChange={(v) => set("method", v as ConsumptionMethod)}
              options={METHOD_ORDER.map((m) => ({ value: m, label: METHOD_SHORT_LABELS[m] }))}
            />
          </div>
        </div>

        {inputs.method === "oral-edible" ? (
          <Field
            label="Estimated THC dose consumed (mg)"
            hint="Labelled or estimated total THC content of the edible."
            notice={issueFor("doseMg")}
          >
            <NumberField
              min={0}
              step={0.5}
              className={clsFor("doseMg")}
              aria-invalid={issueFor("doseMg")?.severity === "error"}
              value={inputs.doseMg}
              onChange={(n) => set("doseMg", n)}
            />
          </Field>
        ) : (
          <>
            <Field
              label="Approximate amount consumed (grams)"
              hint="Total herbal material / concentrate smoked or vaporized in this session."
              notice={issueFor("amountGrams")}
            >
              <NumberField
                min={0}
                step={0.05}
                className={clsFor("amountGrams")}
                aria-invalid={issueFor("amountGrams")?.severity === "error"}
                value={inputs.amountGrams}
                onChange={(n) => set("amountGrams", n)}
              />
            </Field>
            <Field
              label="Estimated THC potency (% w/w)"
              hint="UK herbal cannabis is commonly 10–25%; resin typically lower, concentrates much higher."
              notice={issueFor("potencyPercent")}
            >
              <NumberField
                min={0}
                max={100}
                step={0.5}
                className={clsFor("potencyPercent")}
                aria-invalid={issueFor("potencyPercent")?.severity === "error"}
                value={inputs.potencyPercent}
                onChange={(n) => set("potencyPercent", n)}
              />
            </Field>
          </>
        )}

        <Field
          label="Pattern of use"
          hint="A modelling category, not a diagnosis — it selects which elimination-rate assumptions apply. Regular/daily use is modelled with materially slower clearance than a single or occasional use."
        >
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
          <NullableNumberField
            min={0}
            step={0.1}
            className={inputCls}
            value={inputs.measuredConcentrationNgMl}
            placeholder="Not available"
            onChange={(n) => set("measuredConcentrationNgMl", n)}
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

        <Field label="Body weight (kg)" notice={issueFor("bodyWeightKg")}>
          <NumberField
            min={30}
            max={200}
            step={1}
            className={clsFor("bodyWeightKg")}
            aria-invalid={issueFor("bodyWeightKg")?.severity === "error"}
            value={inputs.bodyWeightKg}
            onChange={(n) => set("bodyWeightKg", n)}
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
