# 技能池生成规范（共享 brief）

> 本文件是「诡秘之主 × 卡牌游戏」技能池设计的**统一约束**，所有途径的生成 agent 都必须遵守。
> 目标产物：每条途径一份 `docs/skill-design/<途径中文名>_技能池_v0.2.md`，格式对齐 `愚者途径_技能池_v0.2.md`（生成前必读）。
> **当前版本：v0.2（2026-09-02）——更遵照原著、只锁效果不锁数值（数值统一标 ⚠️D 待定）；v0.1 已废弃删除。**
>
> **框架编号（A / B / C / D / E / F / G 组）速查见本文档 §7。**
> 原《框架改动记录》与 v1.5 决策记录两个来源文件已删除，其编号的全部落点已并入 §7；
> `docs/ddd/LEGACY_REFS.md` 已于 2026-09-05 删除，**不要再引用它**。

---

## 0. 项目背景（一句话）

进度条卡牌对战 roguelike：爬塔随机派发技能，逐步构筑整队。每英雄 **4 主动 + 4 被动**。技能灵感从《诡秘之主》22 条非凡途径搬运。

---

## 1. 引擎能力上限（硬约束，不可超越）

### 1.1 九个效果原语
`damage` / `heal` / `mount_status` / `modify_stat` / `modify_resource` / `move` / `spawn` / `dispel` / `drain`

### 1.2 已有状态（15 个 + burn，不要再发明等价的）
| 状态 | 语义 |
|---|---|
| 中毒 | 持续伤害 dot |
| 再生 | 持续回血 |
| 反伤 | 受击反弹 |
| 亡语 | 死亡时触发效果 |
| 开场光环 | 挂 **`on_battle_start`**（原挂 `on_spawn` 会导致召唤物登场就白嫖，已迁出，见 §7 A2） |
| 易伤 | 受伤 ×1.3 乘区 |
| 坚守 | 防御向 |
| 护盾 | 吸收伤害 |
| 沉默 | 禁技能 |
| 嘲讽 | 强制攻击施法者 |
| 耗能加重 | 目标能量消耗↑ |
| 免吟唱 | 免前摇 |
| 眩晕 | 不能行动 |
| 守护 | 替友军挡 |
| 伤害转移 | 伤害转嫁 |
| **burn** | dot，每 tick 2 伤，duration 3 |

### 1.3 触发点（**取值域封闭，共 12 个**）

定义见 `../ddd/params/执行参数.md` §2.1：

`on_apply` / `on_remove` / `on_tick` / `on_turn_start` / `on_battle_start` / `on_spawn` / `on_death` / `on_kill` / `on_attack` / `on_take_damage` / `on_deal_damage` / `on_active_skill`

三条易错纪律：

- ⚠️ `on_spawn` 会在召唤物 / 增援登场时**重复 fire**，绝不能当"开局"用。凡"战斗开始时生效"一律用 `on_battle_start`。
- ⚠️ `on_kill` 与 `on_death` **接收方不同**：`on_kill` fire 给**击杀者**，`on_death` fire 给**持有该被动的单位**（并支持全局监听）。击杀触发用 `on_kill`，不要用 `on_deal_damage` 凑（见 §7 G2）。
- ⚠️ `on_attack` 与 `on_active_skill` 的分工：普攻只 fire `on_attack`；非攻击主动技能只 fire `on_active_skill`；**攻击类主动技能两者都 fire**。需要「任何主动行为」语义的订阅方要同时挂两者（见 §7 裁决变更）。

### 1.4 三个术语算子（编目期展开成扁平 EffectRef）
`Sequence` / `Repeat` / `If`

### 1.5 派发 / 构筑约束

> ⚠️ **归属变更（2026-09-05）**：爬塔派发与构筑（槽位 / 稀有度权重 / 候选池 / 途径共享 / 重复策略 / 升级阶梯）按全局蓝图 §5.2 拆为 **Draft（抽取机制）+ Progression（构筑结构）**，二者已迁出本仓库、**归游戏主项目承载**。本节及以下各稿的「〇、肉鸽化前提」是**内容侧**约定，主项目实现时以其自身设计为准；本仓库的 `docs/ddd` 不再定义这部分（原「肉鸽派发」上下文定义保留在 git 历史 `7e6d01f`）。

