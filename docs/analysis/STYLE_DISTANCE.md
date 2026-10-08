# 途径风格距离（STYLE DISTANCE）

> 由 `docs/tools/build_style_analysis.py` 自动生成——**勿手改**；指纹口径与 score.py 第七维同源（原语分布 + 元素分布 + modify_stat 键分布，1−cos 距离）。差异化迭代后重跑本报告看距离拉开。生成时间：2026-10-08。

## 一、最近邻榜（距离越小越雷同，差异化迭代优先拆这些对）

| 途径 | 最近邻 | 距离 | 对他途径均距 |
|---|---|---:|---:|
| sleepless | corpse_collector | 0.196 | 0.309 |
| thief | prisoner | 0.154 | 0.332 |
| lawyer | hunter | 0.212 | 0.335 |
| hunter | criminal | 0.147 | 0.347 |
| prisoner | thief | 0.154 | 0.352 |
| apprentice | assassin | 0.249 | 0.357 |
| corpse_collector | reader | 0.186 | 0.365 |
| reader | corpse_collector | 0.186 | 0.366 |
| seer | hunter | 0.216 | 0.379 |
| supplicant | prisoner | 0.249 | 0.383 |
| apothecary | thief | 0.175 | 0.385 |
| assassin | warrior | 0.153 | 0.388 |
| criminal | hunter | 0.147 | 0.391 |
| warrior | assassin | 0.153 | 0.391 |
| arbiter | seer | 0.217 | 0.402 |
| pryer | reader | 0.206 | 0.411 |
| spectator | sleepless | 0.239 | 0.415 |
| savant | planter | 0.187 | 0.433 |
| planter | savant | 0.187 | 0.439 |
| sailor | criminal | 0.182 | 0.459 |
| monster | sleepless | 0.362 | 0.485 |
| chanter | sleepless | 0.301 | 0.509 |

## 二、22×22 距离矩阵

