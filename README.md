# Fusion

**Gate-fused multi-source context before mutate; dual-memory commit after evaluate.**

`dsh-evolve-fusion` is a standalone Cordis companion plugin for **DeepSeek Harness (DSH)** + Organon [`dsh-evolve-loop`](https://github.com/). It **depends on DSH / `dsh-evolve-loop` at runtime** (`evolve` service) and does **not** modify upstream evolve-loop sources.

**同源代码清单：** [`ORIGIN.md`](ORIGIN.md)  
**依赖 / DIFF 明细：** [`docs/UPSTREAM.md`](docs/UPSTREAM.md)  

与原框架相同且本仓用到的文件已整份写出（`population.js`、`providers/{loop,select,mutate,evaluate,survive}.js`、`run_evaluator.py`）；运行时仍依赖 DSH 的 `evolve` / `subprocess` 等服务。

It registers:

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
  population.js                  # VENDORED = Organon population.js
  index.js / install.js          # Cordis opt-in (depends on evolve)
  providers/
    loop.js select.js mutate.js  # VENDORED upstream defaults
    evaluate.js survive.js run_evaluator.py
    fuse-loop.js                 # = loop.js + fuse + commit
    fuse-mutate.js               # = mutate.js + K_t
  fuse/                          # Fusion-only
tests/ examples/ tasks/demo/
ORIGIN.md  docs/UPSTREAM.md
```


## Invariants

1. Fusion text enters **worker instructions only**, never fitness.
2. Chain patches are disk diffs, never LLM summaries.
3. Commit / fuse failures must not abort the search loop.
4. Upstream `evaluate` remains the only official score path.

## License

MIT
