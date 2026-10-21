# 怪物 monster 重设计日志

## 玩法蓝图（回溯补登 · 2026-10-21 · 蓝图评分 99/100）

### 命题
| 一句话命题 | 可操作变量 | 变量代价/输面 |
|---|---|---|
| 命运双极押注——幸运/厄运双极铺给敌我，fate_value 随摆动进账：押的是「下一次摆动方向」，摆对边收租摆错边赔掉积累 | 双极铺向选择（幸运铺给谁、厄运泼给谁）、摆动兑现时机（何时收租/何时重掷） | 摆动方向押错则积累赔光；概率段落空（chance 抽样未中）则当轮节奏断档 |

### 风格边界
| 主签名维度 | 使用的全局通用机制 | 红线来源 |
|---|---|---|
| 命运族：循环/保存重启（prim:restore_snapshot + prim:advance_clock + res:fate_value） | 召唤,治疗,驱散,基础增益,资源 | 途径设计身份.md 怪物身份卡：概率只走 condition:chance 登记抽样（R1–R6）且只用于非伤害维度；重启必须可回溯（快照语义），不做无条件重置 |

### 轴玩法
| 轴 | 名称 | 锚点(kind:id) | 产出→消费→清除 | 玩家决策点 | 签名键承诺(键:卡位) | 计划卡数 | 角色配比 |
|---|---|---|---|---|---|---|---|
| inspiration | 灵感 | status:inspiration_sense | 灵感超高/绝对灵感/超强预感产层→危险预感/反占卜/命运看守者读层消费→层数被消费或预感兑现清除 | 预感铺向与兑现时机：先看谁、灵感层数何时转成防守/反制 | prim:restore_snapshot:灵感超高,危险预感,未来画面;res:fate_value:命运潮汐,命运看守者,命运启示 | 13 | core×11,starter×1,bridge×1 |
| fortune | 幸运 | status:fortune | 幸运者/命运潮汐/福祸之言产层→赢家/赐福/命运启示读层消费→层数被消费或摆向逆转清除 | 幸运堆叠对象：幸运铺给谁、何时赢家通收 |  | 6 | core×5,trap×1 |
| calamity | 灾厄 | status:misfortune | 给予厄运/厄运诅咒/预见灾祸产层→绝对灵感/命运看守者读层消费→厄运被净化或层数被消费清除 | 厄运泼洒次序：先厄谁、灾祸何时引爆 |  | 6 | core×6 |
| cycle | 循环 | status:fate_loop | 命运循环/重启循环/水银之躯·完整产层→重启/选择读层回放消费→快照耗尽或层数被消费清除 | 保存建档时机：何时存档、何时重启回滚 | prim:advance_clock:命运循环,命运之轮 | 10 | core×9,tech×1 |

### 跨轴钩子
| 卡位 | 读轴 | 概念 | facet | 用途 |
|---|---|---|---|---|
| 引发灾祸 | fortune | status | read | 读幸运层数定灾祸落点 |
| 命运看守者 | calamity | status | read | 读厄运层数看守命运 |
| 福祸之言 | calamity | status | read | 读厄运层数转福祸之言 |
| 预言术 | fortune | status | read | 读幸运层数成预言 |
| 命运之轮 | fortune | status | read | 读幸运层数拨动命运之轮 |

### 跨系钩子
| 枢纽状态 | 写入卡位 | 读取卡位 | participants |
|---|---|---|---|
| fate_chaos | 混乱 | 熵 | lawyer,monster,arbiter |
| misfortune | 给予厄运,厄运诅咒,福祸之言 | 天灾降临 | sleepless,monster,sailor |

### 角色配比
| 角色 | 张数 | 卡位 |
|---|---|---|
| core | 31 | 灵感超高,危险预感,未来画面,精准射击,恐怖计算,反占卜,超强预感,绝对灵感,命运看守者,命运启示,命运之轮,幸运者,命运潮汐,意外之财,赐福,福祸之言,引发灾祸,预见灾祸,精神风暴,给予厄运,厄运领域,厄运诅咒,水银之躯,混乱,水银之躯·完整,命运循环,重启循环,重启,保存,选择,概率权柄 |
| starter | 1 | 素质增强 |
| bridge | 1 | 预言术 |
| trap | 1 | 赢家 |
| tech | 1 | 精神洗礼 |
| flagship | 4 | 厄运领域,福祸之言,命运之轮,概率权柄 |

## 迭代记录

（回溯补登 · 2026-10-21：prefill_blueprint 反填 + 人工逐项确认；命题拍板=命运双极押注。
role 推断分歧处置：赢家降 trap（fortune 登记 payoff + 风险段在案）；精神洗礼定 tech
（dispel 双分支驱散真对策形状）；预言术降 bridge（inspiration 卡读 fortune 锚跨轴在案）；
素质增强定 starter（common 低复杂度教学卡）；保存升 core（cycle 轴 snapshot 写入卡、重启配套件，接受 1 条
「core 无身份动作」注级：snapshot 写入不在 restore_snapshot 签名键判据内，口径缺口记此）；generic 缺位——
全途径自由卡（无签名键/无轴登记/非旗舰）仅 保存 1 张且为 legendary，无平庸件可任，
接受蓝图角色配比维 -1（五角色缺 generic），为 22 途径中首例 honest 缺位。
兑现率缺口（下一迭代轮输入）：fate_chaos/misfortune 两枢纽均已接线（读取=lawyer·熵 /
sailor·天灾降临）；trap/tech/bridge/starter 各仅 1 张。）
