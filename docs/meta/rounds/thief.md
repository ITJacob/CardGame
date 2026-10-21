# 偷盗者 thief 重设计日志

## 玩法蓝图（回溯补登 · 2026-10-21 · 蓝图评分 97/100）

### 命题
| 一句话命题 | 可操作变量 | 变量代价/输面 |
|---|---|---|
| 有借有还——一切夺取都是「持有中」：窃取/寄生/顶替带时限归还，在归还窗口内榨取最大价值 | 偷什么（能力/时间/身份/锚）、何时主动归还或续借 | 归还窗口到期强制还回则战力断档；偷来的东西被驱散/识破则窗口空转 |

### 风格边界
| 主签名维度 | 使用的全局通用机制 | 红线来源 |
|---|---|---|
| 夺取顶替（take_control / modify_targetability / target_override） | 召唤,驱散,位移,基础增益 | 途径设计身份.md 偷盗者身份卡：夺取来的必须注明归还/时限——没有「拥有」只有「持有中」；不走 gauge 正面推条 |

### 轴玩法
| 轴 | 名称 | 锚点(kind:id) | 产出→消费→清除 | 玩家决策点 | 签名键承诺(键:卡位) | 计划卡数 | 角色配比 |
|---|---|---|---|---|---|---|---|
| chrono | 时命 | status:stolen_time | 窃取时间/衰老产层→嫁接命运读层消费→层数被消费或归还到期清除 | 窃取时间对象选择：偷谁的节奏、归还节点何时落 |  | 6 | core×6 |
| deceit | 欺诈 | status:misdirect | 思维误导/精神干扰产层→欺诈规则读层消费→层数被消费或欺诈被识破清除 | 欺诈对象与改指时机：误导谁、何时收网 | prim:modify_targetability:伪装·盗天机,寄生;prim:target_override:精神干扰,解析幻象,窃取记忆 | 11 | core×5,starter×2,generic×3,tech×1 |
| parasite | 寄生 | status:deep_parasitized | 寄生/窃取身份产层→窃取身份/混淆分身读层消费→寄生被驱散或宿主死亡清除 | 寄生对象选择：寄谁、何时深寄接管 | prim:take_control:栽赃,偷走想法,寄生 | 5 | core×3,trap×1,generic×1 |
| steal | 窃取 | status:stolen_ability | 盗火/窃取权柄产层→窃取读层消费→层数被消费或归还到期清除 | 窃取目标选择：偷能力还是偷概念、窗口内怎么榨 |  | 15 | core×8,starter×2,generic×4,bridge×1 |

### 跨轴钩子
| 卡位 | 读轴 | 概念 | facet | 用途 |
|---|---|---|---|---|
| 欺诈规则 | parasite | status | read | 读深寄层数定欺诈规则生效面 |
| 窃取权柄 | chrono | status | read | 读窃取时间层数放大权柄窃取 |

### 跨系钩子
| 枢纽状态 | 写入卡位 | 读取卡位 | participants |
|---|---|---|---|
| deep_parasitized | 寄生,窃取身份 | 液化寄生 | supplicant,thief,seer |
| fate_gap | 命运缝隙 | 本我星象,占星术 | assassin,seer,monster,pryer,thief |

### 角色配比
| 角色 | 张数 | 卡位 |
|---|---|---|
| core | 22 | 窃取,盗火,隔空取物,窃取记忆,偷走想法,食梦者,窃取距离,错误,思维误导,精神干扰,栽赃,伪装·盗天机,欺诈规则,窃取身份,分身替换,混淆分身,嫁接命运,命运缝隙,窃取时间,衰老,石制壁钟,壁钟之域 |
| starter | 4 | 敏捷之手,卓越观察,微表情,魅力口才 |
| bridge | 1 | 窃取权柄 |
| generic | 8 | 精神污染抗性,精准窃取,三连窃取,窃取锚,找出方位,灵性直觉,欺瞒导师,借宿 |
| trap | 1 | 寄生 |
| tech | 1 | 解析幻象 |
| flagship | 4 | 欺诈规则,窃取时间,分身替换,错误 |

## 迭代记录

（回溯补登 · 2026-10-21：prefill_blueprint 反填 + 人工逐项确认；命题拍板=有借有还。
role 推断分歧处置：窃取权柄降 bridge（steal enabler 读 chrono 锚 stolen_time 跨轴在案）；
寄生降 trap（take_control/modify_targetability 双签名键载体 + 风险段在案：深寄被察觉分支）；
解析幻象定 tech（dispel+target_override 真对策形状：反幻象/反欺骗针对）；待定 4 卡
——隔空取物/窃取距离/石制壁钟/壁钟之域升 core（generic 9/37 已贴 25% 上限无余量，
接受 4 条「core 无身份动作」注级：四卡皆为 transfer_status 借还骨架不挂锚点，口径缺口记此）；
命运缝隙升 core（fate_gap 跨系枢纽唯一写入卡，传说承重——hub 写入不在身份动作判据内，
再接受 1 条注级，与 spectator·宣告未来同例）。
兑现率缺口（下一迭代轮输入）：跨轴钩子仅 2 条实证（<3，钩子维失分在案）；deep_parasitized
读取=supplicant·液化寄生已接线、fate_gap 读取=pryer 双实证已接线（全库罕见双通枢纽）；
trap/tech/bridge 各仅 1 张。）
