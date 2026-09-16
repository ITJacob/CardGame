# 技能池设计分析报告

> 数据来源：`docs/json/*.skills.json`（22 份途径技能池，共 **810 张卡**），生成脚本口径见文末。
> 对照基准：`docs/skill-design/_GENERATION_BRIEF.md` v0.3、`docs/ddd/params/*`。
> 生成日期：2026-09-14

---

## 一、总览与结构健康度

| 指标 | 设计目标（brief） | 实际 | 评价 |
|---|---|---|---|
| 途径数 | 22 | 22 | ✅ |
| 每途径卡数 | 约 24 | **33–43**（均值约 37） | ⚠️ 超出约 55%，规模偏大 |
| 序列覆盖 | 覆盖 10 个序列 | 22/22 途径均 **10/10** | ✅ 优秀 |
| 构筑轴 | 每途径 4 轴 | 22/22 途径均 4 轴 | ✅ |
| 轴间均衡 | 「4 轴尽量均衡」 | ⚠️ 仍不均，但 6 弱轴已补至 10（途径内 max/min 1.7–2.3x；律师 warp_rule 仍 4.5x） | 🟡 部分改善（见 §5.2 / 问题 #4） |
| 旗舰技能 | 每轴 1 个（= 4） | **4 ~ 16** | 🔴 标记失控 |
| 主动 / 被动 | 4+4（派发槽位，非池内比例） | 池内约 6:4 | ⚠️ 被动占比偏高 |

**卡数分布**：猎人 43（最多）；战士/秘祈人 33（最少）；均值约 37（810/22）。单途径规模因 #4 补卡整体抬升（见 §七·补 7-4）。

---

## 二、机制用量总盘

### 2.1 效果原语用量

| 原语 | 用量 | 占比 | 说明 |
|---|---|---|---|
| `mount_status` | 728 | 48% | **绝对主力**，技能库以"挂状态"为第一表达 |
| `damage` | 376 | 25% | |
| `modify_stat` | 356 | 23% | |
| `modify_resource` | 150 | 10% | |
| `dispel` | 99 | 6.5% | 净化/驱散是高频子机制 |
| `spawn` | 73 | 5% | |
| `heal` | 55 | 3.6% | |
| `move` | 44 | 2.9% | |
| `domain` | 26 | 1.7% | 界域（v0.3 新增） |
| `drain` | 15 | 1% | |
| `modify_damage` | 11 | 0.7% | 刚落地（2026-09-14） |
| `transfer_status` | 4 | | 状态搬运（H32） |
| `echo_last_skill` | 2 | | 复制上次技能 |
| `snapshot` / `restore_snapshot` | 1 / 1 | | 快照回溯，仅 1 张卡 |
| `gauge_shuffle` / `status_shuffle` | 1 / 1 | | 语义暂缓 |

> **读法**：状态驱动占了一半表达量，说明当前设计风格是「挂 debuff / buff → 条件响应」，而非纯数值对轰。这与原著的"非凡特性侵蚀"气质是吻合的。

### 2.2 元素分布

> 元素用量为**效果级出现次数**（与 §2.1 同口径），按当前 `docs/json/*.skills.json` 复核（2026-09-16）。

| 元素 | 用量 | 评价 |
|---|---|---|
| mental | 117 | 第一大元素（不眠者/观众/收尸人/秘祈人系） |
| physical | 93 | |
| none | 75 | 无属性（含 water 退役后改挂的 8 张） |
| fire | 22 | |
| holy | 22 | 光（歌颂者/战士） |
| poison | 19 | |
| lightning | 16 | 雷（水手为主） |
| **dark** | **14** | ✅ **已落地**：9 张卡（黑焰/地狱之火/深渊之火/深渊之咒/黑暗之剑/黑夜领域/黑暗恐惧/召唤阴影/堕落之影），见 §七·补 7-1 |
| ice | 7 | 偏低，刺客冰霜系未展开 |

> **holy / dark 不对称已缓和**：`dark` 于 2026-09-15 通过存量迁移落地（14 处效果 / 9 张卡），不再是空抗性槽；`holy`（22 处）用量约为 `dark` 的 1.6 倍，后续可按需补充暗系卡。本报告初版 §2.2 称 `dark=0` 系未同步 §七·补 7-1 修复记录所致，现已按当前 JSON 更正。

### 2.3 触发点用量（含被动 hook）

被动卡通过 `hook` 字段声明触发点，与状态触发器内的 `event` 是两套登记：

