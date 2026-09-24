# 技能池 JSON 规范（schema v1.4.0）

本文件是 `docs/json/*.skills.json` 与 `docs/json/manifest.json` 的**结构标准**。
机器可读版本在 `docs/json/schema/` 下，两者必须保持一致：改结构先改 schema，再改数据。

```
docs/json/
├─ manifest.json              全库索引
├─ <pathway>.skills.json ×22  途径技能池
└─ schema/
   ├─ skills.schema.json      ← 本文档的机器可读版（JSON Schema draft 2020-12）
   └─ manifest.schema.json
docs/meta/SCHEMA.md           ← 你在这里
docs/tools/
├─ validate.py                语义校验器（枚举/引用完整性；枚举运行时从 schema 加载）
├─ validate_schema.py         结构校验器（字段/类型/跨字段一致性）
└─ check_enum_sync.py         枚举对账：ddd 参数篇/本文档（文本侧）↔ schema/validate（机器侧）
```

## 1. 怎么用

```bash
# 结构 + 跨字段校验（需 jsonschema）
pip install jsonschema
python docs/tools/validate_schema.py

# 语义校验（无依赖，一直都有）
python docs/tools/validate.py

# 一致性对账（无依赖；上游文本改动后必跑）
python docs/tools/check_enum_sync.py   # ddd 参数篇 + 本文档 ↔ schema 枚举
```

两个校验器分工不同，**都要为 0 错误**才算合规：

| 校验器 | 管什么 |
|---|---|
| `tools/validate_schema.py` | 结构：字段是否存在、类型对不对、有无未知字段；跨字段：axis∈axes、id 前缀、rarity↔sequence、manifest 对齐 |
| `tools/validate.py` | 语义：原语与参数取值域、状态 id 是否登记、稀有度映射、界域租金、frameworkFlag 例外 |
| `tools/check_enum_sync.py` | 枚举漂移：ddd 参数篇 / 本文档（文本侧）与 schema $defs / validate.py（机器侧）不一致即报错；有意分歧须登记进脚本 KNOWN 并注明理由 |

编辑器自动补全：在 VS Code 的 `settings.json` 加

```json
"json.schemas": [
  { "fileMatch": ["*.skills.json"], "url": "./docs/json/schema/skills.schema.json" },
  { "fileMatch": ["manifest.json"],  "url": "./docs/json/schema/manifest.schema.json" }
]
```

## 2. 顶层结构

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `pathwayId` | string | ✓ | 途径英文 ID，必须与文件名 `<pathwayId>.skills.json` 一致 |
| `pathwayName` | string | ✓ | 途径中文名 |
| `sourceFile` | string | ✓ | 溯源指针：`../archive/skill-design_v0.3/<途径>途径_技能池_v0.3.md`（2026-09-18 起技能稿归档为只读快照，JSON 为唯一维护正源） |
| `sourceVersion` | string | ✓ | 源池版本，当前 `v0.3` |
| `axes` | object | ✓ | 构筑轴，`{ "<axisId>": { symbol, name, statusId?, enablers?, payoffs?, note? } }`；卡片 `axis` 必须取自这里的键。statusId = 轴身份状态；enablers/payoffs = 挂载/读取该状态的卡名（自技能稿轴表回收，仅保留可匹配卡名） |
| `sampleBuilds` | array | – | 示例 Build `[{ name, actives[], passives[], playstyle }]`（自技能稿 §二回收；卡名为设计示例，可能与现行卡名有出入） |
| `designNote` | string | – | 途径级机制说明（隐秘值/咬合器等维度，自技能稿轴表后说明段回收） |
| `artStyle` | string | – | 途径统一的 AI 出图风格模板（英文）：画风/材质/构图/调色；展示时与卡级 `art` 现拼成完整 prompt，不落盘 |
| `artFrameEpic` / `artFrameLegendary` | string | – | 途径 epic / legendary 档**边框纹样**的主题层（英文，写途径意象与配色）。**禁写 frame / border / bezel / apex / edge / corner 等构图定位词**（一见「框」就画成装裱画框）。框体由站点 CSS 画（`.cs-bezel`），纹样只负责装饰，几何不进 prompt。共用画法约束（`artFrameFormat`）与 common/uncommon/rare 三档主题层（`artFrame`）在 `manifest.json` 全局登记 |
| `cards` | array | ✓ | 技能卡列表 |

## 3. 卡片（card）

