# 逐职业重设计日志（REDESIGN LOG）

> 环节⑤（WORKFLOW.md）的执行记录：一途径一迭代，改前改后分 + 改动摘要。
> 评分口径见 `SCORING.md`，计分卡由 `score.py` 生成；本文件手维护，每次迭代记一行。

| 日期 | 途径 | 改前 → 改后 | 主要改动 | commit |
|---|---|---|---|---|
| 2026-09-26 | （基线建立） | — | score.py 首跑全库基线分，见 docs/analysis/scorecard.md；榜尾：pryer 45.9 / chanter 46.5 / corpse_collector 47.5 / apothecary 47.6 / arbiter 47.9 | c169205 |

## 待确认：真空轴甄别草案（2026-09-26 提出，主人未拍板）

> 背景：29 个 payoffs 为空的轴按 SCORING.md §二「逐轴甄别」裁定是否接受为合法纯产层。
> 接受的轴标 `payoffVacuumAccepted: true`（schema 已登记该字段），读层闭环维度记 12 分保底；
> 未接受的保持低分、列为环节⑤补卡候选。**主人拍板后把结论落到各轴数据并删除本表。**

### 拟接受（12 轴）——理由一句

- `chanter/hymn`（blessing 纯 enabler 轴）、`lawyer/brute`（amplified 自足件自带 nextAttack×2）
- `monster/inspiration`（咬合已由 calamity 承担）、`monster/cycle`（循环↔幸运耦合经 fortune 收束）
- `reader/mimic`（on_apply 自耗 echo 即 payoff 语义）、`reader/foresight`（charges 自耗减伤载荷）
- `seer/trick`（三自保状态自产自耗）、`seer/miracle`（miracle/wish_fulfilled 自闭环）
- `pryer/scroll`（层数 payoff 由 spell_lore 自带 thresholdTrigger 承载）、`pryer/astral`（ego_constellation 同）
- `corpse_collector/corpse`（身份是防御性自含 buff）、`warrior/guard`（借 common 机制桩，消费者是全库）

### 拟待补（17 轴）——补卡候选，按途径归组

- **apothecary ×3**：brew（药剂 prepared_draught）/ beasts（beast_sense）/ crimson（crimson_vitality）——三轴全真空，比照 moon 轴补层数经济
- **chanter**：notary（公证裁定链，正义审判已读 guilty，notary 该有回款卡）
- **lawyer**：advocacy（寻隙 chink_finding，穿甲体系该有读层 payoff）
- **planter**：alchemy（炼成阶梯 matter_ladder，人偶制造产耗捆绑可拆独立读档卡）
- **pryer**：combat（格斗 energy_strain 无人消费）
- **reader**：arcana（仪式专精 ritual_expertise 单向自 buff）
- **sailor**：authority（tyrant_dread 无收束卡）
- **spectator ×3**：suggestion（subconscious_edit）/ dream（梦境轴身份悬空）/ fantasy（written_truth）
- **supplicant**：corruption（defile 纯产无收）
- **thief ×4**：steal / deceit / parasite / chrono——全轴产耗断裂，conversionNotes 意图已写卡面未落，补条件段即可（优先级最高）
