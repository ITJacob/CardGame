# 途径风格距离（STYLE DISTANCE）

> 由 `docs/tools/build_style_analysis.py` 自动生成——**勿手改**；指纹口径与 score.py 差异化②同源（**全链路指纹**，SCORING 2.3：prim 原语 / elem 元素 / cond 谓词 / condarg 谓词参数 / param 效果参数 / reach 射程 / tgt 选靶（坐标+filter+效果级目标）/ hook 触发点 / sshape 状态形态 / cost 消耗形态 / temporal 时序形态，十一族各自 L2 归一后等权取余弦距离均值）。差异化迭代后重跑本报告看距离拉开。生成时间：2026-10-24。

## 一、最近邻榜（距离越小越雷同，差异化迭代优先拆这些对）

| 途径 | 最近邻 | 距离 | 对他途径均距 |
|---|---|---:|---:|
| savant | prisoner | 0.143 | 0.227 |
| apprentice | assassin | 0.103 | 0.230 |
| prisoner | savant | 0.143 | 0.240 |
| corpse_collector | prisoner | 0.172 | 0.247 |
| assassin | apprentice | 0.103 | 0.248 |
| thief | apprentice | 0.151 | 0.249 |
| hunter | savant | 0.146 | 0.251 |
| apothecary | sailor | 0.135 | 0.254 |
| sailor | apothecary | 0.135 | 0.261 |
| spectator | apprentice | 0.136 | 0.263 |
| supplicant | savant | 0.194 | 0.264 |
| lawyer | monster | 0.126 | 0.268 |
| monster | lawyer | 0.126 | 0.272 |
| arbiter | lawyer | 0.131 | 0.286 |
| criminal | thief | 0.227 | 0.299 |
| seer | supplicant | 0.225 | 0.313 |
| pryer | hunter | 0.225 | 0.315 |
| planter | apothecary | 0.153 | 0.316 |
| chanter | arbiter | 0.174 | 0.318 |
| reader | hunter | 0.235 | 0.320 |
| sleepless | supplicant | 0.274 | 0.336 |
| warrior | chanter | 0.233 | 0.358 |

## 二、22×22 距离矩阵

