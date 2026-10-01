# 途径风格距离（STYLE DISTANCE）

> 由 `docs/tools/build_style_analysis.py` 自动生成——**勿手改**；指纹口径与 score.py 第七维同源（原语分布 + 元素分布 + modify_stat 键分布，1−cos 距离）。差异化迭代后重跑本报告看距离拉开。生成时间：2026-10-02。

## 一、最近邻榜（距离越小越雷同，差异化迭代优先拆这些对）

| 途径 | 最近邻 | 距离 | 对他途径均距 |
|---|---|---:|---:|
| supplicant | spectator | 0.027 | 0.085 |
| lawyer | apprentice | 0.041 | 0.086 |
| prisoner | thief | 0.051 | 0.091 |
| assassin | supplicant | 0.033 | 0.097 |
| spectator | sleepless | 0.020 | 0.100 |
| sleepless | spectator | 0.020 | 0.103 |
| thief | spectator | 0.037 | 0.106 |
| corpse_collector | spectator | 0.035 | 0.110 |
| criminal | lawyer | 0.061 | 0.111 |
| hunter | assassin | 0.043 | 0.114 |
| monster | assassin | 0.040 | 0.117 |
| reader | sleepless | 0.028 | 0.117 |
| pryer | warrior | 0.045 | 0.121 |
| apprentice | lawyer | 0.041 | 0.124 |
| arbiter | reader | 0.038 | 0.126 |
| warrior | hunter | 0.043 | 0.128 |
| apothecary | planter | 0.038 | 0.130 |
| seer | monster | 0.077 | 0.134 |
| planter | apothecary | 0.038 | 0.140 |
| sailor | apprentice | 0.078 | 0.173 |
| savant | seer | 0.128 | 0.206 |
| chanter | assassin | 0.215 | 0.261 |

## 二、22×22 距离矩阵

