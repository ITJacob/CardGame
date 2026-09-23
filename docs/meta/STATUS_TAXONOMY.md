# 状态（Status）概念分类总览

> 本文是「状态（status）」一词在 CardGame 设计库里所有意义的**概念索引**。
> 库里 `status` 同时被 9 个**正交维度**切割——日常混淆几乎都来自把其中两三个维度当成了一回事。
> 权威依据见文末「关联文件」；凡与本文冲突，以各权威文件为准，并回来修本文。
>
> 定位：文档即设计，改本文 = 改概念约定。本文只描述现状，不擅自改数据。

## 〇、一句话结论

「状态」不是单一概念。任意一条状态数据都可沿以下 9 条维度独立归类，且维度之间互相正交：

1. 定义归属（写在哪 / 归谁所有）
2. 跨系可读（非本途径能否读）
3. 挂载层级（战场标量 / 单位标量 / 状态实例 / 坐标域）
4. 主题来源（属于 9 源质系哪一系）
5. 机制角色（category 12 枚举）
6. 途径轴身份（是否某构筑轴的锚 statusId）
7. 昼夜 / 战场时间（受光照 / 时钟驱动）
8. 坐标域（区域 zone / 界域 domain，坐标版状态）
9. 运行态 vs 定义态（statusDef 模板 vs StatusInstance 实例）

## 一、九维总览表

| # | 维度 | 它回答的问题 | 权威字段 / 文件 | 典型例子 |
|---|---|---|---|---|
| 1 | **定义归属** | 写在哪、归谁所有 | `common.statuses.json` vs `<pathway>.statuses.json` | common 21 个（poison/shield/stun…）；私有占约 95% |
| 2 | **跨系可读** | 非本途径能否读 | `statusDef.crossPathway` + `participants` 白名单 | puppet_string / fate / filth / grazing_slot / massing |
| 3 | **挂载层级** | 挂在战场 / 单位 / 实例 | `board.*` / `unit.*` / StatusInstance / zone·domain | board.secrecy；unit.lust；普通状态实例 |
| 4 | **主题来源（源质系）** | 属于 9 系哪系 | `docs/ddd/params/源质维度与跨系枢纽.md` §〇 | 源堡=隐秘值、暗影=恶欲值、光之钥=命运值 |
| 5 | **机制角色** | 什么类状态 | `statusDef.category` 12 枚举 | buff/debuff/control/aura/stance/…/conceal/seal |
| 6 | **途径轴身份** | 是否某构筑轴锚 | `axes[].statusId` + `enablers`/`payoffs` | 占卜家预知轴、刺客戏法轴 |
| 7 | **昼夜 / 战场时间** | 受光照 / 时钟驱动 | `board.clock/luminance/phase` + `dimHook`/`phaseHook` | 歌颂者「白昼」、11 途径昼夜挂钩 |
| 8 | **坐标域** | 占格效果吗 | `zoneDef` / `domainDef` | trap/blessing 地面、overlay 界域 |
| 9 | **运行态 vs 定义态** | 模板还是实例 | statusDef（定义） vs StatusInstance（实例） | 定义只一份；实例可堆叠 / 到期 / 驱散 |

---

## 二、逐维度展开与边界红线

### 维度 1 · 定义归属（common vs 私有）
- `common.statuses.json`：收**中性机制、无主题 owner、任何途径可复用**的状态（现状 21 个：poison / regen / thorns / guard / shield / silence / taunt / energy_strain / free_cast / stun / bulwark / vulnerable / shackle / burn / conceal / revive_blocked / amplify / weaken / slow / debuff_immune / control_immune）。
- `<pathway>.statuses.json`：收带**途径主题身份**的私有状态（约 95%）。
- **红线**（common `_meta` ownershipRules）：判定是「中性通用 vs 途径主题」，不是「简单 vs 复杂」。简单的纯主题标记照样进私有，复杂的中性机制照样进 common。换皮护栏（INV-C2）：私有状态若仅是某 common 关键词的换皮（机制完全相同、仅名字更带主题），须复用 common，不得造重复定义。

### 维度 2 · 跨系可读（crossPathway + participants）
- `crossPathway:true` + `participants:[...]` 白名单 = 「跨系状态」。它本质是**普通 statusDef 加只读标志**，不是新类型。
- 读规则：`crossPathway:true` 且 `participants` 含本途径 id，才可读；未列入的途径即便 `crossPathway:true` 也不可读（源质维度与跨系枢纽.md §一.2）。
- 现状：18 条途径的 status 文件含 `crossPathway` 标记（占卜家 / 刺客 / 罪犯 / 暗影系 / 不眠者 / 收尸人等）。

