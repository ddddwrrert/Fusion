# Fusion

**Gate-fused multi-source context before mutate; dual-memory commit after evaluate.**

npm 包名：`dsh-evolve-fusion`  
仓库：https://github.com/ddddwrrert/Fusion

---

## 从另一台电脑拉下来能直接跑吗？

**能。** 不需要 DSH / Organon / LLM，只要 Node ≥ 22：

```bash
git clone https://github.com/ddddwrrert/Fusion.git
cd Fusion
npm install
npm test
npm start
```

`npm start` = 独立 runner：`select → fuse → mutate → evaluate → commit → survive`，账本写在 `./run/fuse/`。

| 目标 | 命令 | 依赖 |
|------|------|------|
| 单测 | `npm test` | 仅本仓 + vitest |
| 端到端离线环 | `npm start` | 仅本仓（自带 baseline + standalone harness） |
| 对照原版环 | `npm start -- --mode baseline` | 仅本仓（`src/baseline/*` 是原框架同构拷贝） |
| 挂进真 DSH / 官方 V | 见下文「作为 DSH 插件」 | 需要本机已有 `dsh-evolve-loop` |

> **注意：** 官方 AHC / 密封 judge **不在本仓**。`npm start` 用 demo 任务的 `score_hint` 假分，只验证 Fusion 环与账本。真题评测要接 Organon 的 `evaluate`。

---

## 新循环（Fusion）

```text
select(parent)
  → fuse: Evidence[] → gate → K_t     # 本仓新增
  → mutate(parent, K_t)
  → evaluate                          # standalone 假分 / DSH 下官方 V
  → population.append
  → commit: Working + optional Chain  # 本仓新增
  → survive
```

---

## 与原框架同构的代码（已写进本仓）

不 import 上游源码；下列文件是 Organon `dsh-evolve-loop` 默认行为的**仓内拷贝/等价实现**，保证离线可跑、可对照：

| 本仓路径 | 对应原框架 | 作用 |
|----------|------------|------|
| `src/baseline/loop.js` | `providers/loop.js` | 原版五槽环：`select→mutate→evaluate→survive` |
| `src/baseline/mutate.js` | `providers/mutate.js` | 原版 candidate-builder（allocate + spawnWorker） |
| `src/baseline/select.js` | 默认选父 | 按 merit 选最优存活个体 |
| `src/baseline/survive.js` | 默认裁员 | top-k by merit |
| `src/baseline/population.js` | `population.js` | `alive` / `merit` |
| `src/standalone/harness.js` | evolve 服务子集 | 无 DSH 时提供 `allocate/evaluate/spawnWorker/...` |

Fusion 自己的新增在：

- `src/providers/fuse-loop.js` / `fuse-mutate.js`
- `src/fuse/*`（evidence / gate / working / chain / commit）

---

## 作为 DSH 插件（可选）

本机已安装 DeepSeek Harness + `dsh-evolve-loop` 时：

```bash
dsh plugin --profile web add /path/to/Fusion
export DSH_EVOLVE_FUSION=1
```

只注册 `loop=fusion-loop`、`mutate=fusion-mutate`；**不改**上游 `evaluate`。关掉 env 即回原版五槽。

---

## Layout

```text
bin/fusion-run.js          # clone 后直接跑
tasks/demo/                # 离线 demo 题
src/
  baseline/                # 原框架同构拷贝
  standalone/harness.js    # 无 DSH evolve 服务
  providers/fuse-*.js      # Fusion 环
  fuse/                    # 融合 + commit 账本
tests/
```

## Invariants

1. 融合文本只进 worker instruction，不进 fitness  
2. Chain 只存磁盘真 diff，不用 LLM 摘要  
3. fuse/commit 失败不得打断主环  
4. DSH 模式下官方 `evaluate` 仍是唯一真分  

## License

MIT