| | apothecary | apprentice | arbiter | assassin | chanter | corpse_collector | criminal | hunter | lawyer | monster | planter | prisoner | pryer | reader | sailor | savant | seer | sleepless | spectator | supplicant | thief | warrior |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **apothecary** | 0.00 | 0.14 | 0.19 | 0.07 | 0.27 | 0.09 | 0.12 | 0.10 | 0.12 | 0.12 | 0.04 | 0.08 | 0.18 | 0.18 | 0.20 | 0.16 | 0.13 | 0.13 | 0.10 | 0.05 | 0.12 | 0.13 |
| **apprentice** | 0.14 | 0.00 | 0.11 | 0.08 | 0.29 | 0.16 | 0.10 | 0.12 | 0.04 | 0.08 | 0.17 | 0.10 | 0.10 | 0.12 | 0.08 | 0.24 | 0.11 | 0.13 | 0.12 | 0.08 | 0.13 | 0.13 |
| **arbiter** | 0.19 | 0.11 | 0.00 | 0.15 | 0.29 | 0.10 | 0.12 | 0.16 | 0.07 | 0.15 | 0.21 | 0.05 | 0.08 | 0.04 | 0.13 | 0.19 | 0.15 | 0.06 | 0.08 | 0.10 | 0.07 | 0.15 |
| **assassin** | 0.07 | 0.08 | 0.15 | 0.00 | 0.21 | 0.08 | 0.07 | 0.04 | 0.05 | 0.04 | 0.07 | 0.08 | 0.11 | 0.13 | 0.16 | 0.23 | 0.11 | 0.09 | 0.07 | 0.03 | 0.10 | 0.07 |
| **chanter** | 0.27 | 0.29 | 0.29 | 0.21 | 0.00 | 0.24 | 0.25 | 0.24 | 0.24 | 0.24 | 0.24 | 0.25 | 0.25 | 0.28 | 0.31 | 0.37 | 0.26 | 0.24 | 0.25 | 0.23 | 0.28 | 0.24 |
| **corpse_collector** | 0.09 | 0.16 | 0.10 | 0.08 | 0.24 | 0.00 | 0.11 | 0.11 | 0.09 | 0.10 | 0.08 | 0.08 | 0.12 | 0.08 | 0.22 | 0.21 | 0.13 | 0.04 | 0.04 | 0.04 | 0.07 | 0.13 |
| **criminal** | 0.12 | 0.10 | 0.12 | 0.07 | 0.25 | 0.11 | 0.00 | 0.07 | 0.06 | 0.10 | 0.15 | 0.07 | 0.10 | 0.08 | 0.14 | 0.20 | 0.14 | 0.07 | 0.08 | 0.07 | 0.10 | 0.12 |
| **hunter** | 0.10 | 0.12 | 0.16 | 0.04 | 0.24 | 0.11 | 0.07 | 0.00 | 0.07 | 0.10 | 0.09 | 0.09 | 0.09 | 0.15 | 0.15 | 0.22 | 0.14 | 0.11 | 0.11 | 0.08 | 0.12 | 0.04 |
| **lawyer** | 0.12 | 0.04 | 0.07 | 0.05 | 0.24 | 0.09 | 0.06 | 0.07 | 0.00 | 0.04 | 0.14 | 0.05 | 0.06 | 0.06 | 0.09 | 0.18 | 0.09 | 0.07 | 0.07 | 0.04 | 0.07 | 0.08 |
| **monster** | 0.12 | 0.08 | 0.15 | 0.04 | 0.24 | 0.10 | 0.10 | 0.10 | 0.04 | 0.00 | 0.14 | 0.12 | 0.15 | 0.12 | 0.20 | 0.23 | 0.08 | 0.09 | 0.06 | 0.04 | 0.10 | 0.14 |
| **planter** | 0.04 | 0.17 | 0.21 | 0.07 | 0.24 | 0.08 | 0.15 | 0.09 | 0.14 | 0.14 | 0.00 | 0.11 | 0.14 | 0.21 | 0.22 | 0.21 | 0.13 | 0.14 | 0.11 | 0.08 | 0.15 | 0.09 |
| **prisoner** | 0.08 | 0.10 | 0.05 | 0.08 | 0.25 | 0.08 | 0.07 | 0.09 | 0.05 | 0.12 | 0.11 | 0.00 | 0.08 | 0.07 | 0.10 | 0.14 | 0.12 | 0.05 | 0.06 | 0.05 | 0.05 | 0.09 |
| **pryer** | 0.18 | 0.10 | 0.08 | 0.11 | 0.25 | 0.12 | 0.10 | 0.09 | 0.06 | 0.15 | 0.14 | 0.08 | 0.00 | 0.09 | 0.08 | 0.21 | 0.15 | 0.11 | 0.14 | 0.12 | 0.13 | 0.04 |
| **reader** | 0.18 | 0.12 | 0.04 | 0.13 | 0.28 | 0.08 | 0.08 | 0.15 | 0.06 | 0.12 | 0.21 | 0.07 | 0.09 | 0.00 | 0.18 | 0.17 | 0.13 | 0.03 | 0.05 | 0.08 | 0.05 | 0.16 |
| **sailor** | 0.20 | 0.08 | 0.13 | 0.16 | 0.31 | 0.22 | 0.14 | 0.15 | 0.09 | 0.20 | 0.22 | 0.10 | 0.08 | 0.18 | 0.00 | 0.27 | 0.21 | 0.19 | 0.22 | 0.16 | 0.20 | 0.12 |
| **savant** | 0.16 | 0.24 | 0.19 | 0.23 | 0.37 | 0.21 | 0.20 | 0.22 | 0.18 | 0.23 | 0.21 | 0.14 | 0.21 | 0.17 | 0.27 | 0.00 | 0.13 | 0.21 | 0.20 | 0.18 | 0.14 | 0.20 |
| **seer** | 0.13 | 0.11 | 0.15 | 0.11 | 0.26 | 0.13 | 0.14 | 0.14 | 0.09 | 0.08 | 0.13 | 0.12 | 0.15 | 0.13 | 0.21 | 0.13 | 0.00 | 0.14 | 0.10 | 0.08 | 0.12 | 0.16 |
| **sleepless** | 0.13 | 0.13 | 0.06 | 0.09 | 0.24 | 0.04 | 0.07 | 0.11 | 0.07 | 0.09 | 0.14 | 0.05 | 0.11 | 0.03 | 0.19 | 0.21 | 0.14 | 0.00 | 0.02 | 0.04 | 0.04 | 0.15 |
| **spectator** | 0.10 | 0.12 | 0.08 | 0.07 | 0.25 | 0.04 | 0.08 | 0.11 | 0.07 | 0.06 | 0.11 | 0.06 | 0.14 | 0.05 | 0.22 | 0.20 | 0.10 | 0.02 | 0.00 | 0.03 | 0.04 | 0.16 |
| **supplicant** | 0.05 | 0.08 | 0.10 | 0.03 | 0.23 | 0.04 | 0.07 | 0.08 | 0.04 | 0.04 | 0.08 | 0.05 | 0.12 | 0.08 | 0.16 | 0.18 | 0.08 | 0.04 | 0.03 | 0.00 | 0.06 | 0.12 |
| **thief** | 0.12 | 0.13 | 0.07 | 0.10 | 0.28 | 0.07 | 0.10 | 0.12 | 0.07 | 0.10 | 0.15 | 0.05 | 0.13 | 0.05 | 0.20 | 0.14 | 0.12 | 0.04 | 0.04 | 0.06 | 0.00 | 0.14 |
| **warrior** | 0.13 | 0.13 | 0.15 | 0.07 | 0.24 | 0.13 | 0.12 | 0.04 | 0.08 | 0.14 | 0.09 | 0.09 | 0.04 | 0.16 | 0.12 | 0.20 | 0.16 | 0.15 | 0.16 | 0.12 | 0.14 | 0.00 |