### 维度 3 · 挂载层级（最易被误判）
- **战场级标量** `board.*`：`secrecy`(隐秘值) / `order`(秩序度) / `fate_value`(命运值) / `luminance`(光照度) / `clock`(战场时钟)。**不是 statusDef**，是全局数值槽。
- **单位级标量** `unit.*`：`unit.lust`(恶欲值) 挂单位身上，**非战场级、也不是 statusDef**（源质维度与跨系枢纽.md §五 明示「注意：非战场级」）。
- **状态实例 StatusInstance**：`statusDef` 经 `mount_status` 落下去、挂在单位 / 场上的运行时实例，可堆叠、到期、被驱散。
- 边界：维度 4 的源质标量 ≠ 维度 1 的状态定义。不要因为「隐秘值」看着像状态就建 StatusDef（见 §四）。

### 维度 4 · 主题来源（9 源质系）
| 系 | 签名机制 | 维度类型 | 落地节 |
|---|---|---|---|
| 源堡 | 隐秘值 | 战场 0–10 | §二 |
| 混沌海 | 放牧 Grazing | 动态能力槽 | §七.1 |
| 永暗之河 | 隐秘值（主消费方）+ 灵体之线 | 战场 0–10 | §二 / §九 |
| 灾祸之城 | 集众 Gathering | 团队资源池 | §七.2 |
| 知识荒野 | 规律 / 信息 | 无独立量表 | §三 / §九 |
| 光之钥 | 命运值 | 战场 −10↔+10 | §四 |
| 母巢 | 月相 | 节拍器（满/血/银/红/缺） | §六 |
| 失序之国 | 秩序度 + 规则槽 | 战场 0–10 + Rules[3] | §三 |
| 暗影世界 | 恶欲值 + 诅咒链接网 | 单位级 0–10 | §五 |
| （跨系公共）战场时钟 | 光照度 luminance | 战场 0–10 | §八 + 战场参数.md §1.3 |

### 维度 5 · 机制角色（category 12 枚举）
`buff` / `debuff` / `control` / `reactive` / `aura` / `stance` / `fear` / `retarget` / `link` / `contract` / `conceal` / `seal`。
- 机制家族（同属 statusDef 但角色不同）：月相轮转（`formGroup`/`phases`/`nextPhase`/`cycleTicks`）、异类谱系栈（`lineageStack`）、召唤映射（`summonMapping`）、伤害转嫁（`damageTransfer`）、规则槽（`domainDef.rulePatches` / `write_rule_slot`）、行为封锁（`disallowActions`: move/basic_attack/skill/skip/react/channel）。
- 红线：`damage_taken_mul` / `heal_received_mul` 这类**不是原语**，必须写在 `statusDefs[].modifiers`；状态修饰键不带 `op`（`op` 是 `opSequence`/`opRepeat`/`opIf` 控制流专用）。

### 维度 6 · 途径轴身份（enabler + payoff）
- `axes["<axisId>"] = { symbol, name, statusId?, enablers?, payoffs? }`。`statusId` = 该轴的**身份状态**；`enablers`/`payoffs` = 挂载 / 读取该状态的卡名（设计元数据，脚本反推不出，缺属逐轴待办）。
- enabler→payoff 机制：`statPerStack` / `ramp` / `stackThreshold` / `thresholdTrigger`，26 钩子散布 11 途径。
- 注意：`axes` 里同名但定义不同的 `statusId` 会判漂移（INV-C2 单点定义）。

### 维度 7 · 昼夜 / 战场时间
- `board.clock`（`int[0,71]`）是唯一可写源，每 tick +1 环绕；`board.luminance` / `board.phase` 是**只读派生**（由 clock 查表，不双写，INV-C2）。
- 乘区挂钩两类：`dimHook`（luminance 连续阈值，档位 2/5/8）+ `phaseHook`（相位枚举 midnight/dawn/day/dusk/night）。
- 红线：⚠️ **相位与光照档位不严格同构**（黎明前段 tick 12–15 光照度 ≤2 落暗夜档）。凡「必须是黎明 / 必须是黄昏」的判定走 `phase_is` 谓词，不要只靠 `luminance_compare` 近似。
- 算子：`advance_clock` / `set_luminance`；谓词 `phase_is` / `luminance_compare`。现状 11 途径 / 64 张卡昼夜挂钩。

