# 卡牌对战系统 · 领域模型文档（终版）

本目录是整套领域设计文档的入口。文档按 DDD 限界上下文拆分，每个上下文独立成篇；参数与取值域单独成篇，与架构描述解耦。

本文档只描述**当前确定的最终模型**。版本演进、拍板决策记录、示例技能等内容已从各篇剥离，不在此处出现。

## 一、架构总览

整场战斗是一个聚合，根是 `Combat`。所有横跨单位的强一致规则（队列坍缩、先手序列、转向防环）都只能在战斗聚合内保证，因此 Unit 不是聚合根——它是聚合内的实体。Catalog（所有定义态 Def）是独立聚合，不可变、可全局缓存、与战斗运行时完全解耦。

战斗内部用"上下文"做逻辑分层，各层只通过明确接口访问，不允许跨层直接改字段：

| 上下文 | 职责 | 核心实体 | 关键组件 |
|---|---|---|---|
| 战场 | 空间与结构 | Battle / Faction / Lane / Slot / Coordinate / Zone | Placement（唯一占位出口）、CoordinateQuery |
| 编队 | 单位与挂载 | Unit / AttributeSet / BaseProfile / Gauge / Pool / StatProvenance / StatusInstance / BehaviorSlot | UnitRegistry、ProfileQuery |
| 调度 | 时间与机会 | BattleClock / ActionOpportunity / Channel / Cooldown | Scheduler（推进 tick、授予机会） |
| 执行 | 动作与流水线 | Action / ActionSource / ResolvedTarget / BehaviorContext | Pipeline（I→R→M→O） |
| 效果 | 结算 | Effect / DamageChain / MitigationStage | EffectExecutor |
| 编目 | 定义态（独立聚合，只读） | 各 Def | Catalog（按 id 解析） |
| 肉鸽派发 | 局外构筑与局内抽取 | SkillDef（候选）/ BuildSlot / BuildSnapshot / UpgradeTrack | ProgressionAggregate（抽池 / 构筑校验） |
| 共享内核 | 跨层复用的值对象与规约 | TargetSpec / EffectRef / EffectCondition / RandomSource / 元素 / 术语 | —— |

## 二、通用模式：Definition + Grant

几乎所有"定义态 + 实例态"的概念都遵循同一套契约——定义在 Catalog 里、`Grant` 携带本次实例的具体参数、`Instance` 是二者结合的产物：

- **EffectDef → EffectRef → Effect**
- **BehaviorTemplate → SkillDef → BehaviorSlot**
- **StatusDef → StatusGrant → StatusInstance**
- **ZoneDef → ZoneGrant → Zone**
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
- [肉鸽派发上下文](./contexts/肉鸽派发上下文.md)
- [共享内核](./contexts/共享内核.md)
- [随机性治理](./contexts/随机性治理.md)

### 参数与取值域（独立于架构）
- [战场参数](./params/战场参数.md)
- [编队参数](./params/编队参数.md)
- [调度参数](./params/调度参数.md)
- [执行参数](./params/执行参数.md)
- [效果参数](./params/效果参数.md)
- [编目参数](./params/编目参数.md)
- [肉鸽派发参数](./params/肉鸽派发参数.md)
- [共享内核参数](./params/共享内核参数.md)

## 五、不变量总览（按上下文）

共 50 条，分布如下：战场 8 · 编队 9 · 调度 5 · 执行 9 · 效果 9 · 编目 7 · 肉鸽派发 3。各条完整定义见对应上下文文档末尾。
