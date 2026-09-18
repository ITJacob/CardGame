# 技能池设计分析报告（职业维度 · 效果原语专项）

> 数据来源：`docs/json/*.skills.json`（22 份途径技能池，共 **828 张卡**），由 `docs/tools/build_profession_analysis.py` 递归遍历全部效果节点生成。
> 对照基准：`docs/meta/GENERATION_BRIEF.md` v0.3、`docs/ddd/params/*`。
> 生成日期：2026-09-18

## 一、总览：各职业规模与原语/算子总量

| 职业（途径） | 卡数 | 效果节点总数 | 原语节点 | 算子节点 |
|---|---:|---:|---:|---:|
| 不眠者 sleepless | 34 | 91 | 91 | 20 |
| 仲裁人 arbiter | 40 | 94 | 94 | 28 |
| 偷盗者 thief | 37 | 92 | 92 | 18 |
| 刺客 assassin | 39 | 110 | 110 | 33 |
| 囚犯 prisoner | 36 | 88 | 88 | 14 |
| 学徒 apprentice | 34 | 70 | 70 | 21 |
| 律师 lawyer | 46 | 80 | 80 | 16 |
| 怪物 monster | 35 | 86 | 86 | 15 |
| 愚者 fool | 38 | 75 | 75 | 20 |
| 战士 warrior | 33 | 92 | 92 | 20 |
| 收尸人 corpse_collector | 42 | 99 | 99 | 29 |
| 歌颂者 chanter | 41 | 92 | 92 | 20 |
| 水手 sailor | 42 | 117 | 117 | 35 |
| 猎人 hunter | 43 | 102 | 102 | 32 |
| 秘祈人 supplicant | 33 | 95 | 95 | 22 |
| 窥秘人 pryer | 38 | 106 | 106 | 27 |
| 罪犯 criminal | 37 | 117 | 117 | 22 |
| 耕种者 planter | 34 | 90 | 90 | 19 |
| 药师 apothecary | 40 | 92 | 92 | 18 |
| 观众 spectator | 36 | 81 | 81 | 23 |
| 通识者 savant | 36 | 87 | 87 | 19 |
| 阅读者 reader | 34 | 74 | 74 | 17 |
| **全库** | **828** | **2030** | **2030** | **488** |

> 口径：一张卡含多层嵌套效果（卡面 `effects`、状态触发器、区域/界域定义等），故「效果节点总数」≥ 卡数。原语=以 `type` 表达的 19 类 leaf 效果；算子=以 `op` 表达的 9 类控制流/改写节点（`sequence/if/repeat/target_override/push_back/overlay/pull_forward/swap_ally/insert_tail_cross_lane`）。算子节点内部包裹的原语已计入原语统计，二者存在少量重叠（如 `move`+`push_back`）。

## 二、各职业效果原语用量矩阵（type 维度）

行=职业，列=原语；单元格为该职业内该原语的出现次数（递归全量）。

