import { useEffect, useRef, useState } from "react";
import { estimate } from "../lib/pk/estimate";
import type { CaseInputs, EstimationResult } from "../lib/pk/types";

/**
 * Runs the (moderately expensive) Monte Carlo estimation on a short debounce
 * so the input form stays responsive while typing, but the results update
 * "live" — per the MVP requirement to see assumption changes reflected
 * immediately without an explicit submit step.
 */
export function useEstimation(inputs: CaseInputs, debounceMs = 180) {
  const [result, setResult] = useState<EstimationResult>(() => estimate(inputs));
  const [isComputing, setIsComputing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsComputing(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setResult(estimate(inputs));
      setIsComputing(false);
    }, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(inputs), debounceMs]);

  return { result, isComputing };
}