## 三、途径指纹（各途径 Top-5 指纹键）

| 途径 | Top-5 指纹键 |
|---|---|
| apothecary | prim:mount_status ×27；prim:modify_stat ×9；prim:spawn ×8；prim:damage ×6；prim:heal ×4 |
| apprentice | prim:mount_status ×25；prim:damage ×10；elem:physical ×10；prim:modify_resource ×6；prim:move ×5 |
| arbiter | prim:mount_status ×27；prim:damage ×16；elem:mental ×16；elem:physical ×9；prim:modify_stat ×8 |
| assassin | prim:mount_status ×35；prim:damage ×9；elem:physical ×4；prim:modify_stat ×4；prim:modify_resource ×4 |
| chanter | prim:mount_status ×25；elem:holy ×19；prim:damage ×11；prim:dispel ×10；prim:modify_resource ×4 |
| corpse_collector | prim:mount_status ×28；elem:mental ×10；prim:damage ×9；prim:spawn ×9；prim:dispel ×5 |
| criminal | prim:mount_status ×35；prim:damage ×19；prim:modify_stat ×7；elem:mental ×7；prim:modify_resource ×6 |
| hunter | prim:mount_status ×31；prim:damage ×13；elem:none ×8；elem:fire ×6；prim:modify_stat ×5 |
| lawyer | prim:mount_status ×33；prim:damage ×14；prim:modify_resource ×10；elem:physical ×8；elem:mental ×7 |
| monster | prim:mount_status ×28；prim:modify_resource ×8；prim:damage ×5；elem:mental ×4；elem:physical ×3 |
| planter | prim:mount_status ×26；prim:spawn ×8；prim:damage ×7；prim:heal ×7；elem:none ×7 |
| prisoner | prim:mount_status ×23；prim:damage ×12；prim:modify_stat ×9；stat:attack ×6；elem:physical ×5 |
| pryer | prim:mount_status ×26；prim:damage ×18；elem:none ×9；prim:modify_resource ×8；elem:physical ×7 |
| reader | prim:mount_status ×22；prim:damage ×12；elem:mental ×12；prim:modify_resource ×7；prim:modify_stat ×7 |
| sailor | prim:mount_status ×29；prim:damage ×24；elem:physical ×16；elem:lightning ×9；prim:move ×6 |
| savant | prim:mount_status ×15；prim:modify_resource ×12；prim:modify_stat ×11；prim:damage ×7；prim:spawn ×5 |
| seer | prim:mount_status ×19；prim:modify_resource ×10；prim:damage ×5；prim:modify_stat ×4；prim:heal ×4 |
| sleepless | prim:mount_status ×28；prim:damage ×12；elem:mental ×12；prim:modify_stat ×6；stat:attack ×5 |
| spectator | prim:mount_status ×25；elem:mental ×9；prim:modify_stat ×6；prim:damage ×6；prim:modify_resource ×4 |
| supplicant | prim:mount_status ×26；prim:damage ×7；elem:mental ×5；prim:spawn ×5；prim:modify_resource ×4 |
| thief | prim:mount_status ×24；elem:mental ×9；prim:damage ×8；prim:modify_stat ×8；prim:modify_resource ×6 |
| warrior | prim:mount_status ×24；prim:damage ×13；elem:none ×11；prim:modify_resource ×6；elem:physical ×5 |

