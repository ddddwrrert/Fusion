# Upstream / DSH dependency map

Fusion is a **companion** to Organon `dsh-evolve-loop` on DeepSeek Harness (DSH).
It may depend on DSH / `dsh-evolve-loop` at runtime. It does **not** fork the
evolve-loop git tree; it registers providers onto the live `evolve` service.

## 1. Runtime dependency (preferred — no code copy)

These APIs come from **`dsh-evolve-loop`’s `evolve` service** (injected by DSH
Cordis). Fusion calls them; it does not reimplement them.

| Fusion call site | Evolve API | Provided by |
|------------------|------------|-------------|
| `src/index.js` | `inject: ['evolve']` | Cordis + `dsh-evolve-loop` |
| `src/install.js` | `evolve.register(slot, provider)` | `dsh-evolve-loop/src/evolve.js` |
| `fuse-loop.js` | `evolve.context()` | same |
| `fuse-loop.js` | `evolve.population()` / `.rows()` / `.append()` | `population.js` via evolve |
| `fuse-loop.js` | `evolve.copyTask()` | evolve |
| `fuse-loop.js` | `evolve.select(population)` | active **select** provider (upstream default unless replaced) |
| `fuse-loop.js` | `evolve.mutate({...})` | **fusion-mutate** when this plugin is on |
| `fuse-loop.js` | `evolve.evaluate(candidate)` | sealed upstream **evaluate** (never replaced by Fusion) |
| `fuse-loop.js` | `evolve.survive(population)` | upstream **survive** |
| `fuse-loop.js` | `evolve.currentRun().signal` | evolve run control |
| `fuse-mutate.js` | `evolve.allocate(parent)` | evolve |
| `fuse-mutate.js` | `evolve.spawnWorker(dir, instruction, opts)` | evolve (DSH subagents) |
| `fuse-mutate.js` | `evolve.population().rows()` | parent fitness lookup |

**DSH packages (peer):**

- `@deepseek-ai/cordis`
- `@deepseek-ai/dsh-tools`
- `dsh-evolve-loop` (Organon evolve plugin; install into the same DSH profile)

Enable: `DSH_EVOLVE_FUSION=1` after both plugins are in the profile bundle.

## 2. Vendored / forked source (same logic written out)

`dsh-evolve-loop` does not export helper subpaths on npm (`exports` only `"."`).
Where Fusion needs the **same pure helpers or loop skeleton**, the code is
written out below and marked in-file.

### 2.1 `alive` / `merit` — exact upstream

| Fusion | Upstream |
|--------|----------|
| `src/lib/population.js` | `plugins/dsh-evolve-loop/src/population.js` (`alive`, `merit`) |

Semantics must match Organon select/survive/best ranking.

### 2.2 `fusion-loop` — fork of default `evolve-loop`

| Fusion | Upstream |
|--------|----------|
| `src/providers/fuse-loop.js` | `plugins/dsh-evolve-loop/src/providers/loop.js` |

**Same as upstream:**

- empty population → `copyTask` + `evaluate` + append baseline `c000000`
- while budget: `select` → `mutate` → `evaluate` → `append` → maybe `survive`
- final best by `merit(fitness)`
- return `{ best_id, best_fitness, remaining }`

**Diff only (Fusion inserts):**

1. After `select`, before `mutate`: `fuse(evolve, { parentId, rows })` → `K_t`
2. `mutate({ parent, parentFitness, fuseKt: K_t })`
3. After `append`, before `survive`: `commit(...)` → Working + Chain

### 2.3 `fusion-mutate` — fork of default `candidate-builder`

| Fusion | Upstream |
|--------|----------|
| `src/providers/fuse-mutate.js` | `plugins/dsh-evolve-loop/src/providers/mutate.js` |

**Same as upstream:**

- `defaultPersona()` text
- parent fitness resolution from population
- `allocate` + `spawnWorker` + abort rethrow pattern
- EVOLVE_START/END + “do not run official evaluator” instruction rules

**Diff only:**

- `buildInstruction(parentFitness, kt)` appends fused `K_t.text`
- accepts `fuseKt` / `kt` options
- stamps `candidate.fusion = { evidence_ids, ... }`

### 2.4 Install pattern — same as A2 / SELEXIS companions

| Fusion | Upstream pattern |
|--------|------------------|
| `src/install.js` | `dsh-evolve-loop/src/a2/install.js`, `dsh-selexis/src/install.js` |
| `src/index.js` | `dsh-selexis/src/index.js` (`inject: ['evolve']`, env opt-in) |
| `cordis.patch.yml` | companion `- insert: name: …` |

## 3. Fusion-original modules (not in upstream)

| Module | Role |
|--------|------|
| `src/fuse/evidence.js` | multi-source Evidence collect |
| `src/fuse/gate.js` | late gate → `K_t` |
| `src/fuse/fuse.js` | fuse step orchestration |
| `src/fuse/working.js` | fast-layer Working memory |
| `src/fuse/chain.js` | slow-layer true diff chain |
| `src/fuse/commit.js` | post-eval commit |
| `src/fuse/diff.js` | zero-LLM unified diff |
| `src/fuse/paths.js` | `run/fuse/**` paths |

## 4. Local Organon checkout (optional)

If `dsh-evolve-loop` is not on npm in your environment, install from a sibling
Organon tree into the DSH profile (same as other companion plugins), e.g.:

```bash
dsh plugin --profile web add /path/to/Organon-adversarial/plugins/dsh-evolve-loop
dsh plugin --profile web add /path/to/Fusion
export DSH_EVOLVE_FUSION=1
```
