# 途径风格距离（STYLE DISTANCE）

> 由 `docs/tools/build_style_analysis.py` 自动生成——**勿手改**；指纹口径与 score.py 差异化②同源（**全链路指纹**，SCORING 2.3：prim 原语 / elem 元素 / cond 谓词 / condarg 谓词参数 / param 效果参数 / reach 射程 / tgt 选靶（坐标+filter+效果级目标）/ hook 触发点 / sshape 状态形态 / cost 消耗形态 / temporal 时序形态，十一族各自 L2 归一后等权取余弦距离均值）。差异化迭代后重跑本报告看距离拉开。生成时间：2026-10-18。

## 一、最近邻榜（距离越小越雷同，差异化迭代优先拆这些对）

| 途径 | 最近邻 | 距离 | 对他途径均距 |
|---|---|---:|---:|
| prisoner | apothecary | 0.139 | 0.204 |
| lawyer | thief | 0.140 | 0.207 |
| savant | planter | 0.133 | 0.210 |
| reader | thief | 0.146 | 0.213 |
| apprentice | assassin | 0.134 | 0.213 |
| thief | lawyer | 0.140 | 0.217 |
| seer | savant | 0.149 | 0.223 |
| supplicant | prisoner | 0.143 | 0.224 |
| assassin | apprentice | 0.134 | 0.231 |
| arbiter | seer | 0.164 | 0.244 |
| corpse_collector | reader | 0.156 | 0.246 |
| apothecary | prisoner | 0.139 | 0.249 |
| criminal | lawyer | 0.186 | 0.251 |
| sailor | apprentice | 0.184 | 0.259 |
| planter | savant | 0.133 | 0.260 |
| monster | reader | 0.191 | 0.262 |
| spectator | reader | 0.204 | 0.272 |
| hunter | criminal | 0.206 | 0.273 |
| chanter | reader | 0.235 | 0.279 |
| pryer | reader | 0.235 | 0.290 |
| warrior | chanter | 0.265 | 0.323 |
| sleepless | spectator | 0.270 | 0.327 |

## 二、22×22 距离矩阵