| 触发点 | hook | event | 合计 | 状态 |
|---|---|---|---|---|
| `on_battle_start` | **206** | 1 | 207 | ✅ 开场光环主力（A1/A2 迁移正确） |
| `on_death` | 11 | 29 | 40 | ✅ 亡语系 |
| `on_tick` | 4 | 68 | 72 | ✅ DoT/持续 |
| `on_deal_damage` | 9 | 39 | 48 | ✅ |
| `on_take_damage` | 2 | 38 | 40 | ✅ 反制系 |
| `on_remove` | — | 24 | 24 | ✅ |
| `on_kill` | 7 | 6 | 13 | ✅ |
| **`on_turn_start`** | 4 | 21 | **25** | 🔴 **G15：引擎从未 fire，全部不生效** |
| `on_attack` | — | 6 | 6 | ✅ |
| `on_apply` | — | 6 | 6 | ✅ |
| **`on_spawn`** | 4 | 4 | **8** | ⚠️ brief 明令"绝不能当开局用"，需逐条审计 |
| `on_active_skill` | — | 1 | 1 | 偏低 |
| `on_status_gain` | — | 1 | 1 | 🔴 已裁定暂缓（非标准钩子） |

### 2.4 算子

`sequence` 272（多段技能是常态）、`if` 92（条件分支普及）、`target_override` 36（改写目标族）、`push_back` 25、`overlay` 25（界域降临）、`repeat` 19、`pull_forward` 9、`swap_ally` 3、`insert_tail_cross_lane` 3。

---

## 三、已形成的术语体系

按**覆盖广度**（多少条途径在用）排序，可清晰分出「通用术语」与「途径特色术语」。

### 3.1 通用术语（≥ 13 条途径在用，已成为设计词汇）

| 术语 | 卡数 | 途径数 | 典型表达 |
|---|---|---|---|
| 充能 / 次数（charges） | 103 | **22** | 确定性落空、阻挡、限次触发 |
| 加速 / 减速（gauge.rate） | 98 | **22** | 敏捷的原生表达 |
| 召唤（spawn） | 82 | **22** | 亡灵、秘偶、分身 |
| 界域（domain） | 32 | **22** | 场景切换、环境规则 |
| 迷失（lost） | 30 | **22** | 界域租金 |
| 减伤 / 转嫁（damage_*_mul / linkedTo） | 140 | 21 | 守护、伤害转嫁族 |
| 流派联动（empower + tags） | 27 | 21 | 标签卡在特定界域下强化 |
| 隐匿（conceal / stealth） | 45 | 20 | 不可选中 |
| 推条（gauge.current） | 66 | 19 | 抢先 / 延后出手 |
| 受击反制（on_take_damage） | 45 | 19 | 反伤、触发式护盾 |
| 亡语（on_death） | 44 | 19 | 死亡触发 |
| 叠层（statPerStack / stacks） | 81 | 18 | 层数线性成长 |
| 位移（push / pull / swap） | 38 | 18 | 站位 manipulate |
| 护盾（shield） | 37 | 18 | 吸收池 |
| 易伤（vulnerable） | 43 | 17 | 受伤乘区 |
| 改写目标（target_override） | 42 | 17 | 傀儡线、替身 |
| 潜行 / 不可锁定（untargetable） | 33 | 16 | 候选池过滤 |
| 复活 / 免死（revive / lethalProtect） | 26 | 16 | 奇迹、血肉不灭 |
| 标记（mark） | 26 | 14 | 标记→引爆 |
| 眩晕（stun） | 25 | 14 | 控制 |
| 传染扩散（contagious / spread） | 23 | 13 | 复合 debuff |
| 免疫（immune） | 18 | 13 | 类别/来源阻挡 |

**观察**：这 22 个通用术语已经构成一套稳定"词汇表"，你举的例子（「目标身上每个负面火焰状态额外提升本次伤害」）正是**叠层 + 元素判定 + 条件增伤**三者的组合——目前已被 `statPerStack` + `has_category` + `damage_mul(filter)` 覆盖，属于**可以直接写出来的**组合。

### 3.2 途径特色术语（≤ 6 条途径，尚未成为通用词汇）

