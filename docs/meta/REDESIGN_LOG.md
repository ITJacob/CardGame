# 逐职业重设计日志（REDESIGN LOG）

> 环节⑤（WORKFLOW.md）的执行记录：一途径一迭代，改前改后分 + 改动摘要。
> 评分口径见 `SCORING.md`，计分卡由 `score.py` 生成；本文件手维护，每次迭代记一行。

| 日期 | 途径 | 改前 → 改后 | 主要改动 | commit |
|---|---|---|---|---|
| 2026-09-26 | （基线建立） | — | score.py 首跑全库基线分，见 docs/analysis/scorecard.md；榜尾：pryer 45.9 / chanter 46.5 / corpse_collector 47.5 / apothecary 47.6 / arbiter 47.9 | c169205 |
| 2026-09-29 | 窥秘人 `pryer` | 47.3 → **58.7**（基线 45.9） | 窥秘权柄补产层段（scrying 产层 12→20）；知识攻击补窥秘之眼读层（payoff notes→landed）；朗基努斯之枪 knowledge_strain 耗层换效（combat 读层 0→9，从补卡候选落地）；占星术读 knowledge_strain、知识攻击读 scrying_eye（跨轴 0→2 次）；星之巨柱/星桥补 ego_constellation、卷轴·冰冻/麻痹补 spell_lore（astral/scroll 产层注清零）；星之巨柱读 doom、星光囚笼读 astral_anchor（跨系 0→2 次，后者闭环稿面既定意图） | 本轮 |
| 2026-09-29 | 歌颂者 `chanter` | 47.0 → **62.8** | blessing/daylight/obedience 补层数引擎（身份锚定 8→15×3）；神圣誓约/太阳誓约「立约经公证」notarize 产层段（notary 产层 12→20）；太阳誓约读 notarize 违约惩罚（notary payoff 从真空落地 38.2→66.8）；正义审判 obedience 耗层+notarize 铁证双读段（judgment payoff landed，41.5→71.8）；太阳使者补 obedience 产层；召唤圣光 daylight 产层+日照 daylight 读层（light 产层 20、日照 landed）；神圣之光读 blessing、正义审判读 notarize（跨轴 0→2）；终焉颂歌读 grazed_soul（跨系 0→1，安魂超度）；light enablers 核正（太阳光环/光之权柄移出） | 本轮 |
| 2026-09-29 | 药师 `apothecary` | 47.5 → **65.7** | 四身份状态补层数引擎（prepared_draught/beast_sense/crimson_vitality/moon_cycle，身份 8→15×4）；brew：药剂调配/草药敷贴 prepared_draught 产层 + 草药敷贴读层（30.5→65，真空落地）；beasts：enablers 核正（动物感官/野性直觉双实证）+ 狂兽突袭 beast_sense 读层 + prepared_draught 跨轴（33.8→66）；crimson：黑暗之翼 crimson_vitality 产层 + 腐蚀之爪读层（35→66，真空落地）；moon：满月 moon_cycle 产层实证 + 黑暗凝视读层 + 血月当空 nightfall 跨系（界域延长）与 crimson_vitality 跨轴（血族之月） | 本轮 |
| 2026-09-29 | 仲裁人 `arbiter` | 47.7 → **62.2** | marked/castigated/authority 补层数引擎（身份 8→15×3）；inquest：察觉异常「察觉即标记」产层 + 精神刺穿读 marked（39→67）；sanction：处决「先定罪后行刑」castigated 产层 + 审判之剑/审判读 castigated（50.8→70+）；jurisdiction：enablers 核正（分割战场补 authority 产层）；decree：enablers 补禁制追击/秩序领域（挂 decree 状态）；跨轴×2：审判之剑→authority、均衡分割→authority；跨系无可读枢纽（confused/fate_chaos 非轴身份）留遗留；主被动比 3.44 待补被动卡 | 本轮 |
| 2026-09-29 | 通识者 `savant` | 49.7 → **62.9** | analysis_authority/enlightened 补层数引擎（身份 8→15×2）；lore：鉴定补产层+解析透彻读层（43→74）；civilization：导师「导师即启迪」产层+读 construct（跨轴）、毁灭新生读 enlightened（44→70+）；astral：虚假星象补 law_edit 产层、星之祝福读 law_edit+enlightened（56.5→70+）；craft：炼成/考古发掘召唤者 construct 计数产层、机械维修读 construct（63.8→70+）；跨轴×2（导师→construct、星之祝福→enlightened）；跨系无可读枢纽（law_breach/law_authority 非轴身份）留遗留 | 本轮 |
| 2026-09-29 | 收尸人 `corpse_collector` | 50.0 → **65.0** | puppet_string/journeys_end/spirit_sight/corpse_nature 补层数引擎（身份 8→15×4，puppet_string 在 seer 属枢纽状态同修）；undead：enablers 核正（亡者标记无此卡移除、亡者之语移出，通灵补 puppet_string 产层，产层 5→20，轴 44→60+）；end：死亡权柄补 journeys_end 产层、苍白世界 if/else 读 journeys_end 界域 3→4 回合（payoff 升 landed）；spirit_sight：enablers 核正为天然灵视/灵视觉醒/死兆预感（产层 20）、死亡之眼读 spirit_sight 伤害+1（payoff 升 landed）；corpse 真空轴仅引擎修复（真空轴已拍板接受）；跨轴×2（死亡权柄读 puppet_string end→undead、幽冥窥视读 corpse_nature spirit_sight→corpse）；跨系无可读枢纽（purify/occult_seal 非轴身份）留遗留；主被动比 1.33 被动偏多留遗留 | 本轮 |
| 2026-09-29 | 偷盗者 `thief` | 50.6 → **70.3** | deep_parasitized/stolen_time 补层数引擎（身份 8→15×2）；parasite：窃取身份补产层+读层、混淆分身补读层（读层 0→25，轴 34→66+）；chrono：衰老补 stolen_time 产层（命运缝隙不挂移出 enablers）、嫁接命运读 stolen_time 升 landed（轴 36.2→66+）；deceit：精神干扰补 misdirect 产层、欺诈规则读 misdirect 升 landed（轴 42→66+）；steal：enablers 核正（卓越观察/窃取记忆/错误移出）、窃取权柄补产层、窃取读 stolen_ability 升 landed（赃物在手，轴 42.5→66+）；跨轴×2（欺诈规则→deep_parasitized、窃取权柄→stolen_time）；跨系×2（寄生→seer puppet_string、衰老→assassin doom）；规模均衡（steal 15/parasite 5 卡）与 gauge_threshold frameworkFlag 待裁定留遗留 | 本轮 |
| 2026-09-29 | 罪犯 `criminal` | 51.4 → **58.7** | filth：污秽之语补 filth 产层（产层 12→20）、荒芜侵蚀·改读 filth 升 landed（payoff notes→landed）；demon：恶魔化补 rite_mark 产层（产层 12→20）、深渊召唤读 sulfur_toxin 跨轴（demon→elements）；elements：强酸沼泽补 sulfur_toxin 产层、地狱之火读 sulfur_toxin 升 landed（产层 12→20）；vice：恶欲共鸣入 enablers（产层 12→20）、欲望爆炸读 lust 池 ≥6 失控档升 landed；四轴 min 63（轴健康度 -5 摘除）；污秽之语三选一 AST 缺死/堕落分支、vice Pool 阈值档框架件、frameworkFlags 8 项待裁定留遗留 | 本轮 |
| 2026-09-29 | 战士 `warrior` | 51.7 → **66.4** | weapon_grandmaster/ambush_shroud 补层数引擎（身份 8→15×2）；martial：兵械通晓补产层、payoffs 核正（巨力挥击无此卡移除→无坚不摧读层升 landed，产层 12→20，轴 35→63+）；hunt：猎魔之眼补产层、晨曦领域读 ambush_shroud 升 landed（产层 12→20）；guard：守护姿态无此卡移除→黎明铠甲补产层（产层 12→20）；twilight：暮色侵蚀无此卡移除→迟暮/黄昏重生实证 enablers（产层 5→20）；跨轴×1（猎魔之眼→weapon_grandmaster）+黄昏巨剑自动跨轴消费；跨系×2（猎魔之眼→seer puppet_string、隐蔽→sleepless conceal_authority，跨系 0→有）；martial 轴 15 卡规模失衡、无 binding guardianship 语义待内核确认留遗留 | 本轮 |