### 3.1 通用字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `id` | string | ✓ | `skill_<pathwayId>_s<序列>_<短名>`，全局唯一 |
| `name` | string | ✓ | 中文名 |
| `kind` | `active`\|`passive` | ✓ | 决定下面的必填分支 |
| `sequence` | int 0–9 | ✓ | 序列位阶；稀有度由它派生 |
| `sequenceName` | string | ✓ | 该位阶名称 |
| `rarity` | enum | ✓ | `common`(9-8) / `uncommon`(7-6) / `rare`(5-4) / `epic`(3-2) / `legendary`(1-0) |
| `axis` | string | ✓ | 必须存在于顶层 `axes` |
| `flagship` | bool | ✓ | 是否旗舰卡 |
| `lore` / `flavor` / `describe` | string | ✓ | 设定 / 风味 / **玩家可读效果描述**（`describe` 是唯一面向玩家的字段） |
| `effects` | effect[] | ✓ | 卡面效果，至少 1 条 |
| `tentative` | bool | ✓ | 数值待拍板；当前全库 829 张均为 `true` |
| `cost` | object | active | `{ energy, cooldown, castTime }`，`castTime` 可为 `null` |
| `reach` | `none`\|`melee`\|`ranged` | active | 攻击性质（近战/远程，与双方站位正交；仅决定同步对撞与可拦截性，非攻击类写 none） |
| `target` | object | active | 见 §4 |
| `hook` | enum | passive | 被动挂载的触发点 |
| `statusDefs` | statusDef[] | | 卡引入的私有状态 |
| `triggers` | trigger[] | | 卡片级触发器 |
| `unitDefs` / `zoneDef` / `domainDef` | | | 卡引入的单位 / 区域 / 界域定义 |
| `domain` / `zone` | object | | 界域、区域的挂载实例值 |
| `upgradeLadder` | object | | 升级阶梯 |
| `variants` | variant[] | | 变体分支 |
| `secondaryTargets` | object[] | | 附属选靶 |
| `tags` | string[] | | 界域交互标签（供 RulePatch 按 tag 过滤） |
| `gender` | `any`\|`male`\|`female` | | 性别限制 |
| `sharedAcross` | string[] | | 共享该卡的其他途径 |
| `conversionNotes` | string\|string[] | | **仅**登记 md → JSON 转换期的口径问题（未能结构化的内容、语义存疑处）。**缺失 = 转换干净，不是遗漏，无需补写**（全库约 15% 的卡无此字段，属合法状态）。⚠️ **不承载框架缺口**——后者一律走 `frameworkFlags`，见 §8 |
| `frameworkFlags` | flag[] | | 框架缺口登记（见 §8）。与 `conversionNotes` **职责互斥**：前者管「内核尚未支持」，后者管「转换口径存疑」 |
| `dimHooks` | dimHook[] | | 维度乘区挂钩：本卡对战场全局维度的乘区声明（见 §7） |
| `phaseHooks` | phaseHook[] | | 相位乘区挂钩：本卡对战场枚举相位的乘区声明（见 §7.1） |
| `art` | artBrief | | AI 出图特征（英文）`{ subject, elements[], mood }`——只写画面内容，风格在途径顶层 `artStyle` |

### 3.2 kind 分支规则（schema 用 if/then 强制）

- `kind: active` → 必须同时有 `cost`、`reach`、`target`
- `kind: passive` → 必须有 `hook`

## 4. 目标系统

卡面 `target`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `selectionMode` | `manual`\|`auto` | ✓ | 手选 / 引擎自动。两者都须有 `request` 范围（锚点+区域+过滤）；`manual` 由玩家拍板、未指定按 `fallbackSort` 兜底，`auto` 直接按 `fallbackSort` 取最高优先级 |
| `request` | object | ✓ | 选靶请求 |
| `fallbackSort` | sortKey\|null | | 自动排序键 |
| `consumption` | `summon`\|`domain`\|`zone`\|`instant`\|`translocate` | | 目标消耗的额外资源（对齐 DDD 共享内核 consumption）|
| `mode` | `unit`\|`area` | | 目标形态：点目标 / 区域目标（DDD TargetSpec.mode，2026-09-20 回补）。与 `selectionMode` 是两个独立维度；`mode=unit` 时 `consumption` 强制 `instant` 或 `translocate` |
| `pickCount` | integer | | 提交的目标数量（DDD I 节点 CandidatePool.pickCount，2026-09-20 回补）。`manual` 且候选数 > pickCount 才等待玩家选择，候选数 ≤ pickCount 直接全取不打断 |

`request`（对应 DDD 的 faction × scope × anchor × sort × filter × laneRef × spread）：

