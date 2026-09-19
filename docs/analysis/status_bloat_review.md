# 私有状态庞杂度 / 换皮 深度审视报告

> **执行状态（2026-09-19）**：已启动降格，先跑小试点。本次落地 `conceal` + `revive_blocked` 两个干净簇（见 §六）。immune / slow / 减伤易伤大簇按判定暂不入试点。

> 触发：用户质疑「私有属性有些太过庞杂——有些状态是简易拼凑（不如挂两个状态）或是纯参数修改（带主题名但机制通用），加重玩家理解负担」；并要求解释「stealth 拆 id」。
> 方法：扫描全库 `*.statuses.json`（common 14 + 22 途径 = 467 唯一 id，455 私有），按机制指纹聚类；`is_plain` = 仅含单个 modifier、无 effects / triggers / filter / theme。
> 脚本：`docs/.../scan_bloat3.py`（顶层 effects 已计入指纹，修正了初版漏计）。

## 一、stealth 拆 id 到底是什么

`split_divergent_ids.py` 把两个都叫「潜行」的状态拆成了独立 id：

| id | 途径 | 核心机制 | 额外互动 |
|---|---|---|---|
| `shadow_veil`（影纱） | sleepless | `untargetableByTargeted: inbound/single` + duration 2 | 挂 trigger `on_deal_damage → dispel self`（出手自动破除）+ 受击重隐 + 召唤物连带隐匿 |
| `stealth`（隐身药水） | apothecary | `untargetableByTargeted: inbound/single` + duration 2 | on_deal_damage / on_take_damage 的 effects 为空（仅标记「破除」） |

**拆 id 的起因**：上一轮删除了 `KNOWN_STATUS_DIVERGENCE`（同名异义豁免）机制，Gate 改成「同名必须同定义，否则告警」。这两份「潜行」同名但定义不同（shadow_veil 多了一串互动），不能共占 `stealth` 一个 id，于是把 sleepless 那份改名为 `shadow_veil`。

**为什么你会觉得困惑（关键）**：这俩的「潜行」**核心完全相同**，区别只是 sleepless 多了点互动；而数据现在显示，还有 `hidden_space / submerged / psych_invisibility` 也是**同一套「潜行 + 出手破除」机制**（下面 C 簇 4 个同构）。当初是机械地遵循「同名必须同定义」去拆，反而把「通用潜行」和「途径互动」搅在一起——没有从「应不应该先有一个通用 `conceal` 词」的角度设计。

## 二、你的「庞杂」判断被数据证实

455 个私有状态里，**大量是纯换皮 / 同构**（机制组成完全相同，只改了名字 + 数值 / 方向 / 时长）。

### B1. 真纯换皮（仅单个 `damage_taken_mul`，无任何 trigger/effect/filter/theme）— 18 个
即 `common.guard`（mul 0.7 减伤）/ `common.vulnerable`（mul 1.3 易伤）的纯换皮：

| 私有 id | 途径 | mul | 本质 |
|---|---|---|---|
| phantom_door | apprentice | 0.5 | guard 换皮（减伤） |
| form_mist | assassin | 0.85 | guard 换皮 |
| brace | monster | 0.85 | guard 换皮 |
| spirit_shroud_guard | prisoner | 0.85 | guard 换皮 |
| elusive_wake | sailor | 0.5 | guard 换皮 |
| flesh_cloak | supplicant | 0.85 | guard 换皮 |
| host_shelter | thief | 0.85 | guard 换皮 |
| space_rift | apprentice | 1.15 | vulnerable 换皮 |
| castigated | arbiter | 1.4 (filter caster) | vulnerable 换皮 + 施法者过滤 |
| rank_jurisdiction | arbiter | 0.9 (filter rank) | guard 换皮 + 位格过滤 |
| demeaned | arbiter | 1.2 | vulnerable 换皮 |
| untouchable_confusion | lawyer | 0.9 (dynamic) | guard 换皮 + 动态 |
| rule_exploited | lawyer | dynamic/perBuff | guard 换皮 + 动态 |
| madness | supplicant | dynamic/stacks | vulnerable 换皮 + 动态 |
| hunter_eye | warrior | 1.2 | vulnerable 换皮 |
| hunter_mark | warrior | 1.25 | vulnerable 换皮 |

