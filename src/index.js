/**
 * dsh-evolve-fusion — standalone Cordis companion for dsh-evolve-loop.
 * Opt-in via DSH_EVOLVE_FUSION=1. Does not edit upstream evolve-loop sources.
 *
 * @module dsh-evolve-fusion
 */

import { installFusionProviders, requested } from './install.js'

export const name = 'dsh-evolve-fusion'
export const inject = ['evolve']

/**
 * @param {object} ctx
 */
export function apply(ctx) {
  if (!requested()) return
  const evolve = ctx.evolve
  ctx.effect(() => installFusionProviders(evolve).dispose)
}

export { requested, ENV_FLAG, installFusionProviders } from './install.js'
