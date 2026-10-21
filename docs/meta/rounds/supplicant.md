# 秘祈人 supplicant 重设计日志

## 玩法蓝图（回溯补登 · 2026-10-21 · 蓝图评分 100/100）

### 命题
| 一句话命题 | 可操作变量 | 变量代价/输面 |
|---|---|---|
| 血肉税自残换效——一切收益从自己的肉里长出来或从别人的肉里撕出来：付血换效、撕血回流，血量是第二能量条，没有白给的 buff | 血肉税支付节奏（哪回合付多少血换多少效）、撕血对象选择（从谁身上撕回补） | 血肉税付过头则血量崩盘被收割；撕血对象被清场则回流断档 |

### 风格边界
| 主签名维度 | 使用的全局通用机制 | 红线来源 |
|---|---|---|
| 放牧血肉（sref:grazed_soul 放牧 + stat:hp_max 血肉上限交易 + sref:flesh_undying 血肉不灭） | 召唤,驱散,位移,资源 | 途径设计身份.md 秘祈人身份卡：放牧的灵魂必须可追偿（被放牧方死亡/驱散有后果）；血肉经济只许「自残换效」（hp_max/当前血作资源），不拿治疗本职（治疗是耕种者/歌颂者） |

### 轴玩法
| 轴 | 名称 | 锚点(kind:id) | 产出→消费→清除 | 玩家决策点 | 签名键承诺(键:卡位) | 计划卡数 | 角色配比 |
|---|---|---|---|---|---|---|---|
| shadow | 阴影 | status:shadow_dwell | 藏入阴影/操纵阴影产层→阴影统治者读层消费→阴影被驱散或层数被消费清除 | 藏身时机：何时藏入阴影、何时现身统治 |  | 7 | core×3,starter×1,generic×2,bridge×1 |
| flesh | 血肉 | status:parasitized | 液化寄生/血肉炸弹产层→血肉不灭/补充血肉读层消费→寄生被驱散或宿主死亡清除 | 寄生对象与撕血节奏：寄谁、何时撕血回补 | stat:hp_max:扭曲之力,血肉治愈,血肉披风;sref:flesh_undying:血肉治愈,血肉不灭 | 11 | core×7,starter×1,generic×2,tech×1 |
| corruption | 秽堕 | status:defile | 堕落之影/秽语·诅咒产层→秽语·言灵/秽语·流逝读层消费→秽堕被净化或层数被消费清除 | 秽语释放时机：疯癫堆到几层再开口、流逝何时铺 |  | 10 | core×7,starter×1,generic×1,trap×1 |
| soul | 牧魂 | status:grazed_soul | 放牧灵魂产层→驱使灵魂/堕落眷属/灵魂牧场读层消费→被放牧方死亡追偿或层数被消费清除 | 放牧对象选择：牧谁的魂、追偿时机何时落 | sref:grazed_soul:耳语,补充血肉,放牧灵魂 | 5 | core×4,generic×1 |

### 跨轴钩子
| 卡位 | 读轴 | 概念 | facet | 用途 |
|---|---|---|---|---|
| 耳语 | soul | status | read | 读放牧层数定耳语侵蚀 |
| 操纵阴影 | flesh | status | read | 读寄生层数操纵阴影 |
| 补充血肉 | soul | status | read | 读放牧层数撕血回补 |
| 阴影统治者 | soul | status | read | 读放牧层数展开统治 |

### 跨系钩子
| 枢纽状态 | 写入卡位 | 读取卡位 | participants |
|---|---|---|---|
| grazed_soul | 放牧灵魂,驱使灵魂,堕落眷属 | 服从之音,终焉颂歌,读心 | spectator,chanter,reader,sailor,supplicant,warrior |
| grazing_slot | 灵魂牧场 | （待他途径补读取卡） | spectator,chanter,reader,sailor,supplicant |
| parasitized | 血肉炸弹,液化寄生 | （待他途径补读取卡） | supplicant,thief,seer |
| shadow_double | 阴影替身术 | （待他途径补读取卡） | assassin,seer,lawyer,supplicant,prisoner |

### 角色配比
| 角色 | 张数 | 卡位 |
|---|---|---|
| core | 21 | 藏入阴影,阴影替身术,阴影统治者,血肉治愈,血肉披风,血肉炸弹,液化寄生,补充血肉,血肉不灭,替罪,耳语,堕落之影,秽语·言灵,秽语·诅咒,黑暗海洋,秽语·流逝,异变,放牧灵魂,灵魂牧场,驱使灵魂,堕落眷属 |
| starter | 3 | 灵感,祭祀仪式,倾听 |
| bridge | 1 | 操纵阴影 |
| generic | 6 | 召唤阴影,掌控阴影,血肉仆役,黑甲,阴影诅咒,三首形态 |
| trap | 1 | 扭曲之力 |
| tech | 1 | 灵肉之刃 |
| flagship | 4 | 藏入阴影,黑暗海洋,堕落眷属,替罪 |

## 迭代记录

（回溯补登 · 2026-10-21：prefill_blueprint 反填 + 人工逐项确认；命题拍板=血肉税自残换效。
role 推断分歧处置：扭曲之力降 trap（stat:hp_max 签名键载体 + 风险段在案）；操纵阴影降
bridge（shadow 卡读 flesh 锚 parasitized 跨轴在案）；灵肉之刃定 tech（dispel 对策形状，
自 prefill bridge 改任——途径唯一对策件，bridge 由操纵阴影接任）；灵感/祭祀仪式/倾听定
starter（common 血肉税教学卡）；待定 9 卡——召唤阴影/掌控阴影/血肉仆役/阴影诅咒→generic
（泛用骨架/补位），秽语·流逝/异变升 core（corruption 轴 legendary 权柄承重，接受 2 条
「core 无身份动作」注级）；阴影替身术自 prefill generic 修正升 core（shadow_double 跨系
枢纽唯一写入卡，hub 写入不在身份动作判据内，接受 1 条注级，与 spectator·宣告未来同例）。
兑现率缺口（下一迭代轮输入）：grazed_soul 已接线（读取 3 途径实证）；grazing_slot/
parasitized/shadow_double 三枢纽各 0 读取（participants 待接线）；trap/tech/bridge 各仅 1 张。）
