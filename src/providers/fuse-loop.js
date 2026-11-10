/**
 * Fusion loop: select → fuse(K_t) → mutate|K_t → evaluate → record → commit → survive.
 */

import { alive, merit } from '../lib/population.js'
import { fuse } from '../fuse/fuse.js'
import { commit } from '../fuse/commit.js'

export const name = 'fusion-loop'

/**
 * @param {object} args
 * @param {object} evolve
 * @returns {Promise<{ best_id: string, best_fitness: number, remaining: number }>}
 */
export async function run(args, evolve) {
  const { maxPopulation, candidates } = await evolve.context()
  const population = evolve.population()
  const runState = evolve.currentRun()

  let rows = await population.rows()
  if (rows.length === 0) {
    const base = await evolve.copyTask()
    const baseFitness = await evolve.evaluate(base)
    await population.append({
      id: base.id,
      parent: null,
      fitness: baseFitness,
      survival: 'yes',
    })
    rows = await population.rows()
  }

  const limit = candidates ?? Infinity
  let created = 0

  while ((await evolve.context()).budget.remaining > 0 && created < limit) {
    runState.signal.throwIfAborted()

    const parentId = await evolve.select(population)
    rows = await population.rows()
    const parentRow = rows.find(r => r.id === parentId)
    const parentFitness = typeof parentRow?.fitness === 'number' ? parentRow.fitness : undefined

    // --- inserted: fuse ---
    let kt = { text: '', evidence_ids: [], truncated: false, max_chars: 0 }
    try {
      kt = await fuse(evolve, { parentId, rows })
    } catch (err) {
      // Fusion failure must not stop the run; degrade to empty K_t.
      kt = {
        text: `[FUSED CONTEXT unavailable: ${String(err?.message ?? err)}]`,
        evidence_ids: [],
        truncated: false,
        max_chars: 0,
        error: String(err?.message ?? err),
      }
    }

    const candidate = await evolve.mutate({
      parent: parentId,
      parentFitness,
      fuseKt: kt,
    })
    created += 1

    const fitness = await evolve.evaluate(candidate)

    await population.append({
      id: candidate.id,
      parent: parentId,
      fitness,
      survival: 'yes',
    })

    // --- inserted: commit ---
    try {
      await commit(evolve, {
        parent: parentId,
        child: candidate.id,
        fitness,
        parentFitness,
        kt,
      })
    } catch {
      // never block the loop
    }

    rows = await population.rows()
    if (alive(rows).length >= maxPopulation) {
      await evolve.survive(population)
      rows = await population.rows()
    }
  }

  rows = await population.rows()
  let best = rows[0]
  for (const row of rows) {
    if (best === undefined || merit(row.fitness) > merit(best.fitness)) {
      best = row
    }
  }

  const budget = (await evolve.context()).budget
  return {
    best_id: best?.id ?? 'c000000',
    best_fitness: best?.fitness ?? 0,
    remaining: budget.remaining,
  }
}

export default { name, run }
