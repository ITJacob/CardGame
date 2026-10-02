# 途径风格距离（STYLE DISTANCE）

> 由 `docs/tools/build_style_analysis.py` 自动生成——**勿手改**；指纹口径与 score.py 第七维同源（原语分布 + 元素分布 + modify_stat 键分布，1−cos 距离）。差异化迭代后重跑本报告看距离拉开。生成时间：2026-10-02。

## 一、最近邻榜（距离越小越雷同，差异化迭代优先拆这些对）

| 途径 | 最近邻 | 距离 | 对他途径均距 |
|---|---|---:|---:|
| supplicant | assassin | 0.040 | 0.090 |
| lawyer | apprentice | 0.045 | 0.093 |
| prisoner | lawyer | 0.053 | 0.095 |
| assassin | supplicant | 0.040 | 0.101 |
| sleepless | spectator | 0.017 | 0.108 |
| corpse_collector | spectator | 0.039 | 0.113 |
| criminal | lawyer | 0.063 | 0.115 |
| thief | spectator | 0.046 | 0.116 |
| spectator | sleepless | 0.017 | 0.117 |
| hunter | assassin | 0.046 | 0.120 |
| monster | supplicant | 0.041 | 0.122 |
| reader | sleepless | 0.034 | 0.123 |
| pryer | warrior | 0.055 | 0.123 |
| apprentice | lawyer | 0.045 | 0.129 |
| apothecary | planter | 0.038 | 0.136 |
| arbiter | reader | 0.047 | 0.138 |
| seer | monster | 0.080 | 0.141 |
| warrior | pryer | 0.055 | 0.142 |
| planter | apothecary | 0.038 | 0.145 |
| sailor | apprentice | 0.090 | 0.189 |
| savant | seer | 0.131 | 0.208 |
| chanter | warrior | 0.217 | 0.283 |

## 二、22×22 距离矩阵

