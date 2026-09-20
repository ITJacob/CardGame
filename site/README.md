# 技能池数据站

纯静态、零依赖的技能池数据展示站点。数据直接来自 `../docs/json/`（卡片 + 状态）与 `../docs/meta/glossary.json`（术语词典），浏览器端现取现算，无构建步骤。

## 页面

- **卡片浏览** `#/cards`：按途径/构筑轴/稀有度/类型/序列/原语/距离筛选 + 关键词搜索，卡片详情含效果 AST 的中文精读
- **领域模型** `#/ddd`：把 `../docs/ddd/` 的全部设计文档渲染成一页，每篇一节，左侧目录按 README 的「文档导航」分组。正文里的英文枚举 token 自动挂上词典释义，点击跳到对应的词典栏目
- **术语词典** `#/glossary`：英文枚举 key → 中文名 + 解释（原语、算子、条件谓词、触发点、目标锚点等 63 类 318 词条），每类带一句「这一维是什么」的栏目导语，可搜索
- **统计分析** `#/stats`：**卡面口径**（只算 `*.skills.json` 的 effects）——稀有度/序列/途径分布、原语与算子用量、途径×原语热图等（口径对齐 `docs/tools/build_profession_analysis.py`）
- **状态统计** `#/statuses`：**状态定义口径**（只算 `*.statuses.json` 的 statusDefs）——分类/途径/触发点分布、持续与叠层刻度、状态面原语用量、分类×原语热图、`statusDef` 字段填充率

两个统计页面是**分开的两套口径**，不是同一批数据的两种视图：卡面效果与状态定义里的效果是两族文件、两处统计。跨页面看「原语」时注意这个区别。

## 领域模型页

内容**现取**于 `../docs/ddd/*.md`，不往站点里复制一份——文档是唯一正源，复制必然漂移。

- **文档清单从 README 现读**（`js/md.js` 的 `parseToc` 解析 `docs/ddd/README.md` 的「文档导航」小节）。加一篇设计文档只需在 README 里加一行 `- [标签](./x.md)`，本页自动多一节。前端不硬写文件名列表。
- **Markdown 渲染器**（`js/md.js`）零依赖，只覆盖 ddd 实际用到的语法：标题/围栏代码/表格（含引用块内的嵌套表格，引用块是递归渲染）/嵌套列表/粗体/行内代码/链接/分隔线。认不出的行按段落输出，不猜语法。
  - 文档自身的 `#` 标题降一级渲染（`h1`→`h2`），因为「篇」这一级已经由面板标题占了。
  - **链接必须先于行内代码处理**：标签常写作 `` [`x.md`](x.md) ``，先换反引号会把标签变成占位符，`mdLink` 递归解析时按本层下标去查一个新的空 store，解析成空串——链接静默变成没有文字的锚点。
  - **表格的列切分不切码段内的竖线**：`| INV-B1 | 容量 | `|occupied(L)| ≤ |L.slots|` |` 这种行，GFM 要求写成 `\|`，但设计文档是手写的，按普通字符切会把码段撕成两半、页面上留下孤零零的反引号。
  - 指向 `docs/ddd/` 内的 `.md` 走页内跳转（`#/ddd/<篇名>`）；落在 ddd 之外的（如 README 引的 `../meta/GENERATION_BRIEF.md`）新开标签打开原始文件。
