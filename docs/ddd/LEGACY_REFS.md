# 旧编号对照表（LEGACY_REFS）

22 份技能稿 v0.2 仍引用两个**已删除**来源文件的编号：

1. 《框架改动记录》（原 `docs/skill-design/框架改动记录.md`，A–H 组）——v0.1→v0.2 期间的框架扩展登记；
2. v1.5 系列《00_总览与决策》决策记录（A1–A24）——更早期架构拍板。

两文件内容已迁移进本目录（ddd 终版）后删除（提交 `b3f22d7`）。本表给出**技能稿实际引用到的**每个旧编号的现落点。原文可从 git 历史查阅：`git show b787f3c:docs/skill-design/框架改动记录.md`、`git show b787f3c:docs/ddd/待拍板清单_来自v1.5.md`。

> ⚠️ **命名空间警示**：`A` 编号有两套不同源——技能稿中的 **A1 / A2 / A4 指《框架改动记录》A 组**（触发点）；**A22 / A23 / A24 指 v1.5 决策记录**。引用时务必按上表区分。

## 框架改动记录 · A 组（触发点）

| 旧编号 | 内容 | 现落点 |
|---|---|---|
| A1 | 新增触发点 `on_battle_start` | `params/执行参数.md` §2.1 |
| A2 | `opening_aura` 从 `on_spawn` 迁到 `on_battle_start` | `params/执行参数.md` §2.1 语义纪律第 2 条 |
| A3 | 开局载荷清单化（`TermNode[]`） | `contexts/编队上下文.md` §六 + `params/编目参数.md` |
| A4 | 新增触发点 `on_kill`（fire 给击杀者） | `params/执行参数.md` §2.1 |

## v1.5 决策记录（A1–A24，技能稿实际引用者）

| 旧编号 | 内容 | 现落点 |
|---|---|---|
| A22 | heal vs modify_resource 划界（治疗走 heal，直扣走 modify_resource） | `contexts/效果上下文.md` §二「heal vs modify_resource（A22）」+ INV-D5 |
| A23 | 区域载荷清单化 + 陷阱定位（dispel 拆陷阱） | `contexts/效果上下文.md` §二「dispel 的目标与边界（A23）」+ INV-B8 |
| A24 | Gauge 三维度开放 + 击退建模 | `params/效果参数.md`「Gauge 三维度（A24 开放）」 |

## B 组（肉鸽派发）

B1–B7（rarity / weight / pool / pathway / sharedAcross / 槽位 / duplicatePolicy / desc / 升级阶梯）→ 全部落入 `contexts/肉鸽派发上下文.md` + `params/肉鸽派发参数.md`。

## C 组（效果 / 状态扩展）

| 旧编号 | 内容 | 现落点 |
|---|---|---|
| C1 | `move.op` 新增 `pull_forward` / `push_back` | `params/效果参数.md` §一 move.op 行 |
| C2 | `dispel.category` 扩为数组 | `params/效果参数.md` §一 dispel.filter 行 |
| C3 | `glibness`（误导减伤） | 并入 H3 减伤母版（`params/编队参数.md` §2.4） |
| C4 | `miracle`（复活族总入口） | 并入 H7 + 死亡结算链（`contexts/编队上下文.md` §十） |
| C5 | `spawn` 支持 hpRatio + 重生位置 | `params/效果参数.md` §1.1 spawn 参数 |
| C6 | `charges` 次数型状态 | `params/编队参数.md` §1.1b charges 行 |
| C7 | `target_override` 指向空坐标（已端到端验证） | H12 母版 + `params/共享内核参数.md` anchor `first_empty` + `params/执行参数.md` RedirectRule.to `first_empty` |
| C8 | 候选池过滤机制（隐匿/不可选中/加权） | `params/共享内核参数.md` §四 + H5；「加权」维度的 2026-09-04 落点见下文「裁决变更」 |

## D 组（数值待标）

| 旧编号 | 内容 | 现落点 / 状态 |
|---|---|---|
| D1 | 击退定价 → `KNOCKBACK_DISTANCE = 50` | `params/效果参数.md` Gauge 三维度表 ✅ |
| D2 | `gauge_rate` 修正定价 | 未闭合（数值标定待办） |
| D3 | 防御杠杆按乘区口径重标 | `params/效果参数.md` §二 ⚠️ 未闭合 |
| D4 | 全部新技能能量定价 | `params/编队参数.md` §2.1b 定价纪律（执行中） |
| D5 | 再生总回复 6→12 重验 | `params/编队参数.md` §2.2 再生行 ⚠️ 未闭合 |

## E 组（文档与代码对齐）

E1（burn 已实现）/ E2（击退口径，随 D1）/ E3（命名 `gauge.*`）/ E4（状态数 16）——已全部消化进参数篇，无遗留。

## F 组（途径特有项；仅列技能稿实际引用者）

