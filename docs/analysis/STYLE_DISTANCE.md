# 途径风格距离（STYLE DISTANCE）

> 由 `docs/tools/build_style_analysis.py` 自动生成——**勿手改**；指纹口径与 score.py 差异化②同源（**全链路指纹**，SCORING 2.1：prim 原语 / elem 元素 / cond 谓词 / stat modify_stat 键 / sref 状态身份 / tgt 选靶 / tgtf 选靶 filter / hook 触发点，八族各自 L2 归一后等权取余弦距离均值）。差异化迭代后重跑本报告看距离拉开。生成时间：2026-10-17。

## 一、最近邻榜（距离越小越雷同，差异化迭代优先拆这些对）

| 途径 | 最近邻 | 距离 | 对他途径均距 |
|---|---|---:|---:|
| lawyer | thief | 0.237 | 0.355 |
| prisoner | lawyer | 0.240 | 0.372 |
| thief | lawyer | 0.237 | 0.375 |
| supplicant | lawyer | 0.289 | 0.407 |
| pryer | lawyer | 0.296 | 0.408 |
| savant | corpse_collector | 0.280 | 0.418 |
| arbiter | reader | 0.228 | 0.421 |
| planter | apothecary | 0.237 | 0.430 |
| reader | arbiter | 0.228 | 0.435 |
| apothecary | planter | 0.237 | 0.437 |
| corpse_collector | savant | 0.280 | 0.443 |
| sailor | prisoner | 0.335 | 0.445 |
| spectator | thief | 0.315 | 0.447 |
| seer | arbiter | 0.247 | 0.447 |
| apprentice | criminal | 0.341 | 0.450 |
| assassin | lawyer | 0.386 | 0.454 |
| criminal | prisoner | 0.330 | 0.458 |
| hunter | lawyer | 0.395 | 0.471 |
| monster | lawyer | 0.361 | 0.483 |
| chanter | thief | 0.387 | 0.484 |
| sleepless | corpse_collector | 0.319 | 0.500 |
| warrior | savant | 0.390 | 0.513 |

## 二、22×22 距离矩阵

