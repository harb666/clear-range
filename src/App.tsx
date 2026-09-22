import { useState } from "react";
import { InputForm } from "./components/InputForm";
import { ReportView } from "./components/ReportView";
import { ResultsPanel } from "./components/ResultsPanel";
import { useEstimation } from "./hooks/useEstimation";
import { defaultCaseInputs } from "./lib/defaults";
import type { CaseInputs } from "./lib/pk/types";

function App() {
  const [inputs, setInputs] = useState<CaseInputs>(defaultCaseInputs);
  const [view, setView] = useState<"form" | "report">("form");
  const { result, isComputing } = useEstimation(inputs);

  if (view === "report") {
    return <ReportView result={result} onClose={() => setView("form")} />;
  }

  return (
    <div className="min-h-screen">
      <div className="app-glow-bg" aria-hidden="true" />

      <header className="safe-top no-print header-glass border-b border-[var(--border-hairline)] lg:sticky lg:top-0 lg:z-10">
        <div className="safe-x mx-auto flex max-w-6xl flex-col gap-1 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">ClearRange</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Forensic THC blood-level estimation — UK-focused, evidence-based, probabilistic.
              </p>
            </div>
            <button
              onClick={() => setView("report")}
              className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:bg-[var(--brand-strong)] active:scale-95"
            >
              Export report
            </button>
          </div>
          <p className="mt-2 max-w-4xl text-xs text-[var(--text-muted)]">
            ClearRange provides a mathematical/statistical <strong className="text-[var(--text-secondary)]">estimate</strong> —
            a plausible range, not a single definitive number — of THC blood concentration at a past time. It cannot determine
            someone's actual historical blood THC concentration; only a forensic blood analysis can establish an actual
            measured concentration. It does not determine whether a legal threshold was met, and it is not a substitute for
            laboratory testing or professional forensic interpretation. Individual pharmacokinetics vary substantially between
            people — every result shows its assumptions, evidence base, uncertainty, and sensitivity to those assumptions.
          </p>
        </div>
      </header>

      <main className="safe-x mx-auto grid max-w-6xl grid-cols-1 gap-6 py-6 lg:grid-cols-[360px_1fr]">
        <div className="no-print card-glass rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-1)] p-5 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.6)] lg:sticky lg:top-24 lg:h-fit">
          <InputForm inputs={inputs} onChange={setInputs} />
        </div>

        <div className="relative">
          {isComputing && (
            <div className="absolute right-0 top-0 z-10 flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-1-solid)] px-3 py-1 text-xs text-[var(--text-muted)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand-glow)]" />
              Recalculating…
            </div>
          )}
          <ResultsPanel result={result} />
        </div>
      </main>

      <footer className="safe-bottom safe-x no-print mx-auto max-w-6xl text-xs text-[var(--text-muted)]">
        ClearRange is a prototype decision-support tool. It is not a substitute for review by a qualified forensic
        toxicologist, and it does not provide legal advice.
      </footer>
    </div>
  );
}

export default App;