| 职业 | `mount_status` | `damage` | `modify_stat` | `modify_resource` | `dispel` | `spawn` | `heal` | `move` | `domain` | `drain` | `modify_damage` | `transfer_status` | `echo_last_skill` | `snapshot` | `restore_snapshot` | `gauge_shuffle` | `status_shuffle` | `translocate` | `target_override` | 合计 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 不眠者 | 42 | 15 | 17 | 4 | 5 | 3 | 2 | 0 | 1 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 91 |
| 仲裁人 | 31 | 25 | 18 | 7 | 7 | 1 | 0 | 2 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 94 |
| 偷盗者 | 30 | 16 | 19 | 10 | 3 | 3 | 0 | 1 | 1 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 92 |
| 刺客 | 54 | 20 | 11 | 6 | 8 | 3 | 3 | 3 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 110 |
| 囚犯 | 34 | 12 | 27 | 6 | 3 | 3 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 88 |
| 学徒 | 28 | 17 | 8 | 5 | 2 | 2 | 0 | 7 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 70 |
| 律师 | 38 | 14 | 13 | 6 | 2 | 1 | 0 | 2 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 80 |
| 怪物 | 51 | 8 | 7 | 11 | 4 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 86 |
| 愚者 | 21 | 9 | 5 | 11 | 4 | 5 | 3 | 2 | 1 | 0 | 6 | 2 | 0 | 0 | 0 | 0 | 0 | 4 | 2 | 75 |
| 战士 | 31 | 23 | 18 | 10 | 4 | 1 | 3 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 92 |
| 收尸人 | 35 | 20 | 17 | 4 | 8 | 10 | 2 | 0 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 99 |
| 歌颂者 | 31 | 21 | 12 | 4 | 14 | 1 | 7 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 92 |
| 水手 | 33 | 38 | 22 | 6 | 6 | 3 | 0 | 8 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 117 |
| 猎人 | 40 | 24 | 21 | 6 | 3 | 3 | 0 | 1 | 2 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 102 |
| 秘祈人 | 34 | 17 | 16 | 6 | 6 | 5 | 6 | 3 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 95 |
| 窥秘人 | 34 | 25 | 16 | 12 | 8 | 1 | 0 | 5 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 106 |
| 罪犯 | 50 | 34 | 24 | 3 | 0 | 2 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 117 |
| 耕种者 | 31 | 12 | 16 | 3 | 6 | 10 | 9 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 90 |
| 药师 | 31 | 8 | 21 | 5 | 3 | 9 | 12 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 92 |
| 观众 | 36 | 15 | 13 | 5 | 3 | 3 | 4 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 81 |
| 通识者 | 20 | 9 | 31 | 13 | 3 | 6 | 2 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 87 |
| 阅读者 | 29 | 17 | 10 | 9 | 2 | 1 | 0 | 1 | 1 | 0 | 2 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 74 |
| **全库** | 764 | 399 | 362 | 152 | 104 | 78 | 57 | 44 | 26 | 15 | 12 | 4 | 2 | 1 | 1 | 1 | 1 | 4 | 3 | **2030** |

### 2.1 全库原语用量排行（含占比）

| 原语 | 用量 | 占比 |
|---|---:|---:|
| `mount_status` | 764 | 37.6% |
| `damage` | 399 | 19.7% |
| `modify_stat` | 362 | 17.8% |
| `modify_resource` | 152 | 7.5% |
| `dispel` | 104 | 5.1% |
| `spawn` | 78 | 3.8% |
| `heal` | 57 | 2.8% |
| `move` | 44 | 2.2% |
| `domain` | 26 | 1.3% |
| `drain` | 15 | 0.7% |
| `modify_damage` | 12 | 0.6% |
| `transfer_status` | 4 | 0.2% |
| `translocate` | 4 | 0.2% |
| `target_override` | 3 | 0.1% |
| `echo_last_skill` | 2 | 0.1% |
| `snapshot` | 1 | 0.0% |
| `restore_snapshot` | 1 | 0.0% |
| `gauge_shuffle` | 1 | 0.0% |
| `status_shuffle` | 1 | 0.0% |

### 2.2 各职业算子用量矩阵（op 维度）

行=职业，列=算子；与 §2 原语互补，刻画控制流与改写表达。