| | apothecary | apprentice | arbiter | assassin | chanter | corpse_collector | criminal | hunter | lawyer | monster | planter | prisoner | pryer | reader | sailor | savant | seer | sleepless | spectator | supplicant | thief | warrior |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **apothecary** | 0.00 | 0.21 | 0.28 | 0.23 | 0.27 | 0.25 | 0.29 | 0.27 | 0.24 | 0.29 | 0.15 | 0.14 | 0.30 | 0.27 | 0.23 | 0.18 | 0.22 | 0.37 | 0.33 | 0.23 | 0.22 | 0.28 |
| **apprentice** | 0.21 | 0.00 | 0.21 | 0.13 | 0.28 | 0.23 | 0.21 | 0.26 | 0.16 | 0.20 | 0.26 | 0.14 | 0.27 | 0.19 | 0.18 | 0.18 | 0.16 | 0.32 | 0.25 | 0.16 | 0.18 | 0.29 |
| **arbiter** | 0.28 | 0.21 | 0.00 | 0.25 | 0.27 | 0.24 | 0.25 | 0.27 | 0.18 | 0.27 | 0.28 | 0.20 | 0.29 | 0.17 | 0.25 | 0.21 | 0.16 | 0.33 | 0.25 | 0.24 | 0.20 | 0.33 |
| **assassin** | 0.23 | 0.13 | 0.25 | 0.00 | 0.29 | 0.23 | 0.23 | 0.27 | 0.17 | 0.24 | 0.24 | 0.18 | 0.27 | 0.22 | 0.23 | 0.20 | 0.21 | 0.31 | 0.24 | 0.19 | 0.18 | 0.31 |
| **chanter** | 0.27 | 0.28 | 0.27 | 0.29 | 0.00 | 0.28 | 0.28 | 0.26 | 0.26 | 0.32 | 0.27 | 0.26 | 0.32 | 0.23 | 0.29 | 0.26 | 0.28 | 0.33 | 0.31 | 0.28 | 0.26 | 0.26 |
| **corpse_collector** | 0.25 | 0.23 | 0.24 | 0.23 | 0.28 | 0.00 | 0.27 | 0.32 | 0.21 | 0.24 | 0.24 | 0.22 | 0.31 | 0.16 | 0.30 | 0.18 | 0.24 | 0.28 | 0.24 | 0.22 | 0.19 | 0.32 |
| **criminal** | 0.29 | 0.21 | 0.25 | 0.23 | 0.28 | 0.27 | 0.00 | 0.21 | 0.19 | 0.28 | 0.29 | 0.19 | 0.31 | 0.21 | 0.24 | 0.23 | 0.25 | 0.33 | 0.27 | 0.19 | 0.20 | 0.35 |
| **hunter** | 0.27 | 0.26 | 0.27 | 0.27 | 0.26 | 0.32 | 0.21 | 0.00 | 0.21 | 0.32 | 0.23 | 0.26 | 0.29 | 0.24 | 0.24 | 0.22 | 0.21 | 0.39 | 0.34 | 0.28 | 0.27 | 0.36 |
| **lawyer** | 0.24 | 0.16 | 0.18 | 0.17 | 0.26 | 0.21 | 0.19 | 0.21 | 0.00 | 0.23 | 0.26 | 0.17 | 0.25 | 0.16 | 0.21 | 0.17 | 0.16 | 0.30 | 0.22 | 0.19 | 0.14 | 0.29 |
| **monster** | 0.29 | 0.20 | 0.27 | 0.24 | 0.32 | 0.24 | 0.28 | 0.32 | 0.23 | 0.00 | 0.31 | 0.21 | 0.32 | 0.19 | 0.30 | 0.21 | 0.20 | 0.31 | 0.24 | 0.22 | 0.22 | 0.38 |
| **planter** | 0.15 | 0.26 | 0.28 | 0.24 | 0.27 | 0.24 | 0.29 | 0.23 | 0.26 | 0.31 | 0.00 | 0.22 | 0.27 | 0.27 | 0.26 | 0.13 | 0.25 | 0.37 | 0.32 | 0.25 | 0.28 | 0.31 |
| **prisoner** | 0.14 | 0.14 | 0.20 | 0.18 | 0.26 | 0.22 | 0.19 | 0.26 | 0.17 | 0.21 | 0.22 | 0.00 | 0.27 | 0.17 | 0.20 | 0.16 | 0.17 | 0.30 | 0.22 | 0.14 | 0.14 | 0.31 |
| **pryer** | 0.30 | 0.27 | 0.29 | 0.27 | 0.32 | 0.31 | 0.31 | 0.29 | 0.25 | 0.32 | 0.27 | 0.27 | 0.00 | 0.23 | 0.28 | 0.26 | 0.28 | 0.38 | 0.33 | 0.29 | 0.26 | 0.31 |
| **reader** | 0.27 | 0.19 | 0.17 | 0.22 | 0.23 | 0.16 | 0.21 | 0.24 | 0.16 | 0.19 | 0.27 | 0.17 | 0.23 | 0.00 | 0.25 | 0.18 | 0.19 | 0.28 | 0.20 | 0.19 | 0.15 | 0.31 |
| **sailor** | 0.23 | 0.18 | 0.25 | 0.23 | 0.29 | 0.30 | 0.24 | 0.24 | 0.21 | 0.30 | 0.26 | 0.20 | 0.28 | 0.25 | 0.00 | 0.24 | 0.25 | 0.37 | 0.33 | 0.24 | 0.25 | 0.32 |
| **savant** | 0.18 | 0.18 | 0.21 | 0.20 | 0.26 | 0.18 | 0.23 | 0.22 | 0.17 | 0.21 | 0.13 | 0.16 | 0.26 | 0.18 | 0.24 | 0.00 | 0.15 | 0.32 | 0.24 | 0.18 | 0.19 | 0.30 |
| **seer** | 0.22 | 0.16 | 0.16 | 0.21 | 0.28 | 0.24 | 0.25 | 0.21 | 0.16 | 0.20 | 0.25 | 0.17 | 0.28 | 0.19 | 0.25 | 0.15 | 0.00 | 0.34 | 0.25 | 0.18 | 0.19 | 0.33 |
| **sleepless** | 0.37 | 0.32 | 0.33 | 0.31 | 0.33 | 0.28 | 0.33 | 0.39 | 0.30 | 0.31 | 0.37 | 0.30 | 0.38 | 0.28 | 0.37 | 0.32 | 0.34 | 0.00 | 0.27 | 0.29 | 0.28 | 0.39 |
| **spectator** | 0.33 | 0.25 | 0.25 | 0.24 | 0.31 | 0.24 | 0.27 | 0.34 | 0.22 | 0.24 | 0.32 | 0.22 | 0.33 | 0.20 | 0.33 | 0.24 | 0.25 | 0.27 | 0.00 | 0.25 | 0.22 | 0.40 |
| **supplicant** | 0.23 | 0.16 | 0.24 | 0.19 | 0.28 | 0.22 | 0.19 | 0.28 | 0.19 | 0.22 | 0.25 | 0.14 | 0.29 | 0.19 | 0.24 | 0.18 | 0.18 | 0.29 | 0.25 | 0.00 | 0.18 | 0.30 |
| **thief** | 0.22 | 0.18 | 0.20 | 0.18 | 0.26 | 0.19 | 0.20 | 0.27 | 0.14 | 0.22 | 0.28 | 0.14 | 0.26 | 0.15 | 0.25 | 0.19 | 0.19 | 0.28 | 0.22 | 0.18 | 0.00 | 0.34 |
| **warrior** | 0.28 | 0.29 | 0.33 | 0.31 | 0.26 | 0.32 | 0.35 | 0.36 | 0.29 | 0.38 | 0.31 | 0.31 | 0.31 | 0.31 | 0.32 | 0.30 | 0.33 | 0.39 | 0.40 | 0.30 | 0.34 | 0.00 |

