# 编目三件套分析报告（召唤物 / 区域 / 界域）

> 数据来源：`docs/json/*.skills.json` 顶层三池（unitDefs / zoneDefs / domainDefs） + 全库卡面递归遍历，由 `docs/tools/build_entity_analysis.py` 生成。
> 口径与网页端统计分析页的「召唤物 / 区域 / 界域」三个子页一致；状态定义（*.statuses.json）不在本报告口径。
> 生成日期：2026-10-09

## 一、召唤物（unitDefs 池 + 卡面 spawn 引用）

池内蓝本 **11** 条（覆盖 4 途径）；卡面具名单位引用 **30** 种，其中池外引用（卡面内联、无 unitDef）**24** 种 / 74 次——池只收编「同途径多卡共享」的蓝本，单卡单位属性内联在 spawn 段（hpRatio / atkRatio × H1 基线），**池外引用是常态而非缺漏**。具名单位全集（36）与基线档见 ddd《召唤物参数》。

### 1.1 池内蓝本清单

| 单位 | 名称 | unitType | 途径 | 特征 |
|---|---|---|---|---|
| `unit_wraith` | 亡魂 | UNDEAD | 收尸人 | reach melee、hpRatio 0.7 |
| `unit_skeleton` | 骷髅 | UNDEAD | 收尸人 | reach melee、hpRatio 1.0 |
| `unit_zombie` | 活尸 | UNDEAD | 收尸人 | reach melee、hpRatio 1.0 |
| `unit_historical_echo` | 历史影像 | ILLUSION | 占卜家 | hpRatio 0.35 |
| `unit_marionette` | 秘偶 | CONSTRUCT | 占卜家 | hpRatio 0.25 |
| `unit_nature_spirit` | 自然灵 | SPIRIT | 不眠者 | reach melee、hpRatio 1.0 |
| `unit_shadow_spawn` | 阴影生物 | ILLUSION | 秘祈人 | 触发载荷、tags、元素、hpRatio 0.35 |
| `unit_flesh_servant` | 血肉仆役 | FLESH | 秘祈人 | 触发载荷、tags、元素、hpRatio 0.5 |
| `unit_grazed_wraith` | 被放牧的灵体 | SPIRIT | 秘祈人 | tags、元素、hpRatio 0.4 |
| `unit_fallen_kin` | 堕落眷属 | SPIRIT | 秘祈人 | tags、元素、hpRatio 0.25 |
| `unit_abomination` | 异变怪物 | ABERRATION | 秘祈人 | 触发载荷、tags、元素、hpRatio 动态（见卡面效果） |

> unitType 登记率：**11/11**——未登记单位的种类归属见《召唤物参数》§一归属表。

### 1.2 spawn 引用形态（卡面，按节点计）

| 形态 | 次数 |
|---|---:|
| 具名单位引用 | 90 |
| 区域蓝本引用 | 10 |
| 复活（不产生新单位） | 6 |
| 固定蓝本模板 | 6 |
| 动态模板 | 2 |

### 1.3 具名单位引用清单（spawn unitId 去重）

| 单位 | 引用次数 | 首引途径 | 池内 |
|---|---:|---|---|
| `unit_automaton` | 16 | 通识者 | 池外（卡面内联） |
| `unit_beastling` | 11 | 耕种者 | 池外（卡面内联） |
| `unit_skeleton` | 8 | 收尸人 | ✓ |
| `unit_beast` | 7 | 药师 | 池外（卡面内联） |
| `unit_vermin` | 7 | 耕种者 | 池外（卡面内联） |
| `unit_vine` | 5 | 耕种者 | 池外（卡面内联） |
| `unit_homunculus` | 4 | 耕种者 | 池外（卡面内联） |
| `unit_wraith` | 3 | 收尸人 | ✓ |
| `unit_oak_child` | 3 | 耕种者 | 池外（卡面内联） |
| `unit_relic` | 3 | 囚犯 | 池外（卡面内联） |
| `unit_war_soldier` | 2 | 猎人 | 池外（卡面内联） |
| `unit_ghoul` | 2 | 囚犯 | 池外（卡面内联） |
| `unit_nature_spirit` | 2 | 不眠者 | ✓ |
| `unit_bat` | 1 | 药师 | 池外（卡面内联） |
| `unit_elder_thing` | 1 | 药师 | 池外（卡面内联） |
| `unit_thoughtform` | 1 | 学徒 | 池外（卡面内联） |
| `unit_mirror_image` | 1 | 刺客 | 池外（卡面内联） |
| `unit_zombie` | 1 | 收尸人 | ✓ |
| `unit_demon` | 1 | 罪犯 | 池外（卡面内联） |
| `unit_golem` | 1 | 耕种者 | 池外（卡面内联） |
| `unit_doll` | 1 | 耕种者 | 池外（卡面内联） |
| `unit_tower_construct` | 1 | 阅读者 | 池外（卡面内联） |
| `unit_sea_beast` | 1 | 水手 | 池外（卡面内联） |
| `unit_leviathan` | 1 | 水手 | 池外（卡面内联） |
| `unit_historical_echo` | 1 | 占卜家 | ✓ |
| `unit_marionette` | 1 | 占卜家 | ✓ |
| `unit_split_identity` | 1 | 观众 | 池外（卡面内联） |
| `unit_imagined` | 1 | 观众 | 池外（卡面内联） |
| `unit_stone_clock` | 1 | 偷盗者 | 池外（卡面内联） |
| `unit_doppelganger` | 1 | 偷盗者 | 池外（卡面内联） |