| 字段 | 取值 |
|---|---|
| `faction` | `self` / `ally` / `enemy` / `any` / `none` / `self_or_ally` |
| `scope` | `single` / `all` / `none` ✅ **2026-09-20 裁定为权威口径**——DDD 共享内核 §一 原有两行同名 `scope`（L12 几何 `single_point/whole_lane/adjacent` vs L19 覆盖 `single/all`）冲突，现以 **L19 为准**，L12 几何语义废弃、改由 `laneRef`+`spread`+`mode` 承载（避免改动 829 卡现有 scope 数据） |
| `anchor` | `front_line` / `spawned_unit` / `first_empty` / `empty_ally_slot` / `self` / `front_of_self` / `behind_self` / `cross_same_index` / `absolute` / `taunt_source` / `manual` / `nearest_any` / `any_lowest_hp` / `self_faction_hp_desc` / `last_dead_ally` / `index_asc_same_faction`，或直接写具体单位 id（2026-09-20 补齐至 DDD 全部 16 值）。⚠️ `first_empty`=任意半场空格 **≠** `empty_ally_slot`=己方半场空格，**不可互换**；`absolute` 需配 `fixedIndex`(int) |
| `fixedIndex` | integer | 配合 `anchor: absolute` 的绝对站位序号（2026-09-20 补） |
| `sort` | 同 sortKey（见下） |
| `filter` | 候选池过滤器（开放结构）。**DDD 标准 9 维**：`unitType` / `tags` / `hasStatus` / `hasCategory` / `hpPercent` / `casterHasSummon` / `isSummon` / `casterOwned` / `adjacency`；**项目扩展（数据已用）**：`unitId` / `isAllyOrMirror` / `isPuppet` / `isOwnSummon` / `element` / `tier` / `count` / `dispelable` / `anyOf`。2026-09-20 旧名 `statusId`→`hasStatus`、`category`→`hasCategory` 统一为 DDD 命名 |
| `laneRef` | `same_lane` / `cross_lane` / `all_lanes` / `auto`（DDD 原设计有、schema 曾丢失，本轮回补；auto 在 I 节点前由施法者上下文预处理为具体值） |
| `spread` | `none` / `lane_line` / `splash_adjacent` / `splash_behind` / `cross_same_index`（2026-09-20 由 1 值补齐为 DDD 5 值；承载上述废弃几何 scope 的语义） |
| `excludeSelf` / `sortKey` | 见 schema |

> **mode / selectionMode 维度澄清（2026-09-20）**：`mode: unit|area`（点目标 vs 区域目标）与 `selectionMode: manual|auto`（**谁拍板最终目标**）是两个**独立正交维度**，现已回补 `mode`，二者不可混用。配合已回补的 `laneRef`（扫描路线）与补齐的 `spread`（5 值），共同承载原 DDD L12 废弃几何 scope 的语义。

**sortKey 封闭枚举**（新增须先登记到共享内核参数）：

`none` `hp_asc` `hp_desc` `atk_asc` `atk_desc` `index_asc` `index_desc` `energy_desc` `armor_desc` `buff_count_desc` `debuff_count_desc` `gauge_asc` `gauge_desc` `stat_max_desc`

**effect 级 target 锚点**（效果内二次寻址，23 个封闭值）：

`self` `caster` `target` `primary_target` `same_target` `secondary_target` `attacker` `holder` `status_holder` `killed_unit` `all_allies` `allies_except_self` `all_enemies` `all_other_enemies` `all_units` `all` `adjacent_enemy` `enemy` `occupant_ally` `occupant_enemy` `splash_adjacent` `splash_behind` `one_own_snare_trap`

## 5. 效果模型（effect）

递归结构：一个节点要么是**算子**（有 `op`，无 `type`），要么是**原语**（有 `type`）。

### 5.1 算子（3 个）

| op | 必填 | 说明 |
|---|---|---|
| `sequence` | `steps` | 顺序执行，编目期展开为扁平 EffectRef |
| `repeat` | `steps` | 重复；`count` 可用对象形式 `{valueFrom, filter, cap}` 做运行期计算 |
| `if` | `condition`, `then` | 条件分支，`else` 可选 |

### 5.2 原语（29 个，封闭集）

