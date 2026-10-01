# 技能卡与状态设计清单（DESIGN CHECKLIST）

> 新增/重设计一张技能卡或一个状态时依次过一遍的维度清单。
> 约束来源：`GENERATION_BRIEF.md`（生成规范）、`SCHEMA.md`（结构规范）、
> `skills.schema.json`（card 48 字段 / statusDef 38 字段的权威结构）、`SCORING.md`（评分口径）。
> 2026-09-26 整理。

## 设计一张技能卡：8 步

| # | 维度 | 决策内容 / 约束来源 |
|---|---|---|
| 1 | **定位** | 落在哪个途径、哪个构筑轴；在轴里当产层（enabler）还是读层（payoff）——决定它在轴评分里的角色（SCORING.md 轴六维） |
| 2 | **卡面骨架** | `kind` 主动/被动；被动挂 `hook`（触发点 14 个封闭集）；`sequence` + 序列名；`rarity`（rarityMap 由序列位定死，不可自选）；是否旗舰（flagship，理想 4 张/途径） |
| 3 | **效果 AST** | `op` 结构（sequence / if / repeat…）+ 原语组合（27 个封闭集，schema `effect.oneOf` 为权威源）+ 参数（元素/属性/资源/锚点/条件谓词，全部走值域 + glossary 词典）——技能真正的设计主体。攻击行为先想清目标规格：**缺省基准 = 敌方同路最前排**（同路排首；front_line 语义、溅射时点见 `ddd/params/共享内核参数.md` §一，brief §1.6），偏离缺省要在卡面写明 targetSpec |
| 4 | **硬约束自检** | 触发点封闭、R1–R6 随机治理（chance 须登记 + 单次抽样 + 只用于非伤害维）、G8 位移约束、数值锚点（≈3能量 ≈6伤害 ≈10%最大生命，brief §1–§3）——数值本身目前 ⚠️D 占位，只校结构不校大小 |
| 5 | **文本三件套** | `describe`（机器可读复述）/ `flavor` / `lore`，缺一扣「文本完备」分 |
| 6 | **附属定义块**（按需） | 卡面内嵌 `unitDefs` / `zoneDef` / `domainDef` / `upgradeLadder` / `variants`；界域/区域 def 与 grant 字段成对（`domainDef`↔`domain`、`zoneDef`↔`zone`）。新状态不落卡面，写 `<途径>.statuses.json`（跨途径共用进 `common.statuses.json`），卡面用 mount_status 的 statusId 引用 |
| 7 | **元数据收尾** | `conversionNotes`（稿面意图）、`frameworkFlags`（用到的机制缺口登记 landed 状态）、`tentative`、`art` |
| 8 | **过门禁** | 四脚本全绿（validate / validate_schema / check_enum_sync / check_glossary）+ validate 的稀有度与不变量校验 |

## 设计一个状态：7 步

statusDef 38 个字段，设计决策收敛为七组：

| # | 维度 | 决策内容 |
|---|---|---|
| 1 | **身份** | `id` / `name` / `note` + `category` 分类（buff / debuff / 控制…词典值域）——网页统计分析页「状态定义面」分类 × 原语热图的第一个轴 |
| 2 | **时长模型** | 四件套怎么取：`duration`（tick 自然到期）/ `maxStacks`（叠层）/ `charges`（次数）/ `dispelable`——决定「层数语义」，也是评分「身份锚定」查的层数引擎 |
| 3 | **读档能力** | `stackThreshold` + `thresholdTrigger`（到档触发什么）、`statPerStack`（每层载荷）、`ramp`、`phases`（形态轮转，如月相）——状态的 payoff 接口；「身份锚定」+7 分看这组是否非空 |
| 4 | **行为载荷** | `triggers`（14 封闭触发点 → effects，状态的主动面）/ def 级 `effects` / `modifiers`（自由词表修饰符）/ `behaviorModifiers` / `disallowActions` / 防御语义件（`lethalProtect` / `reviveBlocked` / `immune` / `suppress` / `redirectRule`…） |
| 5 | **跨系开关** | `crossPathway` + `participants` 白名单——不写默认途径私有；跨系联动评分维查这里 |
| 6 | **特殊机制件**（按需） | `formGroup` / `cycleTicks`（月相轮转）、`slots`（放牧槽 / 规则槽）、`lineageStack`（异类谱系）、`summonMapping`（刻印链）、`contagious`、`transferOnDeath` 等——用到才取 |
| 7 | **登记 + 数值** | 新 id 过词典对账、枚举过 check_enum_sync；数值 ⚠️D 同技能 |

## 状态归属判定：公有 / 私有 / 分叉（2026-09-29 拍板）

新状态（或给既有 common 状态加玩法时）先按序过五条判据定归属：

| # | 判据 | 归属判定 |
|---|---|---|
| R1 | 有轴拿它当身份锚点（`axes.statusId` 指向）？ | → **必须私有**（落身份轴所在途径的 statuses.json）；common 不托管任何身份 |
| R2 | 身份状态被他途径 combo 消费？ | → 仍归本途径私有，标 `crossPathway:true` + `participants` 白名单（枢纽模式）；共享不转移所有权 |
| R3 | 概念通用但某途径要给它加层数经济 / 阈值玩法 / 主题化？ | → **分叉**：途径建私有变体（如 `intrigue_taunt`），common 原版原封不动留给通用引用 |
| R4 | 多途径日常使用、无人当身份、无层数经济？ | → **留 common**，不私有化 |
| R5 | 纯机制词汇（眩晕 / 沉默 / 护盾 / 减速 / 虚弱等）？ | → 无条件 common，永远不动 |

要点：

- **三档而非两档**：common（无主机制词汇）/ 途径私有（身份，含枢纽共享）/ 分叉（同名双版本）。
- 分叉时「身份用法 vs 通用用法」的逐卡区分口径：**读层（改层 / 条件读档 / 阈值）或当身份锚定的卡改指私有版；纯挂载当工具用的卡留 common 原版**。
- 评分侧背景：身份锚定 / 产层 / 读层三维只认途径自有状态，common 上的不算途径资产——这是私有化运动的动机，也是 R1 存在的理由。

## 技能与状态的接口契约

技能定义「一次性行为」，状态定义「持续语义」：卡面用 `mount_status` 产它、用
`modify_status` / 条件谓词读它。轴评分三维正是这个接口的契约检查：

- **身份锚定 ↔ statusId**：轴身份是否落到一个有层数引擎的状态上
- **产层闭环 ↔ enabler 挂载实证**：enabler 卡面是否真的挂了该身份（AST 可验）
- **读层闭环 ↔ payoff 读层引用**：payoff 卡面是否有读层引用（landed），还是只在 notes 里自称（notes 级）

环节⑤重设计一张卡时，第 1–2 步（定位/骨架）基本不动，主要动第 3–4 步
（AST 与状态载荷）——即评分页失分项「修改意见」指向的那些。
