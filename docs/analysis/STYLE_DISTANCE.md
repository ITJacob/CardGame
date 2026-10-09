# 途径风格距离（STYLE DISTANCE）

> 由 `docs/tools/build_style_analysis.py` 自动生成——**勿手改**；指纹口径与 score.py 第七维同源（原语分布 + 元素分布 + modify_stat 键分布，1−cos 距离）。差异化迭代后重跑本报告看距离拉开。生成时间：2026-10-10。

## 一、最近邻榜（距离越小越雷同，差异化迭代优先拆这些对）

| 途径 | 最近邻 | 距离 | 对他途径均距 |
|---|---|---:|---:|
| thief | prisoner | 0.147 | 0.326 |
| lawyer | hunter | 0.238 | 0.329 |
| prisoner | thief | 0.147 | 0.345 |
| apprentice | criminal | 0.244 | 0.348 |
| hunter | criminal | 0.149 | 0.351 |
| sleepless | reader | 0.247 | 0.352 |
| reader | corpse_collector | 0.194 | 0.363 |
| corpse_collector | reader | 0.194 | 0.368 |
| supplicant | prisoner | 0.240 | 0.372 |
| apothecary | thief | 0.164 | 0.375 |
| seer | arbiter | 0.213 | 0.375 |
| assassin | warrior | 0.153 | 0.381 |
| criminal | hunter | 0.149 | 0.382 |
| warrior | assassin | 0.153 | 0.383 |
| arbiter | seer | 0.213 | 0.396 |
| pryer | reader | 0.204 | 0.397 |
| spectator | lawyer | 0.259 | 0.416 |
| savant | planter | 0.178 | 0.419 |
| planter | savant | 0.178 | 0.427 |
| sailor | criminal | 0.180 | 0.454 |
| chanter | warrior | 0.327 | 0.502 |
| monster | lawyer | 0.417 | 0.502 |

## 二、22×22 距离矩阵

