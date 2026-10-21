# 律师 lawyer 重设计日志

## 玩法蓝图（回溯补登 · 2026-10-21 · 蓝图评分 100/100）

### 命题
| 一句话命题 | 可操作变量 | 变量代价/输面 |
|---|---|---|
| 先立后破的篡改——一切收益来自改写已存在的规则槽/状态/行动条：场上没有可篡改之物就没有弹药，篡改深度堆到秩序崩坏收场 | 篡改对象选择（改哪条规则槽/哪个状态/谁的行动位）、篡改深度堆叠节奏（何时秩序崩坏收场） | 对手不上状态/不立规则则篡改空转；秩序崩坏前被抢节奏则深度白堆 |

### 风格边界
| 主签名维度 | 使用的全局通用机制 | 红线来源 |
|---|---|---|
| 扭曲与熵（gauge_shuffle 行动条重排 + status_shuffle 状态易主 + modify_rule_slot 规则改写） | 驱散,基础增益,资源 | 途径设计身份.md 律师身份卡：扭曲必须「先立后破」——只改写已有规则槽/状态，不从零创造秩序（那是仲裁人）；禁裸 modify_stat 减益——削弱必附规则改写 |

### 轴玩法
| 轴 | 名称 | 锚点(kind:id) | 产出→消费→清除 | 玩家决策点 | 签名键承诺(键:卡位) | 计划卡数 | 角色配比 |
|---|---|---|---|---|---|---|---|
| advocacy | 讼辩 | status:chink_finding | 寻隙/讼师之眼/律令加身产层→chink_finding 层数引擎自放大消费（真空轴已拍板接受）→层数被消费或目标清醒清除 | 寻隙对象选择：寻谁的隙、层数堆到几层再爆讼 | prim:modify_rule_slot:寻隙,滔滔不绝,讼师之眼 | 10 | core×6,starter×2,tech×1,bridge×1 |
| brute | 蛮力 | status:amplified | 力量解决/放大产层→amplified 自足件 nextAttack×2+处决消费（真空轴已拍板接受）→层数被消费清除 | 放大时机：何时开倍击、处决线怎么压 |  | 10 | core×6,generic×4 |
| bribery | 贿腐 | status:corrupted | 腐蚀/重贿产层→腐化回扣/收买读层消费→层数被消费或贿约到期清除 | 贿赂对象与回收时机：贿谁、何时收买/回扣兑现 | prim:status_shuffle:腐蚀,收买,万贿归一 | 10 | core×7,generic×3 |
| warp_rule | 扭曲规则 | status:distortion | 扭曲/利用产层→秩序崩坏读层爆发→层数被爆发消耗或秩序复原清除 | 扭曲对象选择：改哪条规则槽、何时秩序崩坏收场 | prim:modify_rule_slot:扭曲,重定义,秩序崩坏;prim:gauge_shuffle:混乱,狂乱,秩序崩坏 | 16 | core×14,trap×1,generic×1 |

### 跨轴钩子
| 卡位 | 读轴 | 概念 | facet | 用途 |
|---|---|---|---|---|
| 力量解决 | advocacy | status | read | 读寻隙层数定力量解决加成 |
| 上位者·威严 | advocacy | status | read | 读寻隙层数展开威严 |
| 法条援引 | warp_rule | status | read | 读扭曲层数援引法条 |
| 碾压 | advocacy | status | read | 读寻隙层数定碾压面 |

### 跨系钩子
| 枢纽状态 | 写入卡位 | 读取卡位 | participants |
|---|---|---|---|
| confused | 混乱 | （待他途径补读取卡） | lawyer,monster,arbiter |
| corrupted | 腐蚀,重贿 | 预服药水,欲望爆炸,恶欲共鸣 | lawyer,criminal,planter,apothecary |
| defined_substitute | 定义·替身 | 阴影替身术 | assassin,seer,lawyer,supplicant,prisoner |

### 角色配比
| 角色 | 张数 | 卡位 |
|---|---|---|
| core | 33 | 诡辩,寻隙,讼师之眼,律令加身,滔滔不绝,巧言令色,力量解决,放大,野蛮体魄,暴力裁决,碾压,弑序铁拳,贿赂·削弱,腐蚀,腐化回扣,赠予,收买,重贿,万贿归一,扭曲,混乱,难落身,利用,独享规则,上位者·威严,阶层,重定义,独裁者,九座陵寝,秩序崩坏,定义·替身,扭曲秩序,熵 |
| starter | 2 | 薄弱处,陈词 |
| bridge | 1 | 法条援引 |
| generic | 8 | 蛮横冲撞,踏月,强夺,狂乱适应,贿赂·魅惑,贿赂·狂妄,贿赂·关联,对半承担 |
| trap | 1 | 狂乱 |
| tech | 1 | 当庭辩驳 |
| flagship | 4 | 诡辩,腐蚀,放大,独裁者 |

## 迭代记录

（回溯补登 · 2026-10-21：prefill_blueprint 反填 + 人工逐项确认；命题拍板=先立后破的篡改。
role 推断分歧处置：法条援引降 bridge（advocacy 卡读 warp_rule 锚 distortion 跨轴在案）；
狂乱降 trap（gauge_shuffle 签名键载体 + 风险段在案：4 增益 4 减益各 25% 概率双向抽签）；
当庭辩驳定 tech（dispel 真对策形状：驱散减益 + 被缚者针对）；待定 5 卡——贿赂·狂妄/
贿赂·关联→generic（泛用贿赂件），对半承担/蛮横冲撞/踏月/强夺/狂乱适应→generic
（泛用骨架/补位）；定义·替身升 core（defined_substitute 跨系枢纽写入卡，传说承重——hub
写入不在身份动作判据内，接受 1 条注级，与 spectator·宣告未来同例）；扭曲秩序/熵升 core
（扭曲秩序=本途径 domain 卡读混乱/扭曲标签、熵=原著锚承重卡，接受 2 条「core 无身份动作」
注级，generic 已贴 17% 仍有余量但二卡非平庸件，口径缺口记此）。
兑现率缺口（下一迭代轮输入）：confused 枢纽 0 读取（participants monster/arbiter 待接线）；
corrupted/defined_substitute 两枢纽均已接线；trap/tech/bridge 各仅 1 张。）