| 职业 | `sequence` | `if` | `repeat` | `target_override` | `push_back` | `overlay` | `pull_forward` | `swap_ally` | `insert_tail_cross_lane` | 合计 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 不眠者 | 9 | 8 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 20 |
| 仲裁人 | 18 | 3 | 1 | 1 | 1 | 3 | 1 | 0 | 0 | 28 |
| 偷盗者 | 13 | 1 | 0 | 2 | 1 | 1 | 0 | 0 | 0 | 18 |
| 刺客 | 15 | 8 | 1 | 4 | 1 | 2 | 1 | 1 | 0 | 33 |
| 囚犯 | 10 | 2 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 14 |
| 学徒 | 11 | 3 | 1 | 0 | 3 | 1 | 1 | 0 | 1 | 21 |
| 律师 | 3 | 5 | 0 | 5 | 2 | 1 | 0 | 0 | 0 | 16 |
| 怪物 | 6 | 6 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 15 |
| 愚者 | 11 | 4 | 0 | 2 | 1 | 1 | 0 | 1 | 0 | 20 |
| 战士 | 13 | 2 | 3 | 0 | 0 | 1 | 1 | 0 | 0 | 20 |
| 收尸人 | 15 | 9 | 1 | 2 | 0 | 2 | 0 | 0 | 0 | 29 |
| 歌颂者 | 15 | 3 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 20 |
| 水手 | 20 | 4 | 4 | 0 | 5 | 0 | 1 | 0 | 1 | 35 |
| 猎人 | 17 | 6 | 2 | 4 | 0 | 2 | 1 | 0 | 0 | 32 |
| 秘祈人 | 14 | 3 | 1 | 0 | 2 | 1 | 1 | 0 | 0 | 22 |
| 窥秘人 | 9 | 10 | 1 | 1 | 2 | 1 | 2 | 0 | 1 | 27 |
| 罪犯 | 9 | 8 | 0 | 3 | 1 | 1 | 0 | 0 | 0 | 22 |
| 耕种者 | 11 | 4 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 19 |
| 药师 | 11 | 1 | 0 | 3 | 1 | 1 | 0 | 1 | 0 | 18 |
| 观众 | 15 | 4 | 0 | 2 | 1 | 1 | 0 | 0 | 0 | 23 |
| 通识者 | 14 | 1 | 2 | 1 | 0 | 1 | 0 | 0 | 0 | 19 |
| 阅读者 | 13 | 1 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 17 |
| **全库** | 272 | 96 | 19 | 36 | 25 | 25 | 9 | 3 | 3 | **488** |

> `target_override` 在全库另有 **3** 处作为 `type` 原语（`effTargetOverride`）出现，与算子的 36 处合计 **39** 处「改写目标」表达。

### 2.3 各职业 Top-3 原语（签名表达）

| 职业 | Top1 | Top2 | Top3 |
|---|---|---|---|
| 不眠者 | `mount_status`(42) | `modify_stat`(17) | `damage`(15) |
| 仲裁人 | `mount_status`(31) | `damage`(25) | `modify_stat`(18) |
| 偷盗者 | `mount_status`(30) | `modify_stat`(19) | `damage`(16) |
| 刺客 | `mount_status`(54) | `damage`(20) | `modify_stat`(11) |
| 囚犯 | `mount_status`(34) | `modify_stat`(27) | `damage`(12) |
| 学徒 | `mount_status`(28) | `damage`(17) | `modify_stat`(8) |
| 律师 | `mount_status`(38) | `damage`(14) | `modify_stat`(13) |
| 怪物 | `mount_status`(51) | `modify_resource`(11) | `damage`(8) |
| 愚者 | `mount_status`(21) | `modify_resource`(11) | `damage`(9) |
| 战士 | `mount_status`(31) | `damage`(23) | `modify_stat`(18) |
| 收尸人 | `mount_status`(35) | `damage`(20) | `modify_stat`(17) |
| 歌颂者 | `mount_status`(31) | `damage`(21) | `dispel`(14) |
| 水手 | `damage`(38) | `mount_status`(33) | `modify_stat`(22) |
| 猎人 | `mount_status`(40) | `damage`(24) | `modify_stat`(21) |
| 秘祈人 | `mount_status`(34) | `damage`(17) | `modify_stat`(16) |
| 窥秘人 | `mount_status`(34) | `damage`(25) | `modify_stat`(16) |
| 罪犯 | `mount_status`(50) | `damage`(34) | `modify_stat`(24) |
| 耕种者 | `mount_status`(31) | `modify_stat`(16) | `damage`(12) |
| 药师 | `mount_status`(31) | `modify_stat`(21) | `heal`(12) |
| 观众 | `mount_status`(36) | `damage`(15) | `modify_stat`(13) |
| 通识者 | `modify_stat`(31) | `mount_status`(20) | `modify_resource`(13) |
| 阅读者 | `mount_status`(29) | `damage`(17) | `modify_stat`(10) |

## 三、modify_stat 专项：具体改了哪些属性

全库 `modify_stat` 共 **362** 处。下方按「属性键 / 模式 / 参数」逐层拆解。

### 3.1 改了哪些 stat 属性键（全局分布）