| 术语 | 卡数 | 途径数 | 归属 |
|---|---|---|---|
| 契约（contract / oath） | 11 | 6 | 律师、仲裁人 |
| 伤害修正（modify_damage） | 11 | 5 | 收尸人等 |
| 状态搬运（transfer_status） | 7 | 5 | 偷盗者、刺客 |
| 反伤（thorns） | 6 | 5 | 战士、罪犯 |
| 镜像（mirror） | 12 | 4 | 刺客 |
| 冻结（freeze） | 8 | 4 | 冰霜系 |
| **位格（rank）** | 7 | 4 | 🔴 v0.3 核心，利用率极低 |
| 寄生（parasitized） | 10 | 3 | 偷盗者、药师 |
| 快照回溯（snapshot） | 4 | 3 | 怪物、窥秘人 |
| 形态切换（formGroup） | 3 | 2 | 刺客、药师 |
| **跨层（translocate）** | 2 | 2 | 🔴 六范式只用了 2 张卡 |
| 阈值触发（thresholdTrigger） | 2 | 2 | 猎人 |
| 复制 / 模仿（echo / mimic） | 11 | 1 | 阅读者独占 |
| 识破（see_through） | 3 | 1 | 猎人独占 |
| 成长递增（ramp） | 1 | 1 | 孤例 |

### 3.3 状态术语（跨途径共享的枢纽状态）

按被多少条途径定义计数（≥ 2 即为跨途径共享）：

`shackle`(6 途径) · `charm`(4) · `puppet_string`(4) · `revive_blocked`(3) · `hallucination`(3) · `concealed`(3) · `danger_sense`(2) · `exiled`(2) · `sealed`(2) · `blessing`(2) · `spirit_sight`(2) · `countersuit`(2) · `flesh_immortal`(2) · `spirit_sovereign`(2) · `fallen`(2) · `beast_form`(2) · `misfortune`(2) · `submerged`(2) · `dread`(2) · `parasitized`(2)

> 这正是 `crossPathway` + `participants` 机制在起作用的证据：少数状态被多途径复用，形成跨系 combo 的"通用语"。

---

## 四、已使用的复合组合（单卡内共现统计）

| 组合模式 | 卡数 | 评价 |
|---|---|---|
| 能量操控（增减能量） | 130 | 最常见的资源杠杆 |
| 驱散 + 伤害（破增益后打击） | 37 | 经典"穿透"表达 |
| 护盾 + 状态 | 31 | |
| **标记 + 条件引爆** | 27 | 你举例的"标记→引爆"范式已成熟 |
| 亡语 + 召唤 | 26 | 死灵/不死者系 |
| 界域 + 标签联动 | 26 | v0.3 设计意图落地良好 |
| 伤害 + 治疗（吸血 / 奉献） | 22 | |
| 推条 + 伤害（延后出手） | 21 | 节奏型 |
| 状态 + 传染扩散 | 18 | |
| 复制 / 搬运（模仿系） | 18 | |
| 位移 + 伤害（击退 / 拉近） | 16 | |
| 充能 + 阻挡（次数型免疫） | 12 | R5 裁决的正确落地 |
| 吸取 + 状态（寄生续航） | 10 | |
| **位格 + 压制 / 跨层** | 3 | 🔴 v0.3 旗舰机制，几乎没有组合 |

---

## 五、原著契合度评估

### 5.1 逐途径对照（22/22）

