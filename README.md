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
docs/ddd/          战斗内核 DDD 设计（本仓库正源）
├─ README.md       文档入口：上下文总览、依赖关系、不变量总表
├─ contexts/       7 个限界上下文 + 共享内核
└─ params/         各上下文的参数与取值域

docs/skill-design/ 诡秘之主 22 途径技能池 v0.2（内容设计，非 DDD）
├─ _GENERATION_BRIEF.md   生成规范；§7 承载旧框架编号 → DDD 落点速查
└─ <途径>_技能池_v0.2.md  ×22

docs/json/          技能池 JSON 结构化产物（由 skill-design 的 md 转换而来）
├─ manifest.json    索引：schema 版本、稀有度映射、状态 ID、22 途径卡片数
├─ <途径>.skills.json ×22  结构化 AST 卡面（sourceFile 回指 ../skill-design/）
└─ validate.py      全库校验器（用法见文件头）

docs/诡秘之主职业路径与能力对照表.md
```

限界上下文：**战场 / 编队 / 调度 / 执行 / 效果 / 编目 / 随机性治理** + **共享内核**。

原「肉鸽派发」上下文已于 2026-09-05 迁出至主项目（拆为 Draft 抽取机制 + Progression 构筑结构），原定义保留在 git 历史。

## 阅读顺序

从 `docs/ddd/README.md` 进入，它给出上下文总览、依赖方向、不变量总表（当前 49 条）与导航链接。

参数与架构描述解耦：模型结构看 `contexts/`，取值域看 `params/`。

## 已迁出的内容

本仓库曾包含一套 TypeScript 核心逻辑层实现（`src/` 约 8600 行 + `tests/` + 构建配置，89 个测试全过，含确定性校验与不变量校验）。
该实现已于 2026-09-05 随仓库重新定位而移除，**完整保留在 git 历史中**（`7e6d01f`），需要时可全量取回。