| stat 属性键 | 次数 | 占 modify_stat% |
|---|---:|---:|
| `attack` | 118 | 32.6% |
| `gauge.rate` | 76 | 21.0% |
| `defense` | 36 | 9.9% |
| `armor` | 34 | 9.4% |
| `hp_max` | 26 | 7.2% |
| `resist:mental` | 18 | 5.0% |
| `energy_regen` | 12 | 3.3% |
| `resist:physical` | 9 | 2.5% |
| `energy_max` | 8 | 2.2% |
| `resist:poison` | 6 | 1.7% |
| `resist:*` | 5 | 1.4% |
| `gauge.threshold` | 4 | 1.1% |
| `resist:fire` | 3 | 0.8% |
| `rank` | 1 | 0.3% |
| `resist:ice` | 1 | 0.3% |
| `summon_cap` | 1 | 0.3% |
| `damage_mul` | 1 | 0.3% |
| `damage_taken_mul` | 1 | 0.3% |
| `resist:lightning` | 1 | 0.3% |
| `resist:$buildElement` | 1 | 0.3% |

### 3.2 (属性键 × 模式) 组合明细

| stat 属性键 | 模式 | 次数 | 占该属性% |
|---|---|---:|---:|
| `attack` | `delta` | 113 | 96% |
| `attack` | `set` | 3 | 3% |
| `attack` | `to_at_least` | 1 | 1% |
| `attack` | `mul` | 1 | 1% |
| `gauge.rate` | `delta` | 51 | 67% |
| `gauge.rate` | `mul` | 23 | 30% |
| `gauge.rate` | `set` | 2 | 3% |
| `defense` | `delta` | 26 | 72% |
| `defense` | `mul` | 5 | 14% |
| `defense` | `set` | 4 | 11% |
| `defense` | `to_at_least` | 1 | 3% |
| `armor` | `delta` | 32 | 94% |
| `armor` | `set` | 2 | 6% |
| `hp_max` | `delta` | 26 | 100% |
| `resist:mental` | `delta` | 18 | 100% |
| `energy_regen` | `delta` | 12 | 100% |
| `resist:physical` | `delta` | 9 | 100% |
| `energy_max` | `delta` | 8 | 100% |
| `resist:poison` | `delta` | 6 | 100% |
| `resist:*` | `delta` | 5 | 100% |
| `gauge.threshold` | `delta` | 4 | 100% |
| `resist:fire` | `delta` | 3 | 100% |
| `rank` | `delta` | 1 | 100% |
| `resist:ice` | `delta` | 1 | 100% |
| `summon_cap` | `delta` | 1 | 100% |
| `damage_mul` | `mul` | 1 | 100% |
| `damage_taken_mul` | `mul` | 1 | 100% |
| `resist:lightning` | `delta` | 1 | 100% |
| `resist:$buildElement` | `delta` | 1 | 100% |

### 3.3 参数覆盖度：modify_stat 用了哪些可选字段

> 必填字段 `stat`/`mode` 100% 出现；下表统计其余可选参数的实际用到次数。

| 参数 | 出现次数 | 占 modify_stat% | 说明 |
|---|---:|---:|---|
| `value` | 362 | 100.0% | 数值（delta/mul 的增量；set 的设定值） |
| `duration` | 225 | 62.2% | 持续 tick（null/缺失=常驻） |
| `condition` | 3 | 0.8% | 条件触发（Chance 走 RandomSource，仅非伤害维度） |
| `target` | 300 | 82.9% | 效果级目标锚点（二次寻址） |
| `filter` | 4 | 1.1% | 候选池过滤 |
| `spread` | 1 | 0.3% | 溅射（splash_adjacent） |
| `sourceRef` | 10 | 2.8% | 取值参照源（caster/secondary_target/field_average） |
| `valueFrom` | 3 | 0.8% | 动态取值（对象/表达式，非静态数值） |
| `note` | 86 | 23.8% | 注释 |

### 3.4 分职业 stat 键矩阵

行=职业，列=stat 属性键（仅列全库出现过的键）。

