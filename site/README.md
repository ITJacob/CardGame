# 技能池数据站

纯静态、零依赖的技能池数据展示站点。数据直接来自 `../docs/json/`（卡片 + 状态）与 `../docs/meta/glossary.json`（术语词典），浏览器端现取现算，无构建步骤。

## 页面

- **卡片浏览** `#/cards`：按途径/构筑轴/稀有度/类型/序列/原语/距离筛选 + 关键词搜索，卡片详情含效果 AST 的中文精读
- **术语词典** `#/glossary`：英文枚举 key → 中文名 + 解释（原语、算子、条件谓词、触发点、目标锚点等 61 类 300+ 词条），可搜索
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

## 移动端

- **PWA（仅可安装）**：`manifest.webmanifest` + `sw.js`——SW 是最小实现，只用满足浏览器的「可安装」判定，**不缓存任何资源**。装到主屏后 standalone 全屏、无地址栏。图标为占位图（`icons/`），换正式图标改 manifest 的 `icons` 即可。
  **未启用离线**：断网打开会白屏。数据在 `../docs/json/`，位于 SW 的 scope 之外，要做离线须把 SW 挪到仓库根。
- **术语浮层**：鼠标设备悬停跟随光标；触屏改为点击后居中弹出、点浮层外关闭（`js/tooltip.js` 用 `matchMedia('(hover: hover) and (pointer: fine)')` 分流，触屏分支走捕获阶段以拦下卡片列表自身的跳转点击）。
- **响应式**：断点 768px（词典双栏转单栏、热图表头去 sticky）与 640px（顶栏换行、搜索框独占一行、键值表转单列、词典表格转卡片式堆叠——`thead` 隐藏后 `<th>` 上的内联固定列宽随之失效）。网格轨道用 `minmax(min(Npx, 100%), 1fr)`；词典表格的 key/解释列改用 `overflow-wrap: anywhere`，否则 `push_back/pull_forward/…` 这类斜杠串成的枚举清单是一整块不可断的内容，会把整列顶破。

## 维护约定

- 新增枚举值：先登记 schema/`docs/meta/SCHEMA.md`，再补 `docs/meta/glossary.json` 词条；跑 `python docs/tools/check_glossary.py` 对账，它会列出待补录清单（0 缺词条即站点不会再出现橙色「未收录」）。
- 页面上出现橙色「未收录」token = 词典缺词条（控制台同时有 `[术语未收录]` 告警）。
- 状态/途径/构筑轴的中文名直接来自数据文件（`*.statuses.json`、`manifest.json`、各 `axes`），不进词典。
- 悬停状态名时，除词典释义外还会展开该状态自身的 `duration/maxStacks/charges/dispelable` 与 `effects/triggers`（AST 复用 `ast.js` 渲染器）；`modifiers` 等其余字段尚未接入。
