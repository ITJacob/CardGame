# BG-02｜“塔罗符文·秘仪阵”动态背景接入方案

> 状态：仅方案，不含实现代码。  
> 勘察范围：`game/index.html`、`game/src/main.ts`、`game/src/ui/router.ts`、`game/src/ui/views/menu.ts`、`game/src/ui/styles/app.css`、`game/src/ui/styles/kit-bridge.css`、`ui-kit/ui-kit.css`、`game/vite.config.ts`、`game/package.json`、`game/tests/`。  
> 结论先行：采用 **(b) `#app` 外的固定 DOM 矢量层**；效果 **只在首页路由 `''`/`#/` 启用**；用路由设置全局状态，不在视图中反复挂载或依赖不存在的 unmount 钩子。

## 1. 挂载方案对比

### 1.1 现状约束

- `body` 已是 `.cg-kit.cg-bg.cg-bg--fog`，同时承担全站背景载体。
- `.cg-bg` 自身已有“深色底 + 径向暗角 + 低对比度八芒环 tile”。
- `.cg-bg--fog::after` 已被暗雾占用，且使用 `mix-blend-mode: screen`；不能复用或覆盖该伪元素。
- `.cg-nav` 是 `position: sticky; z-index: 40`，并使用 `backdrop-filter: blur(8px)`。
- 路由每次只执行 `view(host, arg)`，各 view 会改写 `#app.innerHTML`，没有 destroy/unmount 生命周期。
- 样式基础顺序是 `app.css → ui-kit.css → kit-bridge.css`，桥接层必须在 kit 后面。

### 1.2 三种方案比较

| 维度 | (a) `body/.cg-bg::before` | (b) `#app` 外固定 DOM 层 | (c) `<canvas>` + rAF |
|---|---|---|---|
| 与现有 `.cg-bg` 叠加 | 可以放在 body 背景与 `::after` 暗雾之间，但必须额外建立明确的 stacking context；否则负 `z-index` 可能落到 body 背景之后，`z-index:auto/0` 又可能盖到普通内容上 | 最容易明确表达“现有底图之上、交互内容之下、暗雾仍按原规则绘制”；不占用 kit 的伪元素槽位 | 可按 DOM 层同样叠加，但仍需处理 stacking context，且 canvas 本身不解决分层问题 |
| 与 `.cg-nav` 相处 | 能做到 nav 在上，但层级规则隐藏在伪元素中，后续维护容易误改 | 根层 `pointer-events:none`，置于负层；nav 的 `z-index:40` 和毛玻璃逻辑保持不变，能自然采样背后的秘仪阵 | 层级可控；但全屏画布与 nav 的 blur 同时存在时，GPU 合成成本更高 |
| 路由切换 | 通过 body class 开关，不必增删节点 | 节点常驻于 `#app` 外，通过 body class/data attribute 开关；完全不受 `host.innerHTML` 重写影响 | 节点可常驻，但必须同时管理 rAF 的 start/cancel，生命周期更复杂 |
| CSS 变量主题化 | 好，可用 `--accent/--bg-deep`；但 data URI SVG 不能直接继承页面变量 | 最好；内联 SVG 可用 `currentColor`/CSS custom properties，BG-01 后续替换几何不改接入协议 | 需要 JS 读取 `getComputedStyle` 后转成颜色，主题变化还要主动重绘 |
| 实现/维护成本 | 初始最低，长期中等：占掉 `::before`，并把游戏特效耦合到 ui-kit 背景载体 | 低到中：一个语义明确的 DOM 根、一个 CSS 文件、一个很小的控制器 | 最高：DPR、resize、rAF、隐藏页暂停、主题同步、绘制状态与资源回收都要自行维护 |
| 性能 | 若只动 transform/opacity，成本低；但伪元素同样可能形成全屏合成层 | 若控制为 1 个根 + 最多 2 个动画 group，可走合成器，且非首页能 `display:none` 彻底退出 | 持续占用主线程或 worker/GPU；即便画面克制，也要每帧清屏与重绘，不符合当前需求性价比 |
| 可测试/可观测 | 只能通过 computed style/伪元素观察，较弱 | 可直接检查节点、class、`display`、ARIA 与动画状态，最清晰 | 可检查循环状态，但视觉内容本身难做稳定断言 |

