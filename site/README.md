# 技能池数据站

纯静态、零依赖的技能池数据展示站点。数据直接来自 `../docs/json/`（卡片 + 状态）与 `../docs/meta/glossary.json`（术语词典），浏览器端现取现算，无构建步骤。

## 页面

- **卡片浏览** `#/cards`：按途径/构筑轴/稀有度/类型/序列/原语/距离筛选 + 关键词搜索，卡片详情含效果 AST 的中文精读
- **术语词典** `#/glossary`：英文枚举 key → 中文名 + 解释（原语、算子、条件谓词、触发点、目标锚点等 61 类 300+ 词条），可搜索
- **统计分析** `#/stats`：**卡面口径**（只算 `*.skills.json` 的 effects）——稀有度/序列/途径分布、原语与算子用量、途径×原语热图等（口径对齐 `docs/tools/build_profession_analysis.py`）
- **状态统计** `#/statuses`：**状态定义口径**（只算 `*.statuses.json` 的 statusDefs）——分类/途径/触发点分布、持续与叠层刻度、状态面原语用量、分类×原语热图、`statusDef` 字段填充率

两个统计页面是**分开的两套口径**，不是同一批数据的两种视图：卡面效果与状态定义里的效果是两族文件、两处统计。跨页面看「原语」时注意这个区别。

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
- **响应式**：断点 768px（词典双栏转单栏）、640px（顶栏换行、搜索框独占一行、键值表转单列、词典表格转卡片式堆叠——`thead` 隐藏后 `<th>` 上的内联固定列宽随之失效）与 580px（热图列折叠，见下）。网格轨道用 `minmax(min(Npx, 100%), 1fr)`；词典表格的 key/解释列改用 `overflow-wrap: anywhere`，否则 `push_back/pull_forward/…` 这类斜杠串成的枚举清单是一整块不可断的内容，会把整列顶破。
- **热图列折叠**：≤580px 默认只显示用量最高的 9 列，勾「显示全部」才展开（展开态钉住首列）。**折叠列数在 `js/charts.js` 的 `HEAT_TOP_COLS` 与 `css/app.css` 的 `:nth-child(n+11)` 两处写死，改一处必须同步改另一处**——选择器把「1 列行头 + 9 列数据」刻进 CSS，两边不一致会露出 10 列却提示 9 列。折的是列不是数据：色阶上限始终在整个矩阵上取，同一数值在任何视图下颜色一致（否则就是「筛掉一列就换配色」那类误导）。两个统计页共用 `js/charts.js`，不各写一份。
- **长键条形图**：`.panel.wide-labels` 把标签列从 130px 放宽到 190px（窄屏 120px），给 `untargetableByTargeted`、`thresholdTrigger` 这类长键用；不放宽会被省略成 `untargetableB…`，认不出是哪个键。

## 维护约定

- 新增枚举值：先登记 schema/`docs/meta/SCHEMA.md`，再补 `docs/meta/glossary.json` 词条；跑 `python docs/tools/check_glossary.py` 对账，它会列出待补录清单（0 缺词条即站点不会再出现橙色「未收录」）。
- 页面上出现橙色「未收录」token = 词典缺词条（控制台同时有 `[术语未收录]` 告警）。
- 状态/途径/构筑轴的中文名直接来自数据文件（`*.statuses.json`、`manifest.json`、各 `axes`），不进词典。
- **「声明面」读自 schema 而不是前端硬写**：统计页的「schema 声明 27 条原语」「statusDef 声明的 44 个字段」都是从 `../docs/json/schema/skills.schema.json` 现读的（`data.js` 的 `readDeclared`）。硬写常量必然与 schema 漂移，而「声明了多少 / 实际用了多少」正是这两页要展示的东西。schema 取不到时退回「声明面 = 实际用过」的降级展示，不阻断加载。
- `manifest.statusIds` 是**中→英兜底**（只带 id/name 的占位项），真实定义在 `*.statuses.json`。合并时真实定义必须能盖掉占位项——`mergeStatuses` 以「有没有 `category`」判定占位项（`category` 是 schema 里 statusDef 的 required 字段）。写反了的话，既在 manifest 里又有定义的 18 个状态（burn/poison/regen/conceal/guard…）会永远只剩一个名字，悬停看不到持续/层数/可驱散与 effects/triggers。
- 悬停状态名时，除词典释义外还会展开该状态自身的 `duration/maxStacks/charges/dispelable` 与 `effects/triggers`（AST 复用 `ast.js` 渲染器）；`modifiers` 等其余字段尚未接入。