> 玩家要记「猎人印记 / 猎人眼 / 震慑 / 轻蔑 / 恐惧 / 狂乱…」十几个名字，其实全是「减伤」或「易伤」。

### C. 同构簇（机制组成完全相同，跨途径重复实现）
纯换皮成员占绝大多数（is_plain 标记非空即纯）：

| 通用机制 | 同构私有数（纯换皮） | 代表 |
|---|---|---|
| 纯增伤 `damage_mul` | 16 | rank_decree / bliss / form_shadow / weapon_mastery / withered… |
| 纯属性增减 `modify_stat` | 23 | iron_body / bear_form / frenzy / steel_body / light_form… |
| 纯混乱控制 `behaviorModifiers` | 16 | charm / charm_axis / hallucination / mislead / deluded / misdirect… |
| 纯减伤/易伤 `damage_taken_mul` | 18 | （含上 B1） |
| 纯免疫 `immune` | 5 | scentless / immunity_writ / composure / curse_ward_block / virtual_persona |
| 纯时长增减 `durationModifier` | 7 | moon_red / persuasion / glib_tongue / silver_tongue… |
| 纯减速 `gaugeRateMul` | 3 | slow / misfortune / quicksilver_submerge |
| 潜行破除 `untargetableByTargeted`+dispel | 4 | shadow_veil / hidden_space / submerged / psych_invisibility |
| 禁复活 `revive_blocked` | 2 | revive_blocked / eternal_sleep |

> 纯换皮 / 同构合计 **约 100+，占私有态 1/4~1/3**。其余小簇（on_death heal、on_tick mount、on_remove damage 等）未全列。

### A. 拼凑体（单一状态挂多个独立机制，m+t+e ≥ 4）
| 状态 | 途径 | 机制元素数 |
|---|---|---|
| demonize | criminal | 7 |
| werewolf_form | prisoner | 6 |
| shadow_dwell | supplicant | 6 |
| object_possession | prisoner | 6 |
| flesh_hunger | supplicant | 6 |
| conceal_authority | sleepless | 6（含 crossPathway+participants） |

> 这些需逐个判读：werewolf_form（变身系）是 legit 复合主题；demonize 之类可能是「互不依赖的独立机制塞一个状态」，应拆成多个状态分别挂载。

## 三、降格可行性（已确认）

`schema` 的 `effMountStatus` 支持实例覆盖参数：`duration` / `stacks` / `value`($ref scalar) / `params` / `charges` / `maxStacksOverride`（schema L1043–1098）。
→ 降格**不必新建 def**，卡面直接：
```json
{ "type": "mount_status", "statusId": "vulnerable", "value": 1.25, "duration": 4 }
```
即可把 `hunter_mark` 之类纯换皮降格为「挂载 common + 传参」。（待实现侧确认 `value` 对单 modifier 状态如 vulnerable 的覆盖语义。）

## 四、建议方向（待用户拍板，未执行）

- **A. 扩 common 词表收口同构簇**：新增 `common.confuse`(收 16 行为控制) / `common.immune`(5) / `common.slow`(3) / `common.conceal`(4 潜行破除，顺带消解 stealth 拆 id 尴尬) / `common.revive_blocked`(2)。
- **B. 参数化挂载消灭纯换皮**：B1 的 18 个 + 各簇纯数值/方向/时长成员，删私有 def，卡面 `mount_status` 传 `value`/`duration`。
- **C. 拼凑体拆分**：互不依赖的独立机制拆成多个状态分别挂载。