### 1.3 推荐

选择 **(b)：在 `#app` 前放置一个常驻、固定定位、纯装饰的独立 DOM 层，内部使用内联 SVG/CSS 动画，不使用 canvas**。

一句话理由：它在不占用 `.cg-bg--fog::after`、不依赖 view 生命周期的前提下，提供最清晰的层级、路由开关、主题变量和降级控制，性能也比持续 rAF 更可预测。

建议的接入契约：

- 节点在 `index.html` 静态声明，位于 `#app` 之前，避免 JS 创建导致首帧闪入，也避免页面切换时重建。
- 根节点具备稳定 id/class、`aria-hidden="true"`、SVG `focusable="false"`、`pointer-events:none`。
- BG-01 后续只需交付/替换根节点内部的矢量几何与分组，不改变挂载点、路由状态或性能控制协议。
- 动画仅作用于 SVG 的 1–2 个 group，使用 `transform`/`opacity`；不采用逐符文 DOM 动画和每帧 JS 绘制。
- **2026-10-13 结构**：根层内再包一层 `.af-stage`（3D 舞台，在 `perspective` 场景里 `rotateX/Y/Z` 前倾侧转）与每环一层 `.af-layer`（`translateZ` 拉纵深）。旋转仍挂在 `<svg>` 上，`.af-layer` 只承载纵深——两者互不打架。视觉参数见 BG-01 §0/§2。

## 2. 首页专属 vs 全站共用

### 2.1 判定：只在首页显示

动态秘仪阵应当是**首页主菜单专属**，不采用“全站显示、首页加强”。理由：

1. 首页承担世界观与品牌氛围，当前 `.menu` 又是直接立在暗雾上的无框结构，动态阵在这里有明确视觉价值。
2. `#/battle` 会每 tick 重写战场 DOM，离线自动播放为 450 ms 节拍；同时已有棋盘 pulse、hover 浮层、目标点击等更新。全屏混合层即使不接收事件，也可能增加 paint/composite 压力。
3. `#/prep` 有 Pointer Events 拖拽和 `elementFromPoint`，卡池页有 hover/浮层及多个 fixed overlay。`pointer-events:none` 能消除命中干扰，却不能消除 GPU/合成竞争。
4. 子页的信息密度高，持续运动会降低可读性；保留现有静态 `.cg-bg` 已足够维持全站视觉一致性。

### 2.2 在现有 router 下的最干净开关

- 独立背景节点始终存在于 `#app` 外；**不在 `renderMenu` 中创建，也不在离开首页时删除**。
- 在 `router.ts` 的内部 `render()` 中，得到 `path` 后、调用 `view(host, arg)` 前，设置一个路由状态，例如在 body 上切换 `is-menu-route`。
- `path === ''` 时为 active；`#/` 同样会被当前 `currentRoute()` 解析为 `''`。所有其他路径（含未知路由）都 inactive。
- CSS 默认隐藏；只有 `body.is-menu-route` 且页面可见、质量策略允许时才启用动画。
- 非首页使用 `display:none`，而不是仅 `opacity:0`：后者仍可能保留动画和合成层。
- 不另挂一套 `hashchange` 监听，不让特效模块重复解析 URL；router 是唯一的路由事实源。
- `ROUTES` 不新增条目；这里只登记“当前是否首页”的状态，`menu.ts` 无需改动。

此方案绕开了无 unmount 钩子的限制：切页只改一个同步状态，节点和全局监听器均只初始化一次，不会积累重复监听或被 `host.innerHTML` 清除。

## 3. 性能与降级清单

### 3.1 运行状态矩阵

