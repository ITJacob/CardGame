# 途径风格距离（STYLE DISTANCE）

> 由 `docs/tools/build_style_analysis.py` 自动生成——**勿手改**；指纹口径与 score.py 差异化②同源（**全链路指纹**，SCORING 2.3：prim 原语 / elem 元素 / cond 谓词 / condarg 谓词参数 / param 效果参数 / reach 射程 / tgt 选靶（坐标+filter+效果级目标）/ hook 触发点 / sshape 状态形态 / cost 消耗形态 / temporal 时序形态，十一族各自 L2 归一后等权取余弦距离均值）。差异化迭代后重跑本报告看距离拉开。生成时间：2026-10-23。

## 一、最近邻榜（距离越小越雷同，差异化迭代优先拆这些对）

| 途径 | 最近邻 | 距离 | 对他途径均距 |
|---|---|---:|---:|
| lawyer | arbiter | 0.135 | 0.288 |
| arbiter | lawyer | 0.135 | 0.290 |
| apprentice | assassin | 0.111 | 0.292 |
| thief | apprentice | 0.182 | 0.299 |
| assassin | apprentice | 0.111 | 0.300 |
| prisoner | thief | 0.190 | 0.303 |
| corpse_collector | prisoner | 0.237 | 0.306 |
| supplicant | seer | 0.229 | 0.312 |
| hunter | reader | 0.245 | 0.313 |
| savant | planter | 0.273 | 0.320 |
| seer | supplicant | 0.229 | 0.321 |
| chanter | arbiter | 0.178 | 0.326 |
| apothecary | planter | 0.149 | 0.330 |
| monster | lawyer | 0.216 | 0.333 |
| planter | apothecary | 0.149 | 0.335 |
| pryer | warrior | 0.229 | 0.343 |
| spectator | assassin | 0.199 | 0.349 |
| sailor | apothecary | 0.190 | 0.350 |
| criminal | assassin | 0.304 | 0.354 |
| warrior | pryer | 0.229 | 0.367 |
| sleepless | corpse_collector | 0.277 | 0.375 |
| reader | hunter | 0.245 | 0.389 |

## 二、22×22 距离矩阵