- 槽位：每英雄 **4 主动 + 4 被动**
- 肉鸽：爬塔随机派发，逐步构筑
- 共享：`sharedAcross: pathwayId[]`，相邻途径（同源质分组）可重复抽到
- 稀有度 = 序列位阶（自然映射，不要另设维度）：
  - 9–8 普通 Common（高权重，骨架）
  - 7–6 精良 Uncommon（中）
  - 5–4 稀有 Rare（低，构筑核心）
  - 3–2 史诗 Epic（很低，大招）
  - 1–0 传说 Legendary（极低，一局≤1）

---

## 2. 数值经济（所有定价都先折成这个单位）

| 锚点 | 值 |
|---|---|
| 技能伤害基准 | 1.2 × 能量 |
| 标准单体技能 | 3 能量 → 5 伤害（火球术锚点） |
| 能量上限 / 恢复 | 50 / (0.2+0.2×智力) per tick |
| 生命上限 | 30 + 10×力量（力量3 = 60 血） |
| 单卡纪律 | 攻防 ±1~±2、护甲 5 一档、抗性 ±10~±20% |
| 一张卡预算 | ≈ 3 能量 ≈ 6 伤害 ≈ 10% 最大生命 |

> 规则：一张卡预算 ≈ 3 能量。伤害技能按"能量 × 1.2"折算；位移/控制/资源类技能要压低直伤，因为位移在「双路各 4 格 + 坍缩 + 插队」的战场里本身就是硬资源。
> 拿不准的定价一律打 ⚠️ 并在「本稿遗留」里列出。

---

### 3.0 ⚠️ 关于"随机"的正确口径（务必先读）

**旧版 brief 写过"引擎确定性 → 禁止效果里写概率"，这个说法是错的，不要照它执行。**

引擎**确实支持概率**，且有完整治理（规则 R1–R6 见 `../ddd/contexts/随机性治理.md`）：

- 随机源可播种、可快照 / 恢复；治理规则 R1–R6 齐备。
- 可复现契约是 **结果 = f(初始状态, 输入序列, seed)** —— 是"**可播种、可复现**"，**不是"禁止随机"**。
- **R3 登记制**：引入概率的效果必须能被随机用量登记筛出，便于平衡审计一键定位。

**正确写法**——概率是 EffectRef 上的 **`condition`**，不是独立算子：

```ts
// ✅ 正确
{ ref: 'gain_energy_2', condition: { kind: 'chance', p: 0.3 } }

// ❌ 错误：不存在 Chance() 这个算子
`Chance(0.3)` → `modify_resource(energy, +2)`
```

**使用约束**：
- **R3 登记**：引入概率的效果必须可被筛出，便于单独评审。
- **R4 单次抽样**：随机源只在生效条件判定处读取一次，禁止在结算链内部二次抽样。
- **R5 用途限制**：概率只用于**非伤害维度**（是否附加状态、是否给能量这类"添头"），不要用来决定伤害数值本身。
- **目标选择禁止引入随机**（R1/R5）：候选池过滤与排序必须是确定性的。想表达"概率性落空/阻挡"一律改用 **charges 次数型状态**的确定性写法——2026-09-04 已按此裁决改写全稿，**R5 不开例外**（见 §7 裁决变更）。
- **命运/预知主题例外**：这类主题优先翻译成节奏（`gauge.current`）而非概率，因为"命运"的玩法体感是抢先出手，不是掷骰子。

## 3. 诡秘 → 卡牌 翻译规则（搬运前先定，否则会硬搬出"全知全能"）

