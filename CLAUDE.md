# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库性质：纯文档库，无代码

本仓库是 Roguelike 爬塔卡牌游戏**战斗内核**的 DDD 领域设计文档库（全部中文），不含实现代码——没有 package.json、没有构建/测试/ lint 命令，不要去寻找。

- 曾有一套 TypeScript 实现（约 8600 行 + 89 测试），2026-09-05 随仓库重新定位移除，完整保留在 git 历史 `7e6d01f`，需要时可全量取回。
- 实现落点在游戏主项目（仓库外）；爬塔派发/构筑（Draft/Progression）等战外上下文也归主项目，不在此处。
- 文档即产物：改文档就是改设计。提交信息用中文 + conventional 前缀（`docs:` / `refactor:` 等）。

## 文档地图

```
docs/meta/           流程·规范·提案（工作流与生成约束，先读 WORKFLOW.md）
├─ WORKFLOW.md       当前 AI 工作流定义：设定→机制→JSON→分析 四环节流水线与完成门槛
├─ GENERATION_BRIEF.md  技能池生成规范，当前 v0.3；§7–§9 是旧框架编号 → DDD 落点速查
├─ REGEN_v03_SPEC.md    v0.3 批量重构规范
├─ SCHEMA.md         JSON 结构规范（改结构前必读；含已知待修数据清单）
├─ PENDING.md        途径级遗留与待办汇总（自技能稿迁移）
└─ proposals/        提案与分析底稿（原语扩展×2、SKILLS_ANALYSIS.md）
docs/ddd/            战斗内核 DDD 设计（权威正源，纯内容）
├─ README.md         入口：上下文总览、依赖方向、一致性边界、54 条不变量总表
├─ contexts/         7 限界上下文 + 共享内核（结构/概念）
└─ params/           各上下文参数与取值域（数值/枚举）
docs/json/           技能池 JSON（唯一维护面，2026-09-18 起技能稿 md 已归档）
├─ manifest.json    索引（schema 版本 / 稀有度映射 / 状态 ID / 各途径卡片数）
├─ <途径>.skills.json ×22  结构化 AST 卡面；sourceFile 溯源回指归档技能稿
└─ schema/          JSON Schema draft 2020-12（skills/manifest.schema.json）
docs/archive/        只读历史快照
└─ skill-design_v0.3/  技能稿 md ×22（生成期源数据，勿改；差集信息已回收进 JSON）
docs/analysis/       纯分析产物（勿手改，重跑 docs/tools/ 脚本生成）
├─ SKILLS_OVERVIEW.md              全库总览（22 途径分章 / 828 卡）
├─ SKILLS_ANALYSIS_BY_PROFESSION.md  原语用量 + modify_stat/modify_resource 属性与参数统计
└─ analysis_by_profession/           22 份「职业 × 构筑轴」设计风格报告
docs/tools/          全部脚本（校验 + 生成）
├─ validate.py      语义校验器（无依赖）：python docs/tools/validate.py
├─ validate_schema.py  结构校验器（需 jsonschema）：python docs/tools/validate_schema.py
├─ check_enum_sync.py  枚举对账（ddd/SCHEMA.md ↔ schema）：python docs/tools/check_enum_sync.py
├─ check_glossary.py   词典对账（值域 ↔ meta/glossary.json）：python docs/tools/check_glossary.py
├─ build_overview.py / build_profession_analysis.py / build_axis_analysis.py
docs/诡秘之主资料库/  原著设定源素材（世界体系/九大源质/界域机制/职业对照表）——工作流① 设定补全的落点
```

新增设计内容先判断归属：结构/概念 → `contexts/`，取值域/数值 → `params/`，内容设计（技能卡）→ `json/`（直接改 JSON，先改 schema）。

## 必须知道的架构大图（跨文件才能读出）

