# 占卜家 seer 重设计日志

## 玩法蓝图（回溯补登 · 2026-10-21 · 蓝图评分 100/100）

### 命题
| 一句话命题 | 可操作变量 | 变量代价/输面 |
|---|---|---|
| 提线控场——灵体之线是唯一通货：牵上线才有操控/换位/挡刀，从占卜预见到秘偶收割全走线的层数引擎 | 牵线对象选择（线牵谁、几层深牵）、线的消费时机（何时换位/挡刀/干扰命运） | 线被剪断或秘偶被拆则整套控场崩；牵线期场面空窗被滚雪球 |

### 风格边界
| 主签名维度 | 使用的全局通用机制 | 红线来源 |
|---|---|---|
| 秘偶历史（sref:puppet_string 提线引擎 + write_rule_slot 嫁接重组 + prim:translocate 灵界放逐） | 召唤,治疗,驱散,位移 | 途径设计身份.md 占卜家身份卡：嫁接只能「移花接木」（改指向/换宿主），不改规则文本（律师）不立新规（仲裁人）；秘偶必须走灵体之线层数引擎 |

### 轴玩法
| 轴 | 名称 | 锚点(kind:id) | 产出→消费→清除 | 玩家决策点 | 签名键承诺(键:卡位) | 计划卡数 | 角色配比 |
|---|---|---|---|---|---|---|---|
| foresight | 预知 | status:clairvoyance | 灵视/占星术产层→命运干扰/命运锚点/历史影像读层消费→层数被消费清除 | 预知对象与干扰时机：先视谁、层数够后干扰谁的命运 | sref:puppet_string:命运干扰,灵界掌控者 | 9 | core×5,starter×1,generic×2,bridge×1 |
| trick | 戏法 | status:paper_substitute | 纸人替身/直觉预感产层→秘偶换位/秘偶置换读层换位消费→替身被拆或层数被消费清除 | 替身启用时机：纸人何时承伤、何时换位收割 |  | 9 | core×4,starter×2,generic×3 |
| marionette | 秘偶 | status:puppet_string | 秘偶/伤害转移产层→秘偶不死/秘偶换位/灵界掌控者读层消费→线被剪断或秘偶被拆清除 | 牵线对象选择：线牵谁、秘偶何时换位挡刀 | sref:puppet_string:伤害转移,秘偶;prim:write_rule_slot:伤害转移,命运干扰;prim:translocate:灵界放逐,秘偶置换 | 11 | core×6,trap×1,tech×2,generic×2 |
| miracle | 奇迹 | status:miracle | 奇迹/愿望产层→历史影像/诡秘之境读层兑现、灵之虫复活保险消费→层数被消费或保险耗尽清除 | 奇迹兑现节奏：愿望堆到几层再兑现、复活保险何时交 | prim:translocate:灵界庇护,遁入灵界 | 10 | core×8,generic×2 |

### 跨轴钩子
| 卡位 | 读轴 | 概念 | facet | 用途 |
|---|---|---|---|---|
| 伤害转移 | trick | status | read | 读纸人替身层数转移伤害 |
| 命运干扰 | marionette | status | read | 读灵体之线层数干扰命运 |
| 灵界掌控者 | marionette | status | read | 读灵体之线层数展开掌控 |

### 跨系钩子
| 枢纽状态 | 写入卡位 | 读取卡位 | participants |
|---|---|---|---|
| paper_substitute | 直觉预感,纸人替身 | （待他途径补读取卡） | assassin,seer,lawyer,supplicant,prisoner |
| puppet_string | 伤害转移,秘偶 | 撕裂空间,石化,通灵 | apprentice,assassin,corpse_collector,seer,prisoner,sleepless,thief,warrior |

### 角色配比
| 角色 | 张数 | 卡位 |
|---|---|---|
| core | 23 | 灵视,占星术,灵界掌控者,命运锚点,遁入灵界,直觉预感,纸人替身,秘偶换位,秘偶置换,伤害转移,秘偶,再生,重组,愚弄,灵界放逐,秘偶不死,历史影像,愿望,诡秘之境,奇迹,灵界庇护,借取力量,灵之虫 |
| starter | 3 | 占卜,飞牌,完美协调 |
| bridge | 1 | 命运干扰 |
| generic | 9 | 灵体之线,细微观察,空气弹,火焰跳跃,隐秘共鸣,兽形,纸人部位,变形,能力精进 |
| trap | 1 | 幻境 |
| tech | 2 | 制造幻觉,秽物转移 |
| flagship | 4 | 纸人替身,诡秘之境,愚弄,灵界掌控者 |

## 迭代记录

（回溯补登 · 2026-10-21：prefill_blueprint 反填 + 人工逐项确认；命题拍板=提线控场。
role 推断分歧处置：命运干扰降 bridge（foresight 登记 payoff 读 marionette 锚 puppet_string
跨轴在案，且为 sref:puppet_string/prim:write_rule_slot 双签名载体）；幻境降 trap（风险段
在案：域内我方普攻每 5 次落空 1 次的自伤段——幻境非签名载体非轴登记，接受 1 条
「trap 无身份动作」注级，口径缺口记此）；制造幻觉/秽物转移定 tech（target_override 改向
+ dispel 转移双对策形状）；待定 7 卡——兽形/纸人部位/变形/能力精进/细微观察/火焰跳跃
→generic（泛用骨架/补位），再生/重组升 core（marionette 轴承重 legendary：死亡即产偶、
增益重组减益皆愚弄权柄语义，接受 2 条「core 无身份动作」注级）；借取力量/灵之虫自
prefill tech 修正升 core（对策形状误判——二卡为自我恢复/复活保险非对敌针对，接受 2 条
注级）；灵体之线自 prefill generic 维持（take_control 仅识破语义非对策承重，近重复对在案）。
兑现率缺口（下一迭代轮输入）：paper_substitute 枢纽 0 读取（participants 5 途径待接线）；
puppet_string 读取面全库最广（8 途径）已接线；trap/bridge 各仅 1 张。）