| | apothecary | apprentice | arbiter | assassin | chanter | corpse_collector | criminal | hunter | lawyer | monster | planter | prisoner | pryer | reader | sailor | savant | seer | sleepless | spectator | supplicant | thief | warrior |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **apothecary** | 0.00 | 0.41 | 0.46 | 0.41 | 0.41 | 0.34 | 0.47 | 0.41 | 0.39 | 0.48 | 0.31 | 0.20 | 0.45 | 0.42 | 0.48 | 0.39 | 0.43 | 0.31 | 0.43 | 0.43 | 0.17 | 0.30 |
| **apprentice** | 0.41 | 0.00 | 0.37 | 0.25 | 0.52 | 0.40 | 0.25 | 0.28 | 0.29 | 0.39 | 0.48 | 0.31 | 0.38 | 0.33 | 0.35 | 0.45 | 0.28 | 0.30 | 0.43 | 0.29 | 0.34 | 0.38 |
| **arbiter** | 0.46 | 0.37 | 0.00 | 0.44 | 0.53 | 0.38 | 0.44 | 0.42 | 0.33 | 0.51 | 0.52 | 0.39 | 0.40 | 0.33 | 0.45 | 0.50 | 0.22 | 0.27 | 0.36 | 0.43 | 0.26 | 0.43 |
| **assassin** | 0.41 | 0.25 | 0.44 | 0.00 | 0.51 | 0.40 | 0.39 | 0.35 | 0.35 | 0.45 | 0.46 | 0.38 | 0.42 | 0.39 | 0.49 | 0.49 | 0.36 | 0.31 | 0.44 | 0.37 | 0.34 | 0.15 |
| **chanter** | 0.41 | 0.52 | 0.53 | 0.51 | 0.00 | 0.49 | 0.58 | 0.52 | 0.49 | 0.57 | 0.54 | 0.53 | 0.52 | 0.50 | 0.59 | 0.62 | 0.56 | 0.30 | 0.51 | 0.57 | 0.50 | 0.34 |
| **corpse_collector** | 0.34 | 0.40 | 0.38 | 0.40 | 0.49 | 0.00 | 0.47 | 0.41 | 0.35 | 0.46 | 0.21 | 0.39 | 0.41 | 0.19 | 0.51 | 0.32 | 0.44 | 0.20 | 0.35 | 0.32 | 0.27 | 0.38 |
| **criminal** | 0.47 | 0.25 | 0.44 | 0.39 | 0.58 | 0.47 | 0.00 | 0.15 | 0.37 | 0.51 | 0.54 | 0.31 | 0.41 | 0.39 | 0.18 | 0.46 | 0.31 | 0.39 | 0.48 | 0.25 | 0.40 | 0.45 |
| **hunter** | 0.41 | 0.28 | 0.42 | 0.35 | 0.52 | 0.41 | 0.15 | 0.00 | 0.21 | 0.47 | 0.45 | 0.33 | 0.37 | 0.38 | 0.26 | 0.32 | 0.22 | 0.33 | 0.45 | 0.29 | 0.32 | 0.35 |
| **lawyer** | 0.39 | 0.29 | 0.33 | 0.35 | 0.49 | 0.35 | 0.37 | 0.21 | 0.00 | 0.43 | 0.47 | 0.28 | 0.30 | 0.28 | 0.40 | 0.35 | 0.28 | 0.22 | 0.24 | 0.35 | 0.30 | 0.36 |
| **monster** | 0.48 | 0.39 | 0.51 | 0.45 | 0.57 | 0.46 | 0.51 | 0.47 | 0.43 | 0.00 | 0.54 | 0.48 | 0.52 | 0.45 | 0.58 | 0.59 | 0.49 | 0.36 | 0.49 | 0.48 | 0.44 | 0.50 |
| **planter** | 0.31 | 0.48 | 0.52 | 0.46 | 0.54 | 0.21 | 0.54 | 0.45 | 0.47 | 0.54 | 0.00 | 0.46 | 0.48 | 0.48 | 0.53 | 0.19 | 0.48 | 0.33 | 0.47 | 0.47 | 0.41 | 0.41 |
| **prisoner** | 0.20 | 0.31 | 0.39 | 0.38 | 0.53 | 0.39 | 0.31 | 0.33 | 0.28 | 0.48 | 0.46 | 0.00 | 0.40 | 0.35 | 0.49 | 0.37 | 0.30 | 0.31 | 0.33 | 0.25 | 0.15 | 0.41 |
| **pryer** | 0.45 | 0.38 | 0.40 | 0.42 | 0.52 | 0.41 | 0.41 | 0.37 | 0.30 | 0.52 | 0.48 | 0.40 | 0.00 | 0.21 | 0.40 | 0.53 | 0.48 | 0.31 | 0.44 | 0.46 | 0.38 | 0.37 |
| **reader** | 0.42 | 0.33 | 0.33 | 0.39 | 0.50 | 0.19 | 0.39 | 0.38 | 0.28 | 0.45 | 0.48 | 0.35 | 0.21 | 0.00 | 0.46 | 0.46 | 0.42 | 0.20 | 0.35 | 0.39 | 0.29 | 0.41 |
| **sailor** | 0.48 | 0.35 | 0.45 | 0.49 | 0.59 | 0.51 | 0.18 | 0.26 | 0.40 | 0.58 | 0.53 | 0.49 | 0.40 | 0.46 | 0.00 | 0.59 | 0.52 | 0.42 | 0.54 | 0.50 | 0.46 | 0.44 |
| **savant** | 0.39 | 0.45 | 0.50 | 0.49 | 0.62 | 0.32 | 0.46 | 0.32 | 0.35 | 0.59 | 0.19 | 0.37 | 0.53 | 0.46 | 0.59 | 0.00 | 0.29 | 0.42 | 0.51 | 0.35 | 0.41 | 0.49 |
| **seer** | 0.43 | 0.28 | 0.22 | 0.36 | 0.56 | 0.44 | 0.31 | 0.22 | 0.28 | 0.49 | 0.48 | 0.30 | 0.48 | 0.42 | 0.52 | 0.29 | 0.00 | 0.38 | 0.45 | 0.28 | 0.32 | 0.46 |
| **sleepless** | 0.31 | 0.30 | 0.27 | 0.31 | 0.30 | 0.20 | 0.39 | 0.33 | 0.22 | 0.36 | 0.33 | 0.31 | 0.31 | 0.20 | 0.42 | 0.42 | 0.38 | 0.00 | 0.24 | 0.37 | 0.20 | 0.31 |
| **spectator** | 0.43 | 0.43 | 0.36 | 0.44 | 0.51 | 0.35 | 0.48 | 0.45 | 0.24 | 0.49 | 0.47 | 0.33 | 0.44 | 0.35 | 0.54 | 0.51 | 0.45 | 0.24 | 0.00 | 0.42 | 0.34 | 0.47 |
| **supplicant** | 0.43 | 0.29 | 0.43 | 0.37 | 0.57 | 0.32 | 0.25 | 0.29 | 0.35 | 0.48 | 0.47 | 0.25 | 0.46 | 0.39 | 0.50 | 0.35 | 0.28 | 0.37 | 0.42 | 0.00 | 0.30 | 0.46 |
| **thief** | 0.17 | 0.34 | 0.26 | 0.34 | 0.50 | 0.27 | 0.40 | 0.32 | 0.30 | 0.44 | 0.41 | 0.15 | 0.38 | 0.29 | 0.46 | 0.41 | 0.32 | 0.20 | 0.34 | 0.30 | 0.00 | 0.36 |
| **warrior** | 0.30 | 0.38 | 0.43 | 0.15 | 0.34 | 0.38 | 0.45 | 0.35 | 0.36 | 0.50 | 0.41 | 0.41 | 0.37 | 0.41 | 0.44 | 0.49 | 0.46 | 0.31 | 0.47 | 0.46 | 0.36 | 0.00 |