| 职业 | `attack` | `gauge.rate` | `defense` | `armor` | `hp_max` | `resist:mental` | `energy_regen` | `resist:physical` | `energy_max` | `resist:poison` | `resist:*` | `gauge.threshold` | `resist:fire` | `rank` | `resist:ice` | `summon_cap` | `damage_mul` | `damage_taken_mul` | `resist:lightning` | `resist:$buildElement` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 不眠者 | 7 | 3 | 4 | 0 | 0 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 仲裁人 | 9 | 3 | 3 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 偷盗者 | 9 | 4 | 2 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 刺客 | 2 | 5 | 1 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 囚犯 | 10 | 3 | 3 | 4 | 1 | 2 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 学徒 | 1 | 5 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 律师 | 5 | 3 | 1 | 0 | 1 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 怪物 | 1 | 2 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 愚者 | 2 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 战士 | 8 | 4 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 收尸人 | 7 | 2 | 3 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 |
| 歌颂者 | 5 | 1 | 3 | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 水手 | 6 | 7 | 1 | 4 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| 猎人 | 8 | 3 | 1 | 3 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 1 | 1 | 0 | 0 |
| 秘祈人 | 5 | 3 | 1 | 0 | 5 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 窥秘人 | 4 | 4 | 3 | 1 | 1 | 0 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 罪犯 | 2 | 6 | 1 | 5 | 3 | 4 | 0 | 1 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 耕种者 | 6 | 3 | 1 | 1 | 3 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 药师 | 4 | 5 | 1 | 2 | 4 | 1 | 2 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 观众 | 5 | 3 | 1 | 3 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 通识者 | 9 | 5 | 2 | 2 | 4 | 3 | 2 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 阅读者 | 3 | 1 | 2 | 1 | 0 | 0 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **全库** | 118 | 76 | 36 | 34 | 26 | 18 | 12 | 9 | 8 | 6 | 5 | 4 | 3 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |

### 3.5 各职业 modify_stat 参数偏好（condition / duration / target / filter 占比）

| 职业 | modify_stat 总数 | 带 condition | 带 duration | 带 target | 带 filter |
|---|---:|---:|---:|---:|---:|
| 不眠者 | 17 | 0 (0%) | 12 (71%) | 12 (71%) | 0 (0%) |
| 仲裁人 | 18 | 0 (0%) | 16 (89%) | 11 (61%) | 0 (0%) |
| 偷盗者 | 19 | 0 (0%) | 17 (89%) | 12 (63%) | 0 (0%) |
| 刺客 | 11 | 0 (0%) | 9 (82%) | 8 (73%) | 0 (0%) |
| 囚犯 | 27 | 0 (0%) | 15 (56%) | 26 (96%) | 1 (4%) |
| 学徒 | 8 | 0 (0%) | 6 (75%) | 8 (100%) | 0 (0%) |
| 律师 | 13 | 3 (23%) | 10 (77%) | 11 (85%) | 0 (0%) |
| 怪物 | 7 | 0 (0%) | 2 (29%) | 7 (100%) | 0 (0%) |
| 愚者 | 5 | 0 (0%) | 4 (80%) | 0 (0%) | 0 (0%) |
| 战士 | 18 | 0 (0%) | 10 (56%) | 17 (94%) | 0 (0%) |
| 收尸人 | 17 | 0 (0%) | 8 (47%) | 12 (71%) | 0 (0%) |
| 歌颂者 | 12 | 0 (0%) | 8 (67%) | 10 (83%) | 0 (0%) |
| 水手 | 22 | 0 (0%) | 9 (41%) | 22 (100%) | 0 (0%) |
| 猎人 | 21 | 0 (0%) | 16 (76%) | 17 (81%) | 0 (0%) |
| 秘祈人 | 16 | 0 (0%) | 7 (44%) | 16 (100%) | 0 (0%) |
| 窥秘人 | 16 | 0 (0%) | 10 (62%) | 13 (81%) | 0 (0%) |
| 罪犯 | 24 | 0 (0%) | 13 (54%) | 20 (83%) | 0 (0%) |
| 耕种者 | 16 | 0 (0%) | 10 (62%) | 16 (100%) | 1 (6%) |
| 药师 | 21 | 0 (0%) | 8 (38%) | 17 (81%) | 2 (10%) |
| 观众 | 13 | 0 (0%) | 11 (85%) | 9 (69%) | 0 (0%) |
| 通识者 | 31 | 0 (0%) | 18 (58%) | 28 (90%) | 0 (0%) |
| 阅读者 | 10 | 0 (0%) | 6 (60%) | 8 (80%) | 0 (0%) |

### 3.6 各 stat 键的数值速览（mode=value 取值分布）