| 条件 | 行为 |
|---|---|
| 首页 + 页面可见 + 正常质量 + 未要求减少动态 | 完整但克制的慢速 transform/opacity 动画 |
| 非首页 | 根节点 `display:none`；无动画、无合成层、无路由页干扰 |
| `document.hidden === true` | 由单例 `visibilitychange` 监听写入 paused 状态，所有 CSS animation 显式 `animation-play-state: paused` |
| `prefers-reduced-motion: reduce` | 保留静态秘仪阵作为氛围；取消旋转、呼吸、闪烁和过渡，不只是“把速度调慢” |
| Save-Data/低端设备命中 | 进入 low/static 档：隐藏次级环与微粒，只保留单组静态线稿；必要时关闭 `mix-blend-mode` |
| 能力 API 不存在 | 正常降级为 feature-detect 未命中；不得因此报错或阻断首页 |

### 3.2 低端设备与省电判定

采用保守、可测试的 best-effort 策略：

1. 用户偏好优先：`prefers-reduced-motion: reduce` 直接静态化。
2. 若可用，`navigator.connection.saveData === true` 进入 low/static 档。此处把它作为用户主动节流的代理信号；本方案是内联矢量，不依赖额外网络请求。
3. 低端硬件判定不要只凭单一弱信号：
   - `deviceMemory` 存在且 `<= 4`，同时 `hardwareConcurrency <= 4`，判 low；
   - 若 `deviceMemory` 不存在，仅在 `hardwareConcurrency <= 2` 时判 low；
   - 所有非标准字段都通过局部类型守卫访问，以满足 strict TypeScript。
4. 浏览器没有可靠、统一的“操作系统省电模式”网页 API。不要依赖 Battery API 猜测省电状态；若产品以后需要用户强制关闭，可再在设置页增加“动态背景：自动/静态/关闭”，但不作为本轮必要改动。
5. 质量决策做成纯函数，DOM 控制器只消费结果，便于 Node 环境下单测各种能力组合。

### 3.3 避免合成层与重绘爆炸

- 只动画 `transform` 和 `opacity`；不动画 `filter`、`box-shadow`、`background-position`、SVG path 数据或大量 `stroke-dashoffset`。**注**：本层**固定挂**了 `drop-shadow`（R1/R2 各一组 4 层，做线辉光，BG-01 §3.7），但**从不动画它**——滤镜结果被缓存，只有 `transform`/`opacity` 在动，故不违反本条。
- 根层 `mix-blend-mode: normal`；**不**给每个符文、每个环单独设置 blend。曾试验的「高光点/耀斑」因引入边缘压暗与光球问题，已撤除。
- 最多 2 个运动 group；`will-change` 只在首页 active 时给这 1–2 个 group，非首页/静态档移除。
- 不在每个 rune 上创建独立 DOM/合成层；优先合并 SVG path，装饰点也应批量绘制。
- 不新增 `backdrop-filter`；顶栏已有 blur，秘仪阵放在其后即可被自然采样。
- 根层使用 paint containment/overflow 裁切，尺寸由 fixed inset 决定；动画不得触发布局。
- resize 只依赖 SVG `viewBox` 与 CSS 尺寸，不在 resize 事件里逐路径重算。
- 不使用 rAF；若 BG-01 的效果最终强制要求 canvas，应重新走性能评审，而不是在本方案上悄悄加入循环。

### 3.4 可测量预算

在 Chrome/Edge Performance 面板分别对首页正常档、4× CPU throttling、以及 `#/battle` 录制 30 秒：

| 指标 | 预算/通过标准 |
|---|---|
| 首页动画帧 | 60 Hz 设备上超过 16.7 ms 的帧占比 `< 1%`；由本效果造成的 `> 50 ms` 帧为 0 |
| 主线程成本 | 稳态无脚本帧循环；效果相关 JS 仅发生在初始化、路由切换、visibility/偏好变化时 |
| CPU 占用 | 30 秒空闲首页中，效果增量目标：桌面平均 `< 3%`，4× CPU/低端模拟 `< 6%`（较旧版略高，因线辉光） |
| Paint | 首次显示和 route/viewport 状态变化外，不应连续触发全视口 paint；`drop-shadow` 结果被缓存、只有 `transform`/`opacity` 在动；若 paint flashing 持续闪烁，优先把辉光从 4 层减到 2 层 |
| 合成层 | 新增持续合成层不超过 **3 个**（R1 / R2 两个运动层 + 1 个 `drop-shadow` 滤镜层）；不得按符文拆层 |
| 布局稳定 | CLS 增量为 0；背景不参与文档流、不改变 body 高度、不产生横向滚动 |
| 非首页/隐藏页 | `display:none` 或 paused 后，Performance 记录中无特效定时任务/rAF，战斗页性能相对基线应为 0 增量 |

