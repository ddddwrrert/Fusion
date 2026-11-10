/**
 * Tiny population helpers (mirrors Organon semantics; local copy, no upstream import).
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