> 仅统计 `value` 为静态数值的条目（排除 valueFrom 动态取值）。

| stat 属性键 | 样本数 | 模式分布 | 数值范围(典型) |
|---|---:|---|---|
| `attack` | 118 | `delta`×113, `set`×3, `to_at_least`×1, `mul`×1 | 负 -5~-1；正 +1~+6 |
| `gauge.rate` | 76 | `delta`×51, `mul`×23, `set`×2 | 负 -15~-1；正 +1~+10 |
| `defense` | 36 | `delta`×26, `mul`×5, `set`×4, `to_at_least`×1 | 负 -3~-1；正 +1~+3 |
| `armor` | 34 | `delta`×32, `set`×2 | 负 -5~-2；正 +1~+12 |
| `hp_max` | 26 | `delta`×26 | 负 -12~-5；正 +1~+20 |
| `resist:mental` | 18 | `delta`×18 | 负 -20~-0；正 +10~+30 |
| `energy_regen` | 12 | `delta`×12 | 负 -0~-0；正 +0~+0 |
| `resist:physical` | 9 | `delta`×9 | 正 +0~+50 |
| `energy_max` | 8 | `delta`×8 | 正 +1~+20 |
| `resist:poison` | 6 | `delta`×6 | 正 +10~+30 |
| `resist:*` | 5 | `delta`×5 | 负 -20~-20；正 +10~+12 |
| `gauge.threshold` | 4 | `delta`×4 | 负 -10~-8；正 +15~+60 |
| `resist:fire` | 3 | `delta`×3 | 正 +30~+60 |
| `rank` | 1 | `delta`×1 | 负 -1~-1 |
| `resist:ice` | 1 | `delta`×1 | 正 +20~+20 |
| `summon_cap` | 1 | `delta`×1 | 正 +2~+2 |
| `damage_mul` | 1 | `mul`×1 | 正 +1~+1 |
| `damage_taken_mul` | 1 | `mul`×1 | 正 +1~+1 |
| `resist:lightning` | 1 | `delta`×1 | 正 +0~+0 |
| `resist:$buildElement` | 1 | `delta`×1 | 正 +40~+40 |

## 四、modify_resource 专项：具体改了哪些资源

全库 `modify_resource` 共 **152** 处。

### 4.1 改了哪些 resource 资源键（全局分布）

| resource 资源键 | 次数 | 占 modify_resource% |
|---|---:|---:|
| `gauge.current` | 65 | 42.8% |
| `energy` | 36 | 23.7% |
| `lost` | 31 | 20.4% |
| `armor` | 15 | 9.9% |
| `hp` | 3 | 2.0% |
| `shield` | 2 | 1.3% |

### 4.2 (资源键 × 模式) 组合明细

| resource 资源键 | 模式 | 次数 | 占该资源% |
|---|---|---:|---:|
| `gauge.current` | `delta` | 62 | 95% |
| `gauge.current` | `set` | 1 | 2% |
| `gauge.current` | `None` | 1 | 2% |
| `gauge.current` | `swap` | 1 | 2% |
| `energy` | `delta` | 36 | 100% |
| `lost` | `delta` | 31 | 100% |
| `armor` | `delta` | 15 | 100% |
| `hp` | `delta` | 3 | 100% |
| `shield` | `delta` | 2 | 100% |

### 4.3 参数覆盖度：modify_resource 用了哪些可选字段

> 必填字段 `resource` 100% 出现；下表统计其余可选参数实际用到次数。

| 参数 | 出现次数 | 占 modify_resource% | 说明 |
|---|---:|---:|---|
| `value` | 152 | 100.0% | 数值（delta 增量 / set 设定值） |
| `mode` | 152 | 100.0% | delta / set / swap |
| `op` | 1 | 0.7% | swap 操作 |
| `between` | 1 | 0.7% | swap 双方（effectTarget 数组） |
| `maxTriggersPerBattle` | 2 | 1.3% | 每场战斗最大触发次数 |
| `condition` | 5 | 3.3% | 条件触发 |
| `target` | 119 | 78.3% | 效果级目标锚点 |
| `filter` | 1 | 0.7% | 候选池过滤 |
| `note` | 92 | 60.5% | 注释 |