| 旧编号 | 内容 | 现落点 |
|---|---|---|
| F1 | `inscription`（默记，计数型） | H11 计数型状态母版（`params/编队参数.md` §2.4） |
| F2 | `parasitized`（寄生，吸血归施法者） | `drain`（`params/效果参数.md` §一）+ F56 casterId |
| F3 | `puppeteered`（提线） | H12 target_override 族 |
| F4 | `shadow_veil`（暗影潜行） | H5 潜行/不可锁定母版 + 候选池过滤器 |
| F7 | `shackle`（束缚：禁位移+减速） | H24 减速族（gaugeRateMul × moveImmune，`params/编队参数.md` §1.1b） |
| F9 | `puppet_string`（傀儡线，持续改写目标） | H12 target_override 族 |
| F11 | `stealth`（隐匿） | H5 潜行母版 |
| F13 | `drowning`（溺沉） | H2 参数化复合 debuff |
| F16 | `whisper`（呓语污染，叠层精神 dot） | H2 参数化复合 debuff + H11 层数 |
| F20 | `petrify`（结晶，禁疗） | H21 `heal_received_mul` |
| F25 | `unit_wraith`（灵体/怨灵） | H1 召唤物基线；ID 归收尸人亡灵线，不眠者自然灵另立 `unit_nature_spirit`（C-6 裁决） |
| F47 | `zone_astral_field`（星象领域） | H9 Zone 母版 |
| F48 | `status.consume(statusId, n)` | `contexts/效果上下文.md` §2.1 + `params/效果参数.md` §1.1 valueFrom 行 |
| F49 | `drain.resource`（hp/energy） | `params/效果参数.md` §一 drain 行 |
| F50 | `drain.category: 'buff'`（增益转移） | `params/效果参数.md` §一 drain 行 ⚠️ 注意：个别技能稿把「mount_status.stacks」误引为 F50，正确编号是 F51 |
| F51 | `mount_status.stacks`（初始层数） | StatusGrant.stacks（`contexts/编队上下文.md` §六 mount 流程） |
| F52 | If 谓词 `target_has_status` | 泛化为 `has_status` 谓词（`params/共享内核参数.md` §三） |
| F54 | `spawn.companionBuff` | `params/效果参数.md` §1.1 spawn 行 |
| F56 | 状态持有 `casterId`、载荷寻址施法者 | `params/编队参数.md` §1.1b casterId 行 |
| F57 | targetSpec `ENEMY_ENERGY_DESC` | `params/共享内核参数.md` §一 sort `energy_desc` |
| F58 | `exclude_veiled` 过滤 | `params/共享内核参数.md` §四 候选池过滤器（与 C8 同出口） |
| F59 | targetSpec `ALL_ALLIES` | `params/共享内核参数.md` §一 `scope: all` + faction 过滤（H18） |
| F61 | targetSpec `attacker`（反伤寻址攻击者） | `params/执行参数.md` §一 RedirectRule.to `attacker` |
| F63 | 新元素 `water` | `params/共享内核参数.md` §二 |

## G 组（逐职业核对修正，技能稿实际引用者）

| 旧编号 | 内容 | 现落点 |
|---|---|---|
| G1 | 概率的正确写法 = EffectRef.condition + 登记制（非禁随机） | `contexts/随机性治理.md` R1–R6 |
| G2 | 击杀触发用 `on_kill`（非 on_deal_damage） | `params/执行参数.md` §2.1 |
| G3 | Repeat / Sequence 算子运行时展开待验证 | `params/编目参数.md` §一；动态段数 2026-09-04 已确认（Repeat.count 行） |
| G4 | `spawn.reviveOf` + `oncePerBattle`（复活不新增原语） | `params/效果参数.md` §1.1 spawn 参数 |
| G5 / G6 | 自推条陷阱（自己回合 gauge 已清零，自推无意义） | `params/调度参数.md` §二 重定位说明 |
| G8 | 位移铁律：己方单位不得越中线 | `contexts/战场上下文.md` INV-B9 |
| G12 | `immune` 免疫字段 | `params/编队参数.md` §1.1b immune 行 |
| G14 / G14-b | tick ≠ 回合概念澄清；「每回合」被动复核 | `contexts/编队上下文.md` §六 ⚠️ 触发点纪律 |
| G15 / G15-b | `on_turn_start` 引擎补 fire；短 duration + 低频触发点冲突 | `params/执行参数.md` §2.1 语义纪律第 1 条 |

## H 组（v0.2 原著校准归并，即新编号）

H 组不是旧账——`params/编队参数.md` §2.4 母版表收录 H1–H50 中已归并成母版的项；其余散见各参数篇（H17 召唤物参数族 → `params/效果参数.md` §1.1；H23 复活优先级链 → `contexts/编队上下文.md` §十；H26 valueFrom → `params/效果参数.md` §1.1；H43 状态触发器非状态原语 → `contexts/编队上下文.md` §十；H44 `holy` 元素 → `params/共享内核参数.md` §二）。

---

## 裁决变更记录（2026-09-04，覆盖旧结论）

| 项 | 旧结论 | 新结论 |
|---|---|---|
| `on_active_skill` 承载方式 | 待拍板清单 H22 裁决：并入 `on_attack` 单节点 + `kind: 'attack'\|'active_skill'\|'any'` | **取代**：`on_active_skill` 独立为第 12 触发点（`params/执行参数.md` §2.1），`on_attack` 保持只管攻击行为 |
| 概率性落空 / 阻挡 | 罪犯·干扰占卜与通灵 p=0.3、囚犯·初步反占卜 p=0.25、囚犯·curse_ward p=0.5，原稿自认「R5 合规」 | **认定违反 R1/R5「目标选择不引入随机」**：三处全部改为 charges 确定性落空/阻挡（技能稿已同步改写），R5 不开例外 |
| 候选池加权（收尸人灵之同类 / 学徒守秘 / 偷盗者混淆分身 / 仲裁人混乱感应） | C8 只登记二元排除过滤器 | 走 `sort` 参数化状态键 `status:<id>:asc\|desc`（`params/共享内核参数.md` §一），不新增 weight 字段 |

## 暂缓项（2026-09-04 拍板）

| 项 | 内容 | 状态 |
|---|---|---|
| `suppress_rule` / `modify_rule` | 战斗级规则开关（关停/改写一条全场规则）——仅仲裁人【废止】【底层规则】两张传说卡需要 | 🔴 **不立项**，两张卡在技能稿标注「暂不实现」，Phase 2 再议；decree 体系其余技能不受影响 |