| | apothecary | apprentice | arbiter | assassin | chanter | corpse_collector | criminal | hunter | lawyer | monster | planter | prisoner | pryer | reader | sailor | savant | seer | sleepless | spectator | supplicant | thief | warrior |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **apothecary** | 0.00 | 0.21 | 0.34 | 0.19 | 0.32 | 0.20 | 0.28 | 0.20 | 0.29 | 0.29 | 0.15 | 0.20 | 0.29 | 0.36 | 0.13 | 0.16 | 0.31 | 0.34 | 0.28 | 0.22 | 0.25 | 0.32 |
| **apprentice** | 0.21 | 0.00 | 0.28 | 0.10 | 0.33 | 0.20 | 0.26 | 0.22 | 0.24 | 0.24 | 0.28 | 0.17 | 0.27 | 0.26 | 0.18 | 0.16 | 0.24 | 0.31 | 0.14 | 0.21 | 0.15 | 0.36 |
| **arbiter** | 0.34 | 0.28 | 0.00 | 0.32 | 0.17 | 0.28 | 0.32 | 0.28 | 0.13 | 0.14 | 0.39 | 0.28 | 0.35 | 0.33 | 0.32 | 0.28 | 0.30 | 0.36 | 0.29 | 0.31 | 0.29 | 0.27 |
| **assassin** | 0.19 | 0.10 | 0.32 | 0.00 | 0.33 | 0.21 | 0.23 | 0.23 | 0.25 | 0.31 | 0.28 | 0.19 | 0.29 | 0.32 | 0.22 | 0.20 | 0.30 | 0.31 | 0.16 | 0.22 | 0.18 | 0.37 |
| **chanter** | 0.32 | 0.33 | 0.17 | 0.33 | 0.00 | 0.31 | 0.36 | 0.29 | 0.20 | 0.20 | 0.40 | 0.34 | 0.39 | 0.40 | 0.33 | 0.32 | 0.36 | 0.39 | 0.34 | 0.35 | 0.33 | 0.23 |
| **corpse_collector** | 0.20 | 0.20 | 0.28 | 0.21 | 0.31 | 0.00 | 0.27 | 0.19 | 0.27 | 0.27 | 0.24 | 0.17 | 0.28 | 0.27 | 0.23 | 0.19 | 0.33 | 0.29 | 0.23 | 0.24 | 0.19 | 0.35 |
| **criminal** | 0.28 | 0.26 | 0.32 | 0.23 | 0.36 | 0.27 | 0.00 | 0.25 | 0.29 | 0.33 | 0.34 | 0.24 | 0.36 | 0.32 | 0.27 | 0.25 | 0.37 | 0.35 | 0.29 | 0.26 | 0.23 | 0.42 |
| **hunter** | 0.20 | 0.22 | 0.28 | 0.23 | 0.29 | 0.19 | 0.25 | 0.00 | 0.29 | 0.30 | 0.24 | 0.22 | 0.22 | 0.24 | 0.20 | 0.15 | 0.30 | 0.34 | 0.26 | 0.27 | 0.24 | 0.35 |
| **lawyer** | 0.29 | 0.24 | 0.13 | 0.25 | 0.20 | 0.27 | 0.29 | 0.29 | 0.00 | 0.13 | 0.38 | 0.27 | 0.34 | 0.33 | 0.26 | 0.27 | 0.30 | 0.35 | 0.29 | 0.27 | 0.25 | 0.24 |
| **monster** | 0.29 | 0.24 | 0.14 | 0.31 | 0.20 | 0.27 | 0.33 | 0.30 | 0.13 | 0.00 | 0.37 | 0.26 | 0.34 | 0.33 | 0.30 | 0.25 | 0.26 | 0.34 | 0.28 | 0.26 | 0.26 | 0.27 |
| **planter** | 0.15 | 0.28 | 0.39 | 0.28 | 0.40 | 0.24 | 0.34 | 0.24 | 0.38 | 0.37 | 0.00 | 0.27 | 0.35 | 0.40 | 0.25 | 0.21 | 0.36 | 0.39 | 0.32 | 0.29 | 0.33 | 0.39 |
| **prisoner** | 0.20 | 0.17 | 0.28 | 0.19 | 0.34 | 0.17 | 0.24 | 0.22 | 0.27 | 0.26 | 0.27 | 0.00 | 0.29 | 0.28 | 0.21 | 0.14 | 0.29 | 0.29 | 0.20 | 0.20 | 0.16 | 0.39 |
| **pryer** | 0.29 | 0.27 | 0.35 | 0.29 | 0.39 | 0.28 | 0.36 | 0.22 | 0.34 | 0.34 | 0.35 | 0.29 | 0.00 | 0.32 | 0.28 | 0.24 | 0.35 | 0.38 | 0.31 | 0.33 | 0.29 | 0.34 |
| **reader** | 0.36 | 0.26 | 0.33 | 0.32 | 0.40 | 0.27 | 0.32 | 0.24 | 0.33 | 0.33 | 0.40 | 0.28 | 0.32 | 0.00 | 0.32 | 0.24 | 0.34 | 0.33 | 0.27 | 0.33 | 0.26 | 0.49 |
| **sailor** | 0.13 | 0.18 | 0.32 | 0.22 | 0.33 | 0.23 | 0.27 | 0.20 | 0.26 | 0.30 | 0.25 | 0.21 | 0.28 | 0.32 | 0.00 | 0.18 | 0.34 | 0.34 | 0.27 | 0.25 | 0.24 | 0.35 |
| **savant** | 0.16 | 0.16 | 0.28 | 0.20 | 0.32 | 0.19 | 0.25 | 0.15 | 0.27 | 0.25 | 0.21 | 0.14 | 0.24 | 0.24 | 0.18 | 0.00 | 0.24 | 0.32 | 0.21 | 0.19 | 0.19 | 0.36 |
| **seer** | 0.31 | 0.24 | 0.30 | 0.30 | 0.36 | 0.33 | 0.37 | 0.30 | 0.30 | 0.26 | 0.36 | 0.29 | 0.35 | 0.34 | 0.34 | 0.24 | 0.00 | 0.39 | 0.26 | 0.23 | 0.28 | 0.42 |
| **sleepless** | 0.34 | 0.31 | 0.36 | 0.31 | 0.39 | 0.29 | 0.35 | 0.34 | 0.35 | 0.34 | 0.39 | 0.29 | 0.38 | 0.33 | 0.34 | 0.32 | 0.39 | 0.00 | 0.27 | 0.27 | 0.29 | 0.41 |
| **spectator** | 0.28 | 0.14 | 0.29 | 0.16 | 0.34 | 0.23 | 0.29 | 0.26 | 0.29 | 0.28 | 0.32 | 0.20 | 0.31 | 0.27 | 0.27 | 0.21 | 0.26 | 0.27 | 0.00 | 0.24 | 0.18 | 0.43 |
| **supplicant** | 0.22 | 0.21 | 0.31 | 0.22 | 0.35 | 0.24 | 0.26 | 0.27 | 0.27 | 0.26 | 0.29 | 0.20 | 0.33 | 0.33 | 0.25 | 0.19 | 0.23 | 0.27 | 0.24 | 0.00 | 0.24 | 0.37 |
| **thief** | 0.25 | 0.15 | 0.29 | 0.18 | 0.33 | 0.19 | 0.23 | 0.24 | 0.25 | 0.26 | 0.33 | 0.16 | 0.29 | 0.26 | 0.24 | 0.19 | 0.28 | 0.29 | 0.18 | 0.24 | 0.00 | 0.40 |
| **warrior** | 0.32 | 0.36 | 0.27 | 0.37 | 0.23 | 0.35 | 0.42 | 0.35 | 0.24 | 0.27 | 0.39 | 0.39 | 0.34 | 0.49 | 0.35 | 0.36 | 0.42 | 0.41 | 0.43 | 0.37 | 0.40 | 0.00 |

