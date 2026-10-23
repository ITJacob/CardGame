# 阅读者 reader 重设计日志

## 玩法蓝图（2026-10-23 A1 骨架重构 · 环节⑥拍板）

### 命题
| 一句话命题 | 可操作变量 | 变量代价/输面 |
|---|---|---|
| 读后而打——读招定策：先读对手能量、技能配置与行动节奏，信息本身是前置；读对的维度让模仿与仪式放大，读错方向投入反噬（降档+自噬能量） | 读哪一维（能量 d_energy / 技能 d_skill / 节奏 d_tempo）、何时兑现（已读维度在时限内何时消费） | 读错方向：payoff 降档并自噬能量；已读标记 25tick 时限——敌方能量/行动条在流动，拖太久旧情报作废 |

**模型落点**（阴阳师式进度条回合制，无手牌）：「对手剩余资源」= 敌方能量池（resource_compare）；「未亮底牌」= 敌方技能配置与最近施放（snapshot / observed.slots.lastSkillRef / echo_last_skill）；「节奏」= 行动条进度（gauge_above/gauge_rank）。读维落地 = 单一「已读」read 状态 + mount_status params 键记维度（d_energy/d_skill/d_tempo），重复挂载键并集合并；兑现门走 recorded_has 谓词，全确定性（无 chance）。

### 风格边界
| 主签名维度 | 使用的全局通用机制 | 红线来源 |
|---|---|---|
| 全知模仿（reveal + 读维 + mimic 定档） | 召唤,驱散,位移,基础增益 | 途径设计身份.md 阅读者身份卡：模仿排除权柄技能；全知是「看」不是「改」——read 只记录已读维度，不附加任何修正；reveal 只显形不附加 |

### 轴玩法
| 轴 | 名称 | 锚点(kind:id) | 产出→消费→清除 | 玩家决策点 | 签名键承诺(键:卡位) | 计划卡数 | 角色配比 |
|---|---|---|---|---|---|---|---|
| analysis | 解析 | status:observed + status:read | 测算/解析产 d_energy、逻辑推演/拆招/洞悉产 d_skill、白塔·全知产三维→推理大师读 d_energy 乘区、模仿系读 d_skill 定档→read 25tick 到期或目标死亡作废 | 先读谁、读哪一维（能量还是技能）、情报在时限内兑现还是作废 | prim:snapshot:过目不忘,观察,解析 | 11 | core×9,starter×1,tech×1 |
| foresight | 预知 | status:foresight + status:read | 预言/读势/星界秘域产 d_tempo→gauge 操作兑现（局势推演推条加码、格斗大师读 d_tempo 击退、星界秘域域内压条）→read 到期清除 | 读节奏的兑现窗口：敌将动时推条/打断/减伤，时机比数值值钱 |  | 7 | core×5,bridge×1,generic×1 |
| mimic | 模仿 | status:mimic + status:read | 观察/拆招产 d_skill→模仿·初解/解构/全知之眼 recorded_has(d_skill) 定复刻完成度（未读降档+自噬能量）→复刻对象死亡则快照作废 | 复刻谁、读透再复刻还是硬模仿赌降档 | sref:mimic:模仿·初解,模仿·解构,模仿·全知之眼 | 7 | core×4,starter×1,bridge×1,trap×1 |
| arcana | 秘术 | status:ritual_expertise + status:read | 仪式魔法专家/省略步骤产层、星界秘术兼产 d_energy→仪式魔法/仪式魔法大师/秘术·洞烛读 d_energy 放大（洞烛读对全效+回能，未读降档+自噬）→层数被仪式消费 | 省略步骤的时机：省节奏还是读对维度完整仪式全效 | prim:reveal:仪式魔法,逻辑推演,格斗大师 | 9 | core×8,generic×1 |