| type | 关键字段 | 备注 |
|---|---|---|
| `damage` | `value` `element` `mul` `spread` `pierce` `lethal` `neverMiss` | 元素见 §5.4 |
| `heal` | `value` `mode`(setHp/hpMaxRatio/to_ratio) | 治疗走 heal，不混 modify_resource（A22） |
| `mount_status` | `statusId` `duration` `stacks` `stackMode` `charges` | 落空/阻挡语义一律用 `charges`（确定性） |
| `modify_stat` | `stat` `value` `mode`(delta/set/mul/to_at_least) `duration` | 无宿主、不可驱散；要可见/可驱散用 mount_status |
| `modify_resource` | `resource` `value` `mode` | `hp/energy/shield/armor/lost/gauge.current` |
| `move` | `op` `distance` | 7 种 op |
| `spawn` | `unitId`/`unit`/`template` `position` `hpRatio` `reviveOf` | 复活走 `reviveOf`，不新增原语（G4） |
| `dispel` | `dispelTarget`(unit/domain) `filter` `category` `count` | 只作用于 StatusInstance（INV-P7） |
| `drain` | `resource` `value` `healRatio` | |
| `domain` | `op`(overlay/swap/hero) `def` `duration` | 界域三件套 |
| `translocate` | `op`(pull_into/banish) `duration` `returnPayload` | **跨层位移**：目标 detached N tick（离场不持坐标、计时冻结），到期于己方队尾回归；`banish` 可带回归载荷。ddd 效果参数 11 号，2026-09-06 拍板；schema 于 2026-09-16 补登记（此前缺失导致零使用） |
| `modify_damage` | `scope`(taken/dealt) `mul` | |
| `target_override` | `faction` `anchor` `sort` | |
| `transfer_status` | `mode`(copy/rewrite) `mapping` `fallback`(effect[]) | |
| `snapshot` / `restore_snapshot` | `fields` | 成对使用 |
| `echo_last_skill` | `potency` `rounding` | 权柄技能不可被重放 |
| `gauge_shuffle` / `status_shuffle` | `resource` / `mode` `sort` | |
| `modify_skill` | `skillRef`(selector/by_id) `clearCooldown` `costDelta` `setInstant` `targetSpecOverride` | **行为层修改（一）**：改写技能实例运行时属性——清 CD / 改施法消耗 / 吟唱转瞬发 / **完整改写 TargetSpec**（对齐 DDD：可改技能全部选靶属性，而非仅范围；`targetSpecOverride` 为对象，给出 selectionMode+request 全字段，未给出的沿用原值，2026-09-17 拍板补原缺口，2026-09-20 升级为完整 TargetSpec 补丁） |
| `modify_status` | `statusId` `target` `addDuration` `setDuration` `maxStacksDelta` `dispelableOverride` | **行为层修改（二）**：改写已存在状态实例的持续 / 最大可叠加层数 / 可驱散性（区别于 mount_status 施加新状态；2026-09-17 拍板） |
| `modify_targetability` | `target` `untargetable` `direction` `duration` `pierce` | 目标可选性：改单位「可被选为目标」的属性，带方向与穿透。对应手写 `untargetableByTargeted`(29)/`untargetable`(2)/`untargetableByAll`(1) |
| `reveal` | `target` `scope`(to_source/to_all) `dispel` `pierceTargetability` | 揭示 / 穿透隐匿。对应手写 14 种拼写（约 26 处）。⚠️ **纯驱散隐匿仍用 `dispel(filter.category=[conceal])`**，本原语用于「显形但不驱散」「仅对施法者显形」 |
| `grant_immunity` | `target` `against`(statusCategory[]) `element` `damageType` `charges` `duration` | 授予免疫（临时/条件性）。此前仅 `statusDef.immune`（2 处）可用，需为每种免疫单写状态 |
| `take_control` | `target` `duration` `onExpire`(revert/die/keep) `actionPolicy`(full/attack_only/move_only) | 夺取控制权 / 阵营翻转：持续期内目标视为己方行动。此前**完全空白**（0 处），而「操控/支配」被提及 72 次 |
| `write_rule_slot` | `slot`(0–2) `field`(trigger/punish/exemptions/scope) `value` `overwrite` | **规则槽写入（一）**：把一条规则写进战场级 `Rules[3]` 的指定槽位。与 `transfer_status` 同族（效果上下文 §2.1），服务仲裁人律令轴全卡。2026-09-18 落地 |
| `modify_rule_slot` | `slot`(0–2) `field` `value` `mode`(replace/append/remove) `filter` | **规则槽修改（二）**：改写/追加/移除既有槽位规则，服务律师与通识者的僭越轴改规类卡。`field` 闭枚举即律师侧要求的「防非法字段写入」校验。2026-09-18 落地 |
| `advance_clock` | `ticks` | **战场时钟推进**：`board.clock += N`（mod 72）。触发 `on_phase_change`。**时钟只进不退**——不提供回拨算子，「回到过去」走已有的 保存/重启/命运循环（快照回滚，原著水银之蛇「非逆转时光」）。2026-09-21 落地，见 `docs/ddd/params/战场参数.md` §1.3 |
| `set_luminance` | `value`(0–10) `duration`(tick) `dispelable` | **光照度覆写**：写入战场级覆写层 `board.lumOverride`，压栈顶、到期回落派生值。服务权柄卡「黑夜降临」「白昼」等昼夜覆盖类。触发 `on_phase_change`。2026-09-21 落地 |

