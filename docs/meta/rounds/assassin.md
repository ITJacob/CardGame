# 刺客 assassin 重设计日志

## 玩法蓝图（回溯补登 · 2026-10-21 · 蓝图评分 95/100）

### 命题
| 一句话命题 | 可操作变量 | 变量代价/输面 |
|---|---|---|
| 替身换位不站撸——输出必带替身/拉入/换位其一：用镜子把「被打」变成「打错」 | 替身放置位置与数量、换位时机（何时真身进场收割） | 替身被拆或换位失误则真身暴露吃满伤害；镜系被驱散则整套节奏断档 |

### 风格边界
| 主签名维度 | 使用的全局通用机制 | 红线来源 |
|---|---|---|
| 镜中世界（translocate 拉入 + ice/dark） | 召唤,治疗,驱散,位移 | 途径设计身份.md 刺客身份卡：镜子必须与 glass/mirror 语义绑定（替身/拉入/穿梭三选一）；不走正面站撸（输出须带闪避/替身/换位其一） |

### 轴玩法
| 轴 | 名称 | 锚点(kind:id) | 产出→消费→清除 | 玩家决策点 | 签名键承诺(键:卡位) | 计划卡数 | 角色配比 |
|---|---|---|---|---|---|---|---|
| charm | 魅 | status:charm_axis | 魅惑/激化矛盾产层→反复魅惑读层消费→层数被消费或目标清醒清除 | 魅惑对象选择：魅谁、激化哪对矛盾 |  | 7 | core×5,starter×2 |
| form | 形 | status:assassin_form | 影形态/雾形态/血形态产层→原初·静止读层消费→形态切换或被驱散清除 | 形态切换时机：三形态各应对什么场面、何时归一入原初 |  | 15 | core×6,starter×3,generic×6 |
| mirror | 镜 | status:mirror_substitute | 镜子替身/魔镜占卜产层→镜中世界读层消费→替身被拆或镜碎清除 | 替身放置与启用：替身摆哪、何时用替身承伤 |  | 8 | core×5,generic×2,bridge×1 |
| plague | 疫 | status:disease | 疾病/黑焰产层→末日读层爆发→层数被爆发消耗或被净化 | 疫病铺场次序与爆发时机：先铺疫再黑焰引爆，还是黑焰开路 | prim:translocate:力量爆发于一击,魅惑,黑焰;elem:ice:冰霜,灾难,崩解;elem:dark:黑焰,（待补强1卡） | 9 | core×6,generic×1,tech×1,trap×1 |

### 跨轴钩子
| 卡位 | 读轴 | 概念 | facet | 用途 |
|---|---|---|---|---|
| 末日 | charm | status | read | 读魅惑层数定末日降临面 |
| 原初·静止 | mirror | status | read | 读镜替身层数归一入静止 |

### 跨系钩子
| 枢纽状态 | 写入卡位 | 读取卡位 | participants |
|---|---|---|---|
| black_flame | （无写入卡，待接线） | 双焰交汇 | assassin,corpse_collector,criminal |
| doom | 命运诅咒,末日 | 五五开,弱点侦察,征服 | assassin,seer,monster,pryer,thief,sailor,planter,criminal,arbiter,lawyer,hunter,savant |
| mirror_substitute | 魔镜占卜,镜子替身 | 独裁者,编织梦境,阴影统治者 | assassin,seer,lawyer,supplicant,prisoner,spectator |

### 角色配比
| 角色 | 张数 | 卡位 |
|---|---|---|
| core | 22 | 力量爆发于一击,魅惑,激化矛盾,欢愉之触,反复魅惑,魅力权柄,黑焰,冰霜,疾病,灾难,命运诅咒,末日,魔镜占卜,镜子替身,镜中囚禁,混沌漩涡,镜中世界,原初·静止,影形态,雾形态,血形态,发刃 |
| starter | 5 | 羽毛般轻盈,鹰的视力,阴影躲藏,误导,说服 |
| bridge | 1 | 投影传送 |
| generic | 9 | 隐形,女巫之形,无形蛛丝,冰霜护甲,青春永驻,石化,不可转移的诅咒,镜像迷宫,镜中人 |
| trap | 1 | 崩解 |
| tech | 1 | 瘟疫 |
| flagship | 4 | 激化矛盾,末日,混沌漩涡,原初·静止 |

## 迭代记录

（回溯补登 · 2026-10-21：prefill_blueprint 反填 + 人工逐项确认；命题拍板=替身换位不站撸。
role 推断分歧处置：崩解降 trap（translocate 签名键载体 + 风险段在案）；瘟疫升 tech（对策形状在案）；
投影传送定 bridge（语义桥：mirror 投影换位连 form 场面——无跨轴锚点实证，接受 1 条
「bridge 无跨界读取」注级，口径缺口记此）；待定 10 卡——命运诅咒升 core（doom 跨系枢纽写入卡，
传说承重，hub 写入不在身份动作判据内，接受 1 条注级，与 spectator·宣告未来同例）、
魅力权柄升 core（legendary 权柄补位，接受注级），其余 7 张→generic。
兑现率缺口（下一迭代轮输入）：black_flame 本途径 0 写入卡（黑焰卡名在而未挂枢纽，待接线；
读取=criminal·双焰交汇已实证）；doom/mirror_substitute 两枢纽读取面全库最广（12/6 途径）；
跨轴钩子仅 2 条实证（<3，钩子维失分在案）；trap/tech/bridge 各仅 1 张；elem:dark 签名键仅 1 实证。）
