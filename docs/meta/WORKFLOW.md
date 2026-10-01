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
| ④ | 质量分析 | `docs/analysis/` | `build_analysis.py` **统一入口**一键重生成评分+统计全部产物（scorecard / scores.json / 总览 / 职业统计 / 轴报告），评估技能池质量 | 产物勿手改，统一入口重跑生成 |
| ⑤ | 重设计迭代 | `docs/json/` + `docs/meta/REDESIGN_LOG.md` | 按 `SCORING.md` 评分取**榜尾途径**逐个重设计：诊断失分项 → 改 axes/cards/statuses → 重跑 `score.py` 确认涨分 | 四脚本全绿 + 该途径总分较改前上涨；一途径一 commit，改前改后分记入 REDESIGN_LOG |

## 环节⑤：逐职业重设计推进（2026-09-26 建立）

```
score.py 评分 → 取总览榜尾途径 → 读计分卡失分项（scorecard.md / 网页评分页）
  → 设计修改（优先序：补读层 payoff 卡 → 补层数引擎 → 提多样性/连通）
  → 四脚本门禁 → 重跑 score.py 确认涨分 → commit → REDESIGN_LOG 记一行
```

- **节奏**：一途径一迭代，一次会话 1–2 个途径；不跨途径批量改（失分归因会糊）。
- **风格驱动**（2026-10-01 差异化专项起）：立项优先序前置「签名键空白/发芽」——每途径身份卡（原著锚/签名键/红线/差距）见 `途径设计身份.md`，推进规则与 11 批排队表见 `差异化重构计划.md`；风格迭代轮验收加一条：第七维「风格签名」只增不减（口径见 SCORING.md）。
- **真空轴**先过甄别（`payoffVacuumAccepted`，SCORING.md §二）：接受的不补卡，未接受的才是补卡候选。
- score.py 只读、随时可跑：它进门禁但不阻塞——防「越改越差」无感知。
- 评分只评**结构与设计丰富度**，不治数值；数值标定属平衡期，另开工。

## 分析与评分工作流（2026-09-30 整合）

评分（score.py）与统计（build_* ×4）同源同面：全部只读 JSON、产物全部落 `docs/analysis/`、全部勿手改。
**统一入口**：`python docs/tools/build_analysis.py`——依次跑 score + 四个 build 脚本，任一失败非零退出。

**何时跑**：`docs/json/` 任何变更（改卡 / 改轴元数据 / 改状态），四门禁全绿后**同轮**跑本入口，
产物与 JSON 变更进同一 commit——网页评分页与计分卡永远与 JSON 同代。数值标定期（下一批）改 JSON 后同样走本流程，时效性由「同轮 commit」保证。

**产物清单与消费**：

| 产物 | 生成者 | 消费 |
|---|---|---|
| `scorecard.md` | score.py | 人读计分卡（环节⑤取榜与失分归因的唯一依据） |
| `scores.json` | score.py | 网页评分页**唯一**数据源（前端不重算；口径单一来源 = SCORING.md） |
| `SKILLS_OVERVIEW.md` | build_overview.py | 全库总览（22 途径分章 / 832 卡） |
| `SKILLS_ANALYSIS_BY_PROFESSION.md` | build_profession_analysis.py | 职业 × 原语用量矩阵 + modify_stat/resource 参数统计 |
| `analysis_by_profession/*.md` ×22 | build_axis_analysis.py | 职业 × 构筑轴设计风格报告 |
| `ENTITIES_ANALYSIS.md` | build_entity_analysis.py | 编目三件套统计（召唤物 / 区域 / 界域：池清单 + 分布 + 卡面用法；口径与网页端统计分析页三子页一致） |

**纪律**：
1. 产物不手改；脚本内禁写死快照数字（2026-09-14 基线底稿 SKILLS_ANALYSIS.md 已归档 docs/archive/proposals/，旧「口径核对」对差表已撤）。
2. 新增统计维度 = 新增 build 脚本并登记进 `build_analysis.py` 的 STEPS，不另立入口。
3. score.py 只读、进门禁但不阻塞；任何计分口径变更先改 `SCORING.md` 再改 score.py，两者同 commit。

## 当前阶段

**数值标定期收官**（2026-10-01 更新）：

- ①–③ 框架补全 + 环节⑤ 逐职业重设计（17 途径迭代）+ 四批遗留（内核裁定/跨系/Pool 档/补卡）全部销账，全库途径分带 **70.1–78.6**、无 <50 非真空轴（技能池 22 途径 / 832 卡）。
- **途径差异化专项启动**（2026-10-01）：诊断/身份/计划三文档 + 评分第七维「风格签名」+ 风格距离基线（见 `差异化重构计划.md`）；阶段二按排队表逐途径风格迭代，与平衡期并行推进。
- 评分/统计产物统一由 `docs/tools/` 脚本重生成（见下「分析与评分工作流」），网页评分页同源消费。
- **数值标定六步全部落地**（数值标定基准 §六）：时间回归 / 费用回填 / 效果层梯度 / 直伤梯度校验（A 轨重拍 brief 锚点）/ 乘区过堂 / 层数定值 / 句尾 ⚠️D 清理 + tentative 翻转——822 卡翻 `false`，余 10 卡带真实欠账（盲区/待拍板类）保留 `true`。
- 下一阶段 = **平衡期**（实战试玩回调）：余量 ⚠️D 63 处（卡 10 / 状态 53）为平衡期入口清单；评分体系只评结构，不作平衡依据。

## 协作纪律（跨环节）

1. **权威优先级**：`ddd/` > brief > JSON > 分析产物。冲突时以 ddd 为准回改下游。
2. **源头唯一**：技能内容只改 JSON，统计产物一律由脚本生成，不手改。
3. **批量改动当轮 commit**，不留未提交改动跨会话。