| 途径 | 四轴 | 原著权柄 | 判定 |
|---|---|---|---|
| 愚者 | foresight / trick / marionette / miracle | 预见·诡计·秘偶·奇迹 | ✅ |
| 学徒 | gate / trick / record / astral | 开门·传送·记录·星象 | ✅ |
| 偷盗者 | steal / deceit / parasite / chrono | 窃取·欺诈·寄生·时间 | ✅ |
| 战士 | martial / guard / hunt / twilight | 战斗·守护·猎杀·黄昏 | ✅ |
| 水手 | rage / storm / authority / ocean | 暴怒·风暴·权威·海洋 | ✅（rage 偏少） |
| 歌颂者 | hymn / light / judgment / notary | 歌颂·光·审判·公证 | ✅（hymn 偏少） |
| 耕种者 | harvest / healing / alchemy / blight | 丰收·治疗·炼金·荒芜 | ✅ |
| 药师 | brew / beasts / crimson / moon | 调制·野兽·血族·月亮 | ✅（beasts 偏少） |
| 收尸人 | spirit_sight / corpse / undead / end | 通灵·尸体·亡灵·终结 | ✅（spirit_sight 偏少） |
| 不眠者 | darkness / nightmare / requiem / secrecy | 黑暗·梦魇·安魂·隐秘 | ✅ |
| 秘祈人 | shadow / flesh / soul / corruption | 阴影·血肉·灵魂·堕落 | ✅ |
| 观众 | insight / suggestion / dream / fantasy | 洞察·暗示·梦境·幻想 | ✅ |
| 仲裁人 | jurisdiction / sanction / inquest / decree | 管辖·制裁·审讯·律令 | ✅ |
| **律师** | advocacy / brute / bribery / **warp_rule(18)** | 辩护·暴力·贿赂·**扭曲规则** | ⚠️ 见下（disorder 已改名 warp_rule；warp_rule 仍 18，偏大） |
| 罪犯 | vice / filth / elements / demon | 罪恶·污秽·元素·恶魔 | ✅ |
| 囚犯 | curse / bondage / aberration / item | 诅咒·束缚·异变·物品 | ✅ |
| 猎人 | flame / intrigue / massing / harvest | 火焰·阴谋·战争集结·收割 | ✅（intrigue 偏少） |
| 通识者 | lore / craft / astral / civilization | 知识·工匠·星象·文明 | ✅ |
| 阅读者 | analysis / arcana / mimic / foresight | 分析·奥秘·模仿·预见 | ✅ |
| 窥秘人 | scrying / combat / scroll / astral | 窥视·战斗·卷轴·星象 | ✅ |
| 怪物 | inspiration / fortune / calamity / cycle | 灵感·幸运·灾难·循环 | ✅ |
| 刺客 | mirror / charm / plague / form | 镜子·魅惑·疾病·形变 | ✅ |

**整体：22/22 途径的轴设计均能在原著中找到明确对应，契合度很高。**

### 5.2 两处需要复核的偏差

1. 🟡 **律师途径的 `disorder` 轴已于 2026-09-16 改名 `warp_rule`（扭曲规则）**，贴合黑皇帝"改写规则"的权柄（原 `disorder`"混乱"语义确实更接近深渊/愚者）。`advocacy`（辩护）已同期补至 10 张。但 `warp_rule` 仍有 18 张（四轴最大），`brute` 仅 4 张，途径内 max/min = 4.5x——彻底均衡见问题 #6。
2. ⚠️ **轴间失衡仍普遍存在，但已显著收敛**：2026-09-16 为 6 个弱轴各补 6–7 张新卡（共 +37，总 810），弱轴均达 10 张下限。当前：**apothecary** beasts10(1.7x)、**chanter** hymn10(2.3x)、**corpse_collector** spirit_sight10(2.3x)、**hunter** intrigue10(2.0x)、**sailor** rage10(1.8x)、**lawyer** advocacy10 但 warp_rule18(4.5x)。整体最大轴/最小轴由 3–5x 降到 1.7–4.5x；"强轴未缩、仅补弱轴"是刻意的"补到下限"策略，彻底均仍需缩强轴（#6）。

---

## 六、引擎参数工具覆盖率

### 6.1 原为「完全未使用」🔴 → 已于 2026-09-15 修复

| 工具 | 修复前 | 修复后 | 说明 |
|---|---|---|---|
| **`dark` 元素** | **0 张卡** | **9 张卡** | 已迁移 9 张暗 / 黑 / 深渊系卡（清单见 §7-1） |
| **吟唱 `castTime`** | **1 张**（仅镜中世界） | **38 张** | 已按序列档位给「序列≤4 且主动且界域 / 仪式类」赋值 |
| **`interrupt`（打断）** | 0 | 0（仍待办） | 吟唱已有 38 处载体，打断标志可随之启用 |

> **勘误**：初版报告称吟唱「全库 0 张」，系统计错误——初版按卡顶层 `castTime` 取值，而该字段实际位于 **`cost.castTime`**。按正确路径统计，修复前为 **1 张**（`skill_assassin_s0_mirror_world`，序列 0，手填 2 tick）。结论方向不变（纪律基本未执行），数字已更正。
>
> 吟唱的问题本质：v0.3 规定「序列 4 以上或仪式 / 咒文类必须标具体 tick 数」，而 526 张带该字段的卡里 257 张显式 `0`、232 张 `null`——**这条纪律几乎从未执行**。现已补档位规则（`_GENERATION_BRIEF.md` §13.2）并回填 38 张。

### 6.2 严重低用 ⚠️