- **术语 token 关联**（`LINK_SPECIFIC` / `LINK_GENERIC`）：词典里有词条的英文枚举渲染成「中文 + 英文小字」，沿用全站的悬停浮层，另带 `#/glossary?cat=&q=` 深链。分两档——专有档（`on_tick`/`empty_ally_slot`/`push_back`…，取值本身就是领域专有写法）正文里也关联；通用档（`all`/`self`/`none`…）只在行内代码与表格单元格这类「一眼是取值」的位置关联，正文里的同形英文单词点成术语只会误导。**宁少勿多，误点比漏点更伤阅读。**
- **`#/glossary?cat=&q=` 深链**：`cat` 用于滚动定位到栏目（`#g-<类别>`），`q` 用于预填搜索框并顺手筛出该词条。不带参数从导航进来时**保留上次的筛选**，便于跳过去看完再回来接着看。
- **触屏**：`.md-tok` 在 `js/tooltip.js` 的触屏分支里被放行（不 `preventDefault`）——触屏没有悬停，拦下点击等于废掉跳转，而词典条目比浮层更全，跳过去本来就是更好的落点。

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
- **响应式**：断点 768px（词典/领域模型双栏转单栏）、640px（顶栏换行、搜索框独占一行、键值表转单列、词典表格转卡片式堆叠——`thead` 隐藏后 `<th>` 上的内联固定列宽随之失效）与 580px（热图列折叠，见下）。网格轨道用 `minmax(min(Npx, 100%), 1fr)`。
  **长标识要 `overflow-wrap: anywhere` 而非 `break-word`**：`push_back/pull_forward/…`、`corpse_collector/skill_xxx_s9_yyy` 这类下划线+斜杠串成的枚举清单是一整块没有断点的内容，`normal` 下会把整页顶出横向滚动；`anywhere` 与 `break-word` 的区别在于只有前者会压低 min-content。词典表格的 key/解释列、`.md` 正文（领域模型页）、栏目备注（`.cat-note`）各有一处。
- **热图列折叠**：≤580px 默认只显示用量最高的 9 列，勾「显示全部」才展开（展开态钉住首列）。**折叠列数在 `js/charts.js` 的 `HEAT_TOP_COLS` 与 `css/app.css` 的 `:nth-child(n+11)` 两处写死，改一处必须同步改另一处**——选择器把「1 列行头 + 9 列数据」刻进 CSS，两边不一致会露出 10 列却提示 9 列。折的是列不是数据：色阶上限始终在整个矩阵上取，同一数值在任何视图下颜色一致（否则就是「筛掉一列就换配色」那类误导）。两个统计页共用 `js/charts.js`，不各写一份。
- **长键条形图**：`.panel.wide-labels` 把标签列从 130px 放宽到 190px（窄屏 120px），给 `untargetableByTargeted`、`thresholdTrigger` 这类长键用；不放宽会被省略成 `untargetableB…`，认不出是哪个键。

## 维护约定

- 新增枚举值：先登记 schema/`docs/meta/SCHEMA.md`，再补 `docs/meta/glossary.json` 词条；跑 `python docs/tools/check_glossary.py` 对账，它会列出待补录清单（0 缺词条即站点不会再出现橙色「未收录」）。
- **每个栏目必须有 `desc`**（「这一维是什么」的概念说明，不是出处）：词典页把它渲染在栏目标题下（`.cat-desc`），缺了就退化成只有 key/中文/解释的裸表，读者看不出这一维在整体里管什么。`check_glossary.py` 把这条做成硬门槛（缺则 exit 1），新加栏目别漏。
- 页面上出现橙色「未收录」token = 词典缺词条（控制台同时有 `[术语未收录]` 告警）。
- 状态/途径/构筑轴的中文名直接来自数据文件（`*.statuses.json`、`manifest.json`、各 `axes`），不进词典。
- **「声明面」读自 schema 而不是前端硬写**：统计页的「schema 声明 27 条原语」「statusDef 声明的 44 个字段」都是从 `../docs/json/schema/skills.schema.json` 现读的（`data.js` 的 `readDeclared`）。硬写常量必然与 schema 漂移，而「声明了多少 / 实际用了多少」正是这两页要展示的东西。schema 取不到时退回「声明面 = 实际用过」的降级展示，不阻断加载。
- `manifest.statusIds` 是**中→英兜底**（只带 id/name 的占位项），真实定义在 `*.statuses.json`。合并时真实定义必须能盖掉占位项——`mergeStatuses` 以「有没有 `category`」判定占位项（`category` 是 schema 里 statusDef 的 required 字段）。写反了的话，既在 manifest 里又有定义的 18 个状态（burn/poison/regen/conceal/guard…）会永远只剩一个名字，悬停看不到持续/层数/可驱散与 effects/triggers。
- 悬停状态名时，除词典释义外还会展开该状态自身的 `duration/maxStacks/charges/dispelable` 与 `effects/triggers`（AST 复用 `ast.js` 渲染器）；`modifiers` 等其余字段尚未接入。