| 原著能力类型 | 卡牌里的翻译 | 依据 |
|---|---|---|
| 信息/占卜/预知 | → 资源前置或节奏提前（energy / gauge.current） | 无隐藏信息，信息本身不值钱 |
| 命运/概率 | → `modify_resource(gauge.*)`（抢先/推后出手） | "命运"体感 = 谁先出手、多久出手一次。**不要用概率去表达"命运"**——命运主题应落在节奏上，而非掷骰子 |
| 欺骗/伪装/反占卜 | → `dispel` 或 `target_override` | 没对手心理可骗，只有状态和目标系统可操作 |
| 复活/历史/召唤 | → `heal` + `spawn` + 亡语 | 语义天然贴合，零新机制 |
| 位格碾压（序列 2 以上） | **不搬** | 1v1 只能做成"数值更大的同一件事"，不如删掉或只借名字做 flavor |
| 治疗/净化/光明 | → `heal` / `dispel(buff on enemy)` / `mount_status(shield/fortify)` | 直接用现有原语 |
| 诅咒/痛苦/负面 | → `mount_status(vulnerable/poison/burn)` 或自定义 debuff 状态 | 优先复用已有状态，缺的才新增 |

---

## 4. 文档结构（严格对齐 `愚者途径_技能池_v0.2.md`）

1. **标题** `# <途径中文名>途径 · 技能池 v0.2`
2. **头部说明**：灵感源（ima 途径数据）、框架依据；加一行说明「文案」= 玩家视角效果描述，用于肉鸽派发展示。
3. **〇、肉鸽化前提**：照搬槽位/派发/共享/稀有度表；**定义本途径的 4 条构筑轴**（命名用炼金/元素符号 🜁🜂🜃🜄 或自创，配关键词 + 玩法）。每条途径的 4 轴要能覆盖它 10 个序列的能力谱系。
4. **一、技能池**：按稀有度分组（普通/精良/稀有/史诗/传说）。每个技能：
   - `#### 【主动/被动】<技能名> <轴符号>`
   - `- **文案** <玩家视角，1-2 句，有 flavor>`
   - `- **序列** <序列号 职业名> · **hook** <触发点> ` 或 `- **序列** ... · **能量 X / cd Y** · <reach/targetSpec>`
   - `- **效果** <原语表达>`
   - `- **推导/语义** <为什么这么映射、绑定了哪个数值锚点>`
   - 需要框架扩展处打 ⚠️ 并注明对应改动记录编号（A1/A2/C1…），**编号含义查本文档 §7**
   - 每条轴挑 1 个 ★ 旗舰技能
   - **总量约 24 个**（每个稀有度档都有，4 轴尽量均衡）
5. **二、示例 Build**：4 个 Build（各 4 主动 + 4 被动），用本途径技能，体现 4 轴。
6. **三、跨途径共享**：列本途径哪些技能 `sharedAcross` 给哪些相邻途径（用源数据里的 `adjacent_pathways`），及理由。
7. **四、本稿遗留**：数值盲区、待标项。
8. **本途径框架改动（新增）**：**只列本途径特有的**新状态 / 新单位 / 新算子 / 新 move.op / 新 targetSpec。格式同改动记录（状态 🔴🟡🟢 + 说明 + 服务于哪个技能）。**不要重复**已登记的通用项 —— 通用项编号（A1–A4、B1–B7、C1–C8、D1–D5、E1–E4、F1–F63、G1–G15）的现落点**全部见本文档 §7**，直接引用，勿重立。

---

## 5. 质量红线

- 不写"全知全能""操纵因果于无形"这类无法落地的描述词进「效果」——那是 flavor，不是机制。
- 「文案」可以华丽，「效果」必须能映射到 1.1 的九原语。
- 数值先换算成"能量/伤害/生命%"再写，别凭感觉。
- 每条新增状态必须说清：`damage_taken_mul` / `damage_mul` / `duration` / 触发事件 / 作用于谁。
- 用中文，简洁，有 flavor。

---

## 6. 工作纪律

- **只新建你负责的那一个途径文档**，不改动其他文件、不改本文档（框架改动记录已并入 §7，汇总阶段统一并回）。
- 生成前先 `Read` `docs/skill-design/愚者途径_技能池_v0.2.md` 对齐格式。
- 完成后在回复里用 3 行以内说明：做了哪条途径、技能数、本途径新增了几条框架改动。

---

## 7. 框架编号速查 → DDD 落点

22 份技能稿 v0.2 引用两个**已删除**来源文件的编号：

1. 《框架改动记录》（原 `docs/skill-design/框架改动记录.md`，A–H 组）——v0.1→v0.2 期间的框架扩展登记；
2. v1.5 系列《00_总览与决策》决策记录（A1–A24）——更早期架构拍板。