| | apothecary | apprentice | arbiter | assassin | chanter | corpse_collector | criminal | hunter | lawyer | monster | planter | prisoner | pryer | reader | sailor | savant | seer | sleepless | spectator | supplicant | thief | warrior |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **apothecary** | 0.00 | 0.31 | 0.36 | 0.31 | 0.34 | 0.30 | 0.38 | 0.30 | 0.33 | 0.38 | 0.15 | 0.28 | 0.37 | 0.47 | 0.19 | 0.29 | 0.34 | 0.42 | 0.42 | 0.31 | 0.32 | 0.35 |
| **apprentice** | 0.31 | 0.00 | 0.30 | 0.11 | 0.35 | 0.29 | 0.33 | 0.30 | 0.27 | 0.32 | 0.33 | 0.28 | 0.34 | 0.38 | 0.30 | 0.29 | 0.25 | 0.38 | 0.21 | 0.27 | 0.18 | 0.36 |
| **arbiter** | 0.36 | 0.30 | 0.00 | 0.32 | 0.18 | 0.29 | 0.32 | 0.28 | 0.14 | 0.22 | 0.34 | 0.27 | 0.23 | 0.34 | 0.35 | 0.30 | 0.30 | 0.35 | 0.33 | 0.31 | 0.29 | 0.27 |
| **assassin** | 0.31 | 0.11 | 0.32 | 0.00 | 0.34 | 0.28 | 0.30 | 0.31 | 0.30 | 0.35 | 0.32 | 0.29 | 0.35 | 0.40 | 0.34 | 0.31 | 0.28 | 0.37 | 0.20 | 0.27 | 0.19 | 0.37 |
| **chanter** | 0.34 | 0.35 | 0.18 | 0.34 | 0.00 | 0.32 | 0.36 | 0.29 | 0.22 | 0.28 | 0.35 | 0.34 | 0.28 | 0.41 | 0.37 | 0.35 | 0.37 | 0.39 | 0.39 | 0.35 | 0.34 | 0.24 |
| **corpse_collector** | 0.30 | 0.29 | 0.29 | 0.28 | 0.32 | 0.00 | 0.34 | 0.27 | 0.29 | 0.34 | 0.27 | 0.24 | 0.33 | 0.36 | 0.36 | 0.29 | 0.33 | 0.28 | 0.34 | 0.30 | 0.27 | 0.36 |
| **criminal** | 0.38 | 0.33 | 0.32 | 0.30 | 0.36 | 0.34 | 0.00 | 0.32 | 0.31 | 0.39 | 0.38 | 0.31 | 0.41 | 0.40 | 0.35 | 0.34 | 0.37 | 0.40 | 0.38 | 0.31 | 0.32 | 0.42 |
| **hunter** | 0.30 | 0.30 | 0.28 | 0.31 | 0.29 | 0.27 | 0.32 | 0.00 | 0.31 | 0.37 | 0.26 | 0.31 | 0.34 | 0.25 | 0.33 | 0.29 | 0.27 | 0.40 | 0.38 | 0.33 | 0.31 | 0.36 |
| **lawyer** | 0.33 | 0.27 | 0.14 | 0.30 | 0.22 | 0.29 | 0.31 | 0.31 | 0.00 | 0.22 | 0.36 | 0.29 | 0.23 | 0.37 | 0.32 | 0.29 | 0.29 | 0.37 | 0.34 | 0.30 | 0.26 | 0.26 |
| **monster** | 0.38 | 0.32 | 0.22 | 0.35 | 0.28 | 0.34 | 0.39 | 0.37 | 0.22 | 0.00 | 0.40 | 0.31 | 0.29 | 0.38 | 0.39 | 0.32 | 0.31 | 0.38 | 0.35 | 0.32 | 0.33 | 0.36 |
| **planter** | 0.15 | 0.33 | 0.34 | 0.32 | 0.35 | 0.27 | 0.38 | 0.26 | 0.36 | 0.40 | 0.00 | 0.31 | 0.36 | 0.45 | 0.26 | 0.27 | 0.35 | 0.41 | 0.41 | 0.32 | 0.36 | 0.35 |
| **prisoner** | 0.28 | 0.28 | 0.27 | 0.29 | 0.34 | 0.24 | 0.31 | 0.31 | 0.29 | 0.31 | 0.31 | 0.00 | 0.36 | 0.37 | 0.33 | 0.28 | 0.29 | 0.35 | 0.33 | 0.26 | 0.19 | 0.40 |
| **pryer** | 0.37 | 0.34 | 0.23 | 0.35 | 0.28 | 0.33 | 0.41 | 0.34 | 0.23 | 0.29 | 0.36 | 0.36 | 0.00 | 0.44 | 0.37 | 0.36 | 0.38 | 0.41 | 0.41 | 0.37 | 0.35 | 0.23 |
| **reader** | 0.47 | 0.38 | 0.34 | 0.40 | 0.41 | 0.36 | 0.40 | 0.25 | 0.37 | 0.38 | 0.45 | 0.37 | 0.44 | 0.00 | 0.44 | 0.38 | 0.34 | 0.38 | 0.37 | 0.39 | 0.35 | 0.50 |
| **sailor** | 0.19 | 0.30 | 0.35 | 0.34 | 0.37 | 0.36 | 0.35 | 0.33 | 0.32 | 0.39 | 0.26 | 0.33 | 0.37 | 0.44 | 0.00 | 0.34 | 0.37 | 0.43 | 0.42 | 0.34 | 0.36 | 0.40 |
| **savant** | 0.29 | 0.29 | 0.30 | 0.31 | 0.35 | 0.29 | 0.34 | 0.29 | 0.29 | 0.32 | 0.27 | 0.28 | 0.36 | 0.38 | 0.34 | 0.00 | 0.27 | 0.40 | 0.37 | 0.29 | 0.31 | 0.39 |
| **seer** | 0.34 | 0.25 | 0.30 | 0.28 | 0.37 | 0.33 | 0.37 | 0.27 | 0.29 | 0.31 | 0.35 | 0.29 | 0.38 | 0.34 | 0.37 | 0.27 | 0.00 | 0.38 | 0.30 | 0.23 | 0.28 | 0.43 |
| **sleepless** | 0.42 | 0.38 | 0.35 | 0.37 | 0.39 | 0.28 | 0.40 | 0.40 | 0.37 | 0.38 | 0.41 | 0.35 | 0.41 | 0.38 | 0.43 | 0.40 | 0.38 | 0.00 | 0.35 | 0.29 | 0.34 | 0.40 |
| **spectator** | 0.42 | 0.21 | 0.33 | 0.20 | 0.39 | 0.34 | 0.38 | 0.38 | 0.34 | 0.35 | 0.41 | 0.33 | 0.41 | 0.37 | 0.42 | 0.37 | 0.30 | 0.35 | 0.00 | 0.34 | 0.23 | 0.48 |
| **supplicant** | 0.31 | 0.27 | 0.31 | 0.27 | 0.35 | 0.30 | 0.31 | 0.33 | 0.30 | 0.32 | 0.32 | 0.26 | 0.37 | 0.39 | 0.34 | 0.29 | 0.23 | 0.29 | 0.34 | 0.00 | 0.29 | 0.37 |
| **thief** | 0.32 | 0.18 | 0.29 | 0.19 | 0.34 | 0.27 | 0.32 | 0.31 | 0.26 | 0.33 | 0.36 | 0.19 | 0.35 | 0.35 | 0.36 | 0.31 | 0.28 | 0.34 | 0.23 | 0.29 | 0.00 | 0.41 |
| **warrior** | 0.35 | 0.36 | 0.27 | 0.37 | 0.24 | 0.36 | 0.42 | 0.36 | 0.26 | 0.36 | 0.35 | 0.40 | 0.23 | 0.50 | 0.40 | 0.39 | 0.43 | 0.40 | 0.48 | 0.37 | 0.41 | 0.00 |