| 工具 | 用量 | 应然 |
|---|---|---|
| 位格 `rank` | 7 卡 / 4 途径 | v0.3 头号核心数值，应贯穿高位能力 |
| 跨层 `translocate` | 2 卡 / 2 途径 | 六范式设计了 4 种操作 |
| 形态切换 `formGroup` | 3 卡 / 2 途径 | 魔女/野兽变形系的天然载体 |
| 阈值触发 `thresholdTrigger` | 2 卡 / 2 途径 | |
| 快照 `snapshot` | 4 卡 / 3 途径 | |
| `on_active_skill` | 1 | 第 12 触发点几乎闲置 |
| 冰 `ice` | 8 | 刺客冰霜系未展开 |

### 6.3 用了但不生效 🔴

| 项 | 用量 | 问题 |
|---|---|---|
| `on_turn_start` | 25（4 hook + 21 event） | **G15：引擎从未 fire**，全部为死逻辑 |

### 6.4 使用充分 ✅

界域（22 途径全覆盖）、迷失（22）、充能（22）、推条（19）、加速减速（22）、流派标签联动（21）、叠层（18）、驱散（99 效果）、位移（18）、护盾（18）、易伤（17）、改写目标（17）、潜行（16）、复活免死（16）、传染（13）、免疫（13）。

---

## 七、问题清单与建议（按优先级）

| # | 问题 | 严重度 | 建议 |
|---|---|---|---|
| 1 | `dark` 元素曾零使用，holy/dark 不对称 | ✅ 已解决 | 2026-09-15 已执行存量迁移（9 张暗/黑/深渊系卡 → dark，清单见 §七·补 7-1）；holy 仍略多，但已非"空槽" |
| 2 | 吟唱机制曾全库未执行 v0.3 纪律 | ✅ 已解决 | 2026-09-15 已按序列档位回填 38 张（详见 §七·补 7-2）；数值补偿（能量折扣）仍待落编目时补 |
| 3 | `on_turn_start` 25 处死逻辑 | 🟡 方案已定（待主项目实现） | 已定方案：引擎补 fire 点（规格见 §七·补 7-3，含 25 处精确清单：4 hook + 21 event / 19 张卡）。本仓库为纯设计文档库，fire 点需在 cardgame-core 落地；实现后关闭 G15 |
| 4 | 轴间失衡 3–5 倍 | 🟡 弱轴已补至 10 | 2026-09-16 已为 6 弱轴各补 6–7 张新卡（共 +37，总 810）：rage / hymn / intrigue / beasts / spirit_sight / advocacy 均达 10；途径内 max/min 由 3–5x 降至 1.7–2.3x（清单见 §七·补 7-4）。律师 warp_rule(18)/brute(4) 的 4.5x 失衡归 #6 处理 |
| 5 | 旗舰标记 4~16 失控 | 🟠 中 | 收敛为每轴 1 个（= 4/途径），其余降为普通卡 |
| 6 | 律师 `warp_rule`（原 `disorder`）卡量 18 偏大、与原著权柄曾偏离 | 🟠 中 | 改名已执行（warp_rule「扭曲规则」贴合黑皇帝"改写规则"）；卡量 18 仍为四轴最大，建议缩 warp_rule 或扩充 brute/bribery 至均衡（与 #4 的"补弱轴"互补） |
| 7 | 位格 / 跨层 / 形态切换低用 | 🟠 中 | 这三项是 v0.3 的差异化卖点，建议指定 2–3 条途径做深度示范（如愚者=跨层、刺客=形态、仲裁人=位格压制） |
| 8 | `on_spawn` 8 处 | 🟡 低 | 逐条审计是否误当"开局"用（召唤物会重复 fire） |
| 9 | 卡数超设计 45% | 🟡 低 | 33–38 vs 目标 24；若非有意扩容，考虑精简低价值卡 |

---

## 七·补、2026-09-15 修复记录

### 7-1 `dark` 元素存量迁移（9 张）

| 卡 | 途径 | 原元素 → dark |
|---|---|---|
| 黑焰 | 刺客 | fire → **dark** |
| 地狱之火 | 罪犯 | fire → **dark** |
| 深渊之火 | 罪犯 | fire → **dark** |
| 深渊之咒 | 罪犯 | mental → **dark** |
| 黑暗之剑 | 不眠者 | mental → **dark** |
| 黑夜领域 | 不眠者 | mental → **dark** |
| 黑暗恐惧 | 囚犯 | mental → **dark** |
| 召唤阴影 | 秘祈人 | mental → **dark** |
| 堕落之影 | 秘祈人 | mental → **dark** |