| | apothecary | apprentice | arbiter | assassin | chanter | corpse_collector | criminal | hunter | lawyer | monster | planter | prisoner | pryer | reader | sailor | savant | seer | sleepless | spectator | supplicant | thief | warrior |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **apothecary** | 0.00 | 0.41 | 0.50 | 0.43 | 0.47 | 0.49 | 0.38 | 0.45 | 0.36 | 0.57 | 0.24 | 0.32 | 0.34 | 0.54 | 0.39 | 0.39 | 0.52 | 0.59 | 0.52 | 0.37 | 0.39 | 0.52 |
| **apprentice** | 0.41 | 0.00 | 0.45 | 0.41 | 0.54 | 0.56 | 0.34 | 0.52 | 0.37 | 0.49 | 0.45 | 0.36 | 0.38 | 0.49 | 0.36 | 0.47 | 0.48 | 0.58 | 0.48 | 0.39 | 0.37 | 0.55 |
| **arbiter** | 0.50 | 0.45 | 0.00 | 0.45 | 0.49 | 0.42 | 0.49 | 0.45 | 0.34 | 0.44 | 0.50 | 0.37 | 0.42 | 0.23 | 0.42 | 0.41 | 0.25 | 0.48 | 0.40 | 0.45 | 0.35 | 0.54 |
| **assassin** | 0.43 | 0.41 | 0.45 | 0.00 | 0.57 | 0.48 | 0.46 | 0.47 | 0.39 | 0.51 | 0.42 | 0.42 | 0.41 | 0.45 | 0.47 | 0.43 | 0.46 | 0.50 | 0.49 | 0.39 | 0.43 | 0.50 |
| **chanter** | 0.47 | 0.54 | 0.49 | 0.57 | 0.00 | 0.50 | 0.54 | 0.48 | 0.40 | 0.52 | 0.44 | 0.41 | 0.48 | 0.51 | 0.46 | 0.52 | 0.53 | 0.55 | 0.45 | 0.46 | 0.39 | 0.47 |
| **corpse_collector** | 0.49 | 0.56 | 0.42 | 0.48 | 0.50 | 0.00 | 0.54 | 0.47 | 0.39 | 0.47 | 0.43 | 0.41 | 0.48 | 0.40 | 0.54 | 0.28 | 0.43 | 0.32 | 0.44 | 0.44 | 0.38 | 0.42 |
| **criminal** | 0.38 | 0.34 | 0.49 | 0.46 | 0.54 | 0.54 | 0.00 | 0.48 | 0.37 | 0.55 | 0.44 | 0.33 | 0.39 | 0.51 | 0.43 | 0.46 | 0.53 | 0.58 | 0.48 | 0.34 | 0.40 | 0.56 |
| **hunter** | 0.45 | 0.52 | 0.45 | 0.47 | 0.48 | 0.47 | 0.48 | 0.00 | 0.39 | 0.55 | 0.42 | 0.45 | 0.43 | 0.48 | 0.44 | 0.41 | 0.44 | 0.57 | 0.54 | 0.49 | 0.44 | 0.50 |
| **lawyer** | 0.36 | 0.37 | 0.34 | 0.39 | 0.40 | 0.39 | 0.37 | 0.39 | 0.00 | 0.36 | 0.33 | 0.24 | 0.30 | 0.37 | 0.34 | 0.36 | 0.39 | 0.45 | 0.32 | 0.29 | 0.24 | 0.48 |
| **monster** | 0.57 | 0.49 | 0.44 | 0.51 | 0.52 | 0.47 | 0.55 | 0.55 | 0.36 | 0.00 | 0.54 | 0.41 | 0.47 | 0.42 | 0.50 | 0.49 | 0.44 | 0.53 | 0.39 | 0.44 | 0.39 | 0.63 |
| **planter** | 0.24 | 0.45 | 0.50 | 0.42 | 0.44 | 0.43 | 0.44 | 0.42 | 0.33 | 0.54 | 0.00 | 0.38 | 0.34 | 0.53 | 0.43 | 0.36 | 0.51 | 0.56 | 0.49 | 0.36 | 0.39 | 0.48 |
| **prisoner** | 0.32 | 0.36 | 0.37 | 0.42 | 0.41 | 0.41 | 0.33 | 0.45 | 0.24 | 0.41 | 0.38 | 0.00 | 0.34 | 0.40 | 0.34 | 0.39 | 0.40 | 0.47 | 0.33 | 0.29 | 0.25 | 0.51 |
| **pryer** | 0.34 | 0.38 | 0.42 | 0.41 | 0.48 | 0.48 | 0.39 | 0.43 | 0.30 | 0.47 | 0.34 | 0.34 | 0.00 | 0.38 | 0.36 | 0.42 | 0.44 | 0.55 | 0.43 | 0.36 | 0.33 | 0.51 |
| **reader** | 0.54 | 0.49 | 0.23 | 0.45 | 0.51 | 0.40 | 0.51 | 0.48 | 0.37 | 0.42 | 0.53 | 0.40 | 0.38 | 0.00 | 0.49 | 0.41 | 0.28 | 0.46 | 0.41 | 0.44 | 0.36 | 0.56 |
| **sailor** | 0.39 | 0.36 | 0.42 | 0.47 | 0.46 | 0.54 | 0.43 | 0.44 | 0.34 | 0.50 | 0.43 | 0.34 | 0.36 | 0.49 | 0.00 | 0.48 | 0.49 | 0.58 | 0.48 | 0.44 | 0.39 | 0.52 |
| **savant** | 0.39 | 0.47 | 0.41 | 0.43 | 0.52 | 0.28 | 0.46 | 0.41 | 0.36 | 0.49 | 0.36 | 0.39 | 0.42 | 0.41 | 0.48 | 0.00 | 0.40 | 0.40 | 0.50 | 0.41 | 0.40 | 0.39 |
| **seer** | 0.52 | 0.48 | 0.25 | 0.46 | 0.53 | 0.43 | 0.53 | 0.44 | 0.39 | 0.44 | 0.51 | 0.40 | 0.44 | 0.28 | 0.49 | 0.40 | 0.00 | 0.54 | 0.46 | 0.43 | 0.40 | 0.57 |
| **sleepless** | 0.59 | 0.58 | 0.48 | 0.50 | 0.55 | 0.32 | 0.58 | 0.57 | 0.45 | 0.53 | 0.56 | 0.47 | 0.55 | 0.46 | 0.58 | 0.40 | 0.54 | 0.00 | 0.45 | 0.50 | 0.41 | 0.42 |
| **spectator** | 0.52 | 0.48 | 0.40 | 0.49 | 0.45 | 0.44 | 0.48 | 0.54 | 0.32 | 0.39 | 0.49 | 0.33 | 0.43 | 0.41 | 0.48 | 0.50 | 0.46 | 0.45 | 0.00 | 0.39 | 0.31 | 0.59 |
| **supplicant** | 0.37 | 0.39 | 0.45 | 0.39 | 0.46 | 0.44 | 0.34 | 0.49 | 0.29 | 0.44 | 0.36 | 0.29 | 0.36 | 0.44 | 0.44 | 0.41 | 0.43 | 0.50 | 0.39 | 0.00 | 0.32 | 0.54 |
| **thief** | 0.39 | 0.37 | 0.35 | 0.43 | 0.39 | 0.38 | 0.40 | 0.44 | 0.24 | 0.39 | 0.39 | 0.25 | 0.33 | 0.36 | 0.39 | 0.40 | 0.40 | 0.41 | 0.31 | 0.32 | 0.00 | 0.51 |
| **warrior** | 0.52 | 0.55 | 0.54 | 0.50 | 0.47 | 0.42 | 0.56 | 0.50 | 0.48 | 0.63 | 0.48 | 0.51 | 0.51 | 0.56 | 0.52 | 0.39 | 0.57 | 0.42 | 0.59 | 0.54 | 0.51 | 0.00 |