## 三、途径指纹（各途径 Top-5 指纹键）

| 途径 | Top-5 指纹键 |
|---|---|
| apothecary | tgt:eff:self ×32；sshape:cat:buff ×29；prim:mount_status ×28；cost:cooldown:long ×26；sshape:dur:persistent ×23 |
| apprentice | tgt:eff:self ×35；cost:cooldown:long ×28；param:mode=delta ×28；prim:mount_status ×28；sshape:dur:tick ×26 |
| arbiter | cost:cooldown:long ×31；param:mode=delta ×29；tgt:mode=unit ×28；cost:energy:high ×27；tgt:faction=enemy ×27 |
| assassin | tgt:eff:self ×42；prim:mount_status ×36；sshape:dur:tick ×33；cost:cooldown:long ×31；tgt:mode=unit ×30 |
| chanter | tgt:eff:self ×30；cost:cooldown:long ×29；sshape:cat:buff ×29；prim:mount_status ×28；tgt:mode=unit ×27 |
| corpse_collector | tgt:eff:self ×36；prim:mount_status ×30；cost:cooldown:long ×26；param:mode=delta ×25；sshape:cat:buff ×24 |
| criminal | prim:modify_resource ×38；param:mode=delta ×37；param:resource=lust ×37；prim:move ×37；prim:mount_status ×35 |
| hunter | prim:mount_status ×35；cost:cooldown:long ×30；tgt:eff:self ×30；sshape:dur:tick ×27；cost:energy:high ×24 |
| lawyer | prim:mount_status ×35；tgt:eff:self ×34；cost:cooldown:long ×33；cost:energy:high ×31；tgt:faction=enemy ×30 |
| monster | prim:mount_status ×28；tgt:eff:self ×26；sshape:cat:buff ×25；sshape:dur:persistent ×22；cost:cooldown:long ×21 |
| planter | prim:mount_status ×33；prim:spawn ×30；tgt:eff:self ×29；unit:reach:melee ×29；cost:cooldown:long ×26 |
| prisoner | tgt:eff:self ×28；param:mode=delta ×26；cost:cooldown:long ×25；prim:mount_status ×24；cost:energy:high ×22 |
| pryer | cost:cooldown:long ×28；prim:mount_status ×28；tgt:mode=unit ×27；tgt:eff:self ×26；sshape:cat:buff ×22 |
| reader | prim:mount_status ×24；sshape:dur:tick ×24；cost:cooldown:long ×23；sshape:cat:debuff ×23；tgt:eff:self ×22 |
| sailor | tgt:eff:self ×35；prim:mount_status ×32；sshape:cat:buff ×29；cost:cooldown:long ×28；cost:energy:high ×27 |
| savant | param:mode=delta ×28；cost:cooldown:long ×27；tgt:eff:self ×25；sshape:cat:buff ×23；sshape:stacks ×23 |
| seer | cost:cooldown:long ×27；tgt:mode=unit ×27；tgt:eff:self ×26；cost:energy:high ×23；param:mode=delta ×23 |
| sleepless | prim:mount_status ×32；tgt:eff:self ×28；cost:cooldown:long ×21；sshape:dur:tick ×20；cost:energy:high ×18 |
| spectator | cost:cooldown:long ×27；prim:mount_status ×25；tgt:eff:self ×24；tgt:mode=unit ×22；cost:energy:high ×19 |
| supplicant | tgt:eff:self ×31；param:mode=delta ×30；prim:modify_resource ×28；cost:hp_cost ×27；prim:mount_status ×26 |
| thief | tgt:eff:self ×28；cost:cooldown:long ×25；prim:mount_status ×24；tgt:mode=unit ×24；cost:energy:high ×23 |
| warrior | tgt:eff:self ×32；cost:cooldown:long ×26；param:mode=delta ×26；prim:mount_status ×26；cond:has_status ×23 |

