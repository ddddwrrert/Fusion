/**
 * Baseline population helpers — same semantics as Organon
 * `plugins/dsh-evolve-loop/src/population.js` (alive / merit).
 * Copied into Fusion so this repo runs without importing upstream sources.
 */

/**
 * @param {unknown} fitness
 * @returns {number}
 */
export function merit(fitness) {
  if (typeof fitness !== 'number' || !Number.isFinite(fitness)) return Number.NEGATIVE_INFINITY
  return fitness
}

/**
 * @param {Array<{ survival?: string }>} rows
 * @returns {Array<object>}
 */
export function alive(rows) {
  return (rows ?? []).filter(row => row && row.survival !== 'no')
}