## 三、途径指纹（各途径 Top-5 指纹键）

| 途径 | Top-5 指纹键 |
|---|---|
| apothecary | prim:mount_status ×27；tgt:mode=unit ×21；prim:transfer_status ×18；tgt:sel=auto ×17；hook:on_battle_start ×13 |
| apprentice | prim:mount_status ×25；tgt:mode=unit ×22；tgt:faction=enemy ×17；prim:modify_resource ×16；tgt:sel=manual ×16 |
| arbiter | prim:take_control ×27；tgt:mode=unit ×27；prim:mount_status ×26；tgt:faction=enemy ×26；tgt:sel=manual ×20 |
| assassin | prim:mount_status ×33；prim:modify_targetability ×26；tgt:mode=unit ×26；tgt:faction=enemy ×19；tgt:sel=manual ×17 |
| chanter | tgt:mode=unit ×28；prim:mount_status ×25；prim:set_luminance ×20；prim:grant_immunity ×16；tgt:sel=auto ×14 |
| corpse_collector | prim:mount_status ×28；tgt:mode=unit ×23；prim:reveal ×16；hook:on_battle_start ×15；prim:spawn ×15 |
| criminal | prim:modify_resource ×37；prim:move ×37；prim:mount_status ×35；tgt:faction=enemy ×24；tgt:mode=unit ×24 |
| hunter | prim:mount_status ×31；tgt:mode=unit ×21；prim:modify_resource ×20；tgt:faction=enemy ×20；prim:move ×18 |
| lawyer | prim:mount_status ×33；tgt:faction=enemy ×27；tgt:mode=unit ×25；tgt:sel=manual ×23；prim:modify_rule_slot ×18 |
| monster | prim:restore_snapshot ×30；prim:mount_status ×28；tgt:mode=unit ×16；hook:on_battle_start ×15；tgt:sel=manual ×14 |
| planter | prim:spawn ×30；prim:mount_status ×26；tgt:mode=unit ×21；tgt:sel=auto ×13；tgt:sel=manual ×11 |
| prisoner | prim:mount_status ×24；tgt:mode=unit ×22；prim:modify_resource ×20；prim:transfer_status ×20；tgt:faction=enemy ×17 |
| pryer | prim:modify_skill ×28；tgt:mode=unit ×27；prim:mount_status ×26；tgt:sel=manual ×20；prim:damage ×18 |
| reader | prim:mount_status ×22；tgt:mode=unit ×20；tgt:faction=enemy ×16；tgt:sel=manual ×16；prim:reveal ×13 |
| sailor | prim:move ×39；prim:mount_status ×29；prim:damage ×24；tgt:faction=enemy ×24；tgt:mode=unit ×18 |
| savant | tgt:mode=unit ×21；prim:spawn ×20；prim:mount_status ×15；tgt:sel=manual ×15；prim:modify_rule_slot ×13 |
| seer | tgt:mode=unit ×27；prim:mount_status ×19；prim:modify_resource ×18；tgt:sel=manual ×18；prim:take_control ×14 |
| sleepless | prim:mount_status ×31；tgt:mode=unit ×18；hook:on_tick ×16；tgt:faction=enemy ×14；cond:phase_is ×12 |
| spectator | prim:mount_status ×25；tgt:mode=unit ×23；prim:modify_status ×17；tgt:faction=enemy ×17；tgt:sel=manual ×17 |
| supplicant | prim:modify_resource ×28；prim:mount_status ×26；prim:drain ×22；tgt:mode=unit ×18；cond:has_status ×13 |
| thief | tgt:mode=unit ×25；prim:mount_status ×24；tgt:faction=enemy ×20；tgt:sel=manual ×19；prim:transfer_status ×14 |
| warrior | prim:mount_status ×24；cond:dead_count ×20；tgt:mode=unit ×20；prim:modify_resource ×18；prim:damage ×17 |

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
| warrior | elem:holy ×10；flag:filter.unitType ×3；sref:guardianship ×6 |