⚠️ `damage_taken_mul`、`heal_received_mul` 这类**不是原语**，属状态修正，必须写在 `statusDefs[].modifiers` 里。

### 5.3 条件（condition）

开放结构（`additionalProperties: true`），字段随 `kind` 变化。`kind` 为封闭枚举（26 个）：

`any_of` `caster_has_summon` `caster_status_exists` `chance` `consumed_count` `dead_count` `dispelled_count` `element_is` `field_status_count` `gauge_rank` `has_category` `has_status` `hp_percent` `hp_percent_compare` `remove_reason` `resource_compare` `stat_compare` `status_category` `target_dead` `target_faction_is` `target_has_tag` `target_is_summoned` `target_unit_type` `unit_faction` `variant_is` `zone_active`

⚠️ `chance` 必须遵守随机性治理 R1–R6：只用于**非伤害维度**、单次抽样、须可登记筛出。
当前全库仅 1 处 `chance`（monster 行动条 −8，p=0.5）。

### 5.4 元素（element）

`fire` `ice` `poison` `lightning` `mental` `physical` `holy` `dark` `none`；`$` 前缀表示运行期变量（如 `$recorded.element`）。

## 6. 状态（statusDef）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` / `name` | string | id 小写下划线 |
| `category` | enum[] | `buff` `debuff` `control` `reactive` `aura` `stance` `fear` `retarget` `link` `contract` `conceal` `seal` |
| `dispelable` | bool | |
| `duration` | int\|null | |
| `modifiers` | array\|object | **两种形态都合法**：数组（字符串/对象混合）或 `{修正名: 参数}` 映射表；开放结构。数组形态的对象元素为封闭 `statusModifier`（2026-09-18 增补 `target`/`condition` 两字段，承载「对全体友军、阈值门控」类修饰） |
| `triggers` / `effects` | | 状态自带触发器与载荷 |
| `charges` `maxStacks` `stackPolicy`(stack/refresh) | | 层数与次数 |
| `disallowActions` | `actionLock[]` | **行为封锁**：单位持有该状态时禁止相应行动，`actionLock` 封闭枚举 = `move`(禁止移动) / `basic_attack`(禁止普攻) / `skill`(禁止主动技能) / `skip`(禁止跳过行动周期) / `react`(禁止反应·反击) / `channel`(禁止吟唱)。经既有 `mount_status` 挂载，可驱散、可带 duration/stacks（行为层修改三，2026-09-17 拍板） |
| `crossPathway` | bool | 枢纽状态跨系可读标志：true 时该状态可被非本途径友方技能读取（跨系 combo 依赖此标志 + `participants` 白名单）。定义见 源质维度与跨系枢纽.md §一 |
| `participants` | PathwayId[] | 跨系读取白名单：列出可读取本 `crossPathway` 状态的途径 id。未列入的途径即便 `crossPathway:true` 也不可读。见 §一.2 运行时读取规则 |
| `damageTransfer` | object | **伤害转嫁族**（编队参数 §1.1b / H28）：`ratio` × `direction`(to_caster/to_allies/to_target/to_third) × `split`(single/even) × `selfKeep` × `linkedTo`；**必须内置防循环**——由本状态产生的伤害不再触发任何转嫁。`network` 子块即囚犯「诅咒链接网络」可堆叠形态：`maxTargets`=N、`splitCoefficient`{base,perExtra}，全网分摊系数 = base + perExtra×(N−1)（囚犯 1+0.2×(N−1)）。2026-09-18 从开放 `modifiers` 提升为一等字段 |
| `lineageStack` | object | **异类谱系栈**（编队参数 §2.4）：`lineage_push`（推入的形态 statusId）× `lineage_depth`（当前栈深）× `maxDepth` × `replay.enabled`（演出回放，重演栈内形态序列）。与 `formGroup/nextPhase/cycleTicks`（月相轮转=轮换）是不同机制，不得混用 |
| `summonMapping` | object[] | **召唤映射表**：`stacks`(N) × `count` × `atkRatio` × `hpRatio` × `unitId?`，表达「刻印层数 N → 召唤物强度/数量 f(N)」（罪犯 仪式刻印→深渊召唤；编队参数 §2.4 H1 召唤物基线 + `spawn.companionBuff`） |
| `countMode` | `cumulative`\|`on_field` | **计数口径**（通识者造物轴）：`cumulative`=累计产出（只增不减）/ `on_field`=当前在场（离场即减）。⚠️ 口径为待拍板项，两者对造物轴阈值 payoff 的激励方向相反 |
| 其余 | | `lethalProtect` `immune` `suppress` `redirectRule` `thresholdTrigger` `slots` `fields` `ramp` `behaviorModifiers` 等，见 schema |