## 三、途径指纹（各途径 Top-5 指纹键）

| 途径 | Top-5 指纹键 |
|---|---|
| apothecary | tgt:eff:self ×32；prim:mount_status ×27；cost:cooldown:long ×25；sshape:cat:buff ×25；cost:energy:high ×22 |
| apprentice | tgt:eff:self ×29；cost:cooldown:long ×25；prim:mount_status ×25；cost:energy:high ×22；tgt:mode=unit ×22 |
| arbiter | cost:cooldown:long ×31；param:mode=delta ×29；tgt:mode=unit ×28；cost:energy:high ×27；tgt:faction=enemy ×27 |
| assassin | tgt:eff:self ×42；prim:mount_status ×36；sshape:dur:tick ×34；cost:cooldown:long ×31；tgt:mode=unit ×30 |
| chanter | tgt:eff:self ×30；cost:cooldown:long ×29；sshape:cat:buff ×28；prim:mount_status ×27；tgt:mode=unit ×27 |
| corpse_collector | tgt:eff:self ×34；prim:mount_status ×29；cost:cooldown:long ×25；param:mode=delta ×24；sshape:dur:tick ×24 |
| criminal | prim:modify_resource ×38；param:mode=delta ×37；param:resource=lust ×37；prim:move ×37；prim:mount_status ×35 |
| hunter | prim:mount_status ×34；cost:cooldown:long ×30；tgt:eff:self ×29；sshape:dur:tick ×27；cost:energy:high ×24 |
| lawyer | prim:mount_status ×33；cost:cooldown:long ×31；cost:energy:high ×30；tgt:eff:self ×27；tgt:faction=enemy ×27 |
| monster | prim:restore_snapshot ×31；prim:mount_status ×28；tgt:eff:self ×28；sshape:cat:buff ×22；cost:cooldown:long ×19 |
| planter | prim:spawn ×30；prim:mount_status ×28；cost:cooldown:long ×26；tgt:eff:self ×26；param:consumption=summon ×22 |
| prisoner | param:mode=delta ×26；cost:cooldown:long ×25；tgt:eff:self ×25；prim:mount_status ×24；cost:energy:high ×22 |
| pryer | cost:cooldown:long ×28；prim:mount_status ×27；tgt:mode=unit ×27；tgt:eff:self ×24；param:mode=delta ×21 |
| reader | prim:mount_status ×24；sshape:dur:tick ×24；cost:cooldown:long ×23；sshape:cat:debuff ×23；tgt:eff:self ×21 |
| sailor | prim:move ×39；prim:mount_status ×29；cost:cooldown:long ×27；param:op=push_back ×27；cost:energy:high ×26 |
| savant | cost:cooldown:long ×24；param:mode=delta ×24；tgt:eff:self ×22；cost:energy:high ×20；prim:spawn ×20 |
| seer | cost:cooldown:long ×27；tgt:mode=unit ×27；cost:energy:high ×23；tgt:eff:self ×23；param:mode=delta ×21 |
| sleepless | prim:mount_status ×32；tgt:eff:self ×26；cost:cooldown:long ×21；sshape:dur:tick ×20；cost:energy:high ×18 |
| spectator | cost:cooldown:long ×27；prim:mount_status ×24；tgt:eff:self ×23；tgt:mode=unit ×22；cost:energy:high ×19 |
| supplicant | tgt:eff:self ×31；param:mode=delta ×30；prim:modify_resource ×28；cost:hp_cost ×27；prim:mount_status ×26 |
| thief | tgt:eff:self ×27；cost:cooldown:long ×25；tgt:mode=unit ×25；prim:mount_status ×24；cost:energy:high ×23 |
| warrior | tgt:eff:self ×30；prim:mount_status ×26；cost:cooldown:long ×25；param:mode=delta ×25；cond:has_status ×22 |

