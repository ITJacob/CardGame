# 逐职业重设计日志（REDESIGN LOG）

> 环节⑤（WORKFLOW.md）的执行记录：一途径一迭代，改前改后分 + 改动摘要。
> 评分口径见 `SCORING.md`，计分卡由 `score.py` 生成；本文件手维护，每次迭代记一行。

| 日期 | 途径 | 改前 → 改后 | 主要改动 | commit |
|---|---|---|---|---|
| 2026-09-26 | （基线建立） | — | score.py 首跑全库基线分，见 docs/analysis/scorecard.md；榜尾：pryer 45.9 / chanter 46.5 / corpse_collector 47.5 / apothecary 47.6 / arbiter 47.9 | c169205 |

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