### 4.4 分职业 resource 键矩阵

行=职业，列=resource 资源键。

| 职业 | `gauge.current` | `energy` | `lost` | `armor` | `hp` | `shield` |
|---|---:|---:|---:|---:|---:|---:|
| 不眠者 | 2 | 1 | 1 | 0 | 0 | 0 |
| 仲裁人 | 3 | 0 | 3 | 1 | 0 | 0 |
| 偷盗者 | 8 | 1 | 1 | 0 | 0 | 0 |
| 刺客 | 2 | 1 | 3 | 0 | 0 | 0 |
| 囚犯 | 4 | 1 | 1 | 0 | 0 | 0 |
| 学徒 | 3 | 1 | 1 | 0 | 0 | 0 |
| 律师 | 0 | 3 | 1 | 1 | 0 | 1 |
| 怪物 | 8 | 2 | 0 | 1 | 0 | 0 |
| 愚者 | 4 | 2 | 5 | 0 | 0 | 0 |
| 战士 | 4 | 0 | 1 | 5 | 0 | 0 |
| 收尸人 | 1 | 1 | 2 | 0 | 0 | 0 |
| 歌颂者 | 0 | 3 | 1 | 0 | 0 | 0 |
| 水手 | 2 | 0 | 1 | 3 | 0 | 0 |
| 猎人 | 3 | 0 | 2 | 0 | 0 | 1 |
| 秘祈人 | 0 | 3 | 1 | 0 | 2 | 0 |
| 窥秘人 | 9 | 2 | 1 | 0 | 0 | 0 |
| 罪犯 | 0 | 1 | 1 | 0 | 1 | 0 |
| 耕种者 | 1 | 1 | 1 | 0 | 0 | 0 |
| 药师 | 1 | 3 | 1 | 0 | 0 | 0 |
| 观众 | 3 | 1 | 1 | 0 | 0 | 0 |
| 通识者 | 2 | 6 | 1 | 4 | 0 | 0 |
| 阅读者 | 5 | 3 | 1 | 0 | 0 | 0 |
| **全库** | 65 | 36 | 31 | 15 | 3 | 2 |

### 4.5 资源操控的语义标签（按 resource 归类用途）

| resource | 主要语义 | 高频模式 |
|---|---|---|
| `gauge.current` | 推条（抢先/延后出手） | `delta`×62, `set`×1, `None`×1, `swap`×1 |
| `energy` | 能量操控（资源杠杆，最常见） | `delta`×36 |
| `lost` | 迷失租金（界域/跨层代价，独立资源槽） | `delta`×31 |
| `armor` | 护甲增减 | `delta`×15 |
| `hp` | 直接治疗/伤害（常与 heal/damage 互补） | `delta`×3 |
| `shield` | 护盾吸收池增减 | `delta`×2 |

### 4.6 swap（交换资源）用法

共 **1** 处使用 `op:swap` / `between`（双方资源交换）。

| 卡 | 职业 | resource |
|---|---|---|
| `skill_monster_s0_wheel_of_fate` | 怪物 | `gauge.current` |

## 五、数据质量提示

### 5.1 非标准 stat 键（不符合 schema 取值域）

以下 `modify_stat` 节点的 `stat` 键不匹配 `skills.schema.json` 的 stat 正则（仅允许 attack/defense/armor/rank/hp_max/energy_max/energy_regen/gauge.rate/gauge.threshold/summon_cap/resist:*）：

| 职业 | 卡 id | stat 键 | 建议 |
|---|---|---|---|
| 猎人 | `skill_hunter_s1_massing_ascend` | `damage_mul` | 改用 `modify_damage`（scope: dealt/taken） |
| 猎人 | `skill_hunter_s1_massing_ascend` | `damage_taken_mul` | 改用 `modify_damage`（scope: dealt/taken） |

> 说明：`damage_mul` / `damage_taken_mul` 属「伤害乘区」语义，已有专用原语 `modify_damage`（`scope: dealt|taken`, `mul`），无需挂在 modify_stat 上；此写法可能与 §七·补 7-5 中 fool 的同类修复（`damage_taken_mul`→`modify_damage`）未对齐，建议统一。

## 六、口径核对（与 SKILLS_ANALYSIS.md §2 对照）