| | apothecary | apprentice | arbiter | assassin | chanter | corpse_collector | criminal | hunter | lawyer | monster | planter | prisoner | pryer | reader | sailor | savant | seer | sleepless | spectator | supplicant | thief | warrior |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **apothecary** | 0.00 | 0.38 | 0.44 | 0.39 | 0.39 | 0.34 | 0.45 | 0.41 | 0.36 | 0.51 | 0.30 | 0.19 | 0.42 | 0.41 | 0.47 | 0.37 | 0.42 | 0.35 | 0.43 | 0.39 | 0.16 | 0.28 |
| **apprentice** | 0.38 | 0.00 | 0.36 | 0.24 | 0.50 | 0.40 | 0.24 | 0.28 | 0.28 | 0.42 | 0.46 | 0.29 | 0.36 | 0.32 | 0.34 | 0.43 | 0.27 | 0.34 | 0.42 | 0.28 | 0.32 | 0.36 |
| **arbiter** | 0.44 | 0.36 | 0.00 | 0.43 | 0.52 | 0.38 | 0.42 | 0.42 | 0.33 | 0.53 | 0.50 | 0.38 | 0.39 | 0.32 | 0.44 | 0.48 | 0.21 | 0.31 | 0.36 | 0.42 | 0.25 | 0.42 |
| **assassin** | 0.39 | 0.24 | 0.43 | 0.00 | 0.50 | 0.39 | 0.38 | 0.35 | 0.34 | 0.46 | 0.44 | 0.36 | 0.41 | 0.38 | 0.48 | 0.47 | 0.35 | 0.34 | 0.43 | 0.37 | 0.33 | 0.15 |
| **chanter** | 0.39 | 0.50 | 0.52 | 0.50 | 0.00 | 0.49 | 0.56 | 0.51 | 0.48 | 0.59 | 0.52 | 0.51 | 0.50 | 0.49 | 0.57 | 0.60 | 0.54 | 0.40 | 0.50 | 0.55 | 0.48 | 0.33 |
| **corpse_collector** | 0.34 | 0.40 | 0.38 | 0.39 | 0.49 | 0.00 | 0.47 | 0.41 | 0.35 | 0.48 | 0.21 | 0.38 | 0.40 | 0.19 | 0.51 | 0.32 | 0.44 | 0.25 | 0.36 | 0.32 | 0.27 | 0.38 |
| **criminal** | 0.45 | 0.24 | 0.42 | 0.38 | 0.56 | 0.47 | 0.00 | 0.15 | 0.36 | 0.52 | 0.52 | 0.30 | 0.39 | 0.38 | 0.18 | 0.44 | 0.30 | 0.42 | 0.47 | 0.25 | 0.39 | 0.44 |
| **hunter** | 0.41 | 0.28 | 0.42 | 0.35 | 0.51 | 0.41 | 0.15 | 0.00 | 0.24 | 0.50 | 0.45 | 0.32 | 0.37 | 0.38 | 0.26 | 0.33 | 0.21 | 0.37 | 0.45 | 0.31 | 0.32 | 0.35 |
| **lawyer** | 0.36 | 0.28 | 0.33 | 0.34 | 0.48 | 0.35 | 0.36 | 0.24 | 0.00 | 0.42 | 0.44 | 0.27 | 0.28 | 0.29 | 0.40 | 0.32 | 0.28 | 0.27 | 0.26 | 0.31 | 0.29 | 0.35 |
| **monster** | 0.51 | 0.42 | 0.53 | 0.46 | 0.59 | 0.48 | 0.52 | 0.50 | 0.42 | 0.00 | 0.53 | 0.50 | 0.52 | 0.47 | 0.60 | 0.58 | 0.50 | 0.43 | 0.51 | 0.50 | 0.47 | 0.52 |
| **planter** | 0.30 | 0.46 | 0.50 | 0.44 | 0.52 | 0.21 | 0.52 | 0.45 | 0.44 | 0.53 | 0.00 | 0.44 | 0.46 | 0.47 | 0.52 | 0.18 | 0.46 | 0.37 | 0.46 | 0.44 | 0.39 | 0.39 |
| **prisoner** | 0.19 | 0.29 | 0.38 | 0.36 | 0.51 | 0.38 | 0.30 | 0.32 | 0.27 | 0.50 | 0.44 | 0.00 | 0.38 | 0.34 | 0.47 | 0.35 | 0.29 | 0.35 | 0.33 | 0.24 | 0.15 | 0.40 |
| **pryer** | 0.42 | 0.36 | 0.39 | 0.41 | 0.50 | 0.40 | 0.39 | 0.37 | 0.28 | 0.52 | 0.46 | 0.38 | 0.00 | 0.20 | 0.39 | 0.49 | 0.46 | 0.34 | 0.44 | 0.42 | 0.36 | 0.35 |
| **reader** | 0.41 | 0.32 | 0.32 | 0.38 | 0.49 | 0.19 | 0.38 | 0.38 | 0.29 | 0.47 | 0.47 | 0.34 | 0.20 | 0.00 | 0.45 | 0.45 | 0.41 | 0.25 | 0.34 | 0.38 | 0.28 | 0.40 |
| **sailor** | 0.47 | 0.34 | 0.44 | 0.48 | 0.57 | 0.51 | 0.18 | 0.26 | 0.40 | 0.60 | 0.52 | 0.47 | 0.39 | 0.45 | 0.00 | 0.57 | 0.51 | 0.44 | 0.53 | 0.49 | 0.45 | 0.44 |
| **savant** | 0.37 | 0.43 | 0.48 | 0.47 | 0.60 | 0.32 | 0.44 | 0.33 | 0.32 | 0.58 | 0.18 | 0.35 | 0.49 | 0.45 | 0.57 | 0.00 | 0.29 | 0.46 | 0.50 | 0.32 | 0.39 | 0.46 |
| **seer** | 0.42 | 0.27 | 0.21 | 0.35 | 0.54 | 0.44 | 0.30 | 0.21 | 0.28 | 0.50 | 0.46 | 0.29 | 0.46 | 0.41 | 0.51 | 0.29 | 0.00 | 0.41 | 0.45 | 0.28 | 0.32 | 0.45 |
| **sleepless** | 0.35 | 0.34 | 0.31 | 0.34 | 0.40 | 0.25 | 0.42 | 0.37 | 0.27 | 0.43 | 0.37 | 0.35 | 0.34 | 0.25 | 0.44 | 0.46 | 0.41 | 0.00 | 0.27 | 0.42 | 0.25 | 0.35 |
| **spectator** | 0.43 | 0.42 | 0.36 | 0.43 | 0.50 | 0.36 | 0.47 | 0.45 | 0.26 | 0.51 | 0.46 | 0.33 | 0.44 | 0.34 | 0.53 | 0.50 | 0.45 | 0.27 | 0.00 | 0.42 | 0.34 | 0.46 |
| **supplicant** | 0.39 | 0.28 | 0.42 | 0.37 | 0.55 | 0.32 | 0.25 | 0.31 | 0.31 | 0.50 | 0.44 | 0.24 | 0.42 | 0.38 | 0.49 | 0.32 | 0.28 | 0.42 | 0.42 | 0.00 | 0.28 | 0.43 |
| **thief** | 0.16 | 0.32 | 0.25 | 0.33 | 0.48 | 0.27 | 0.39 | 0.32 | 0.29 | 0.47 | 0.39 | 0.15 | 0.36 | 0.28 | 0.45 | 0.39 | 0.32 | 0.25 | 0.34 | 0.28 | 0.00 | 0.34 |
| **warrior** | 0.28 | 0.36 | 0.42 | 0.15 | 0.33 | 0.38 | 0.44 | 0.35 | 0.35 | 0.52 | 0.39 | 0.40 | 0.35 | 0.40 | 0.44 | 0.46 | 0.45 | 0.35 | 0.46 | 0.43 | 0.34 | 0.00 |

