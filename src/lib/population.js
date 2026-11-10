/**
 * Vendored from Organon `dsh-evolve-loop/src/population.js` (alive + merit only).
 *
 * Upstream source (Organon-adversarial):
 *   plugins/dsh-evolve-loop/src/population.js
 *   - alive: lines ~64–66
 *   - merit: lines ~76–78
 *
 * Why vendored: `dsh-evolve-loop` package exports only `.` (plugin entry), not
 * `./population.js`. At DSH runtime we still *use* the live population store via
 * `evolve.population()` from that package; these two pure helpers are copied so
 * fusion-loop can cull/rank identically without importing private paths.
 *
 * Keep in sync when upstream merit/alive semantics change.
 *
 * @see docs/UPSTREAM.md
 */

/**
 * Filter the records down to those currently alive (survival === 'yes').
 * @param {object[]} records
 * @returns {object[]}
 */
export function alive(records) {
  return records.filter(record => record.survival === 'yes')
}

/**
 * How good a fitness is, as a weight where bigger is better: the default select, survive and
 * best all rank candidates by it. A fitness of 0 is a failed evaluation and counts as 0, below
 * every real score. A minimize task's evaluator makes its scores negative (-5 beats -20), so
 * those count as 1/|fitness|.
 * @param {number} fitness
 * @returns {number}
 */
export function merit(fitness) {
  return fitness > 0 ? fitness : fitness < 0 ? -1 / fitness : 0
}
