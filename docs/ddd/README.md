# 卡牌对战系统 · 领域模型文档（终版）

本目录是整套领域设计文档的入口。文档按 DDD 限界上下文拆分，每个上下文独立成篇；参数与取值域单独成篇，与架构描述解耦。

## 〇、本仓库的范围（2026-09-05 裁撤后）

本仓库**只承载战斗内核的领域设计**：战场 / 编队 / 调度 / 执行 / 效果 / 编目 / 随机性治理 七个上下文，外加共享内核。

对外契约是「入口 `CombatSetup` → 出口 `CombatEnded`」，战斗内核是一个纯函数：结果 = f(初始状态, 输入序列, 种子)。

**不在此处**的上下文（由游戏主项目的全局蓝图承载）：抽发 Draft、构筑 Progression、跑图征程 Run、事件 Event、名册与队伍 Roster、对局与匹配 Match、元进度 Meta、平衡遥测 Telemetry。

> 原「肉鸽派发」上下文已于 2026-09-05 迁出：按全局蓝图 §5.2 一分为二，构筑结构归 Progression、抽取机制归 Draft。原定义保留在 git 历史 `7e6d01f`。

本文档只描述**当前确定的最终模型**。版本演进、拍板决策记录、示例技能等内容已从各篇剥离，不在此处出现。

## 一、架构总览

整场战斗是一个聚合，根是 `Combat`。所有横跨单位的强一致规则（队列坍缩、先手序列、转向防环）都只能在战斗聚合内保证，因此 Unit 不是聚合根——它是聚合内的实体。Catalog（所有定义态 Def）是独立聚合，不可变、可全局缓存、与战斗运行时完全解耦。

战斗内部用"上下文"做逻辑分层，各层只通过明确接口访问，不允许跨层直接改字段：

| 上下文 | 职责 | 核心实体 | 关键组件 |
|---|---|---|---|
| 战场 | 空间与结构 | Battle / Faction / Lane / Slot / Coordinate / Zone / Domain | Placement（唯一占位出口）、CoordinateQuery、界域栈（压制/优先级） |
| 编队 | 单位与挂载 | Unit / AttributeSet / BaseProfile / Gauge / Pool / StatProvenance / StatusInstance / BehaviorSlot | UnitRegistry、ProfileQuery |
| 调度 | 时间与机会 | BattleClock / ActionOpportunity / Channel / Cooldown | Scheduler（推进 tick、授予机会） |
| 执行 | 动作与流水线 | Action / ActionSource / ResolvedTarget / BehaviorContext | Pipeline（I→R→M→O） |
| 效果 | 结算 | Effect / DamageChain / MitigationStage | EffectExecutor |
| 编目 | 定义态（独立聚合，只读） | 各 Def | Catalog（按 id 解析） |
| 共享内核 | 跨层复用的值对象与规约 | TargetSpec / EffectRef / EffectCondition / RandomSource / 元素 / 术语 | —— |

## 二、通用模式：Definition + Grant

几乎所有"定义态 + 实例态"的概念都遵循同一套契约——定义在 Catalog 里、`Grant` 携带本次实例的具体参数、`Instance` 是二者结合的产物：

- **EffectDef → EffectRef → Effect**
- **BehaviorTemplate → SkillDef → BehaviorSlot**
- **StatusDef → StatusGrant → StatusInstance**
- **ZoneDef → ZoneGrant → Zone**
- **DomainDef → DomainGrant → DomainInstance**
- **TermDef → TermGrant →（编目期展开后消失，只留 originTerm 烙印）**

三条铁律：
1. 默认值与上下限只写在 Def，实例值只写在 Grant。任何一处都不许两写。
2. Grant 是值对象，创建后不可变；Instance 持有它的副本。
3. Def 不可变、可缓存、可共享；同一 Def 可产生任意多个不同 Grant 的实例。

元素（Element）不属于本模式：它是一个枚举型标签值对象，没有"默认/覆写/实例"三层，直接挂在 EffectDef 上。

## 三、一致性边界

| 范围 | 一致性 | 说明 |
|---|---|---|
| 一次结算步骤内的全部变更 | 强一致（原子） | 一个 Action 从点火到落地的完整过程；失败则整体回滚到步骤开始前的战斗快照 |
| 一个 tick 内的全部推进 | 强一致 | 资源累积、引导/冷却递减、引导完成结算，作为一个原子步 |
| 战斗 ↔ 战斗 | 无一致性需求 | 各战斗独立 |
| 战斗 ↔ Catalog | 启动时快照 | 战斗创建时把所引用的全部 Def 快照进战斗内，之后配置变更不影响进行中的战斗（保证回放与验证可复现） |
| 战斗 → 外部（UI / 回放 / 统计） | 最终一致 | 通过领域事件异步广播，不参与战斗一致性 |

快照 Catalog 这条与随机性铁律是同一件事的两面：外部输入（配置）与内部随机（RandomSource）都必须在战斗启动时被固定，战斗才是一个纯函数——结果 = f(初始状态, 输入序列, 种子)。

## 四、文档导航

### 领域上下文（架构描述）
- [战场上下文](./contexts/战场上下文.md)
- [编队上下文](./contexts/编队上下文.md)
- [调度上下文](./contexts/调度上下文.md)
- [执行上下文](./contexts/执行上下文.md)
- [效果上下文](./contexts/效果上下文.md)
- [编目上下文](./contexts/编目上下文.md)
- [共享内核](./contexts/共享内核.md)
- [随机性治理](./contexts/随机性治理.md)

### 参数与取值域（独立于架构）
- [战场参数](./params/战场参数.md)
- [编队参数](./params/编队参数.md)
- [调度参数](./params/调度参数.md)
- [执行参数](./params/执行参数.md)
- [效果参数](./params/效果参数.md)
- [编目参数](./params/编目参数.md)
- [共享内核参数](./params/共享内核参数.md)
- [源质维度与跨系枢纽](./params/源质维度与跨系枢纽.md)（九大源质系 v0.3 引擎侧落地：6 咬合器维度 + 2 万能接口 + 5 枢纽状态 `crossPathway` 白名单，数值 ⚠️D 占位）
- [数值标定基准](./params/数值标定基准.md)（v0.3 技能池占位数值的收敛方案：1751 处占位盘点、三层数值模型、费用层经验基线表、效果层梯度缺口与待拍板项）

### 辅助索引

- **旧框架编号 → 本目录落点的对照表**（技能稿引用的《框架改动记录》A–H 组 / v1.5 决策记录编号，含 2026-09-04 裁决变更与暂缓项）已迁至 [`docs/skill-design/_GENERATION_BRIEF.md`](../skill-design/_GENERATION_BRIEF.md) §7–§9。

  本目录不再维护该表——它服务的是技能稿，与技能稿放在一起更合理；原 `LEGACY_REFS.md` 已于 2026-09-05 删除。

## 五、不变量总览（按上下文）

共 54 条，分布如下：战场 12 · 编队 9 · 调度 5 · 执行 9 · 效果 10 · 编目 9。共享内核与随机性治理不在此处以 INV 编号表达（前者为值对象，后者以 R1–R6 规则表达）。各条完整定义见对应上下文文档末尾。