### 1.4 按 unitType 分道的承载（卡面）

三路承载合并：效果节点 filter.unitType 乘区 **2** 处（登记口径，当前数据零使用——晨曦领域的类型约束写在域 envRulesText 文本里，结构不可统计）、target.request 选靶约束 **21** 张卡、target_unit_type 条件谓词 **9** 处；另有 target_is_summoned 笼统召唤物谓词 **3** 处（此表按类型拆，不含它）。filter 不区分敌我（克制 / 加益只由效果方向决定）。

| unitType | 次数 |
|---|---:|
| `SPIRIT` | 19 |
| `UNDEAD` | 16 |
| `DEMON` | 5 |
| `CONSTRUCT` | 4 |
| `ITEM` | 1 |

## 二、区域（zoneDefs 池 + 卡面 zone 用法）

池内蓝本 **9** 条（覆盖 8 途径）；卡级 zone 字段（注册）**2** 张；spawn 召唤区域 **10** 次 / 9 种。Zone 是纯坐标效果、不占格，与召唤物的判别权威在 ddd《战场参数》§一；与 statusDef 同族但**不是** statusDef（驱散不作用于 zone 标量）。

### 2.1 池内蓝本清单

| 区域 | kind | 作用方 | 触发 | duration | 途径 |
|---|---|---|---|---|---|
| `zone_jurisdiction` | `blessing` | `any` | `on_occupy_tick` | 30 | 仲裁人 |
| `zone_no_darkness` | `blessing` | `any` | `on_occupy_tick` | — | 歌颂者 |
| `zone_true_death` | `hazard` | `enemy_of_owner` | `on_occupy_tick` | None | 收尸人 |
| `zone_pale_kingdom` | `hazard` | `enemy_of_owner` | `on_occupy_tick` | None | 收尸人 |
| `zone_doom_field` | `hazard` | `enemy_of_owner` | `on_occupy_tick` | 40 | 怪物 |
| `zone_storm_hell` | `hazard` | `enemy_of_owner` | `on_occupy_tick` | 20 | 水手 |
| `zone_mystery_realm` | `blessing` | `any` | `on_occupy_tick` | None | 占卜家 |
| `zone_nightmare_world` | `hazard` | `enemy_of_owner` | `on_occupy_tick` | 20 | 不眠者 |
| `zone_dawn_bastion` | `blessing` | `ally_of_owner` | `on_occupy_tick` | 20 | 战士 |

### 2.2 结构维度分布

| 维度 | 取值 | 次数 |
|---|---|---:|
| kind | `hazard` | 5 |
| kind | `blessing` | 4 |
| affects | `enemy_of_owner` | 5 |
| affects | `any` | 3 |
| affects | `ally_of_owner` | 1 |
| trigger | `on_occupy_tick` | 9 |
| durationUnit | `tick（缺省）` | 4 |
| durationUnit | `tick` | 1 |

### 2.3 区域载荷原语（zoneDefs 内效果节点）

| 原语 | 次数 |
|---|---:|
| `modify_stat` | 7 |
| `mount_status` | 7 |
| `damage` | 4 |
| `dispel` | 1 |
| `spawn` | 1 |
| `modify_damage` | 1 |

## 三、界域（domainDefs 池 + 卡面 domain 用法）

池内蓝本 **28** 条（覆盖 21 途径）；卡面 domain 原语 **32** 次；卡级 domain 字段 **28** 张（引用池 def **28** 张——卡级字段是「引用 + 展示副本」，权威定义在池）。界域 = 战场级规则改写包（声明式补丁 + 战场级触发器），三件套压制栈（base / hero / overlay）见 ddd 共享内核。

### 3.1 池内蓝本清单

