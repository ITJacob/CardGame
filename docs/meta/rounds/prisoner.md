# 囚犯 prisoner 重设计日志

## 玩法蓝图（回溯补登 · 2026-10-21 · 蓝图评分 100/100）

### 命题
| 一句话命题 | 可操作变量 | 变量代价/输面 |
|---|---|---|
| 诅咒反照账本——咒出必自承半份：诅咒网络铺得越广反照越多，迷失值记账+转嫁/无反噬手段是稀缺解，铺咒节奏与反照消化的权衡是核心 | 铺咒次序与密度（咒铺给谁、铺到多广）、反照消化手段分配（转嫁给谁、无反噬留给哪道咒） | 反照积压则自身状态崩盘；迷失值爆档则异类化失控 |

### 风格边界
| 主签名维度 | 使用的全局通用机制 | 红线来源 |
|---|---|---|
| 诅咒异类（sref:curse_link 诅咒链 + unitType:ITEM 物品权柄 + sref:lineage_stack 异类谱系栈） | 召唤,治疗,驱散,位移 | 途径设计身份.md 囚犯身份卡：诅咒必带反照/代价（诅咒之源伤敌反照是原著本体）；异类形态的谱系栈必须单调不可逆（lineage_push 不回头） |

### 轴玩法
| 轴 | 名称 | 锚点(kind:id) | 产出→消费→清除 | 玩家决策点 | 签名键承诺(键:卡位) | 计划卡数 | 角色配比 |
|---|---|---|---|---|---|---|---|
| aberration | 异类 | status:werewolf_form | 狼人化/异类之王产层→诅咒权柄/演出/异类之王读层消费→形态转化（谱系栈推进不可逆）清除 | 谱系栈推进时机：何时推进形态、栈位定在哪档 | sref:lineage_stack:狼人化,灵体化,操纵物品 | 13 | core×6,starter×1,bridge×1,generic×5 |
| bondage | 束缚 | status:the_bound | 被缚者/长久沉默产层→侵蚀诅咒读层消费→束缚被拆或层数被消费清除 | 束缚对象选择：缚谁、长久沉默封谁的口 |  | 7 | core×3,starter×1,tech×1,generic×2 |
| curse | 诅咒 | status:curse_link | 诅咒之源/无反噬之咒产层→万咒加身读层消费→诅咒被净化或反照回身清除 | 铺咒密度与反照消化：咒铺多广、转嫁给谁 | sref:curse_link:诅咒之源,无反噬之咒,万咒加身 | 8 | core×6,trap×1,generic×1 |
| item | 物品 | status:object_possession | 附身物体/操纵物品产层→物品权柄读层消费→附身被驱散或物品被毁清除 | 附身对象选择：附哪件物品、权柄何时展开 | unitType:ITEM:操纵物品,物品权柄 | 8 | core×4,starter×3,generic×1 |

### 跨轴钩子
| 卡位 | 读轴 | 概念 | facet | 用途 |
|---|---|---|---|---|
| 操纵物品 | aberration | status | read | 读异类栈位定操纵力度 |
| 演出 | aberration | status | read | 读异类栈位定演出效果 |
| 侵蚀诅咒 | bondage | status | read | 读束缚层数加深侵蚀 |

### 跨系钩子
| 枢纽状态 | 写入卡位 | 读取卡位 | participants |
|---|---|---|---|
| object_possession | 操纵物品,附身物体 | （待他途径补读取卡） | prisoner,savant |
| the_bound | 长久沉默,被缚者 | 当庭辩驳 | prisoner,lawyer |

### 角色配比
| 角色 | 张数 | 卡位 |
|---|---|---|
| core | 19 | 狼人化,灵体化,怨魂附身,灵界潜域,转化,异类之王,操纵物品,演出,附身物体,物品权柄,长久沉默,邪物,被缚者,诅咒之源,变形诅咒,无反噬之咒,邪物之眼,侵蚀诅咒,万咒加身 |
| starter | 5 | 体魄强化,知觉敏锐,随手物品,犯罪技巧,疯癫抗性 |
| bridge | 1 | 怨魂尖啸 |
| generic | 9 | 毒性傀儡,钢铁之躯,死寒之握,唤醒死尸,幽影之躯,操纵活尸,爆发欲望,初步反占卜,怨灵之缠 |
| trap | 1 | 诅咒权柄 |
| tech | 1 | 黑暗恐惧 |
| flagship | 4 | 变形诅咒,转化,被缚者,物品权柄 |

## 迭代记录

（回溯补登 · 2026-10-21：prefill_blueprint 反填 + 人工逐项确认；命题拍板=诅咒反照账本。
role 推断分歧处置：诅咒权柄降 trap（curse 轴登记 + 风险段在案）；怨魂尖啸定 bridge
（aberration 卡读 curse 锚 curse_link 跨轴在案，prefill bridge 三候选取其一）；黑暗恐惧定
tech（dispel 全体增益真对策形状；prefill tech 三卡——爆发欲望/操纵活尸/邪物皆对策误判，
前两者降 generic、邪物升 core 注级）；体魄强化/知觉敏锐/疯癫抗性自 prefill generic 改
starter（common 教学卡更贴语义）；随手物品/犯罪技巧定 starter（common 低复杂度）；待定 8
卡——毒性傀儡/死寒之握/唤醒死尸/怨灵之缠/操纵活尸→generic（泛用骨架），怨魂附身/灵界潜域/
邪物之眼升 core（附身改指/domain/全体变形承重，接受 3 条「core 无身份动作」注级，generic
已贴 25% 上限，口径缺口记此）。
兑现率缺口（下一迭代轮输入）：the_bound 已接线（读取=lawyer·当庭辩驳）；
object_possession 0 读取（participants savant 待接线）；trap/tech/bridge 各仅 1 张。）
