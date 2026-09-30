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

## tools/（一次性迁移脚本，跑完即归档）

| 路径 | 用途（历史） |
|---|---|
| `extract_statuses.py` | 技能稿 md → statuses.json 抽取 |
| `consolidate_statuses.py` | 状态定义合并 |
| `split_divergent_ids.py` | 同名异义状态拆 id（stealth 拆 shadow_veil 试点） |

> 仍活跃的共享 loader `status_loader.py` 留在 `docs/tools/`（validate/score/validate_schema 四个脚本在用）。