## 三、途径指纹（各途径 Top-5 指纹键）

| 途径 | Top-5 指纹键 |
|---|---|
| apothecary | prim:mount_status ×27；prim:transfer_status ×18；prim:grant_immunity ×12；prim:modify_stat ×9；prim:spawn ×8 |
| apprentice | prim:mount_status ×25；prim:modify_resource ×16；prim:translocate ×14；prim:echo_last_skill ×11；prim:damage ×10 |
| arbiter | prim:take_control ×27；prim:mount_status ×26；prim:damage ×16；elem:mental ×16；elem:physical ×9 |
| assassin | prim:mount_status ×33；prim:modify_targetability ×26；prim:modify_resource ×14；prim:translocate ×11；prim:damage ×9 |
| chanter | prim:mount_status ×25；elem:holy ×21；prim:set_luminance ×20；prim:grant_immunity ×16；prim:damage ×12 |
| corpse_collector | prim:mount_status ×28；prim:reveal ×16；prim:spawn ×15；elem:mental ×10；prim:damage ×9 |
| criminal | prim:move ×37；prim:modify_resource ×37；prim:mount_status ×35；prim:damage ×19；prim:modify_stat ×7 |
| hunter | prim:mount_status ×31；prim:modify_resource ×20；prim:move ×18；prim:modify_rule_slot ×17；prim:damage ×13 |
| lawyer | prim:mount_status ×33；prim:modify_rule_slot ×18；prim:damage ×15；prim:modify_status ×14；elem:mental ×11 |
| monster | prim:restore_snapshot ×30；prim:mount_status ×28；prim:modify_resource ×8；prim:damage ×5；elem:mental ×4 |
| planter | prim:spawn ×30；prim:mount_status ×26；elem:none ×8；prim:damage ×7；prim:heal ×7 |
| prisoner | prim:mount_status ×24；prim:transfer_status ×20；prim:modify_resource ×20；prim:damage ×12；prim:modify_status ×10 |
| pryer | prim:modify_skill ×28；prim:mount_status ×26；prim:damage ×18；elem:none ×9；prim:modify_resource ×8 |
| reader | prim:mount_status ×22；prim:reveal ×13；prim:damage ×12；elem:mental ×12；prim:modify_skill ×10 |
| sailor | prim:move ×39；prim:mount_status ×29；prim:damage ×24；elem:physical ×16；elem:lightning ×12 |
| savant | prim:spawn ×20；prim:mount_status ×15；prim:modify_rule_slot ×13；prim:modify_resource ×12；prim:modify_stat ×11 |
| seer | prim:mount_status ×19；prim:modify_resource ×18；prim:take_control ×14；prim:modify_rule_slot ×11；prim:damage ×5 |
| sleepless | prim:mount_status ×31；prim:damage ×12；elem:mental ×12；prim:dispel ×8；prim:set_luminance ×7 |
| spectator | prim:mount_status ×25；prim:modify_status ×17；prim:write_rule_slot ×16；elem:mental ×12；prim:damage ×7 |
| supplicant | prim:modify_resource ×28；prim:mount_status ×26；prim:drain ×22；prim:modify_stat ×9；prim:damage ×7 |
| thief | prim:mount_status ×24；prim:transfer_status ×14；elem:mental ×9；prim:damage ×8；prim:modify_stat ×8 |
| warrior | prim:mount_status ×24；prim:modify_targetability ×16；prim:damage ×13；prim:grant_immunity ×13；elem:none ×12 |