| 维度 | 本报告（递归全量） | 旧报告 §2 | 说明 |
|---|---:|---:|---|
| 效果节点总数 | 2030 | — | 递归全量 |
| 原语节点 | 2030 | — | 19 类 type |
| 算子节点 | 488 | — | 9 类 op |
| `type=mount_status` | 764 | 728 | +36 |
| `type=damage` | 399 | 376 | +23 |
| `type=modify_stat` | 362 | 356 | +6 |
| `type=modify_resource` | 152 | 150 | +2 |
| `type=dispel` | 104 | 99 | +5 |
| `type=spawn` | 78 | 73 | +5 |
| `type=heal` | 57 | 55 | +2 |
| `type=move` | 44 | 44 | +0 |
| `type=domain` | 26 | 26 | +0 |
| `type=drain` | 15 | 15 | +0 |
| `type=modify_damage` | 12 | 11 | +1 |
| `type=transfer_status` | 4 | 4 | +0 |
| `type=echo_last_skill` | 2 | 2 | +0 |
| `type=snapshot` | 1 | 1 | +0 |
| `type=restore_snapshot` | 1 | 1 | +0 |
| `type=gauge_shuffle` | 1 | 1 | +0 |
| `type=status_shuffle` | 1 | 1 | +0 |
| `type=translocate` | 4 | — |  |
| `type=target_override` | 3 | — |  |

> 旧报告原语数基于较早快照；本库当前 828 张卡，数字随补卡上浮属正常。算子（§2.4）口径一致：sequence=272 / if=96 / target_override=36 / push_back=25 / overlay=25 / repeat=19 / pull_forward=9 / swap_ally=3 / insert_tail_cross_lane=3。

## 七、结论与观察

1. **原语总量**：全库共 2030 个原语节点 + 488 个算子节点；`mount_status`(38%) 与 `damage`(20%) 仍是绝对主力，状态驱动风格延续。
2. **modify_stat 最常被改的属性**：`attack`(118)、`gauge.rate`(76)、`defense`(36) —— 敏捷原生的 `gauge.rate`、攻防 `attack/defense`、资源速率与独立资源槽是首选。
3. **modify_resource 最常被改的资源**：`gauge.current`(65)、`energy`(36)、`lost`(31) —— `energy` 是第一杠杆，`lost`（迷失租金）已随界域/跨层普及成为常态成本，`gauge.current`（推条）用量高于直接 hp/shield。
4. **参数使用**：modify_stat 中带 `duration` 的占 62%（持续型修正为主），带 `condition` 的仅 1%（绝大多数无条件是确定性修正，符合 B1 铁律）；`sourceRef`/`valueFrom` 动态取值共 13 处，属「按参照源缩放」的高级表达。
5. **职业差异**：详见 §二/§2.2 矩阵与 §3.4/§4.4。各职业 Top 原语（§2.3）显示签名表达——召唤系（不眠者/收尸人/秘祈人）`spawn` 偏高，控制系（刺客/囚犯）`move`+`dispel` 偏高，能量系（愚者/阅读者）`modify_resource(energy)` 偏高。
6. **数据质量**：见 §五。发现 2 处非标准 stat 键，建议改用 modify_damage。

### 附：统计口径

- 数据源：`docs/json/*.skills.json` 的 `cards[]`，共 828 张卡。
- 原语/算子用量：**递归遍历**每张卡的全部效果节点（含卡面 `effects`、`statusDefs[].triggers[].effects`、`zoneDef`/`domainDef`/单位定义等任意嵌套），同一张卡的同名原语多次计数。
- 原语以效果节点 `type` 字段归类（19 类）；算子以效果节点 `op` 字段归类（9 类）。
- `modify_stat`/`modify_resource` 统计：同样递归全量；`stat`/`resource` 取节点字段值，`mode`/`value`/`duration`/`condition`/`target`/`filter`/`spread`/`sourceRef`/`valueFrom`（资源侧另含 `op`/`between`/`maxTriggersPerBattle`）逐一记录。
- 参数覆盖度：仅统计实际出现的字段（未在节点中出现的字段不计入）。
- 生成脚本：`docs/tools/build_profession_analysis.py`（可重复运行）。