**刻意排除**（主题含暗/黑/影但语义不属于"黑暗侵蚀"）：

- 光系反暗卡（`无暗之域`、`无暗之枪`、`日照`、`神圣之光`、`神圣之国`、`晨曦领域`）——它们是 holy，改成 dark 会自相矛盾。
- 毒素/污秽类（`腐蚀之爪`、`污秽之语`、`侵蚀者`、`污秽之王`、`腐蚀毒雾`）——归 poison 更准。
- 纯精神/梦境类（`强制入梦`、`午夜诗篇`、`心理暗示`、`操纵`、`呓语`、`精神冲击`）——归 mental 更准。
- 星象/冰冻/雷电/亡灵权柄/死亡权柄——各有其元素归属。

### 7-2 吟唱回填（38 张）

按序列档位（序列 4→2t、3→3t、2→4t、1→5t、0→6t）赋给「序列 ≤ 4 且主动且界域 / 仪式类」的卡；档位规则已写入 `_GENERATION_BRIEF.md` §13.2。**数值补偿（吟唱 N tick ≈ 折扣 0.5×N 能量）尚未逐卡回填，落编目时需补。**

### 7-3 `on_turn_start`（方案已定：引擎补 fire 点，待 cardgame-core 实现）

**现状**：`TriggerEvent` 枚举已含 `on_turn_start`（登记为 G15），但引擎主循环从未发射该事件，故 JSON 里 25 处引用全部为死逻辑。本仓库为纯设计文档库，引擎在独立的 cardgame-core（`src/combat` / `src/scheduling` / `src/execution`），不在此机/此仓库，fire 点需在主项目落地。

**精确清单（25 次引用 = 4 个被动 hook + 21 个状态 event，去重 19 张卡）**：

| 卡 id | 途径 | 类型 | 引用数 |
|---|---|---|---|
| `skill_chanter_s9_spirit_recovery` | 歌颂者 | hook（被动） | 1 |
| `skill_fool_s8_premonition` | 愚者 | hook（被动） | 1 |
| `skill_fool_s9_divination` | 愚者 | hook（被动） | 1 |
| `skill_savant_s5_star_deduction` | 秘祈人 | hook（被动） | 1 |
| `skill_chanter_s1_holy_nation` | 歌颂者 | event（状态） | 1 |
| `skill_corpse_collector_s1_pale_world` | 收尸人 | event | 1 |
| `skill_corpse_collector_s4_underworld_gate` | 收尸人 | event | 2 |
| `skill_hunter_s2_extreme_weather` | 猎人 | event | 3 |
| `skill_hunter_s3_war_mist` | 猎人 | event | 1 |
| `skill_planter_s1_create_world` | 耕种者 | event | 1 |
| `skill_prisoner_s5_spirit_shroud_domain` | 囚犯 | event | 1 |
| `skill_pryer_s5_astral_field` | 祈祷者 | event | 1 |
| `skill_reader_s4_astral_sanctum` | 窥秘人 | event | 1 |
| `skill_sailor_s3_sea_kingdom` | 水手 | event | 2 |
| `skill_savant_s3_dominion` | 秘祈人 | event | 1 |
| `skill_sleepless_s4_night_realm` | 不眠者 | event | 3 |
| `skill_spectator_s3_shared_dream` | 观众 | event | 1 |
| `skill_supplicant_s1_dark_sea` | 祈求者 | event | 1 |
| `skill_warrior_s6_dawn_domain` | 战士 | event | 1 |

**引擎 fire 点规格（供主项目实现）**：

1. **发射位置**：调度/执行主循环，单位"行动周期（gauge 阈值触发）开始"处——即选定本 tick 进入行动的单位、在其执行技能/动作之前，发射 `on_turn_start`。
2. **发射对象**：`source = target = 该单位`；逐个进入行动的单位各发一次。
3. **频率**：每单位每回合一次；因加速/击退/推条导致的"额外回合"或"重新进入"各算一次（与行动周期派生值一致，不在此直接修正周期）。
4. **生效范围**：触发该单位的 `passive.hooks.on_turn_start`（4 处）+ 挂于该单位/全局、且 `trigger == on_turn_start` 的状态 `events`（21 处）。
5. **边界**：死亡单位不发射；被 `disable`（眩晕）单位是否发射需裁定——建议正常发射（眩晕只阻断"行动执行"，回合仍开始；多数 `on_turn_start` 期望每回合稳定触发）。
6. **配套**：实现后在 `docs/ddd/params/执行参数.md` §2.1 G15 标注"已补 fire 点"并移出阻塞；若回合开始涉及数值结算（如每回合回能），需在 invariants 登记对应不变量。