## 四、签名键用量（≥2 卡 = 落地；空白键 = 差异化迭代立项依据）

| 途径 | 签名键用量 |
|---|---|
| apothecary | sref:moon_cycle ×3；unitType:BEAST ×8；sref:prepared_draught ×4 |
| apprentice | prim:translocate ×3；prim:echo_last_skill ×2；prim:restore_snapshot ×2 |
| arbiter | flag:seal_effect ×0（空白）；flag:cost_mod ×0（空白）；res:order ×6 |
| assassin | prim:translocate ×0（空白）；elem:ice ×2；elem:dark ×1（发芽） |
| chanter | prim:grant_immunity ×0（空白）；prim:write_rule_slot ×0（空白）；trig:on_phase_change ×0（空白） |
| corpse_collector | flag:filter.unitType ×0（空白）；trig:on_kill ×0（空白）；prim:drain ×0（空白） |
| criminal | res:lust ×5；elem:dark ×4；flag:companionBuff ×1（发芽） |
| hunter | prim:target_override ×0（空白）；flag:gender_is ×1（发芽）；sref:massing ×1（发芽） |
| lawyer | prim:gauge_shuffle ×1（发芽）；prim:status_shuffle ×1（发芽）；prim:modify_rule_slot ×1（发芽） |
| monster | prim:restore_snapshot ×1（发芽）；prim:advance_clock ×2；res:fate_value ×5 |
| planter | flag:statPerStack ×0（空白）；unitType:PLANT ×2；sref:blight ×3 |
| prisoner | sref:curse_link ×3；unitType:ITEM ×1（发芽）；sref:lineage_stack ×0（空白） |
| pryer | flag:valueFrom ×2；flag:cast_time_set ×0（空白）；sref:info_form ×1（发芽） |
| reader | prim:reveal ×0（空白）；sref:mimic ×5；prim:snapshot ×0（空白） |
| sailor | elem:ice ×0（空白）；elem:lightning ×7；sref:rage ×10 |
| savant | prim:modify_rule_slot ×1（发芽）；sref:law_edit ×3；unitType:CONSTRUCT ×1（发芽） |
| seer | sref:puppet_string ×4；prim:write_rule_slot ×0（空白）；prim:translocate ×4 |
| sleepless | trig:on_phase_change ×0（空白）；prim:advance_clock ×0（空白）；res:secrecy ×3 |
| spectator | stat:rank ×0（空白）；flag:template ×1（发芽）；sref:insight ×5 |
| supplicant | sref:grazed_soul ×4；stat:hp_max ×1（发芽）；sref:flesh_undying ×1（发芽） |
| thief | prim:take_control ×0（空白）；prim:modify_targetability ×0（空白）；prim:target_override ×0（空白） |
| warrior | elem:holy ×1（发芽）；flag:filter.unitType ×0（空白）；sref:guardianship ×2 |