## 四、签名键用量（≥2 卡 = 落地；空白键 = 差异化迭代立项依据）

| 途径 | 签名键用量 |
|---|---|
| apothecary | sref:moon_cycle ×4；unitType:BEAST ×8；sref:prepared_draught ×5 |
| apprentice | prim:translocate ×14；prim:echo_last_skill ×11；prim:restore_snapshot ×2 |
| arbiter | flag:seal_effect ×2；flag:cost_mod ×2；res:order ×6 |
| assassin | prim:translocate ×11；elem:ice ×3；elem:dark ×1（发芽） |
| chanter | prim:grant_immunity ×16；prim:write_rule_slot ×2；trig:on_phase_change ×2 |
| corpse_collector | flag:filter.unitType ×3；trig:on_kill ×2；prim:drain ×9 |
| criminal | res:lust ×36；elem:dark ×4；flag:companionBuff ×2 |
| hunter | prim:target_override ×10；flag:gender_is ×1（发芽）；sref:massing ×1（发芽） |
| lawyer | prim:gauge_shuffle ×7；prim:status_shuffle ×5；prim:modify_rule_slot ×18 |
| monster | prim:restore_snapshot ×30；prim:advance_clock ×2；res:fate_value ×5 |
| planter | flag:statPerStack ×3；unitType:PLANT ×8；sref:blight ×3 |
| prisoner | sref:curse_link ×3；unitType:ITEM ×2；sref:lineage_stack ×6 |
| pryer | flag:valueFrom ×2；flag:cast_time_set ×29；sref:info_form ×2 |
| reader | prim:reveal ×13；sref:mimic ×5；prim:snapshot ×7 |
| sailor | elem:ice ×2；elem:lightning ×8；sref:rage ×10 |
| savant | prim:modify_rule_slot ×13；sref:law_edit ×3；unitType:CONSTRUCT ×3 |
| seer | sref:puppet_string ×4；prim:write_rule_slot ×2；prim:translocate ×4 |
| sleepless | trig:on_phase_change ×2；prim:advance_clock ×4；res:secrecy ×3 |
| spectator | stat:rank ×3；flag:template ×1（发芽）；sref:insight ×5 |
| supplicant | sref:grazed_soul ×7；stat:hp_max ×5；sref:flesh_undying ×2 |
| thief | prim:take_control ×5；prim:modify_targetability ×2；prim:target_override ×8 |
| warrior | elem:holy ×4；flag:filter.unitType ×2；sref:guardianship ×2 |
