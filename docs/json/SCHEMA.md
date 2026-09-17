# 技能池 JSON 规范（schema v1.1.0）

本文件是 `docs/json/*.skills.json` 与 `docs/json/manifest.json` 的**结构标准**。
机器可读版本在同目录 `schema/` 下，两者必须保持一致：改结构先改 schema，再改数据。

```
docs/json/
├─ manifest.json              全库索引
├─ <pathway>.skills.json ×22  途径技能池
├─ validate.py                语义校验器（枚举/引用完整性）
├─ schema/
│  ├─ skills.schema.json      ← 本文档的机器可读版（JSON Schema draft 2020-12）
│  ├─ manifest.schema.json
│  └─ validate_schema.py      结构校验器（字段/类型/跨字段一致性）
└─ SCHEMA.md                  ← 你在这里
```

## 1. 怎么用

```bash
# 结构 + 跨字段校验（需 jsonschema）
pip install jsonschema
python docs/json/schema/validate_schema.py

# 语义校验（无依赖，一直都有）
python docs/json/validate.py
```

两个校验器分工不同，**都要为 0 错误**才算合规：

| 校验器 | 管什么 |
|---|---|
| `schema/validate_schema.py` | 结构：字段是否存在、类型对不对、有无未知字段；跨字段：axis∈axes、id 前缀、rarity↔sequence、manifest 对齐 |
| `validate.py` | 语义：原语与参数取值域、状态 id 是否登记、稀有度映射、界域租金、frameworkFlag 例外 |

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
| `sourceFile` | string | ✓ | 回指源 md：`../skill-design/<途径>途径_技能池_v0.3.md`（目录变动时必须同步） |
| `sourceVersion` | string | ✓ | 源池版本，当前 `v0.3` |
| `axes` | object | ✓ | 构筑轴，`{ "<axisId>": { symbol, name } }`；卡片 `axis` 必须取自这里的键 |
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
| `tentative` | bool | ✓ | 数值待拍板；当前全库 773 张均为 `true` |
| `cost` | object | active | `{ energy, cooldown, castTime }`，`castTime` 可为 `null` |
| `reach` | `none`\|`melee`\|`ranged` | active | 攻击距离 |
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
| `conversionNotes` | string\|string[] | | md → JSON 转换备注 |
| `frameworkFlags` | flag[] | | 框架缺口登记（见 §8） |

### 3.2 kind 分支规则（schema 用 if/then 强制）

- `kind: active` → 必须同时有 `cost`、`reach`、`target`
- `kind: passive` → 必须有 `hook`

## 4. 目标系统

卡面 `target`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|:--:|---|
| `selectionMode` | `manual`\|`auto` | ✓ | 手选 / 引擎自动（按 `fallbackSort`） |
| `request` | object | ✓ | 选靶请求 |
| `fallbackSort` | sortKey\|null | | 自动排序键 |
| `consumption` | `summon`\|`domain`\|`zone` | | 目标消耗的额外资源 |

`request`（对应 DDD 的 faction × scope × anchor × sort）：

| 字段 | 取值 |
|---|---|
| `faction` | `self` / `ally` / `enemy` / `any` / `none` / `self_or_ally` |
| `scope` | `single` / `all` / `none` |
| `anchor` | `front_line` / `spawned_unit` / `first_empty` / `empty_ally_slot` |
| `sort` | 同 sortKey（见下） |
| `filter` | 候选池过滤器（开放结构） |
| `spread` / `excludeSelf` / `sortKey` | 见 schema |

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

### 5.2 原语（19 个，封闭集）

| type | 关键字段 | 备注 |
|---|---|---|
| `damage` | `value` `element` `mul` `spread` `pierce` `lethal` `neverMiss` | 元素见 §5.4 |
| `heal` | `value` `mode`(setHp/hpMaxRatio/to_ratio) | 治疗走 heal，不混 modify_resource（A22） |
| `mount_status` | `statusId` `duration` `stacks` `stackMode` `charges` | 落空/阻挡语义一律用 `charges`（确定性） |
| `modify_stat` | `stat` `value` `mode`(delta/set/mul/to_at_least) `duration` | 无宿主、不可驱散；要可见/可驱散用 mount_status |
| `modify_resource` | `resource` `value` `mode` | `hp/energy/shield/armor/lost/gauge.current/gauge.threshold` |
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

⚠️ `damage_taken_mul`、`heal_received_mul` 这类**不是原语**，属状态修正，必须写在 `statusDefs[].modifiers` 里。

### 5.3 条件（condition）

开放结构（`additionalProperties: true`），字段随 `kind` 变化。`kind` 为封闭枚举（25 个）：

