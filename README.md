# Fusion

**Gate-fused multi-source context before mutate; dual-memory commit after evaluate.**

`dsh-evolve-fusion` is a standalone Cordis companion plugin for [`dsh-evolve-loop`](https://github.com/) / Organon. It does **not** modify upstream evolve-loop sources. It registers:

| Slot | Provider | Role |
|------|----------|------|
| `loop` | `fusion-loop` | `select → fuse(K_t) → mutate\|K_t → evaluate → commit → survive` |
| `mutate` | `fusion-mutate` | Injects fused `K_t` into the worker instruction |

`evaluate` / `select` / `survive` stay upstream (official sealed \(V\) untouched).

## Loop

```text
select(parent)
  → fuse: Evidence[] → gate → K_t     # NEW
  → mutate(parent, K_t)
  → evaluate                          # sealed official V
  → population.append
  → commit: Working + optional Chain  # NEW
  → survive
```

### Fuse (before mutate)

Collects evidence from:

- parent fitness / deficit vs best
- sibling true diffs (higher-fitness peers)
- Working (last attempt outcome)
- Chain (recent accepted true diffs)

Then **late-gates** into a character-bounded `K_t` prompt block.

### Commit (after evaluate)

- **Working** (`run/fuse/working.json`): overwritten every step
- **Chain** (`run/fuse/chain.jsonl`): append-only **true unified diff** only when `fitness > parent_fitness` (zero LLM)

## Install (DSH profile)

```bash
# from this repo
dsh plugin --profile web add ./   # or publish and: dsh plugin add dsh-evolve-fusion

export DSH_EVOLVE_FUSION=1
```

Requires `dsh-evolve-loop` already providing the `evolve` service.

Disable the flag to restore the default five-slot baseline for A/B runs.

## Offline smoke (no DSH / no LLM)

```bash
npm install
npm test
npm run example:mock
```

## Layout

```text
src/
  index.js / install.js          # Cordis opt-in
  providers/fuse-loop.js         # new loop
  providers/fuse-mutate.js       # K_t → worker
  fuse/
    evidence.js  gate.js  fuse.js
    working.js   chain.js  commit.js
    diff.js      paths.js
tests/                           # vitest
examples/mock-evolve-run.js
```

## Invariants

1. Fusion text enters **worker instructions only**, never fitness.
2. Chain patches are disk diffs, never LLM summaries.
3. Commit / fuse failures must not abort the search loop.
4. Upstream `evaluate` remains the only official score path.

## License

MIT