| 界域 | tier | duration | durationUnit | 可驱散 | rulePatches | 域内触发器 | 途径 |
|---|---|---|---|---|---:|---:|---|
| `domain_blood_moon` | `overlay` | 15 | tick | 是 | 2 | 1 | 药师 |
| `domain_reenactment` | `overlay` | 15 | tick | 是 | 2 | 1 | 学徒 |
| `domain_full_moon` | `overlay` | 15 | tick | 是 | 2 | 1 | 仲裁人 |
| `edict_seal` | `overlay` | 20 | tick | 是 | 1 | 0 | 仲裁人 |
| `order_bedrock` | `overlay` | 40 | tick | 是 | 3 | 0 | 仲裁人 |
| `reality_press` | `overlay` | 30 | tick | 是 | 1 | 0 | 仲裁人 |
| `domain_mirror_maze` | `overlay` | 15 | tick | 是 | 2 | 1 | 刺客 |
| `domain_mirror_world` | `overlay` | 10 | tick | 是 | 2 | 1 | 刺客 |
| `domain_holy_nation` | `overlay` | 20 | tick | 是 | 2 | 3 | 歌颂者 |
| `domain_underworld_gate` | `overlay` | 20 | tick | 是 | 2 | 2 | 收尸人 |
| `domain_pale_world` | `overlay` | 15 | tick | 是 | 2 | 2 | 收尸人 |
| `domain_abyssal` | `overlay` | 15 | tick | 是 | 2 | 1 | 罪犯 |
| `domain_war_mist` | `overlay` | 15 | tick | 是 | 3 | 2 | 猎人 |
| `domain_extreme_weather` | `overlay` | 20 | tick | 是 | 1 | 2 | 猎人 |
| `domain_distorted_order` | `overlay` | 15 | tick | 是 | 2 | 1 | 律师 |
| `domain_nature_world` | `overlay` | 20 | tick | 是 | 2 | 2 | 耕种者 |
| `domain_spirit_shroud` | `overlay` | 15 | tick | 是 | 2 | 2 | 囚犯 |
| `domain_astral_field` | `overlay` | 15 | tick | 是 | 2 | 2 | 窥秘人 |
| `domain_astral_sanctum` | `overlay` | 15 | tick | 是 | 1 | 2 | 阅读者 |
| `domain_sea_kingdom` | `hero` | -1 | turn | 否 | 2 | 3 | 水手 |
| `domain_dominion` | `overlay` | 15 | tick | 是 | 1 | 2 | 通识者 |
| `domain_civilization` | `overlay` | 15 | tick | 是 | 1 | 2 | 通识者 |
| `domain_illusion` | `overlay` | 15 | tick | 是 | 2 | 1 | 占卜家 |
| `domain_night_realm` | `overlay` | 20 | tick | 是 | 2 | 4 | 不眠者 |
| `domain_shared_dream` | `overlay` | 15 | tick | 是 | 1 | 2 | 观众 |
| `domain_dark_sea` | `overlay` | 20 | tick | 是 | 2 | 1 | 秘祈人 |
| `domain_clock_tower` | `overlay` | 15 | tick | 是 | 1 | 1 | 偷盗者 |
| `domain_dawn` | `overlay` | 15 | tick | 是 | 2 | 2 | 战士 |

### 3.2 结构维度分布

| 维度 | 取值 | 次数 |
|---|---|---:|
| tier | `overlay` | 27 |
| tier | `hero` | 1 |
| dispelable | 可驱散 | 27 |
| dispelable | 不可驱散 | 1 |
| durationUnit | `tick` | 27 |
| durationUnit | `turn` | 1 |

### 3.3 rulePatches 规则补丁 kind 分布

| kind | 条数 |
|---|---:|
| `empower` | 44 |
| `disable_effect` | 3 |
| `seal_effect` | 2 |
| `cost_mod` | 1 |

### 3.4 域内触发点与载荷原语

| 触发点 | 条数 |
|---|---:|
| `on_tick` | 22 |
| `on_turn_start` | 20 |
| `on_attack` | 2 |

| 载荷原语 | 次数 |
|---|---:|
| `modify_stat` | 27 |
| `damage` | 14 |
| `mount_status` | 10 |
| `dispel` | 6 |
| `modify_resource` | 5 |
| `heal` | 2 |
| `target_override` | 1 |

### 3.5 卡面 domain 原语 op 分布

| op | 次数 |
|---|---:|
| `overlay` | 31 |
| `hero` | 1 |

### 附：统计口径

- 编目层：`*.skills.json` 顶层 `unitDefs` / `zoneDefs` / `domainDefs` 三池。
- 卡面层：递归遍历全部卡的效果节点（含任意嵌套），计数规则与网页端 `walkCardEffects` 一致。
- 跨途径复用：具名单位以**全球池**判定池内/池外（unit_beast 定义在药师、可被多途径引用）。
- 生成脚本：`docs/tools/build_entity_analysis.py`（可重复运行，只读 JSON）。