## 真空轴甄别（2026-09-29 主人拍板，草案已结案）

> 原「待确认草案」表已按拍板结论落到轴数据并删除。结论：
> - **接受 12 轴**为合法纯产层：`payoffVacuumAccepted:true` 已写入轴数据（chanter/hymn、lawyer/brute、monster/inspiration、monster/cycle、reader/mimic、reader/foresight、seer/trick、seer/miracle、pryer/scroll、pryer/astral、corpse_collector/corpse、warrior/guard），读层闭环维度记 12 分保底。warrior/guard 理由按 2026-09-29 私有化后事实改写（guardianship 私有，收益=承伤重定向运行时语义）。
> - **17 轴未接受**（读层维度 0 分），列为环节⑤重设计补卡候选，按下表归组排期。

### 补卡候选（17 轴，按途径归组，环节⑤排期依据）

- **apothecary ×3**：brew（药剂 prepared_draught）/ beasts（beast_sense）/ crimson（crimson_vitality）——三轴全真空，比照 moon 轴补层数经济
- **chanter**：notary（公证裁定链，正义审判已读 guilty，notary 该有回款卡）
- **lawyer**：advocacy（寻隙 chink_finding，穿甲体系该有读层 payoff）
- **planter**：alchemy（炼成阶梯 matter_ladder，人偶制造产耗捆绑可拆独立读档卡）
- **pryer**：combat（格斗 knowledge_strain 无人消费——2026-09-29 已自 common energy_strain 分叉私有化）
- **reader**：arcana（仪式专精 ritual_expertise 单向自 buff）
- **sailor**：authority（tyrant_dread 无收束卡）
- **spectator ×3**：suggestion（subconscious_edit）/ dream（梦境轴身份悬空）/ fantasy（written_truth）
- **supplicant**：corruption（defile 纯产无收）

- **thief ×4**：steal / deceit / parasite / chrono——全轴产耗断裂，conversionNotes 意图已写卡面未落，补条件段即可（优先级最高）
