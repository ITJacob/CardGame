# 技能池数据站

纯静态、零依赖的技能池数据展示站点。数据直接来自 `../docs/json/`（卡片 + 状态）与 `../docs/meta/glossary.json`（术语词典），浏览器端现取现算，无构建步骤。

## 页面

- **卡片浏览** `#/cards`：按途径/构筑轴/稀有度/类型/序列/原语/距离筛选 + 关键词搜索，卡片详情含效果 AST 的中文精读
- **术语词典** `#/glossary`：英文枚举 key → 中文名 + 解释（原语、算子、条件谓词、触发点、目标锚点等 57 类 300+ 词条），可搜索
- **统计分析** `#/stats`：稀有度/序列/途径分布、原语与算子用量、途径×原语热图等（口径对齐 `docs/tools/build_profession_analysis.py`）

## 本地运行

必须在**仓库根目录**起本地服务（浏览器 fetch 不支持 file://）：

```
python -m http.server 8000
# 打开 http://localhost:8000/site/
```

## 线上（GitHub Pages）

Pages 源 = main 分支 / 仓库根。访问 `https://<user>.github.io/<repo>/site/`。
所有资源与数据引用均为相对路径（`../docs/...`），本地与 Pages 前缀环境通用。

## 维护约定

- 新增枚举值：先登记 schema/`docs/meta/SCHEMA.md`，再补 `docs/meta/glossary.json` 词条。
- 页面上出现橙色「未收录」token = 词典缺词条（控制台同时有 `[术语未收录]` 告警）。
- 状态/途径/构筑轴的中文名直接来自数据文件（`*.statuses.json`、`manifest.json`、各 `axes`），不进词典。
