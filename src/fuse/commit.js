/**
 * Post-evaluate commit: refresh Working; conditionally append Chain.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fusePaths } from './paths.js'
import { outcomeOf, saveWorking } from './working.js'
import { maybeAppendChain } from './chain.js'

/**
 * @param {object} evolve
 * @param {object} args
 * @param {string} args.parent
 * @param {string} args.child
 * @param {number} args.fitness
 * @param {number} [args.parentFitness]
 * @param {object} [args.kt]
 * @param {string} [args.note]
 * @returns {Promise<{ working: object, chain: object|null }>}
 */
export async function commit(evolve, args) {
  const {
    parent,
    child,
    fitness,
    parentFitness,
    kt,
    note,
  } = args

  const delta = (typeof fitness === 'number' && typeof parentFitness === 'number')
    ? fitness - parentFitness
    : null

  const working = await saveWorking(evolve, {
    parent,
    child,
    fitness,
    parent_fitness: parentFitness ?? null,
    delta,
    outcome: outcomeOf(parentFitness, fitness),
    evidence_ids: kt?.evidence_ids ?? [],
    note: note ?? null,
  })

  // Persist K_t snapshot keyed by child for audit / replay.
  if (kt) {
    const { ktDir, root } = fusePaths(evolve)
    await mkdir(root, { recursive: true })
    await mkdir(ktDir, { recursive: true })
    await writeFile(
      join(ktDir, `${child}.json`),
      `${JSON.stringify({ ...kt, child, parent, fitness }, null, 2)}\n`,
      'utf8',
    )
  }

  let chain = null
  try {
    chain = await maybeAppendChain(evolve, {
      parent,
      child,
      fitness,
      parentFitness,
      kt,
    })
  } catch (err) {
    // Commit must not kill the search loop.
    working.commit_chain_error = String(err?.message ?? err)
    await saveWorking(evolve, working)
  }

  return { working, chain }
}
