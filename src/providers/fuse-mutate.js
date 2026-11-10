/**
 * Fusion mutate: injects K_t into the worker instruction.
 * Uses evolve.allocate + evolve.spawnWorker only (no upstream source imports).
 */

export const name = 'fusion-mutate'

/** @returns {string} */
export function defaultPersona() {
  return 'You are a solution worker in an evolutionary search. Design and implement one complete candidate in your assigned directory. IMPLEMENT A SINGLE SOLUTION. DO NOT ATTEMPT MULTIPLE SOLUTIONS.'
}

/**
 * @param {number} [parentFitness]
 * @param {object} [kt]
 * @returns {string}
 */
export function buildInstruction(parentFitness, kt) {
  const lines = [
    'Read the task statement and the parent solution in this directory.',
  ]

  if (typeof parentFitness === 'number' && Number.isFinite(parentFitness)) {
    lines.push(`The parent candidate's official fitness was ${parentFitness}.`)
  }

  lines.push(
    'Understand how the current solution works, consider how it could better satisfy the task, and implement your chosen improvement as one complete candidate.',
    'Edit only the solution code between the #EVOLVE_START and #EVOLVE_END markers; leave all other task files and code unchanged.',
    'This directory is one allocated candidate and one complete solution attempt. You may reason about alternatives, but do not write, run, or compare several complete implementations here.',
    'Do not run the task\'s official evaluator or performance benchmarks; the search loop evaluates your candidate after you finish.',
  )

  if (kt?.text) {
    lines.push('', String(kt.text).trim())
  }

  return lines.join('\n')
}

/**
 * @param {object} options
 * @param {object} evolve
 * @returns {Promise<{ id: string, dir: string, fusion?: object }>}
 */
export async function mutate(options, evolve) {
  const {
    parent,
    parentFitness: providedFitness,
    instruction: providedInstruction,
    fuseKt,
    kt,
    name: workerName,
    description,
    persona = defaultPersona(),
    model,
    allowShell = true,
    allowedTools,
    maxDepth,
    ...extra
  } = options ?? {}

  if (!parent) throw new Error('mutate needs a parent candidate id')

  let parentFitness = providedFitness
  if (parentFitness === undefined && evolve?.population) {
    const rows = await evolve.population().rows()
    const parentRow = rows.find(r => r.id === parent)
    if (parentRow && typeof parentRow.fitness === 'number') {
      parentFitness = parentRow.fitness
    }
  }

  const fused = fuseKt ?? kt ?? null
  const instruction = providedInstruction ?? buildInstruction(parentFitness, fused)
  const candidate = await evolve.allocate(parent)
  const workerLabel = workerName ?? description ?? 'fusion-mutator'

  try {
    await evolve.spawnWorker(candidate.dir, instruction, {
      label: workerLabel,
      persona,
      model,
      allowShell,
      allowedTools,
      maxDepth,
      ...extra,
    })
  } catch (error) {
    const currentRun = evolve.currentRun?.()
    if (currentRun?.signal?.aborted) throw error
  }

  candidate.fusion = {
    parentFitness,
    evidence_ids: fused?.evidence_ids ?? [],
    truncated: Boolean(fused?.truncated),
  }

  return candidate
}

export default { name, mutate, buildInstruction, defaultPersona }