### 7-4 轴间失衡：6 弱轴补卡至 10（2026-09-16，+37 卡 → 总 810）

**动作**：为 6 个"最小轴仅 3–4 张"的弱轴各补 6–7 张新卡（被动 hook 多为 `on_battle_start`），使弱轴达到与强轴可比的 10 张下限：

| 途径 | 弱轴（补后） | 补卡数 | 途径内 max/min |
|---|---|---|---|
| 水手 sailor | rage 4→**10** | +6 | 1.75x（storm 14） |
| 歌颂者 chanter | hymn 4→**10** | +6 | 2.29x（light 16） |
| 收尸人 corpse_collector | spirit_sight 3→**10** | +7 | 2.29x（undead 16） |
| 猎人 hunter | intrigue 4→**10** | +6 | 2.0x（massing 16） |
| 药师 apothecary | beasts 3/4→**10** | +6 | 1.71x（moon 12） |
| 律师 lawyer | advocacy 4→**10** | +6 | 4.5x（warp_rule 18） |

**新增卡（按序列降序；序列 4+ 无吟唱，序列 ≤4 按档位标 `castTime`）**：

- 水手：rage_roar(s9)、raging_sea(s7 被动·on_take_damage)、blood_surge(s6)、wrath_body(s5 被动·on_battle_start)、wrath_smash(s4)、tyrant_edict(s3)
- 歌颂者：holy_blessing(s8)、valiant_hymn(s6)、endless_hymn(s5 被动·on_battle_start)、purify_chant(s4)、light_blessing(s3 被动·on_battle_start)、finale_hymn(s2)
- 收尸人：sight_awaken(s9 被动·on_battle_start)、ghost_see(s7)、spirit_touch(s6 被动·on_battle_start)、dead_whisper(s5)、spirit_lookout(s4)、death_omen(s3 被动·on_battle_start)、end_eye(s2)
- 猎人：seed_doubt(s9)、schemer(s7 被动·on_battle_start)、divide(s5)、lay_trap(s4)、shadow_planner(s3 被动·on_battle_start)、final_intrigue(s2)
- 药师：beast_call(s9)、wild_instinct(s7 被动·on_battle_start)、pack_maul(s6)、beast_rush(s5)、frenzy_rush(s4)、beast_tide(s2)
- 律师：plead(s8)、pleader_eye(s7 被动·on_battle_start)、cite_statute(s6)、glib_tongue2(s5 被动·on_battle_start)、courtroom_rebut(s4)、statute_body(s3 被动·on_battle_start)

**伴随改动（律师）**：`disorder` 轴正式改名为 `warp_rule`（扭曲规则，贴合黑皇帝"改写规则"权柄），`axes` 对象删除 `disorder` 键并新增 `warp_rule:{symbol:"🜄",name:"扭曲规则"}`，原 `axis:"disorder"` 的卡全部改挂 `warp_rule`。

**结果**：整库卡数 773 → **810**；6 弱轴均达 10 张，途径内 max/min 由 3–5x 降至 1.7–2.3x（律师因 warp_rule 仍 18、brute 仅 4，保持 4.5x，归问题 #6）。校验：`validate.py` 0 error / 19 warn；`validate_schema.py` 当时仅余 3 个历史错误（assassin s18、fool s28、prisoner s21），manifest 计数已全部同步——**该 3 项已于同日另行清零，见 7-5**。

### 7-5 清除 3 个历史 schema 错误（2026-09-16，校验归零）

`validate_schema.py` 长期残留的 3 个结构性错误（均非本轮引入，可追溯至 2026-09-10）已全部清零，至此 **两个校验器均 0 error**（`validate.py` 0/19 warn、`validate_schema.py` 0/28 warn）。