## 4. 不改动现有 `.cg-bg` 的叠加方式

### 4.1 目标绘制关系

保持 ui-kit 中以下两处声明原样：

- `.cg-bg` 的现有 `background-color/background-image/background-blend-mode`；
- `.cg-bg--fog::after` 的现有双径向雾与 `mix-blend-mode: screen`。

新增层的目标关系为：

1. 最底：现有 `.cg-bg` 深色底、暗角与静态八芒环；
2. 中间：新的秘仪阵固定矢量层；
3. 其上：现有页面内容，原有 fog 伪元素继续按当前规则叠加；
4. `.cg-nav` 继续凭 `z-index:40` 位于装饰层之上，毛玻璃仍能采样背景。

### 4.2 推荐层级做法

- 在新特效 CSS 中让 body 建立隔离 stacking context（`isolation`），不去改 `ui-kit/ui-kit.css`。
- 新根层 `position:fixed; inset:0; z-index:-1; pointer-events:none`。在隔离 stacking context 内，负层位于 body 自身背景之上、普通内容之下，不会逃到页面画布背后。
- 不给 `#app` 新建 stacking context，避免把 `.cg-nav`、模态框、卡面浮层的现有 `z-index:40/50/60/62/80` 关进新的层级盒子。
- 不使用 `.cg-bg::before`，也不覆盖 `.cg-bg--fog::after`；两个系统的责任边界保持清楚。
- 新层只画线稿，不铺不透明底色。层不透明度以 BG-01 §0 为准（2026-10-13 定稿：R1 0.40 / R2 0.35 / S0 0.10；旧版 0.045/0.040/0.028 因 1px 细线肉眼不可见而上调）。
- 根层 `mix-blend-mode: normal`（BG-01 §3.7）。罗盘**锚在左上、部分出屏**（`--af-cx/--af-cy`；竖屏 `@media (orientation: portrait)` 另给一组），不再是居中背景板。
- 根层加 `perspective` + `perspective-origin: var(--af-cx) var(--af-cy)`；`.af-stage` 做整体 3D 倾斜，`.af-layer` 用 `translateZ` 分层（BG-01 §2）。
- 色彩从现有 `--accent`/`--accent-dim` 派生（S0 用 `--text-dim`）；**唯一新增色号 `--af-glow`** 用于线辉光——BG-01 文件头已登记的**有意破例**。暗部不覆盖 `--bg-deep`。

该做法只增加新的装饰层和隔离边界，不修改已有暗角/暗雾规则；实现验收时必须用 DevTools Layers/paint flashing 再确认实际浏览器的绘制顺序。

## 5. 落地文件清单

### 5.1 实现时需要新增/修改

| 绝对路径 | 性质 | 计划改动 |
|---|---|---|
| `D:/Projects/self/CardGame/game/index.html` | 修改 | 在 `#app` 之前增加一个 `aria-hidden` 的固定背景根节点：内层 `.af-stage`（3D 舞台）+ 每环一层 `.af-layer` 包裹 BG-01 内联 SVG；保留 body 的 `cg-kit cg-bg cg-bg--fog` 类不变 |
| `D:/Projects/self/CardGame/game/src/main.ts` | 修改 | 在现有三层样式之后追加导入 `arcane-bg.css`，保证 `app.css → ui-kit.css → kit-bridge.css` 原顺序完全不动；初始化一次背景控制器 |
| `D:/Projects/self/CardGame/game/src/ui/router.ts` | 修改 | 每次解析出 `path` 后、渲染 view 前同步切换 body 的首页状态；**不新增 ROUTES 路由项**，不增加第二个 hashchange 监听 |
| `D:/Projects/self/CardGame/game/src/ui/styles/arcane-bg.css` | 新增 | 专属 token、fixed/stacking、SVG 尺寸与动画、首页显示、hidden pause、reduced-motion、low/static 档；所有选择器以背景根类为作用域 |
| `D:/Projects/self/CardGame/game/src/ui/effects/arcane-bg.ts` | 新增 | 单例初始化；visibility 状态；能力探测与质量决策；不含 rAF，不在模块顶层直接访问 DOM，以便 Node 测试安全导入 |
| `D:/Projects/self/CardGame/game/tests/arcaneBg.test.ts` | 新增 | 测试纯质量决策：reduced-motion、Save-Data、双低硬件、缺失 capability、正常档；不引入 jsdom |