## 四、签名键用量（≥2 卡 = 落地；空白键 = 差异化迭代立项依据）

| 途径 | 签名键用量 |
|---|---|
| apothecary | sref:moon_cycle ×4；unitType:BEAST ×8；sref:prepared_draught ×5 |
| apprentice | prim:translocate ×14；prim:echo_last_skill ×11；prim:restore_snapshot ×2 |
| arbiter | flag:seal_effect ×2；flag:cost_mod ×2；res:order ×10 |
| assassin | prim:translocate ×11；elem:ice ×3；elem:dark ×6 |
| chanter | prim:grant_immunity ×16；prim:write_rule_slot ×2；trig:on_phase_change ×2 |
| corpse_collector | flag:filter.unitType ×3；trig:on_kill ×3；prim:drain ×9 |
| criminal | res:lust ×36；elem:dark ×4；flag:companionBuff ×2 |
| hunter | prim:target_override ×3；flag:gender_is ×2；sref:massing ×11 |
| lawyer | prim:gauge_shuffle ×7；prim:status_shuffle ×5；prim:modify_rule_slot ×18 |
| monster | prim:restore_snapshot ×30；prim:advance_clock ×2；res:fate_value ×5 |
| planter | flag:statPerStack ×3；unitType:PLANT ×8；sref:blight ×5 |
| prisoner | sref:curse_link ×3；unitType:ITEM ×2；sref:lineage_stack ×6 |
| pryer | flag:valueFrom ×2；flag:cast_time_set ×21；sref:info_form ×2 |
| reader | prim:reveal ×14；sref:mimic ×3；prim:snapshot ×8 |
| sailor | elem:ice ×2；elem:lightning ×8；sref:rage ×10 |
| savant | prim:modify_rule_slot ×13；sref:law_edit ×3；unitType:CONSTRUCT ×3 |
| seer | sref:puppet_string ×4；prim:write_rule_slot ×2；prim:translocate ×4 |
| sleepless | trig:on_phase_change ×4；prim:advance_clock ×4；res:secrecy ×3 |
| spectator | stat:rank ×3；flag:template ×1（发芽）；sref:insight ×5 |
| supplicant | sref:grazed_soul ×7；stat:hp_max ×5；sref:flesh_undying ×2 |
| thief | prim:take_control ×5；prim:modify_targetability ×2；prim:target_override ×7 |
| warrior | elem:holy ×7；flag:filter.unitType ×3；sref:guardianship ×3 |