## 三、途径指纹（各途径 Top-5 指纹键）

| 途径 | Top-5 指纹键 |
|---|---|
| apothecary | prim:mount_status ×27；prim:transfer_status ×18；prim:grant_immunity ×12；cond:has_status ×11；prim:modify_stat ×9 |
| apprentice | prim:mount_status ×25；prim:modify_resource ×16；prim:translocate ×14；prim:echo_last_skill ×11；elem:physical ×10 |
| arbiter | prim:take_control ×27；prim:mount_status ×26；elem:mental ×16；prim:damage ×16；elem:physical ×9 |
| assassin | prim:mount_status ×33；prim:modify_targetability ×26；prim:modify_resource ×14；prim:translocate ×11；prim:damage ×9 |
| chanter | prim:mount_status ×25；elem:holy ×21；prim:set_luminance ×20；prim:grant_immunity ×16；prim:damage ×12 |
| corpse_collector | prim:mount_status ×28；prim:reveal ×16；prim:spawn ×15；elem:mental ×10；prim:damage ×9 |
| criminal | prim:modify_resource ×37；prim:move ×37；prim:mount_status ×35；prim:damage ×19；cond:has_status ×13 |
| hunter | prim:mount_status ×31；prim:modify_resource ×20；prim:move ×18；prim:modify_rule_slot ×17；prim:damage ×13 |
| lawyer | prim:mount_status ×33；prim:modify_rule_slot ×18；cond:has_status ×17；prim:damage ×15；prim:modify_status ×14 |
| monster | prim:restore_snapshot ×30；prim:mount_status ×28；cond:chance ×16；prim:modify_resource ×8；cond:has_status ×5 |
| planter | prim:spawn ×30；prim:mount_status ×26；cond:has_status ×9；elem:none ×8；prim:damage ×7 |
| prisoner | prim:mount_status ×24；prim:modify_resource ×20；prim:transfer_status ×20；prim:damage ×12；prim:modify_status ×10 |
| pryer | prim:modify_skill ×28；prim:mount_status ×26；prim:damage ×18；cond:has_status ×12；elem:none ×9 |
| reader | prim:mount_status ×22；prim:reveal ×13；elem:mental ×12；prim:damage ×12；prim:modify_skill ×10 |
| sailor | prim:move ×39；prim:mount_status ×29；prim:damage ×24；elem:physical ×16；elem:lightning ×12 |
| savant | prim:spawn ×20；prim:mount_status ×15；prim:modify_rule_slot ×13；prim:modify_resource ×12；prim:modify_stat ×11 |
| seer | prim:mount_status ×19；prim:modify_resource ×18；prim:take_control ×14；prim:modify_rule_slot ×11；cond:has_status ×5 |
| sleepless | prim:mount_status ×31；cond:phase_is ×14；elem:mental ×12；prim:damage ×12；prim:dispel ×8 |
| spectator | prim:mount_status ×25；prim:modify_status ×17；prim:write_rule_slot ×16；elem:mental ×12；prim:damage ×7 |
| supplicant | prim:modify_resource ×28；prim:mount_status ×26；prim:drain ×22；cond:has_status ×18；prim:modify_stat ×9 |
| thief | prim:mount_status ×24；prim:transfer_status ×14；cond:has_status ×9；elem:mental ×9；prim:damage ×8 |
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