**权衡（必须你定）**：完全降格会牺牲 flavor（「猎人印记」比「易伤」有代入感）。两种折中：
1. 通用机制用 common 词，但卡面 `lore` 文本保留 flavor 名；
2. common 词 + 途径别名显示层（展示用 hunter_mark，底层是 vulnerable）。

**推荐试点**：先 `conceal` + `immune` 小范围验证（最中性、无争议），跑通 Gate 后再推广到减伤/易伤/增伤大簇。

## 五、结论
- stealth 拆 id = 把两份同名「潜行」拆为 `shadow_veil`(sleepless) 与 `stealth`(apothecary)，起因是删豁免机制后 Gate 强制同名同定义；但核心机制相同，且另有 4 个同构潜行实现 → 当初未从「通用 conceal 词」角度设计。
- 用户的质疑成立：私有态约 1/4~1/3 是纯换皮 / 同构，确属「带主题名但机制通用」的冗余，加重认知负担。
- 降格在技术上可行（mount_status 支持 value/params）。

## 六、试点执行（2026-09-19）

启动降格，先跑最干净的两个簇，验证"扩 common 词表 + 删私有副本 + 卡面重指"全链路：

### 6.1 conceal（通用潜行）
- 新增 `common.conceal`：`untargetableByTargeted(inbound/single)` + `on_deal_damage→dispel self`（出手破除），category `conceal`，dur 2。
- 删 3 份同核私有 def：`shadow_veil`(sleepless) / `hidden_space`(apprentice) / `psych_invisibility`(spectator)。
- 全库引用重指（含 sleepless 主题互动 `traceless` 受击重隐、`conceal_authority` 常驻隐匿+召唤物连带，均按通用潜行语义无损）。
- 保留变体（不入试点）：`submerged`(sailor, dur=null) / `stealth`(apothecary, 多受击破除)。

### 6.2 revive_blocked（通用禁复活）
- `revive_blocked` def 自 `corpse_collector` 迁入 `common`（事实已是跨途径公共词）。
- 删 `eternal_sleep`(sleepless) 纯副本，2 处引用并入 `revive_blocked`。

### 6.3 结果
- common.statuses.json：14 → 16 状态；manifest.statusIds 增 `潜行`/`禁复活`。
- 三 Gate 全绿（validate_schema 0错0警 / validate.py 0错仅 1 条已知 doom_curse 告警 / check_enum_sync 一致）。
- 旧 id 全库零残留。共改 8 文件 + manifest + 本报告。
- 未 push。

### 6.4 待推广（按同法，待拍板）
- 减伤/易伤 B1（18）：guard/vulnerable 参数化挂载。
- 纯增伤（16）/ 纯属性（23）/ 纯混乱（16）：抽 `common.amplify` / `common.stat_mod` / `common.confuse`。
- 纯免疫（5→拆 debuff/control 两词）/ 纯减速（3）/ 潜行变体（2）/ 禁复活已做。
- 拼凑体（A 类）：逐判拆多状态挂载。

## 七、targetOverride 修饰键表达统一（2026-09-19 续）

上一轮收尾遗留「4 个混淆态（targetOverride 两 schema 表达）待统一」。

### 7.1 两种表达
- 表达 A（无 `op`）：apprentice 的 `闪光`/`escape_act`/`star_mark` — `{anchor, note}`。
- 表达 B（带 `op`）：corpse_collector `反噬`、fool `提线木偶` — `{op:"target_override", anchor, note}`。

### 7.2 判定
- schema 中 statusDef 修饰键 `targetOverride` 定义为 `{"type":"object"}`，并不识别 `op`。
- `op` 是控制流算子层（opSequence/opRepeat/opIf）的专用判别字段；全库其他修饰键（immune / untargetableByTargeted / damage_taken_mul 等）均不带 `op`。
- 无脚本读取 `targetOverride.op`。
- → 表达 B 的 `op:"target_override"` 是从旧式 `behaviorModifiers:[{op:'target_override'}]` 迁移时的残留冗余字段。