跨途径**同名状态视为共享状态**：同名但定义不同时会告警。2026-09-18 已将全部 28 条清零（同机制统一签名 / 异机制改名拆分，见 §10）。

## 7. 界域 / 区域 / 单位

- `domainDef`：`{ id, tier(overlay|hero), dispelable, duration, durationUnit, triggers, rulePatches }`
  - `rulePatches[]`：`{ kind, side, tag, mul }`，`tag` 可为数组
- `zoneDef`：`{ id, kind(hazard|blessing), trigger, affects(ally_of_owner|enemy_of_owner|any), effects, duration }`——`affects` 值域对齐 `docs/ddd/params/战场参数.md` 的 `ZoneGrant.affects`
  - `effects` 元素有两种形态：直接是 effect，或 `{ side, payload: effect }` 按阵营分组
- `unitDef`：`{ id, name, hpRatio, atkRatio, reach, element, tags, triggers, unitType, gender }`——`gender`(`any`/`male`/`female`) 为 Unit.gender，供获取期过滤与性别限制判定（刺客序列4+ 高位谱系要求 `female`）。

## 7. 维度乘区挂钩（dimHook）

战场全局标量维度（`secrecy` 隐秘值 / `order` 秩序度 / `fate_value` 命运值 / `luminance` 光照度）的累积与阈值判定定义在 `docs/ddd/params/源质维度与跨系枢纽.md` §二，阈值档位对齐 `docs/ddd/params/数值标定基准.md` §五（隐秘值 4/7/10、秩序度 3/7/10、命运值 ±5/±8/±10、光照度 2/5/8）。`dimHook` 把这个「维度→乘区」的挂钩**结构化到卡面**，供结算层（效果上下文）在 `board.<dim>` 达阈值时对本卡相关结算乘 `mul`。

```json
"dimHooks": [{
  "dim": "secrecy", "comparator": ">=", "threshold": 7,
  "mul": 1.5, "target": "damage", "filterTags": ["隐秘"],
  "note": "≥7 隐秘类 +50%（⚠️D 平衡占位）"
}]
```

字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `dim` | `secrecy`\|`order`\|`fate_value`\|`luminance` | 挂钩的战场维度（闭枚举） |
| `comparator` | `>=`\|`<=`\|`>`\|`<`\|`==` | 阈值比较符，默认 `>=` |
| `threshold` | number | 触发阈值，须在维度值域内（secrecy/order/luminance ∈ [0,10]、fate_value ∈ [−10,10]） |
| `mul` | number>0 | 乘区系数（⚠️D 占位）；单卡建议 0.8–1.5，超限需 `note` 说明 |
| `target` | `damage`\|`damage_taken`\|`heal`\|`resource`\|`rule_strength`\|`all` | 乘区作用目标，默认 `damage` |
| `filterTags` | string[] | 仅当本卡带其一 tag 才生效（如 secrecy 要求 tag∈{愚弄,隐秘,conceal}） |
| `note` | string | 口径说明，mul 超限或非常规时必填 |

Gate（validate.py）：`dim` 须为已注册维度、`threshold` 须在值域内、`mul>0`；`mul` 越出 0.8–1.5 给出非阻断告警（平衡期再收紧）。

> 维度本身是全局标量，不在此 per-pathway schema 内重复定义；本字段只声明「哪张卡在哪维度达阈值时放大什么」。维度注册表（range/tier）以 ddd 散文为权威源。

### 7.1 相位乘区挂钩（phaseHook）

**为什么单列、不塞进 `dimHook`**：相位是**枚举**（`midnight`/`dawn`/`day`/`dusk`/`night`），而 `dimHook.threshold` 是 number + comparator，装不下枚举；更关键的是**黎明与黄昏的光照度区间几乎完全重叠**（黎明 1→7、黄昏 6→1），用连续量 `luminance` 根本区分不开二者。凡「必须是黎明 / 必须是黄昏」的判定一律走本结构（2026-09-21 裁定）。