| | apothecary | apprentice | arbiter | assassin | chanter | corpse_collector | criminal | hunter | lawyer | monster | planter | prisoner | pryer | reader | sailor | savant | seer | sleepless | spectator | supplicant | thief | warrior |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **apothecary** | 0.00 | 0.14 | 0.21 | 0.08 | 0.30 | 0.09 | 0.12 | 0.11 | 0.13 | 0.12 | 0.04 | 0.08 | 0.18 | 0.19 | 0.21 | 0.16 | 0.13 | 0.13 | 0.13 | 0.05 | 0.12 | 0.14 |
| **apprentice** | 0.14 | 0.00 | 0.12 | 0.07 | 0.31 | 0.16 | 0.10 | 0.12 | 0.05 | 0.08 | 0.17 | 0.10 | 0.10 | 0.12 | 0.09 | 0.24 | 0.12 | 0.13 | 0.14 | 0.08 | 0.13 | 0.14 |
| **arbiter** | 0.21 | 0.12 | 0.00 | 0.15 | 0.31 | 0.11 | 0.13 | 0.18 | 0.08 | 0.16 | 0.22 | 0.06 | 0.08 | 0.05 | 0.15 | 0.19 | 0.16 | 0.07 | 0.08 | 0.12 | 0.08 | 0.17 |
| **assassin** | 0.08 | 0.07 | 0.15 | 0.00 | 0.24 | 0.08 | 0.08 | 0.05 | 0.05 | 0.04 | 0.07 | 0.08 | 0.10 | 0.13 | 0.16 | 0.22 | 0.10 | 0.09 | 0.10 | 0.04 | 0.10 | 0.08 |
| **chanter** | 0.30 | 0.31 | 0.31 | 0.24 | 0.00 | 0.27 | 0.27 | 0.26 | 0.27 | 0.27 | 0.27 | 0.27 | 0.27 | 0.30 | 0.33 | 0.39 | 0.29 | 0.26 | 0.29 | 0.26 | 0.30 | 0.22 |
| **corpse_collector** | 0.09 | 0.16 | 0.11 | 0.08 | 0.27 | 0.00 | 0.11 | 0.11 | 0.10 | 0.10 | 0.08 | 0.08 | 0.12 | 0.08 | 0.23 | 0.21 | 0.13 | 0.04 | 0.04 | 0.04 | 0.07 | 0.14 |
| **criminal** | 0.12 | 0.10 | 0.13 | 0.08 | 0.27 | 0.11 | 0.00 | 0.07 | 0.06 | 0.10 | 0.15 | 0.07 | 0.10 | 0.08 | 0.15 | 0.20 | 0.14 | 0.07 | 0.09 | 0.07 | 0.10 | 0.14 |
| **hunter** | 0.11 | 0.12 | 0.18 | 0.05 | 0.26 | 0.11 | 0.07 | 0.00 | 0.07 | 0.10 | 0.09 | 0.09 | 0.09 | 0.15 | 0.17 | 0.22 | 0.14 | 0.11 | 0.14 | 0.08 | 0.12 | 0.06 |
| **lawyer** | 0.13 | 0.05 | 0.08 | 0.05 | 0.27 | 0.10 | 0.06 | 0.07 | 0.00 | 0.05 | 0.14 | 0.05 | 0.06 | 0.07 | 0.11 | 0.18 | 0.10 | 0.07 | 0.08 | 0.05 | 0.08 | 0.09 |
| **monster** | 0.12 | 0.08 | 0.16 | 0.04 | 0.27 | 0.10 | 0.10 | 0.10 | 0.05 | 0.00 | 0.14 | 0.12 | 0.15 | 0.12 | 0.21 | 0.23 | 0.08 | 0.09 | 0.08 | 0.04 | 0.11 | 0.16 |
| **planter** | 0.04 | 0.17 | 0.22 | 0.07 | 0.27 | 0.08 | 0.15 | 0.09 | 0.14 | 0.14 | 0.00 | 0.11 | 0.14 | 0.21 | 0.23 | 0.21 | 0.14 | 0.15 | 0.15 | 0.08 | 0.15 | 0.10 |
| **prisoner** | 0.08 | 0.10 | 0.06 | 0.08 | 0.27 | 0.08 | 0.07 | 0.09 | 0.05 | 0.12 | 0.11 | 0.00 | 0.08 | 0.07 | 0.12 | 0.14 | 0.12 | 0.05 | 0.07 | 0.05 | 0.06 | 0.11 |
| **pryer** | 0.18 | 0.10 | 0.08 | 0.10 | 0.27 | 0.12 | 0.10 | 0.09 | 0.06 | 0.15 | 0.14 | 0.08 | 0.00 | 0.10 | 0.09 | 0.21 | 0.16 | 0.11 | 0.14 | 0.12 | 0.13 | 0.06 |
| **reader** | 0.19 | 0.12 | 0.05 | 0.13 | 0.30 | 0.08 | 0.08 | 0.15 | 0.07 | 0.12 | 0.21 | 0.07 | 0.10 | 0.00 | 0.20 | 0.18 | 0.14 | 0.03 | 0.04 | 0.09 | 0.06 | 0.18 |
| **sailor** | 0.21 | 0.09 | 0.15 | 0.16 | 0.33 | 0.23 | 0.15 | 0.17 | 0.11 | 0.21 | 0.23 | 0.12 | 0.09 | 0.20 | 0.00 | 0.29 | 0.23 | 0.20 | 0.25 | 0.18 | 0.21 | 0.15 |
| **savant** | 0.16 | 0.24 | 0.19 | 0.22 | 0.39 | 0.21 | 0.20 | 0.22 | 0.18 | 0.23 | 0.21 | 0.14 | 0.21 | 0.18 | 0.29 | 0.00 | 0.13 | 0.22 | 0.21 | 0.18 | 0.15 | 0.21 |
| **seer** | 0.13 | 0.12 | 0.16 | 0.10 | 0.29 | 0.13 | 0.14 | 0.14 | 0.10 | 0.08 | 0.14 | 0.12 | 0.16 | 0.14 | 0.23 | 0.13 | 0.00 | 0.15 | 0.13 | 0.08 | 0.13 | 0.17 |
| **sleepless** | 0.13 | 0.13 | 0.07 | 0.09 | 0.26 | 0.04 | 0.07 | 0.11 | 0.07 | 0.09 | 0.15 | 0.05 | 0.11 | 0.03 | 0.20 | 0.22 | 0.15 | 0.00 | 0.02 | 0.04 | 0.05 | 0.17 |
| **spectator** | 0.13 | 0.14 | 0.08 | 0.10 | 0.29 | 0.04 | 0.09 | 0.14 | 0.08 | 0.08 | 0.15 | 0.07 | 0.14 | 0.04 | 0.25 | 0.21 | 0.13 | 0.02 | 0.00 | 0.04 | 0.05 | 0.20 |
| **supplicant** | 0.05 | 0.08 | 0.12 | 0.04 | 0.26 | 0.04 | 0.07 | 0.08 | 0.05 | 0.04 | 0.08 | 0.05 | 0.12 | 0.09 | 0.18 | 0.18 | 0.08 | 0.04 | 0.04 | 0.00 | 0.06 | 0.14 |
| **thief** | 0.12 | 0.13 | 0.08 | 0.10 | 0.30 | 0.07 | 0.10 | 0.12 | 0.08 | 0.11 | 0.15 | 0.06 | 0.13 | 0.06 | 0.21 | 0.15 | 0.13 | 0.05 | 0.05 | 0.06 | 0.00 | 0.16 |
| **warrior** | 0.14 | 0.14 | 0.17 | 0.08 | 0.22 | 0.14 | 0.14 | 0.06 | 0.09 | 0.16 | 0.10 | 0.11 | 0.06 | 0.18 | 0.15 | 0.21 | 0.17 | 0.17 | 0.20 | 0.14 | 0.16 | 0.00 |

