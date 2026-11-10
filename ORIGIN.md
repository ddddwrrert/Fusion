# Vendored upstream-identical code

These files are copied from Organon `plugins/dsh-evolve-loop` so Fusion can be read and reviewed as a full five-slot stack. Behavior matches the upstream defaults unless noted.

| Fusion path | Upstream source | Role |
|-------------|-----------------|------|
| `src/lib/population.js` | `dsh-evolve-loop/src/population.js` | `alive` / `merit` / population.jsonl IO |
| `src/providers/loop.js` | `.../providers/loop.js` | baseline loop (no fuse/commit) |
| `src/providers/select.js` | `.../providers/select.js` | fitness-proportional select |
| `src/providers/mutate.js` | `.../providers/mutate.js` | default candidate-builder |
| `src/providers/evaluate.js` | `.../providers/evaluate.js` | python-subprocess evaluate (needs DSH `subprocess` / optional `sandbox`) |
| `src/providers/run_evaluator.py` | `.../providers/run_evaluator.py` | SkyDiscover-style evaluator runner |
| `src/providers/survive.js` | `.../providers/survive.js` | top-k survive |

Fusion-only deltas:

| Path | What changed |
|------|----------------|
| `src/providers/fuse-loop.js` | = `loop.js` + `fuse` after select + `commit` after append |
| `src/providers/fuse-mutate.js` | = `mutate.js` path + append `K_t` to instruction |
| `src/fuse/**` | evidence / gate / working / chain / commit |

Runtime still depends on **DeepSeek Harness (DSH)** Cordis services and the `evolve` service object provided by `dsh-evolve-loop` (`allocate`, `spawnWorker`, `register`, `files`, …).