### 5.2 明确不需要改

- `D:/Projects/self/CardGame/game/src/ui/views/menu.ts`：背景不是 view 内容，不应随 `innerHTML` 重建。
- `D:/Projects/self/CardGame/game/src/ui/styles/app.css`：不继续扩张约 70 KB 的通用游戏样式；特效独立成文件。
- `D:/Projects/self/CardGame/game/src/ui/styles/kit-bridge.css`：现有职责仅为 token 接线与 kit 微调，秘仪阵不是桥接规则。
- `D:/Projects/self/CardGame/ui-kit/ui-kit.css`：不修改共享 `.cg-bg` 和已占用的 `.cg-bg--fog::after`。
- `D:/Projects/self/CardGame/game/vite.config.ts`：内联 SVG + TS/CSS 都由现有 Vite 链路处理，无新资产挂载或插件。
- `D:/Projects/self/CardGame/game/package.json`：不增加依赖，也不增加脚本。
- 设置页：本轮使用自动降级即可；只有后续决定提供“自动/静态/关闭”用户开关时才需要另改 `views/settings.ts` 与持久化层。

## 6. 验证方式

### 6.1 本地查看

在 `D:/Projects/self/CardGame/game` 执行：

```bash
npm run dev
```

检查以下路径与状态：

1. `#/` 或空 hash：首页显示秘仪阵，按钮、链接、文本选择/点击区域均不受遮挡。
2. `#/cards`、`#/prep`、`#/battle`、`#/settings`：动态层为 `display:none`，仅保留原 `.cg-bg`。
3. 从首页往返子页多次：背景节点始终只有一个，visibility/hashchange 监听不累积，返回首页能恢复。
4. 顶栏滚动/吸顶时仍在最上层，blur 后能看到克制的背景，但文字和边框对比度不下降。
5. 窄屏、横屏、`100dvh` 场景无横向滚动、无页面高度变化、无 CLS。
6. DevTools 强制 `prefers-reduced-motion: reduce`：阵列保持静态，无旋转/呼吸/闪烁。
7. 切到别的标签页再回来：隐藏期间动画时间不推进或控制状态明确为 paused，回来后只恢复一次。
8. DevTools Layers、Rendering → Paint flashing、Performance 30 秒录制：按第 3.4 节预算验收。
9. 对比新增前后截图/录屏，确认现有暗角、蓝紫暗雾与静态八芒环仍存在，没有被新层不透明底或过亮 screen 混合冲掉。

### 6.2 类型、构建与测试冒烟

实现后依次执行：

```bash
npm run typecheck
npm run test
npm run build
```

判定：

- `typecheck`：重点捕获 strict 模式下 `navigator.connection/deviceMemory` 的非标准字段类型、空节点处理与未使用声明。
- `test`：现有 Vitest 是 `environment: 'node'`。新增模块必须保持顶层无 DOM 副作用，新增纯函数测试可直接运行。
- `build`：脚本本身已包含一次 `tsc --noEmit`；还需确认内联 SVG、第四个特效 CSS import 和 Vite base `/CardGame/` 下均正常，无外部路径依赖。
- 无 `lint` script，本轮不虚构 lint 门禁。

当前方案勘察时的基线：

- `npm run typecheck`：通过；
- `npm run test`：13 个测试文件、81 个测试全部通过；
- 现有 `game/tests/` 主要覆盖 kernel/meta/match/cardFace 字符串输出，没有 router/menu DOM 测试，因此不会直接被背景改动波及；新增的 `arcaneBg.test.ts` 补质量策略回归。
- 本轮未运行 `npm run build`，因为任务要求只出方案、不做实现；落地后必须执行构建冒烟。