## 三、途径指纹（各途径 Top-5 指纹键）

| 途径 | Top-5 指纹键 |
|---|---|
| apothecary | prim:mount_status ×27；prim:modify_stat ×9；prim:spawn ×8；prim:damage ×6；prim:heal ×4 |
| apprentice | prim:mount_status ×25；prim:damage ×10；elem:physical ×10；prim:modify_resource ×6；prim:move ×5 |
| arbiter | prim:mount_status ×26；prim:damage ×16；elem:mental ×16；elem:physical ×9；prim:modify_resource ×9 |
| assassin | prim:mount_status ×33；prim:damage ×9；prim:modify_resource ×5；elem:none ×5；elem:physical ×4 |
| chanter | prim:mount_status ×25；elem:holy ×21；prim:damage ×12；prim:dispel ×10；prim:modify_resource ×4 |
| corpse_collector | prim:mount_status ×28；elem:mental ×10；prim:damage ×9；prim:spawn ×9；prim:dispel ×5 |
| criminal | prim:mount_status ×35；prim:damage ×19；prim:modify_stat ×7；elem:mental ×7；prim:modify_resource ×6 |
| hunter | prim:mount_status ×31；prim:damage ×13；elem:none ×8；elem:fire ×6；prim:modify_stat ×5 |
| lawyer | prim:mount_status ×33；prim:damage ×15；prim:modify_resource ×10；elem:physical ×8；elem:mental ×7 |
| monster | prim:mount_status ×28；prim:modify_resource ×8；prim:damage ×5；elem:mental ×4；elem:physical ×3 |
| planter | prim:mount_status ×26；prim:spawn ×8；prim:damage ×7；prim:heal ×7；elem:none ×7 |
| prisoner | prim:mount_status ×23；prim:damage ×12；prim:modify_stat ×9；stat:attack ×6；elem:physical ×5 |
| pryer | prim:mount_status ×26；prim:damage ×18；elem:none ×9；prim:modify_resource ×8；elem:physical ×7 |
| reader | prim:mount_status ×22；prim:damage ×12；elem:mental ×12；prim:modify_resource ×7；prim:modify_stat ×7 |
| sailor | prim:mount_status ×29；prim:damage ×24；elem:physical ×16；elem:lightning ×12；prim:move ×6 |
| savant | prim:mount_status ×15；prim:modify_resource ×12；prim:modify_stat ×11；prim:damage ×7；prim:spawn ×5 |
| seer | prim:mount_status ×19；prim:modify_resource ×10；prim:damage ×5；prim:modify_stat ×4；prim:heal ×4 |
| sleepless | prim:mount_status ×28；prim:damage ×12；elem:mental ×12；prim:modify_stat ×6；stat:attack ×5 |
| spectator | prim:mount_status ×25；elem:mental ×12；prim:damage ×7；prim:modify_stat ×6；prim:modify_resource ×4 |
| supplicant | prim:mount_status ×26；prim:damage ×7；elem:mental ×5；prim:spawn ×5；prim:modify_resource ×4 |
| thief | prim:mount_status ×24；elem:mental ×9；prim:damage ×8；prim:modify_stat ×8；prim:modify_resource ×6 |
| warrior | prim:mount_status ×24；prim:damage ×13；elem:none ×12；prim:modify_resource ×6；elem:physical ×5 |