- **整场战斗一个聚合，根是 `Combat`**；对外契约 `CombatSetup → CombatEnded`。Unit 不是聚合根。
- **纯函数契约：结果 = f(初始状态, 输入序列, seed)**。为此 Catalog（全部定义态 Def）是独立不可变聚合，战斗启动时快照进战斗内；随机源可播种、可快照。可复现 ≠ 禁随机。
- **Definition + Grant 三件套**（EffectDef→EffectRef→Effect、StatusDef→StatusGrant→StatusInstance 等）：默认值只写 Def、实例值只写 Grant，Grant 不可变。
- **效果原语 27 个**（以 `docs/json/schema/skills.schema.json` 的 `effect.oneOf` 为权威源，`check_enum_sync.py` 对账）：damage / heal / mount_status / modify_stat / modify_resource / move / spawn / dispel / drain / domain / translocate / snapshot / restore_snapshot / modify_damage / target_override / transfer_status / echo_last_skill / gauge_shuffle / status_shuffle / modify_skill / modify_status / modify_targetability / reveal / grant_immunity / take_control / write_rule_slot / modify_rule_slot。**12 个触发点封闭集**（`docs/ddd/params/执行参数.md` §2.1）。新增原语须先在 `docs/meta/SCHEMA.md` §5.2 登记再改 schema，否则 `check_enum_sync.py` 报漂移。
- **随机性治理 R1–R6**：伤害/目标选择零随机；概率写成 `EffectRef.condition: {kind:'chance',p}`（没有 Chance 算子），须登记、单次抽样、只用于非伤害维度；落空/阻挡语义一律用 charges 次数型状态的确定性写法（2026-09-04 裁决，R5 不开例外）。

## 编辑纪律（违反会踩坑）

1. **`docs/ddd/` 保持"纯内容"**：只描述当前最终模型——不写拍板过程、不写版本变迁、不写例子、不标来源编号。来源与演进留在 git 提交里。
2. **旧编号速查在 brief §7**：技能稿引用的 A–H 组 / v1.5 A1–A24 编号，落点全部并入 `docs/meta/GENERATION_BRIEF.md` §7–§9。`LEGACY_REFS.md`、`框架改动记录.md`、`待拍板清单_来自v1.5.md` 均已删除，**不要引用**（原文在 git 历史）。⚠️ A 编号有两套来源，引用前查 §7 区分。
3. **v0.3 新维度（界域/位格/迷失/性别/吟唱）已于 2026-09-06 融入 ddd**：界域三件套（DomainDef→Grant→Instance，base/hero/overlay 压制栈）、domain/translocate 第 10/11 原语、位格 rank（stat_compare 零新谓词）、迷失值（每英雄 Pool+阈值档）、gender_shift/gender_is、interrupt 打断标志。落点与拍板结论索引在 `docs/meta/GENERATION_BRIEF.md` §14。
4. **Edit 工具对部分中文短语会匹配失败**（疑似零宽字符/异码点，报 "String to replace not found"）。绕过法：Python 按行首前缀整行重写（`io.open(encoding="utf-8")` + `startswith` 定位 + 整行替换/插入）。
5. **数值锚点与硬约束清单**：写/改技能卡前必读 brief §1–§3（九原语、15+burn 状态、单卡预算 ≈3能量≈6伤害≈10%最大生命）与 `.workbuddy/memory/MEMORY.md` 的「硬约束」节（B1/A22/A21/INV-S5/INV-P7/INV-C2）。
6. **改 JSON 结构先改 schema**：`docs/json/schema/skills.schema.json` 是技能池的结构标准（规范说明在 `docs/meta/SCHEMA.md`）。新增/删除字段、扩枚举都**先改 schema 再改数据**；改完跑 `docs/tools/validate_schema.py`（结构）+ `docs/tools/validate.py`（语义）+ `check_enum_sync.py` + `check_glossary.py`（词典词条），四者全绿才算合规。（技能稿 md 已于 2026-09-18 归档为只读快照，原 md↔JSON 骨架对账脚本 `check_pool_sync.py` 已废弃，不再登记；WORKFLOW.md 环节③ Gate 同为「四脚本全绿」。）

## Git 工作方式（血泪教训）

- **批量编辑务必当轮 `git commit`**，不留未提交改动跨会话——曾发生工作树 `docs/` 整目录被清空（靠 `git checkout HEAD -- docs/` 还原）。
- 中文路径：`git show`/`git status` 输出会八进制转义不可读，用 `git -c core.quotePath=false ...`。
- commit message 避免「中文 + 反引号」组合（bash 命令替换会吃掉词），用单引号或 `-F` 传文件。
- 用户此前要求**先不 push**；只 commit，push 需明确要求。

## .workbuddy/

gitignore 的本地智能体工作记忆（含 ima 知识库同步脚本），不进版本库。其中 `memory/MEMORY.md` 的「引擎现状」「代码与文档偏离」两节描述的是**已移除的 src/ 实现**，已过时——以本文件与 `docs/ddd/` 为准。