## 四、签名键用量（≥2 卡 = 落地；空白键 = 差异化迭代立项依据）

| 途径 | 签名键用量 |
|---|---|
| apothecary | sref:moon_cycle ×5；unitType:BEAST ×8；sref:prepared_draught ×6 |
| apprentice | prim:translocate ×14；prim:echo_last_skill ×11；prim:restore_snapshot ×2 |
| arbiter | flag:seal_effect ×2；flag:cost_mod ×2；res:order ×11 |
| assassin | prim:translocate ×11；elem:ice ×3；elem:dark ×6 |
| chanter | prim:grant_immunity ×16；prim:write_rule_slot ×2；trig:on_phase_change ×0（空白） |
| corpse_collector | flag:filter.unitType ×3；trig:on_kill ×3；prim:drain ×9 |
| criminal | res:lust ×36；elem:dark ×5；flag:companionBuff ×2 |
| hunter | prim:target_override ×3；flag:gender_is ×2；sref:massing ×11 |
| lawyer | prim:gauge_shuffle ×7；prim:status_shuffle ×5；prim:modify_rule_slot ×2 |
| monster | prim:restore_snapshot ×2；prim:advance_clock ×2；res:fate_value ×6 |
| planter | flag:statPerStack ×3；unitType:PLANT ×8；sref:blight ×5 |
| prisoner | sref:curse_link ×3；unitType:ITEM ×2；sref:lineage_stack ×6 |
| pryer | flag:valueFrom ×2；flag:cast_time_set ×21；sref:info_form ×2 |
| reader | prim:reveal ×14；sref:mimic ×3；prim:snapshot ×8 |
| sailor | elem:ice ×2；elem:lightning ×9；sref:rage ×11 |
| savant | prim:modify_rule_slot ×13；sref:law_edit ×6；unitType:CONSTRUCT ×2 |
| seer | sref:puppet_string ×5；prim:write_rule_slot ×2；prim:translocate ×4 |
| sleepless | trig:on_phase_change ×4；prim:advance_clock ×4；res:secrecy ×3 |
| spectator | stat:rank ×3；flag:template ×1（发芽）；sref:insight ×6 |
| supplicant | sref:grazed_soul ×6；stat:hp_max ×5；sref:flesh_undying ×2 |
| thief | prim:take_control ×5；prim:modify_targetability ×2；prim:target_override ×7 |
| warrior | elem:holy ×7；flag:filter.unitType ×3；sref:guardianship ×3 |
