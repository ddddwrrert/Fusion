/**
 * Install Fusion providers onto an existing evolve service.
 */

import fuseLoop from './providers/fuse-loop.js'
import fuseMutate from './providers/fuse-mutate.js'

export const ENV_FLAG = 'DSH_EVOLVE_FUSION'

/**
 * @param {Record<string, string|undefined>} [env=process.env]
 * @returns {boolean}
 */
export function requested(env = process.env) {
  const value = `${env[ENV_FLAG] ?? ''}`.trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'on'
}

/**
 * Registers fuse-loop + fuse-mutate. Leaves evaluate / survive / select upstream.
 * @param {object} evolve
 * @returns {{ installed: string[], dispose: () => void }}
 */
export function installFusionProviders(evolve) {
  const providers = {
    loop: fuseLoop,
    mutate: fuseMutate,
  }

  const disposers = []
  const installed = []
  for (const [slot, provider] of Object.entries(providers)) {
    disposers.push(evolve.register(slot, provider))
    installed.push(`${slot}=${provider.name}`)
  }

  evolve.fusion = {
    flag: ENV_FLAG,
    installed: [...installed],
  }

  return {
    installed,
    dispose: () => {
      delete evolve.fusion
      for (const dispose of disposers.reverse()) dispose()
    },
  }
}
