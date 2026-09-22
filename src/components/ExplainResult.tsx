import type { EstimationResult } from "../lib/pk/types";

interface Props {
  result: EstimationResult;
}

export function ExplainResult({ result }: Props) {
  return (
    <details className="group card-glass rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-1)] shadow-[0_20px_60px_-24px_rgba(0,0,0,0.6)] open:pb-5" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Explain this result</span>
          <span className="mt-0.5 block text-xs font-normal normal-case text-[var(--text-muted)]">
            The major inputs behind the estimate above, and how each one shaped it.
          </span>
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 rounded-full border border-[var(--border-strong)] px-2 py-0.5 text-xs text-[var(--text-secondary)] transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>

      <div className="space-y-4 px-5 text-sm">
        {result.explanation.map((factor) => (
          <div key={factor.key} className="border-l-2 border-[var(--series-1)]/30 pl-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
              <span className="font-medium text-[var(--text-primary)]">{factor.label}</span>
              <span className="text-[var(--text-secondary)]">{factor.value}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{factor.detail}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
