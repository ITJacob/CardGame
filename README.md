# 卡牌对战系统 · 核心逻辑层

把《02_详细设计_v1.5》与《03_参数层_v1.5》落地为可运行、可测试、可回放的领域模型。
**不含任何 UI、渲染、网络、持久化**——这一层只负责一件事：把战斗当成确定性纯函数推进。

```
结果 = f(初始状态, 输入序列, seed)
```

## 快速开始

```bash
npm install
npm run typecheck   # 类型检查
npm test            # 53 个测试
npm run smoke       # 跑一场完整战斗并打印过程
npm run build       # 产出 dist/
```

## 目录结构

目录与限界上下文一一对应（上下文是逻辑边界，聚合是事务边界，二者不必重合）：

```
src/
├─ shared/       共享内核：标识、Result、事件字典、元素、目标规格、条件谓词
├─ catalog/      编目（独立聚合）：各 Def、术语编目期展开、编译期校验
├─ battle/       战场：坐标 / 路线 / Placement 唯一占位出口 / Zone
├─ roster/       编队：Unit、属性三层、Gauge / Pool、StatProvenance、状态
├─ scheduling/   调度：BattleClock、ActionOpportunity、先手、可选行为
├─ execution/    执行：Action、I→R→M→O 流水线、近战对撞
├─ effect/       效果：DamageChain、九种效果执行体
├─ random/       随机源治理（R1–R6）
├─ combat/       聚合根 Combat
└─ data/         示例编目（数值占位，结构可用）
```

依赖方向是单向的：`combat → execution / effect / scheduling / roster / battle → shared`。
下层模块只依赖 `shared` 与各自声明的窄接口（`EffectRuntime` / `CombatHost`），
由聚合根实现并注入，因此不存在模块循环。

## 一个必须先定的架构判断

**整场战斗是一个聚合，根是 `Combat`；`Unit` 不是聚合根。**

核心不变量——坍缩后队列无空洞、同一时刻只有一个单位在行动、转向后目标仍是合法坐标——
全都横跨多个单位。若 `Unit` 各自成聚合，这些不变量没有任何聚合内能保证。
代价是聚合变大，缓解方式是内部按"上下文"做逻辑分层，各层只通过明确接口访问。

## 已落地的关键机制

| 机制 | 落点 | 对应不变量 |
|---|---|---|
| Definition + Grant 三层模式 | `catalog/model.ts` | INV-C2 数值单点定义 |
| 术语编目期展开（编译期宏 + 溯源烙印） | `catalog/term-expander.ts` | INV-T1–T5 |
| Placement 唯一占位出口 + 快照回滚 | `battle/placement.ts` | INV-B1–B7 |
| 属性三层 + 溯源账本 | `roster/attributes.ts` `roster/provenance.ts` | INV-P1–P7 |
| tick 八步原子推进 | `scheduling/clock.ts` | INV-S1–S5 |
| I→R→M→O 流水线 | `execution/pipeline*.ts` | INV-E1–E9 |
| 伤害链阶段管道 | `effect/damage-chain.ts` | INV-D1–D5 |
| 随机源治理与登记 | `random/random-source.ts` | R1–R6 |

## 与设计稿的三处偏差（都是为了让模型自洽）

1. **Gauge 的越界扣减时机**。§5.3 的伪码把 `current = overflow` 写在 `advance()` 里，
   但 §6.2 又要求 commit 时 `consume(cost.gaugeAmount)`（默认等于 threshold）。
   若在 advance 里就压成 overflow，"成本 = 阈值"将永远付不起。
   实现取：**advance 只报告越界，扣减发生在 commit**；机会未被消耗时由 `settleOverflow()`
   按策略处理（对应 INV-S4 的"不累积"）。这样行动周期恰好是 `threshold / rate`。

2. **抗性阶段与乘区阶段的关系**。§8.2 说抗性是独立阶段且插在乘区前，
   §3.10 / A14 又说抗性与易伤"同乘区加算后统一乘一次"。
   实现取：抗性是独立阶段（可见于 breakdown、单独钳制），但其贡献累加进同一个乘区桶，
   由乘区阶段统一乘一次——两条要求同时满足。

3. **INV-D4 的作用范围**。"状态伤害不进通用乘区"被解释为
   **不进易伤 / 坚守这类状态提供的乘区，抗性仍然生效**（否则 DoT 无视火抗，不合理）。

## 已知缺口（源自设计稿 §14.2，非实现缺陷）

- 数值全部是占位：DEF 杠杆、再生 12 点总回复、技能伤害基准都标记了待评审。
- `击退 = modify_resource(gauge.current, -50/n)` 里 **n 的含义待确认**（清单第 31 项）。
- `burn` 状态已补（原 15 个状态表里缺它，但三个示例技能都依赖它）。
- 47 条不变量中已有 40+ 条被测试覆盖，剩余以"配置约束"形式存在于 Catalog 编译期校验。

## 下一步建议

1. 把 47 条不变量写成**可执行断言**挂在战斗快照上（现在只有抽样断言）。
2. 定义**事件流 schema**，配合 seed 做精确回放。
3. 数值重新标定：用这个引擎重扫 TTK，回填参数层。
4. 术语词汇表校准 + 技能设计（A20 的推进顺序：先术语，再技能）。