```json
"phaseHooks": [{
  "phases": ["dawn"], "mul": 1.25, "target": "damage",
  "note": "黎明窗口加成（⚠️D 平衡占位）"
}]
```

字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `phases` | `midnight`\|`dawn`\|`day`\|`dusk`\|`night` 数组（≥1 项） | 生效相位集合；月夜 = `["night","midnight"]` + 月相条件 |
| `mul` | number>0 | 乘区系数（⚠️D 占位）；单卡建议 0.8–1.5，超限需 `note` 说明 |
| `target` | 同 §7 `dimHook.target` | 乘区作用目标，默认 `damage` |
| `filterTags` | string[] | 仅当本卡带其一 tag 才生效 |
| `note` | string | 口径说明，mul 超限或非常规时必填 |

Gate（validate.py）：`phases` 非空且取值合法、`mul>0`；`mul` 越出 0.8–1.5 给出非阻断告警（与 dimHook 同一口径）。

## 8. 框架缺口（frameworkFlags）

卡片用到但 DDD 内核尚未正式支持的机制，必须登记：

```json
"frameworkFlags": [{ "code": "GAUGE_RATE_AS_STAT", "note": "gauge.rate 定价无锚点（D2）", "landed": true }]
```

`landed: false` = 仍欠账。当前 104 张卡带 flag（共 109 条），其中 **46 条为 `landed: false`**。
⚠️ 触发点 `on_status_gain` 也在此列——它不在 12 触发点封闭集内，使用时必须同时登记 flag。

**与 `conversionNotes` 的边界（2026-09-19 明确，避免重复排查）**

| | `frameworkFlags` | `conversionNotes` |
|---|---|---|
| 管什么 | 内核**尚未支持**的机制 | md→JSON **转换口径**存疑 |
| 可见性 | `build_overview.py` 的「⚠️缺口」列已独立列出 | 卡面字段 |
| 缺失含义 | 无缺口 | **转换干净，不是遗漏** |

→ 因此：**不要因为某卡缺 `conversionNotes` 就去补写**，也不要把框架缺口写进 `conversionNotes`。
当前有 5 张卡同时缺 `conversionNotes` 且带 `landed:false` flag（arbiter 权威质变 / assassin 说服 / corpse_collector 灵之同类 / monster 意外之财 / thief 窃取锚）——**这是正常状态**，其缺口已由 `frameworkFlags` 完整承载并被 `build_overview` 列出，无需也不应补写 `conversionNotes`。

## 9. 严格度约定

| 区域 | 策略 | 理由 |
|---|---|---|
| 文档/卡片/原语顶层 | **封闭**（`additionalProperties: false`） | 防止拼错字段静默失效 |
| 枚举（kind/rarity/reach/element/category/triggerEvent/sortKey/effectTarget） | **封闭** | 取值域由 ddd 参数篇背书 |
| `condition` / `unitFilter` / `modifiers` | **开放** | 谓词与修正维度在持续扩展，封闭会阻碍内容生产 |
| `scalar`（value 等） | 宽：`number\|string\|boolean\|null` | 兼容动态引用（`statusStacks:<id>`、`$var`）与占位描述 |

扩展新枚举值时，先去 `docs/ddd/params/` 对应参数篇登记，再改 schema，最后改数据。

## 10. 当前校验结果（2026-09-22 更新）

```
结构校验（validate_schema.py）: files 22 | errors 0 | warns 0
语义校验（validate.py）       : cards 829 | errors 0 | warns 0（已登记缺口 1 项汇总输出，不逐条告警）
```

**命名治理（2026-09-18 清零）**：`modifiers` 为开放结构，曾同义异写严重。`validate.py` 内置 `MODIFIER_ALIASES` 别名表，命中即产出非阻断告警引导收敛；全库 25 条已于 2026-09-18 一次性收敛完毕：

| 别名 | 规范拼写 |
|---|---|
| `damageTakenMul` | `damage_taken_mul` |
| `damageMul` / `damageDealtMul` / `damageDealtMulFilter` / `damage_mul_2` | `damage_mul`（同卡撞键合并为数组） |
| `healReceivedMul` | `heal_received_mul` |
| `healInvert` | `heal_invert`（ddd 效果上下文 §2.1 正典载荷名） |
| `damageTakenBonus` | `damage_taken_add`（平加值非乘区，2026-09-18 登记进编队参数 StatusDef 修正表） |
| `untargetable` / `untargetableByAll` | `untargetableByTargeted` |
| `dispelOverride` / `dispelableOverwrite` / `runtimeDispelOverride` | `dispelableOverride` |
| `behaviorOverride` | `behaviorModifiers` |

