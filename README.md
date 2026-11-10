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

## What runs after `git clone` on another machine?

| Goal | Clone-and-run? | Need the same extras |
|------|----------------|----------------------|
| Unit tests + mock loop | **Yes** | **Node.js ≥ 22**, `npm` |
| Real Organon / DSH evolve with LLM workers | **No (not this repo alone)** | Same stack as any `dsh-evolve-loop` run (below) |

This repo is a **companion plugin**. Offline smoke proves Fusion’s fuse/commit logic. It does **not** ship DeepSeek Harness, `dsh-evolve-loop`, a task evaluator, or model API keys.

### A. Offline (any PC with Node 22+)

```bash
git clone https://github.com/ddddwrrert/Fusion.git
cd Fusion
npm install
npm test
npm run example:mock
```

Expected: 13 tests pass; mock prints `[result]`, `[working]`, `[chain lines]`.  
No DSH, no GPU, no API key.

### B. Real DSH / Organon evolve (same prerequisites as Organon)

You need **the same environment you already use for evolve**, plus this plugin:

1. **Node.js ≥ 22**
2. **DeepSeek Harness (`dsh`)** installed and a working profile (e.g. `web` / `headless`)
3. **`dsh-evolve-loop`** loaded in that profile (provides `evolve`)
4. A **task directory** with `task.json` + `evaluator/` + `#EVOLVE_START`…`#EVOLVE_END` solution (same as Organon)
5. **LLM credentials** for worker `spawnWorker` (same provider keys you use for mutate)
6. This plugin installed into the profile, then:

```bash
# from the Fusion checkout
dsh plugin --profile web add ./

export DSH_EVOLVE_FUSION=1
# then run evolve as usual (evolve_run / your Organon task workflow)
```

Unset / omit `DSH_EVOLVE_FUSION` → upstream five-slot baseline (A/B).

**Not included / not auto-installed:** Cordis, `dsh-tools`, `dsh-evolve-loop` (listed as optional peers so `npm install` works offline).

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