### 维度 8 · 坐标域（zone / domain）
- 战场参数.md 明定：**区域是坐标版的状态**——占格 / 有血量 / 可被攻击 → `summon`+`spawn`；纯坐标效果、不占格 → `zone`。
- `zoneDef`（`trap`/`blessing`/`hazard`/`mark`）+ `domainDef`（`overlay`/`hero`）与 statusDef 同族，但**不是 statusDef**。`dispel` 原语 `dispelTarget` 可指向 `unit`/`domain`，但 `dispel` 只作用于 StatusInstance（INV-P7），不作用于 zone/domain 的标量。

### 维度 9 · 运行态 vs 定义态
- **statusDef（定义态）**：静态模板，全库只定义一次（INV-C2 单点定义），跨途径按 `id` 引用。
- **StatusInstance（运行态）**：定义经 `mount_status` 落场后的实例，可叠加层数 `maxStacks`（stack/refresh）、消耗次数 `charges`、到期 `duration`，可被 `dispel` / `modify_status` 改写。
- 红线：同名状态必须同定义，异义只能拆 id（豁免机制已移除）；`dispel` 只作用于 StatusInstance（INV-P7）。

---

## 三、两个被混用的词（务必在文档/对话里分开）

1. **「源质状态」同时指了两种不同层级的机制，建议拆称：**
   - (a) **源质维度**：9 系各贡献的标量槽（战场级 secrecy/order/fate_value/luminance，或单位级 lust）。是 `board.*`/`unit.*` 上的数值总线，**不是 statusDef**。
   - (b) **枢纽状态（crossPathway 状态）**：puppet_string / fate / filth / conceal / lust / grazing_slot / massing 等，是普通 statusDef 标 `crossPathway:true`+`participants`。
   - 两者机制层级不同（a 是数值、b 是可读标志），混用「源质状态」一词会误导。
2. **「状态修饰 vs 原语」**：`damage_taken_mul` / `heal_received_mul` 等是状态**修饰键**，写在 `statusDefs[].modifiers`，不是 29 个效果原语之一。

---

## 四、判别卡（见到一条「状态」先问 5 问）

1. **写在哪？** common 还是某途径 `<pathway>.statuses.json`？
2. **挂在哪层？** board 标量 / unit 标量 / 单位状态实例 / 坐标域 zone·domain？
3. **属哪系？** 9 源质系维度，还是某途径主题？
4. **要不要跨系读？** 要就 `crossPathway:true` + `participants`，否则纯私有。
5. **模板还是实例？** 定义只写一次；运行是实例、可驱散堆叠。

---

## 五、关联不变量

- **INV-C2（数值单点定义 / 状态只定义一次）**：同名状态必须同定义，全库仅一处定义，跨途径按 `id` 引用；异义只能拆 id。
- **INV-P7（dispel 只作用 StatusInstance）**：`dispel` 原语目标 `unit`/`domain` 指向实例层，不作用于 board/unit 标量或 zone/domain 本身。
- **换皮护栏（INV-C2 派生）**：私有状态若是某 common 关键词换皮，须复用 common。
- 同源状态若定义漂移 → 告警（2026-09-18 已清零 28 条同名漂移，签名对齐见 SCHEMA.md §10）。

---

## 六、关联文件（权威源）

| 文件 | 用途 |
|---|---|
| `docs/meta/SCHEMA.md` | §6 状态定义 / §7 维度乘区挂钩 / §7.1 相位挂钩 / §10 同名漂移 |
| `docs/json/schema/skills.schema.json` | statusDef 结构（`#/$defs/statusDef`，含 crossPathway/participants） |
| `docs/json/common.statuses.json` | 公共状态注册表 + ownershipRules / namingRules |
| `docs/json/<pathway>.statuses.json` | 途径私有状态（含 crossPathway 标记的枢纽状态） |
| `docs/ddd/params/源质维度与跨系枢纽.md` | §〇 9 系总览 / §一 crossPathway 白名单 / §二–§八 各维度 / §九 软引用裁定 |
| `docs/ddd/params/战场参数.md` | §1.1 区域 / §1.2 界域 / §1.3 战场时钟（clock/luminance/phase 查表） |
| `docs/meta/WORKFLOW.md` | 四环节流水线（环节③ 是 JSON 结构化，本概念索引服务于环节③ 一致性） |
