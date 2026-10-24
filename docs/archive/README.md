# docs/archive/ 归档索引

> 只读历史快照。此处内容不再维护；现行设计以 `docs/ddd/`（权威正源）、`docs/json/`（唯一维护面）、`docs/meta/`（流程·规范）为准。
> 归档判断：已完成使命（机制已落地正典 / 分析已被重生成产物取代 / 一次性迁移脚本跑完）。

## 顶层

| 路径 | 原位置 | 归档原因 |
|---|---|---|
| `skill-design_v0.3/` | docs/ | 技能稿 md 生成期源数据，2026-09-18 起差集信息已回收进 JSON，只读快照 |
| `REGEN_v03_SPEC.md` | docs/meta/ | v0.3 批量重构规范，重构已完成并归档技能稿，现行流程见 WORKFLOW.md |
| `status_bloat_review.md` | docs/analysis/ | 2026-09-19 一次性私有状态审视报告（试点已执行，结论已并入 PENDING），非重生成产物 |

## proposals/（机制提案，落地后即归档）

| 路径 | 结局 |
|---|---|
| `原语扩展_行为层修改.md` | ✅ 已落地 schema v1.2.0：modify_skill / modify_status / disallowActions（ddd 效果参数为权威源） |
| `原语扩展候选_维度盘点与原著映射.md` | ✅ 缺口已由后续原语落地消化（reveal / modify_targetability / grant_immunity / modify_status 族），27 原语封闭集以 schema effect.oneOf 为权威源 |
| `战场时间-昼夜时钟.md` | ✅ 机制已落 ddd 参数层 + schema，dimHook 存量卡挂钩已完成（17 途径文件在用） |
| `SKILLS_ANALYSIS.md` | 2026-09-14 分析底稿（828 卡期），已被 `docs/tools/` 重生成产物取代：总览=SKILLS_OVERVIEW.md，职业统计=SKILLS_ANALYSIS_BY_PROFESSION.md，评分=scorecard.md |
| `element-linkage.md` | ✅ 2026-10-24 收官：元素共鸣 1–4 档、相消（×0.85 + 削 1 层）、`StatusDef.tags` + `has_status_tag` 全部落地；残留（首个正式读 tag 卡、词汇表、元素态覆盖）在 `docs/meta/待办.md` §二 |
| `summon-first-class.md` | ✅ 2026-10-23 P0–P3 全部落地：`kind:"summon"`、37 具 unitDef、召唤谓词、corpse 2 张转 summon、cap 基数 3 + 维持费型特权 |
| `site-blueprint-refactor.md` | ✅ 2026-10-22 拍板并落地：`#/blueprint` 与 22 途径蓝图页、`blueprints.json`、四页接入（P0–P4 全部完成） |

## meta/（一次性诊断、已完成专项）

| 路径 | 结局 |
|---|---|
| `PENDING.md` | 技能稿期落地总账（抽离进现行清单前的未完成项与出处） |
| `REDESIGN_LOG.md` | 环节⑤逐职业重设计日志（改前/改后分 + 改动摘要） |
| `机制期诊断与推进工作流_2026-10-18.md` | 2026-10-18 一次性诊断（评分体系/指纹/checklist 三件套 + 推进工作流）；可用部分已并入 `docs/meta/WORKFLOW.md` 玩法轨与环节⑥ |
| `差异化重构计划.md` | 2026-10-01 差异化专项推进计划；阶段二 2026-10-03 全途径收官，阶段三并入平衡期 |
| `途径风格诊断.md` | 上述专项的同批诊断（为什么同质）；身份目标仍由 `docs/meta/途径设计身份.md` 承载 |
| `选靶重构设计.md` | 选靶几何化设计稿；2026-10-17 选靶 V2 全库迁移完成，现行权威 = `docs/ddd/params/共享内核参数.md` §一 |
| `轴选靶签名设计.md` | 88 轴选靶签名设计稿；签名已写入卡池，现行权威 = 卡面 `target` + `SCORING.md` 签名键口径 |

## tools/（一次性迁移脚本，跑完即归档）

| 路径 | 用途（历史） |
|---|---|
| `extract_statuses.py` | 技能稿 md → statuses.json 抽取 |
| `consolidate_statuses.py` | 状态定义合并 |
| `split_divergent_ids.py` | 同名异义状态拆 id（stealth 拆 shadow_veil 试点） |

> 仍活跃的共享 loader `status_loader.py` 留在 `docs/tools/`（validate/score/validate_schema 四个脚本在用）。
