# 工作流：从设定到技能质量分析

> 本文件定义当前 AI 协作产出的标准流水线。各环节产物归属见 CLAUDE.md 文档地图。

## 流水线总览

```
① 设定补全        ② 机制落地         ③ 技能结构化       ④ 质量分析
诡秘之主资料库/ →  ddd/（权威正源）→  json/          →  analysis/
（故事背景/源素材）  （战斗机制 DDD）   （技能池 JSON）    （统计 + 总览）
```

> 2026-09-18 起技能稿 md 环节取消：文字稿已完成历史使命（差集信息已回收进 JSON），归档为只读快照 `docs/archive/skill-design_v0.3/`，技能内容唯一维护面 = `docs/json/`。

流程规范与生成约束集中在 `docs/meta/`，全部脚本在 `docs/tools/`。

**依赖方向**：①→②→③→④ 单向推进。唯一允许的反向流动是 **③→②**：JSON 落地时发现 ddd 语义缺口（如 snapshot / modify_damage 原语），先拍板补定义再回写 JSON，拍板结论登记到 `GENERATION_BRIEF.md` §14。

## 各环节职责与完成门槛

| # | 环节 | 产物位置 | 干什么 | 完成门槛（Gate） |
|---|---|---|---|---|
| ① | 设定补全 | `docs/诡秘之主资料库/` | 补充世界体系 / 源质 / 界域 / 职业对照等原著设定素材 | 设定自洽，可被 ② 引用 |
| ② | 机制落地 | `docs/ddd/` | 把设定里的新维度（如界域/位格/性别/吟唱）落成原语、上下文、参数取值域 | 保持"纯内容"（无拍板过程/版本变迁）；拍板结论索引进 `GENERATION_BRIEF.md` §14 |
| ③ | 技能结构化 | `docs/json/` | 按 `GENERATION_BRIEF.md` 约束直接维护技能池 JSON（**改结构先改 schema 再改数据**，规范见 `docs/meta/SCHEMA.md`）；顺带补全 ddd 机制缺口 | 四脚本全绿：`validate_schema.py` + `validate.py` 双 0 错误；`check_enum_sync.py`（ddd/SCHEMA.md ↔ schema 枚举对账）0 漂移；`check_glossary.py`（值域 ↔ `glossary.json` 词条）0 缺词条 |
| ④ | 质量分析 | `docs/analysis/` | `docs/tools/` 脚本统计原语用量/构筑轴分布 + 全库总览（SKILLS_OVERVIEW.md），评估技能池质量 | 产物勿手改，重跑脚本生成 |
| ⑤ | 重设计迭代 | `docs/json/` + `docs/meta/REDESIGN_LOG.md` | 按 `SCORING.md` 评分取**榜尾途径**逐个重设计：诊断失分项 → 改 axes/cards/statuses → 重跑 `score.py` 确认涨分 | 四脚本全绿 + 该途径总分较改前上涨；一途径一 commit，改前改后分记入 REDESIGN_LOG |

## 环节⑤：逐职业重设计推进（2026-09-26 建立）

```
score.py 评分 → 取总览榜尾途径 → 读计分卡失分项（scorecard.md / 网页评分页）
  → 设计修改（优先序：补读层 payoff 卡 → 补层数引擎 → 提多样性/连通）
  → 四脚本门禁 → 重跑 score.py 确认涨分 → commit → REDESIGN_LOG 记一行
```

- **节奏**：一途径一迭代，一次会话 1–2 个途径；不跨途径批量改（失分归因会糊）。
- **真空轴**先过甄别（`payoffVacuumAccepted`，SCORING.md §二）：接受的不补卡，未接受的才是补卡候选。
- score.py 只读、随时可跑：它进门禁但不阻塞——防「越改越差」无感知。
- 评分只评**结构与设计丰富度**，不治数值；数值标定属平衡期，另开工。

## 当前阶段

**逐职业重设计期**（2026-09-26 起）：

- ①–③ 的框架补全已收官（PENDING 真缺口清零），技能池 v0.3+（22 途径 / 832 卡）。
- 重心转入环节⑤：按 `SCORING.md` 评分从榜尾途径逐个重设计（首榜尾：pryer / chanter / corpse_collector / apothecary / arbiter）。
- 数值平衡测试**未开始**；④ 的评分体系评结构与设计丰富度，不作为平衡依据。

## 协作纪律（跨环节）

1. **权威优先级**：`ddd/` > brief > JSON > 分析产物。冲突时以 ddd 为准回改下游。
2. **源头唯一**：技能内容只改 JSON，统计产物一律由脚本生成，不手改。
3. **批量改动当轮 commit**，不留未提交改动跨会话。