两文件内容已迁移进 `../ddd/`（ddd 终版）后删除（提交 `b3f22d7`）。本表给出**技能稿实际引用到的**每个旧编号的现落点。原文可从 git 历史查阅：`git show b787f3c:docs/skill-design/框架改动记录.md`、`git show b787f3c:docs/ddd/待拍板清单_来自v1.5.md`。

> ⚠️ **命名空间警示**：`A` 编号有两套不同源——技能稿中的 **A1 / A2 / A4 指《框架改动记录》A 组**（触发点）；**A22 / A23 / A24 指 v1.5 决策记录**。引用时务必按本表区分。

### A 组（触发点）

| 旧编号 | 内容 | 现落点 |
|---|---|---|
| A1 | 新增触发点 `on_battle_start` | `../ddd/params/执行参数.md` §2.1 |
| A2 | `opening_aura` 从 `on_spawn` 迁到 `on_battle_start` | `../ddd/params/执行参数.md` §2.1 语义纪律第 2 条 |
| A3 | 开局载荷清单化（`TermNode[]`） | `../ddd/contexts/编队上下文.md` §六 + `../ddd/params/编目参数.md` |
| A4 | 新增触发点 `on_kill`（fire 给击杀者） | `../ddd/params/执行参数.md` §2.1 |

### v1.5 决策记录（A1–A24，技能稿实际引用者）

| 旧编号 | 内容 | 现落点 |
|---|---|---|
| A22 | heal vs modify_resource 划界（治疗走 heal，直扣走 modify_resource） | `../ddd/contexts/效果上下文.md` §二「heal vs modify_resource（A22）」+ INV-D5 |
| A23 | 区域载荷清单化 + 陷阱定位（dispel 拆陷阱） | `../ddd/contexts/效果上下文.md` §二「dispel 的目标与边界（A23）」+ INV-B8 |
| A24 | Gauge 三维度开放 + 击退建模 | `../ddd/params/效果参数.md`「Gauge 三维度（A24 开放）」 |

### B 组（肉鸽派发，已于 2026-09-05 迁出本仓库）

| 旧编号 | 内容 | 现落点 / 状态 |
|---|---|---|
| B1–B7 | rarity / weight / pool / pathway / sharedAcross / 槽位 / duplicatePolicy / desc / 升级阶梯 | **不在本仓库**。按全局蓝图 §5.2 一分为二：构筑结构归 **Progression**、抽取机制归 **Draft**，二者均属游戏主项目。原定义保留在 git 历史 `7e6d01f`，本仓库 `docs/ddd` 已无「肉鸽派发」上下文 |

### C 组（效果 / 状态扩展）

| 旧编号 | 内容 | 现落点 |
|---|---|---|
| C1 | `move.op` 新增 `pull_forward` / `push_back` | `../ddd/params/效果参数.md` §一 move.op 行 |
| C2 | `dispel.category` 扩为数组 | `../ddd/params/效果参数.md` §一 dispel.filter 行 |
| C3 | `glibness`（误导减伤） | 并入 H3 减伤母版（`../ddd/params/编队参数.md` §2.4） |
| C4 | `miracle`（复活族总入口） | 并入 H7 + 死亡结算链（`../ddd/contexts/编队上下文.md` §十） |
| C5 | `spawn` 支持 hpRatio + 重生位置 | `../ddd/params/效果参数.md` §1.1 spawn 参数 |
| C6 | `charges` 次数型状态 | `../ddd/params/编队参数.md` §1.1b charges 行 |
| C7 | `target_override` 指向空坐标（已端到端验证） | H12 母版 + `../ddd/params/共享内核参数.md` anchor `first_empty` + `../ddd/params/执行参数.md` RedirectRule.to `first_empty` |
| C8 | 候选池过滤机制（隐匿/不可选中/加权） | `../ddd/params/共享内核参数.md` §四 + H5；「加权」维度的 2026-09-04 落点见下文「裁决变更」 |

### D 组（数值待标）