### 跨轴钩子
| 卡位 | 读轴 | 概念 | facet | 用途 |
|---|---|---|---|---|
| 观察 | analysis | status | read | 读已解析层数加深观察，兼产 d_skill（解析链起手） |
| 预言 | analysis | status | read | 读已解析度压条，兼产 d_tempo |
| 格斗大师 | foresight | status | read | 读 d_tempo 追加击退（arcana 卡消费 foresight 维度） |
| 推理大师 | analysis | status | read | 读 d_energy 伤害乘区（analysis 自轴消费） |
| 局势推演 | analysis | status | read | 场上存在已读敌人则推条 30→45（read 在场兑现） |
| 模仿·全知之眼 | analysis | status | read | 全知模仿读 d_skill 定复刻完成度 |

### 跨系钩子
| 枢纽状态 | 写入卡位 | 读取卡位 | participants |
|---|---|---|---|
| law_authority | 规律权柄 | （待他途径补读取卡） | reader,savant |
| law_breach | 规律·撬动 | （待他途径补读取卡） | reader,savant |

### 角色配比
| 角色 | 张数 | 卡位 |
|---|---|---|
| core | 26 | 过目不忘,仪式魔法,逻辑推演,仪式魔法专家,格斗大师,解析,仪式魔法大师,秘术·自创,省略步骤,预言,星界秘术,秘术传授,洞悉,智慧权柄,全知·现在与过去,星界导师,模仿·全知之眼,白塔·全知,测算,拆招,读势,秘术·洞烛,模仿·解构,推理大师,星界秘域,局势推演 |
| starter | 2 | 理解力,知识储备 |
| bridge | 2 | 观察,规律·撬动 |
| generic | 2 | 规律权柄,白塔·创造 |
| trap | 1 | 模仿·初解 |
| tech | 1 | 解析还原 |
| flagship | 4 | 秘术·自创,智慧权柄,星界导师,白塔·全知 |

## 迭代记录

（2026-10-23 **A1 骨架重构**（环节⑥拍板，第 1 轮⑤）：命题由「先解析后打击——信息即火力」整条迁入 A1
「读招定策」。机制扩容：condition 新增 recorded_has 谓词（状态实例 slots/params 键存在性，读维兑现门）；
read 状态入库（debuff/25tick/dispelable，params 键 d_energy/d_skill/d_tempo，重复挂载键并集合并）；
observed 从唯一前置降格为可读维度之一（读状态面）。退役 5：模仿·秘术导师/模仿·预言家/模仿·智天使
（echo 固定 potency 20%→100% 凑数梯度）、武器精通（generic 物理增益，与命题脱节）、星界阶梯（纯保人位移）；
机制退役：「下一式-1费」模仿习得段全撤（集中由省略步骤/streamlined_cast 承载）。新增 5：测算（s7 读能量）、
拆招（s6 读技能）、读势（s5 读节奏）、秘术·洞烛（s3 仪式 payoff）、模仿·解构（s2 高档兑现）。
改写 ~12：模仿·初解/全知之眼改 recorded_has(d_skill) 定档+自噬（初解 50% chance 退役，随机性治理销账）、
预言/观察/逻辑推演/解析/洞悉产读维、仪式魔法系接 d_energy、格斗大师读 d_tempo 追加击退、
星界秘域展开全体 d_tempo、推理大师/局势推演 generic 重接读维（role→core）、
白塔·全知开战全体三维已读（omniscience Def on_deal_damage 触发器持续刷新）。卡数 34 持平。）

（回溯补登 · 2026-10-21：prefill_blueprint 反填 + 人工逐项确认；旧命题=先解析后打击。
兑现率缺口（已在 2026-10-23 A1 轮处置）：arcana/foresight/mimic 三轴 payoff 登记真空→三轴均已补 payoff
（秘术·洞烛/局势推演/模仿系三张）；trap/tech 各仅 1 张→保留（trap=模仿·初解读错自噬、tech=解析还原）。
遗留：law_authority/law_breach 0 他途径读者（participants 已列 savant 待接线）。）
