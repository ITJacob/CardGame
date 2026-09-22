# CardGame · 战斗内核领域设计

本仓库是 Roguelike 爬塔卡牌游戏**战斗内核**的领域设计文档库（DDD）。

不含实现代码。这里产出的是领域模型、不变量与参数取值域；实现落点由主项目承载。

## 定位与边界

本仓库只承载战斗内核，即战斗本身从开局到结束的领域模型：

> 结果 = f(初始状态, 输入序列, seed)

对外契约是 `CombatSetup → CombatEnded`，整场战斗是一个聚合，根为 `Combat`。

**不在此处**（属战外 / 元层，由主项目承载）：抽发 Draft、构筑 Progression、跑图 Run、事件 Event、名册 Roster、匹配 Match、元进度、遥测。

边界依据主项目全局蓝图 `blueprint-完整版.md`。

## 目录

```
docs/meta/          流程·规范·提案
├─ WORKFLOW.md          当前工作流：设定→机制→JSON→分析 四环节流水线
├─ GENERATION_BRIEF.md  技能池生成规范（当前 v0.3）；§7 承载旧框架编号 → DDD 落点速查
├─ REGEN_v03_SPEC.md    v0.3 批量重构规范
├─ SCHEMA.md            JSON 结构规范（字段表 + 枚举 + 严格度约定 + 已知待修数据）
├─ glossary.json        术语词典（英文枚举 key → 中文名 + 解释，站点词典页数据源）
└─ proposals/           原语扩展提案与分析底稿

docs/ddd/           战斗内核 DDD 设计（本仓库正源）
├─ README.md        文档入口：上下文总览、依赖关系、不变量总表
├─ contexts/        7 个限界上下文 + 共享内核
└─ params/          各上下文的参数与取值域

docs/json/          技能池 JSON（唯一维护面）
├─ manifest.json    纯索引：22 途径清单与卡片数 + rarityMap（稀有度↔序列校验基准）
├─ <途径>.skills.json ×22    结构化 AST 卡面
├─ <途径>.statuses.json ×22 + common.statuses.json  状态定义（唯一权威源）
└─ schema/          机器可读结构标准（JSON Schema draft 2020-12）

docs/archive/       只读历史快照
└─ skill-design_v0.3/  22 份技能稿 md（生成期源数据，勿改；2026-09-18 起 JSON 为唯一维护正源）

docs/analysis/      统计与分析产物（勿手改，重跑 docs/tools/ 脚本生成）
├─ SKILLS_OVERVIEW.md  全库总览：22 途径分章，每卡含效果/机制/支持进度/拍板项
├─ SKILLS_ANALYSIS_BY_PROFESSION.md  效果原语用量 + 属性参数统计
└─ analysis_by_profession/  22 份「职业 × 构筑轴」设计风格报告

docs/tools/         校验与生成脚本（validate.py / validate_schema.py / check_enum_sync.py / check_glossary.py / build_*.py）

docs/诡秘之主资料库/  原著设定源素材（世界体系 / 九大源质 / 界域机制 / 职业对照表）

site/               技能池数据展示站（纯静态零依赖，详见「网页展示站」一节）
```

限界上下文：**战场 / 编队 / 调度 / 执行 / 效果 / 编目 / 随机性治理** + **共享内核**。

原「肉鸽派发」上下文已于 2026-09-05 迁出至主项目（拆为 Draft 抽取机制 + Progression 构筑结构），原定义保留在 git 历史。

## 阅读顺序

从 `docs/ddd/README.md` 进入，它给出上下文总览、依赖方向、不变量总表（当前 54 条）与导航链接。

参数与架构描述解耦：模型结构看 `contexts/`，取值域看 `params/`。

## 网页展示站（site/）

`site/` 是纯静态、零依赖的数据展示站（卡片浏览 / 领域模型速查 / 术语词典 / 统计分析），
线上发布于 GitHub Pages（`itjacob.github.io/CardGame/site/`）。

**数据流向是单向的**：站点运行时现读 `docs/`（`json/` 卡片与状态、`ddd/` 设计文档、`meta/glossary.json`
词典），浏览器端现取现算，**无任何逆向写回**。因此它不进 docs 的工作流——改 `docs/` 不需要动站点
（下次访问自动反映），改站点也不需要跑 `docs/tools/` 的校验脚本；两者的提交互不相干。
本地预览需在**仓库根目录**起服务（`python -m http.server 8000` → `http://localhost:8000/site/`），
设计细节见 `site/README.md`。

## 已迁出的内容

本仓库曾包含一套 TypeScript 核心逻辑层实现（`src/` 约 8600 行 + `tests/` + 构建配置，89 个测试全过，含确定性校验与不变量校验）。
该实现已于 2026-09-05 随仓库重新定位而移除，**完整保留在 git 历史中**（`7e6d01f`），需要时可全量取回。