## 四、签名键用量（≥2 卡 = 落地；空白键 = 差异化迭代立项依据）

| 途径 | 签名键用量 |
|---|---|
| apothecary | sref:moon_cycle ×3；unitType:BEAST ×8；sref:prepared_draught ×4 |
| apprentice | prim:translocate ×3；prim:echo_last_skill ×2；prim:restore_snapshot ×2 |
| arbiter | flag:seal_effect ×2；flag:cost_mod ×2；res:order ×6 |
| assassin | prim:translocate ×2；elem:ice ×3；elem:dark ×1（发芽） |
| chanter | prim:grant_immunity ×2；prim:write_rule_slot ×2；trig:on_phase_change ×2 |
| corpse_collector | flag:filter.unitType ×1（发芽）；trig:on_kill ×0（空白）；prim:drain ×0（空白） |
| criminal | res:lust ×5；elem:dark ×4；flag:companionBuff ×1（发芽） |
| hunter | prim:target_override ×2；flag:gender_is ×1（发芽）；sref:massing ×1（发芽） |
| lawyer | prim:gauge_shuffle ×2；prim:status_shuffle ×2；prim:modify_rule_slot ×2 |
| monster | prim:restore_snapshot ×1（发芽）；prim:advance_clock ×2；res:fate_value ×5 |
| planter | flag:statPerStack ×0（空白）；unitType:PLANT ×2；sref:blight ×3 |
| prisoner | sref:curse_link ×3；unitType:ITEM ×1（发芽）；sref:lineage_stack ×0（空白） |
| pryer | flag:valueFrom ×2；flag:cast_time_set ×0（空白）；sref:info_form ×1（发芽） |
| reader | prim:reveal ×2；sref:mimic ×5；prim:snapshot ×2 |
| sailor | elem:ice ×2；elem:lightning ×8；sref:rage ×10 |
| savant | prim:modify_rule_slot ×1（发芽）；sref:law_edit ×3；unitType:CONSTRUCT ×1（发芽） |
| seer | sref:puppet_string ×4；prim:write_rule_slot ×2；prim:translocate ×4 |
| sleepless | trig:on_phase_change ×2；prim:advance_clock ×2；res:secrecy ×3 |
| spectator | stat:rank ×3；flag:template ×1（发芽）；sref:insight ×5 |
| supplicant | sref:grazed_soul ×4；stat:hp_max ×1（发芽）；sref:flesh_undying ×1（发芽） |
| thief | prim:take_control ×2；prim:modify_targetability ×2；prim:target_override ×2 |
| warrior | elem:holy ×4；flag:filter.unitType ×2；sref:guardianship ×2 |