## 三、途径指纹（各途径 Top-5 指纹键）

| 途径 | Top-5 指纹键 |
|---|---|
| apothecary | tgt:eff:self ×32；prim:mount_status ×27；cost:cooldown:long ×25；sshape:cat:buff ×25；cost:energy:high ×22 |
| apprentice | tgt:eff:self ×29；cost:cooldown:long ×25；prim:mount_status ×25；cost:energy:high ×22；tgt:mode=unit ×22 |
| arbiter | cost:cooldown:long ×31；cost:energy:high ×27；param:actionPolicy=full ×27；param:onExpire=revert ×27；prim:take_control ×27 |
| assassin | tgt:eff:self ×39；prim:mount_status ×33；cost:cooldown:long ×29；cost:energy:high ×27；sshape:dur:tick ×27 |
| chanter | tgt:mode=unit ×28；cost:cooldown:long ×27；prim:mount_status ×25；sshape:cat:buff ×23；prim:set_luminance ×20 |
| corpse_collector | prim:mount_status ×28；cost:cooldown:long ×23；sshape:cat:buff ×23；tgt:mode=unit ×23；tgt:eff:self ×22 |
| criminal | param:mode=delta ×37；prim:modify_resource ×37；prim:move ×37；param:resource=lust ×36；prim:mount_status ×35 |
| hunter | prim:mount_status ×31；cost:cooldown:long ×29；cost:energy:high ×24；sshape:dur:tick ×24；param:mode=delta ×22 |
| lawyer | prim:mount_status ×33；cost:cooldown:long ×31；cost:energy:high ×30；tgt:faction=enemy ×27；sshape:dur:tick ×26 |
| monster | prim:restore_snapshot ×30；prim:mount_status ×28；tgt:eff:self ×27；sshape:cat:buff ×22；cost:cooldown:long ×19 |
| planter | prim:spawn ×30；prim:mount_status ×26；cost:cooldown:long ×24；param:consumption=summon ×22；reach:reach=none ×22 |
| prisoner | cost:cooldown:long ×25；prim:mount_status ×24；tgt:eff:self ×23；cost:energy:high ×22；tgt:mode=unit ×22 |
| pryer | cost:cooldown:long ×28；prim:modify_skill ×28；tgt:mode=unit ×27；prim:mount_status ×26；cost:energy:high ×20 |
| reader | cost:cooldown:long ×22；prim:mount_status ×22；tgt:mode=unit ×20；cost:energy:high ×19；sshape:dur:tick ×18 |
| sailor | prim:move ×39；prim:mount_status ×29；cost:cooldown:long ×27；cost:energy:high ×26；param:op=push_back ×26 |
| savant | cost:cooldown:long ×24；tgt:mode=unit ×21；cost:energy:high ×20；param:mode=delta ×20；prim:spawn ×20 |
| seer | cost:cooldown:long ×27；tgt:mode=unit ×27；cost:energy:high ×23；tgt:eff:self ×23；param:mode=delta ×21 |
| sleepless | prim:mount_status ×31；cost:cooldown:long ×21；cost:energy:high ×18；sshape:dur:persistent ×18；sshape:dur:tick ×18 |
| spectator | cost:cooldown:long ×27；prim:mount_status ×24；tgt:mode=unit ×23；tgt:eff:self ×20；cost:energy:high ×19 |
| supplicant | tgt:eff:self ×31；param:mode=delta ×30；prim:modify_resource ×28；cost:hp_cost ×27；prim:mount_status ×26 |
| thief | cost:cooldown:long ×25；tgt:eff:self ×25；tgt:mode=unit ×25；prim:mount_status ×24；cost:energy:high ×23 |
| warrior | prim:mount_status ×29；tgt:eff:self ×29；sshape:cat:buff ×27；cost:cooldown:long ×22；sshape:dur:persistent ×22 |

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
| hunter | prim:target_override ×7；flag:gender_is ×1（发芽）；sref:massing ×1（发芽） |
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
| thief | prim:take_control ×5；prim:modify_targetability ×2；prim:target_override ×7 |
| warrior | elem:holy ×10；flag:filter.unitType ×3；sref:guardianship ×6 |