`any_of` `caster_has_summon` `caster_status_exists` `chance` `consumed_count` `dead_count` `dispelled_count` `element_is` `field_status_count` `gauge_rank` `has_category` `has_status` `hp_percent` `hp_percent_compare` `remove_reason` `stat_compare` `status_category` `target_dead` `target_faction_is` `target_has_tag` `target_is_summoned` `target_unit_type` `unit_faction` `variant_is` `zone_active`

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
| `modifiers` | array\|object | **两种形态都合法**：数组（字符串/对象混合）或 `{修正名: 参数}` 映射表；开放结构 |
| `triggers` / `effects` | | 状态自带触发器与载荷 |
| `charges` `maxStacks` `stackPolicy`(stack/refresh) | | 层数与次数 |
| 其余 | | `lethalProtect` `immune` `suppress` `redirectRule` `thresholdTrigger` `slots` `fields` `ramp` 等，见 schema |

跨途径**同名状态视为共享状态**：同名但定义不同时会告警（当前 28 条），需确认是否应拆成两个状态。

## 7. 界域 / 区域 / 单位

- `domainDef`：`{ id, tier(overlay|hero), dispelable, duration, durationUnit, triggers, rulePatches }`
  - `rulePatches[]`：`{ kind, side, tag, mul }`，`tag` 可为数组
- `zoneDef`：`{ id, kind(hazard|blessing), trigger, affects, effects, duration }`
  - `effects` 元素有两种形态：直接是 effect，或 `{ side, payload: effect }` 按阵营分组
- `unitDef`：`{ id, name, hpRatio, atkRatio, reach, element, tags, triggers }`

## 8. 框架缺口（frameworkFlags）

卡片用到但 DDD 内核尚未正式支持的机制，必须登记：

```json
"frameworkFlags": [{ "code": "GAUGE_RATE_AS_STAT", "note": "gauge.rate 定价无锚点（D2）", "landed": false }]
```

`landed: false` = 仍欠账。当前 104 张卡带 flag（共 109 条）。
⚠️ 触发点 `on_status_gain` 也在此列——它不在 12 触发点封闭集内，使用时必须同时登记 flag。

## 9. 严格度约定

| 区域 | 策略 | 理由 |
|---|---|---|
| 文档/卡片/原语顶层 | **封闭**（`additionalProperties: false`） | 防止拼错字段静默失效 |
| 枚举（kind/rarity/reach/element/category/triggerEvent/sortKey/effectTarget） | **封闭** | 取值域由 ddd 参数篇背书 |
| `condition` / `unitFilter` / `modifiers` | **开放** | 谓词与修正维度在持续扩展，封闭会阻碍内容生产 |
| `scalar`（value 等） | 宽：`number\|string\|boolean\|null` | 兼容动态引用（`statusStacks:<id>`、`$var`）与占位描述 |

扩展新枚举值时，先去 `docs/ddd/params/` 对应参数篇登记，再改 schema，最后改数据。

## 10. 当前校验结果（2026-09-16 更新）

```
files: 22 | errors: 0 | warns: 28
```

**原 3 处数据问题——已于 2026-09-16 全部清零**：

| 位置 | 原问题 | 处置 |
|---|---|---|
| `assassin` / `skill_assassin_s5_repeated_charm` | `statusDefs[0].triggers[0].condition` 缺 `kind` | ✅ 该 condition 实为纯注释（无谓词），已将 note 上移到 `trigger.note` 并删除空 condition——省略 condition 即表示「无条件」，与 `always` 等价，无需为此新开枚举值 |
| `fool` / `skill_fool_s1_mystery_realm` | `zoneDef.effects[0].then[1]` 用了 `type: "damage_taken_mul"`——不是原语 | ✅ 改写为既有原语 `modify_damage`（`scope:"taken"`, `mul:0.85`）。该原语已在库内使用 11 次，无需新登记；`duration` 字段该原语不支持，已移除（zone 为 `on_occupy_tick` 逐 tick 重挂，语义为「停留期间」） |
| `prisoner` / `skill_prisoner_s4_performance`（演出） | `target.fallbackSort: "atk_asc"` 不在 sortKey 封闭集 | ✅ **裁定为登记 `atk_asc`**：权威取值域 `ddd/params/共享内核参数.md` §sort 早在 2026-09-14 就已含 `atk_asc`，是 schema 未同步。已补进 schema sortKey 枚举并同步本文件枚举清单，保留数据原意（按攻击升序取最弱己方） |

**28 条警告**：跨途径同名状态但定义不一致（如 `charm`、`shackle`、`puppet_string`）。需逐条确认是「拆成两个状态」还是「统一定义」。

`manifest.json` 结构与全库对齐检查 **0 错误**。