| 旧编号 | 内容 | 现落点 / 状态 |
|---|---|---|
| D1 | 击退定价 → `KNOCKBACK_DISTANCE = 50` | `../ddd/params/效果参数.md` Gauge 三维度表 ✅ |
| D2 | `gauge_rate` 修正定价 | 未闭合（数值标定待办） |
| D3 | 防御杠杆按乘区口径重标 | `../ddd/params/效果参数.md` §二 ⚠️ 未闭合 |
| D4 | 全部新技能能量定价 | `../ddd/params/编队参数.md` §2.1b 定价纪律（执行中） |
| D5 | 再生总回复 6→12 重验 | `../ddd/params/编队参数.md` §2.2 再生行 ⚠️ 未闭合 |

### E 组（文档与代码对齐）

E1（burn 已实现）/ E2（击退口径，随 D1）/ E3（命名 `gauge.*`）/ E4（状态数 16）——已全部消化进参数篇，无遗留。

### F 组（途径特有项；仅列技能稿实际引用者）

| 旧编号 | 内容 | 现落点 |
|---|---|---|
| F1 | `inscription`（默记，计数型） | H11 计数型状态母版（`../ddd/params/编队参数.md` §2.4） |
| F2 | `parasitized`（寄生，吸血归施法者） | `drain`（`../ddd/params/效果参数.md` §一）+ F56 casterId |
| F3 | `puppeteered`（提线） | H12 target_override 族 |
| F4 | `shadow_veil`（暗影潜行） | H5 潜行/不可锁定母版 + 候选池过滤器 |
| F7 | `shackle`（束缚：禁位移+减速） | H24 减速族（gaugeRateMul × moveImmune，`../ddd/params/编队参数.md` §1.1b） |
| F9 | `puppet_string`（傀儡线，持续改写目标） | H12 target_override 族 |
| F11 | `stealth`（隐匿） | H5 潜行母版 |
| F13 | `drowning`（溺沉） | H2 参数化复合 debuff |
| F16 | `whisper`（呓语污染，叠层精神 dot） | H2 参数化复合 debuff + H11 层数 |
| F20 | `petrify`（结晶，禁疗） | H21 `heal_received_mul` |
| F25 | `unit_wraith`（灵体/怨灵） | H1 召唤物基线；ID 归收尸人亡灵线，不眠者自然灵另立 `unit_nature_spirit`（C-6 裁决） |
| F47 | `zone_astral_field`（星象领域） | H9 Zone 母版 |
| F48 | `status.consume(statusId, n)` | `../ddd/contexts/效果上下文.md` §2.1 + `../ddd/params/效果参数.md` §1.1 valueFrom 行 |
| F49 | `drain.resource`（hp/energy） | `../ddd/params/效果参数.md` §一 drain 行 |
| F50 | `drain.category: 'buff'`（增益转移） | `../ddd/params/效果参数.md` §一 drain 行 ⚠️ 注意：个别技能稿把「mount_status.stacks」误引为 F50，正确编号是 F51 |
| F51 | `mount_status.stacks`（初始层数） | StatusGrant.stacks（`../ddd/contexts/编队上下文.md` §六 mount 流程） |
| F52 | If 谓词 `target_has_status` | 泛化为 `has_status` 谓词（`../ddd/params/共享内核参数.md` §三） |
| F54 | `spawn.companionBuff` | `../ddd/params/效果参数.md` §1.1 spawn 行 |
| F56 | 状态持有 `casterId`、载荷寻址施法者 | `../ddd/params/编队参数.md` §1.1b casterId 行 |
| F57 | targetSpec `ENEMY_ENERGY_DESC` | `../ddd/params/共享内核参数.md` §一 sort `energy_desc` |
| F58 | `exclude_veiled` 过滤 | `../ddd/params/共享内核参数.md` §四 候选池过滤器（与 C8 同出口） |
| F59 | targetSpec `ALL_ALLIES` | `../ddd/params/共享内核参数.md` §一 `scope: all` + faction 过滤（H18） |
| F61 | targetSpec `attacker`（反伤寻址攻击者） | `../ddd/params/执行参数.md` §一 RedirectRule.to `attacker` |
| F63 | 新元素 `water` | `../ddd/params/共享内核参数.md` §二 |

### G 组（逐职业核对修正，技能稿实际引用者）

