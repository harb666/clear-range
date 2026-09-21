/** Small self-contained RNG + sampling utilities (no external dependency). */

/** Mulberry32 PRNG — deterministic given a seed, fast, good enough for Monte Carlo simulation (not cryptographic). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal draw via Box-Muller. */
export function sampleNormal(rng: () => number, mean: number, sd: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + sd * z;
}

/**
 * Lognormal draw parameterised by the *median* and a coefficient of
 * variation (CV), which is how PK variability is usually reported.
 * Truncated to a plausible [lowMult, highMult] multiple of the median to
 * avoid pathological tail draws dominating a finite Monte Carlo sample.
 */
export function sampleLognormalFromMedianCv(
  rng: () => number,
  median: number,
  cv: number,
  lowMult = 0.15,
  highMult = 6,
): number {
  const sigma = Math.sqrt(Math.log(1 + cv * cv));
  const mu = Math.log(median);
  let value = Math.exp(sampleNormal(rng, mu, sigma));
  const low = median * lowMult;
  const high = median * highMult;
  if (value < low) value = low;
  if (value > high) value = high;
  return value;
}

/** Uniform draw in [low, high]. */
export function sampleUniform(rng: () => number, low: number, high: number): number {
  return low + rng() * (high - low);
}

/** Weighted quantile of a sample, using the Harrell-Davis-free simple weighted interpolation. */
export function weightedQuantile(values: number[], weights: number[], q: number): number {
  const n = values.length;
  if (n === 0) return NaN;
  const idx = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
  const sortedValues = idx.map((i) => values[i]);
  const sortedWeights = idx.map((i) => weights[i]);
  const totalWeight = sortedWeights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) return sortedValues[Math.floor(q * (n - 1))];

  let cumulative = 0;
  const target = q * totalWeight;
  for (let i = 0; i < n; i++) {
    cumulative += sortedWeights[i];
    if (cumulative >= target) {
      return sortedValues[i];
    }
  }
  return sortedValues[n - 1];
}

/** Effective sample size after importance weighting (Kish's ESS). */
export function effectiveSampleSize(weights: number[]): number {
  const sum = weights.reduce((a, b) => a + b, 0);
  const sumSq = weights.reduce((a, b) => a + b * b, 0);
  if (sumSq === 0) return 0;
  return (sum * sum) / sumSq;
}