| 位置 | 原错误 | 处置与理由 |
|---|---|---|
| `assassin` / `skill_assassin_s5_repeated_charm` | `statusDefs[0].triggers[0].condition` 缺 `kind` | 该 condition 实为**纯注释对象**（只有一个 `note`，无任何谓词），语义是标注"实际订阅事件应为施加 charm 时"。已将 note 上移至 `trigger.note` 并删除空 condition——**省略 condition 即"无条件"**，无需为"无谓词"新开 `always` 枚举值（Condition.kind 封闭集本就无此项） |
| `fool` / `skill_fool_s1_mystery_realm` | `zoneDef.effects[0].then[1]` 用了 `type:"damage_taken_mul"`（非原语） | 改写为既有原语 **`modify_damage`**（`scope:"taken"`, `mul:0.85`）。该原语库内已用 11 次，无需新登记；`duration` 不被该原语支持故移除——zone 为 `on_occupy_tick` 逐 tick 重挂，语义正是"停留期间生效"，与原 `duration:2` 意图一致 |
| `prisoner` / `skill_prisoner_s4_performance`（演出） | `target.fallbackSort:"atk_asc"` 不在 sortKey 封闭集 | **裁定为登记 `atk_asc`**：权威取值域 `ddd/params/共享内核参数.md` §sort 早在 2026-09-14 即已含 `atk_asc`，是 **schema 未同步**（schema 描述里还写着"待裁定"）。已补进 `sortKey` 枚举 + `SCHEMA.md` 枚举清单，保留数据原意（按攻击升序取最弱己方），未改成 `atk_desc` |

**连带处置**：

- prisoner 的 `frameworkFlags.SORT_ATK_ASC` 置 **`landed: true`**——`landed` 的语义是"是否已落入 **DDD 内核**"（≠引擎实现），而 atk_asc 确已在内核参数登记，该 flag 此前是陈旧状态。
- **修正 `build_overview.py` 的 landed 逻辑缺陷**：原脚本按 `len(frameworkFlags)` 渲染"N 项缺口未落地"，**完全忽略 `landed`**，导致已落地项仍被计为缺口；图例还硬编码"全库 109 条 landed 均为 false"。已改为只统计 `landed:false` 为缺口、已落地项渲染为"✅ 历史缺口已落入 DDD 内核"，汇总计数同步按未落地口径。重跑后 prisoner 该卡正确显示"✅ 1 项历史缺口已落入 DDD 内核"。
- `SCHEMA.md` §10 校验结果更新为 `files: 22 | errors: 0 | warns: 28`，原"3 处数据问题"表改为已处置说明；sortKey 封闭枚举清单补 `atk_asc`。

---

## 八、结论

1. **设计风格**：已形成以「状态挂载 + 条件响应」为核心的稳定风格（mount_status 占 48%），通用术语 22 个、特色术语 15 个、跨途径共享状态 20 个——**术语体系已经成型**，你举例的那种"复合条件增伤"在现有词汇下可以直接书写。
2. **原著契合**：22/22 途径的构筑轴均能在原著找到明确对应；律师 `disorder` 已于 2026-09-16 改名 `warp_rule`（扭曲规则）以贴合黑皇帝"改写规则"权柄，但其卡量 18 仍为四轴最大，待问题 #6 收口。
3. **工具覆盖**：主流工具（界域、迷失、充能、推条、标签联动、叠层、转嫁、潜行、复活）利用率良好；v0.3 三大新增维度中**吟唱已修复（1 张 → 38 张）**，但**位格（7 卡 / 4 途径）与跨层（2 卡 / 2 途径）仍严重低用**，是下一轮重点。
4. **三件事的处置（2026-09-15 → 2026-09-16）**：`dark` 存量迁移 ✅ 9 张；吟唱回填 ✅ 38 张（档位规则已入 `_GENERATION_BRIEF.md` §13.2，数值补偿待回填）；`on_turn_start` 🟡 **方案已定——引擎补 fire 点规格见 §七·补 7-3（含 25 处精确清单：4 hook + 21 event / 19 张卡），待 cardgame-core 落地后关闭 G15**。

---

### 附：统计口径

- 数据源：`docs/json/*.skills.json` 的 `cards[]` 数组，共 810 张卡。
- 原语 / 元素 / 触发点用量：递归遍历效果节点统计（同一张卡可多次计数）。
- 术语模式：按关键词在单卡 JSON 文本中匹配，**同一张卡命中多个关键词只计一次**；「吟唱」「驱散」两项因字段名（`castTime`、`dispelable`）普遍存在而虚高，正文已按实际值（castTime>0 = 0、dispel 效果 = 99）校正。
- 复合组合：同一张卡内两个机制共现计一次。
- 原著契合：依据各途径 `axes` 定义与《诡秘之主》22 途径权柄人工比对。