| 旧编号 | 内容 | 现落点 |
|---|---|---|
| G1 | 概率的正确写法 = EffectRef.condition + 登记制（非禁随机） | `../ddd/contexts/随机性治理.md` R1–R6 |
| G2 | 击杀触发用 `on_kill`（非 on_deal_damage） | `../ddd/params/执行参数.md` §2.1 |
| G3 | Repeat / Sequence 算子运行时展开待验证 | `../ddd/params/编目参数.md` §一；动态段数 2026-09-04 已确认（Repeat.count 行） |
| G4 | `spawn.reviveOf` + `oncePerBattle`（复活不新增原语） | `../ddd/params/效果参数.md` §1.1 spawn 参数 |
| G5 / G6 | 自推条陷阱（自己回合 gauge 已清零，自推无意义） | `../ddd/params/调度参数.md` §二 重定位说明 |
| G8 | 位移铁律：己方单位不得越中线进入敌方半场；跨阵营 `relocate` 直接拒绝；纯伤害/减益 Zone 可跨中线，但含位移（`relocate`）或生成（`spawn`）载荷的 Zone 落点恒为施法者己方半场 | `../ddd/contexts/战场上下文.md` §三 Placement（跨阵营 relocate 被拒绝）+ §二「Zone 放置与跨半场」（该处以「G8」旧编号行内标注）。⚠️ 战场不变量为 INV-B1–B8，**无 INV-B9** |
| G12 | `immune` 免疫字段 | `../ddd/params/编队参数.md` §1.1b immune 行 |
| G14 / G14-b | tick ≠ 回合概念澄清；「每回合」被动复核 | `../ddd/params/执行参数.md` §2.1 语义纪律第 1 条 |
| G15 / G15-b | `on_turn_start` 引擎补 fire；短 duration + 低频触发点冲突 | `../ddd/params/执行参数.md` §2.1 语义纪律第 1 条 + `../ddd/contexts/编队上下文.md` §六「⚠️ 触发点纪律（G15-b）」 |

### H 组（v0.2 原著校准归并，即新编号）

H 组不是旧账——`../ddd/params/编队参数.md` §2.4 母版表收录 H1–H50 中已归并成母版的项；其余散见各参数篇（H17 召唤物参数族 → `../ddd/params/效果参数.md` §1.1；H23 复活优先级链 → `../ddd/contexts/编队上下文.md` §十；H26 valueFrom → `../ddd/params/效果参数.md` §1.1；H43 状态触发器非状态原语 → `../ddd/contexts/编队上下文.md` §十；H44 `holy` 元素 → `../ddd/params/共享内核参数.md` §二）。

---

## 8. 裁决变更记录（2026-09-04，覆盖旧结论）

| 项 | 旧结论 | 新结论 |
|---|---|---|
| `on_active_skill` 承载方式 | 待拍板清单 H22 裁决：并入 `on_attack` 单节点 + `kind: 'attack'\|'active_skill'\|'any'` | **取代**：`on_active_skill` 独立为第 12 触发点（`../ddd/params/执行参数.md` §2.1），`on_attack` 保持只管攻击行为 |
| 概率性落空 / 阻挡 | 罪犯·干扰占卜与通灵 p=0.3、囚犯·初步反占卜 p=0.25、囚犯·curse_ward p=0.5，原稿自认「R5 合规」 | **认定违反 R1/R5「目标选择不引入随机」**：三处全部改为 charges 确定性落空/阻挡（技能稿已同步改写），R5 不开例外 |
| 候选池加权（收尸人灵之同类 / 学徒守秘 / 偷盗者混淆分身 / 仲裁人混乱感应） | C8 只登记二元排除过滤器 | 走 `sort` 参数化状态键 `status:<id>:asc\|desc`（`../ddd/params/共享内核参数.md` §一），不新增 weight 字段 |

## 9. 暂缓项（2026-09-04 拍板）

| 项 | 内容 | 状态 |
|---|---|---|
| `suppress_rule` / `modify_rule` | 战斗级规则开关（关停/改写一条全场规则）——仅仲裁人【废止】【底层规则】两张传说卡需要 | 🔴 **不立项**，两张卡在技能稿标注「暂不实现」，Phase 2 再议；decree 体系其余技能不受影响 |