收敛方式：优先改用规范拼写；语义上确属新能力的，改用对应原语（如 `reveal` / `modify_targetability` / `modify_status.dispelableOverride`）。

**manual 卡 fallbackSort（17 张，2026-09-18 补齐）**：`selectionMode: manual` 但缺 `fallbackSort` 的 17 张卡已按卡面意图补默认排序键——敌方控制/debuff 与输出增益类取 `atk_desc`（notarize / miracle / historical_echo / corruption / chaos / choice_branch），治疗保护换位与补刀类取 `hp_asc`（blink / frost_armor / mirror_step / holy_water / marionette_swap / preserve / guardian_stance / sacrifice_prayer / mind_baptism / rage_swipe），wheel_of_fate 取 `gauge_desc`。

**同名状态 28 条警告——2026-09-18 全部清零**，处置分两类：

统一签名（同名同机制，8 个 id）：`shackle`（枷锁 ×6→apothecary 版）、`revive_blocked`（×3→seer 版永久）、`dread`（→sailor 版，statMods 方言转 effects）、`puppet_string`（×4→corpse 版）、`hallucination`（×3→control + charges 1 + 3t + behaviorModifiers）、`danger_sense`（→monster 版含自续链）、`spirit_sight`（→corpse 版原著限定 SPIRIT）、`stealth`（潜行，apothecary/sleepless 统一为 direction inbound + duration 2，挂载点均显式覆盖 duration；`charm` 正典 = 反向嘲讽 anchor self_faction_hp_desc，assassin/lawyer 归一）。签名对齐只动 8 个签名字段（name/category/dispelable/duration/modifiers/maxStacks/stackPolicy/charges），各卡 triggers/effects/note 保持本地差异。

改名拆分（同名异机制，保留方不动，改名方同步卡内全部引用）：`beast_form`→`werewolf_form`（prisoner 狼人化）、`blessing`→`blessing_gift`（monster）、`charm`→`obsession` 迷恋（apothecary/criminal 的 anchor self 版）、`countersuit`→`distortion` 扭曲（lawyer）、`exiled`→`ostracized` 隔离（arbiter）、`fallen`→`falling` 堕落中（supplicant）、`flesh_immortal`→`flesh_undying`（supplicant）、`misfortune`→`bad_omen` 恶兆（sleepless）、`parasitized`→`deep_parasitized` 深度寄生（thief）、`sealed`→`occult_seal`（sleepless）、`spirit_sovereign`→`spirit_authority`（sleepless）、`submerged`→`quicksilver_submerge`（warrior，顺带修 gaugeRateMul null→0.5）、`concealed` 三方拆分：seer 保留正典 `concealed`，sleepless→`stealth` 潜行，warrior→`ambush_shroud` 伏击伪装（monster inspiration_sense 的 targetHasStatus 过滤同步扩为三 id）。

跨卡引用同步修正：`arbiter authority_shift` 过滤 exiled→ostracized；`sleepless calamity` 挂载 misfortune→bad_omen。

**原 3 处数据问题——已于 2026-09-16 全部清零**：

| 位置 | 原问题 | 处置 |
|---|---|---|
| `assassin` / `skill_assassin_s5_repeated_charm` | `statusDefs[0].triggers[0].condition` 缺 `kind` | ✅ 该 condition 实为纯注释（无谓词），已将 note 上移到 `trigger.note` 并删除空 condition——省略 condition 即表示「无条件」，与 `always` 等价，无需为此新开枚举值 |
| `seer` / `skill_seer_s1_mystery_realm` | `zoneDef.effects[0].then[1]` 用了 `type: "damage_taken_mul"`——不是原语 | ✅ 改写为既有原语 `modify_damage`（`scope:"taken"`, `mul:0.85`）。该原语已在库内使用 11 次，无需新登记；`duration` 字段该原语不支持，已移除（zone 为 `on_occupy_tick` 逐 tick 重挂，语义为「停留期间」） |
| `prisoner` / `skill_prisoner_s4_performance`（演出） | `target.fallbackSort: "atk_asc"` 不在 sortKey 封闭集 | ✅ **裁定为登记 `atk_asc`**：权威取值域 `ddd/params/共享内核参数.md` §sort 早在 2026-09-14 就已含 `atk_asc`，是 schema 未同步。已补进 schema sortKey 枚举并同步本文件枚举清单，保留数据原意（按攻击升序取最弱己方） |

`manifest.json` 结构与全库对齐检查 **0 错误**。