### 7.3 动作
- 以表达 A 为 canonical，删除 corpse_collector.反噬 与 fool.提线木偶 内的 `op` 字段（共 2 处）。
- 全库 5 处 statusDef 修饰键 `targetOverride` 现表达一致（均仅 `{anchor, note[，charges]}`）。
- 注：skills.json 中另有 7 处 `variant.targetOverride`（卡牌变体目标阵营覆盖，字段为 faction/scope），属不同 schema 节点、不同语义，本身不带 `op`，无需改动。

### 7.4 降格评估（结论：不降格）
5 个状态机制上并非纯换皮：anchor 不同（first_empty vs index_asc_same_faction）、star_mark 另带 `damage_taken_mul`、category/duration/charges 各异；且 `targetOverride` 修饰键已通过 `anchor` 字段参数化，无额外公共词可抽。故仅做表达统一，不做降格。

### 7.5 Gate
- validate_schema 22 文件 0 错 0 警；validate.py 829 卡 0 错 0 警；check_enum_sync 全一致。

## 八、拼凑体设计评审（2026-09-19 续）

对 §二.A 标记的 6 个「机制元素 ≥4」状态逐一判读，回答原假设「是否为互不依赖的独立机制乱拼、应拆分」。

| 状态 | 途径 | 机制构成 | 判读 |
|---|---|---|---|
| demonize 恶魔化 | criminal | 5×modify_stat(攻/血上限/甲/行动率 + 代价 精神抗−15) + trigger 命中附毒 | 统一「恶魔化形态」母版（与 beast_form 同母版）；5 属性是同一变身膨胀，mental−15 是有意代价段，附毒是 flavor。KEEP |
| werewolf_form 狼人化 | prisoner | 2×modify_stat + 2×trigger(附毒/自愈) + lineageStack | beast_form 母版复用，变身形态。KEEP（报告已注 legit 复合主题） |
| object_possession 附身物体 | prisoner | modify_stat(物抗+40) + modifiers(不可选/禁施法) + trigger(命中精神伤) | 统一「物体化」形态：不可选+自废施法换生存+命中怨毒。note 明言不可合并。KEEP |
| shadow_dwell 藏入阴影 | supplicant | modifiers(不可选+受伤减伤 0.85) + 2×trigger(出手/挨打现形) | 潜行母版变体（conceal + 减伤 + 双向现形）；主题统一。KEEP（其 note 自建议并入 unify 潜行母版，属降格轨道，非拆分） |
| flesh_hunger 血肉饥渴 | supplicant | modify_stat(血上限−5 代价) + 2×trigger(击杀回血攒储备/定期排毒) | 统一「嗜血肉体」：代价+续航+自净三段一体。KEEP |
| conceal_authority 隐秘权柄 | sleepless | modifiers(隐匿不可驱散) + 2×trigger(常驻隐匿己+召唤物 / 出手破除) | crossPathway 枢纽权柄：隐藏+不可驱散+出手破。主题统一。KEEP |

### 8.1 结论
6 个状态**均为主题统一的复合形态/权柄**，机制元素多是因为「丰富主题状态天然捆绑多条 effect/trigger/modifier」，并非「互不依赖的独立机制乱拼」。§二.A 的拆分假设（demonize 之类应拆多状态）经判读**不成立**。

- → 全部 KEEP，不做拆分。
- → 用户原担忧「简易拼凑」对纯换皮簇（B1 / C 各同构簇）成立，已在批次 1–5 降格收口；对这 6 个具体标记态不成立。
- → 唯一可跟进项：shadow_dwell 自注「建议并入统一潜行母版」，属 conceal 降格轨道（common.conceal 已建）；但它是带减伤 + 双向现形的 conceal 变体，与 submerged 同理保留独立。⚠️ **用户 2026-09-19 拍板：shadow_dwell 保留独立、不再追并入潜行母版**，本条关闭。
