# 游戏端框架设计方案 v1（纸面）

> 状态：设计稿 · 未实现。落点：本仓库新增顶层 `game/`，TypeScript + Vite + 原生 DOM。
> 战斗内核实现方式（复活 git `7e6d01f` 旧码 vs 全新实现）本轮**不决策**，只先定接口。

本文件描述 Web 游戏端的整体架构：仓库定位调整、目录分层、内核对外契约、数据接入、战外上下文、UI 复用、构建部署与分期。

---

## 一、定位调整与总原则

仓库从「纯文档库」→「**设计文档 + 数据 + Web 游戏端**」。三条不改的红线：

1. `docs/ddd/` 继续只描述最终模型，纯内容，游戏实现不得反向污染文档措辞。
2. `docs/json/` 仍是**唯一数据权威源**，游戏端只读、**不拷贝**（运行时直读，构建期不生成数据副本——遵循「派生数据消灭同步面」原则）。
3. 战斗内核是**纯函数**：`结果 = f(初始状态, 输入序列, seed)`，逐位可复现。UI / 存储 / AI 全部在核外。

---

## 二、目录与分层

```
game/                          # 新增顶层；工程根 = Vite root
├─ package.json  tsconfig.json  vite.config.ts
├─ index.html                  # 游戏壳（首页=主菜单）
├─ public/                     # 图标等纯静态
└─ src/
   ├─ kernel/                  # ★ 战斗内核：零 DOM / 零 I/O / 确定性
   │   ├─ shared/              TargetSpec·EffectRef·EffectCondition·RandomSource·Element
   │   ├─ catalog/             Def 定义态 + Catalog 快照 + 引用校验
   │   ├─ battle/              Battle·Faction·Lane·Slot·Coordinate·Zone·Domain·Placement
   │   ├─ roster/              Unit·AttributeSet·Gauge·Pool·StatusInstance·BehaviorSlot·SkillSlot
   │   ├─ scheduling/          BattleClock·Scheduler（tick 原子推进）
   │   ├─ execution/           Pipeline I→R→M→O·Action·ResolvedTarget
   │   ├─ effect/              EffectExecutor·DamageChain·29 原语
   │   ├─ combat/              Combat 聚合根·事件流·CombatSetup/CombatEnded
   │   └─ index.ts             ★ 对外唯一出口：createCombat(setup) => CombatFacade
   ├─ data/                    # 数据接入层（唯一触碰 docs/json 之处）
   │   ├─ loader.ts            fetch manifest / *.skills.json / *.statuses.json / schema
   │   ├─ catalogBuild.ts      JSON AST → kernel Def；编目期展开 TermRef
   │   └─ schema.types.ts      JSON Schema 的 TS 类型（satisfies 校验）
   ├─ meta/                    # ★ 战外上下文（DDD 明确排除、游戏必需）
   │   ├─ herogen/             英雄生成：力敏智×体质×职业×技能槽
   │   ├─ progression/         解锁：职业解锁 / 卡牌解锁 / 货币
   │   ├─ formation/           编队编辑（5 英雄 → 站位）
   │   ├─ match/               匹配：初版 AI；transport 端口预留 Firebase
   │   ├─ persistence/         存档/榜单（Storage 端口 + LocalStorageAdapter）
   │   └─ controller/          AiController（实现与人类相同的输入接口）
   ├─ ui/                      # 原生 DOM
   │   ├─ router.ts            hash 路由（扩展自 site/js/main.js）
   │   ├─ views/               menu/roster/formation/battle/cards/leaderboard/settings/wiki*
   │   ├─ components/          tooltip·term·ast 渲染（移植自 site/js）
   │   ├─ battleView/          CombatView 投影 → 战场 DOM
   │   └─ styles/              复用 site/css/app.css 的 CSS 变量与 22 途径色板
   └─ main.ts
```

**分层依赖方向**：`ui → meta → data → kernel`，**严禁反向**。`kernel` 不 import 任何上层；`meta` 不 import `ui`。靠 ESLint（`import/no-restricted-paths`）或目录约定强制。

---

## 三、内核对外契约（纸面 IDL）

`docs/ddd/` 只给了契约名与语义，未给逐字段 schema。以下为拟定 IDL，落地时按五上下文校订：

```ts
// kernel/index.ts —— 唯一出口
export function createCombat(setup: CombatSetup): CombatFacade;

// ---------- 入口 ----------
interface CombatSetup {
  seed: number;                       // 战斗级随机种子（写入对局记录）
  catalog: CatalogSnapshot;           // 启动时快照的全部 Def（INV-C3）
  board: {
    clock: ClockInit;                 // 起始 clock：窗口内按 seed 抖动（R3 登记 / R4 单次）
    domainGrants: DomainGrant[];      // base 层界域（塔层/Boss 决定）
    illuminance?: LuminanceInit;      // set_luminance / advance_clock 的初值
  };
  factions: [FactionSetup, FactionSetup];   // 2 阵营
  inputs: InputSequence;              // 外部输入序列（Manual 目标选择等）
}

interface FactionSetup { id: string; name: string; units: UnitSetup[]; }

interface UnitSetup {
  defId: string;                      // unitDef 蓝本
  coordinate: Coordinate;             // {faction, lane(0|1), index(0..3)}，index0=中线前线
  attributeSet: { force: number; agility: number; intellect: number; rank?: Rank };
  gender: 'male' | 'female';
  anchor: number;                     // 提升 lost 上限与各档阈值
  activeSlots: SkillSlot[];           // ≤4 主动（来自卡 kind='active'）
  passiveSlots: BehaviorSlot[];       // ≤4 被动（来自卡 kind='passive'）
  initialStatuses: StatusGrant[];     // 初始状态（体质/遗物落点）
  pools: PoolInit;                    // hp/energy/shield/armor/lost/lust 初值
  gauge?: GaugeInit;
}

// ---------- 出口 ----------
interface CombatEnded {
  outcome: 'side_a' | 'side_b' | 'draw' | 'aborted';
  winnerFactionId?: string;
  events: readonly DomainEvent[];     // 完整事件流（回放 + 战斗日志 + 遥测）
  finalState: CombatSnapshot;
  randomSnapshot: RandomSnapshot;     // 供验证「同 seed 逐位相同」(R6)
  stats: CombatStats;                 // 回合数/伤害/治疗…（对局记录 & 排行榜取数）
}

// ---------- 运行门面（UI 只认这个） ----------
interface CombatFacade {
  state(): CombatView;                          // 只读投影，给渲染
  drainEvents(): readonly DomainEvent[];
  pendingDecision(): DecisionRequest | null;    // ★ 内核暂停点：Manual 目标选择
  submitDecision(d: DecisionInput): void;       // ★ 喂回输入，内核续跑
  step(): StepReport;                           // 推进一个 tick（或直到下一个决策点）
  ended(): CombatEnded | null;
}
```

### 核心接缝：决策点

Pipeline 的 R 阶段遇 `selectionMode: 'Manual'` 时（Manual 必填 `fallbackSort`，INV-E6）内核**不能自行选择**：它暂停、抛出 `DecisionRequest{request, candidates, pickCount}`，UI 据此渲染选靶界面，玩家点选后 `submitDecision` 续跑。

这正是「纯函数 + 输入序列」的落地形式——所有人工决策都是 `inputs` 里的一个元素，AI 与人也只是**两种 InputSequence 产生器**。此约束要求内核写成**可暂停的生成器 / 状态机**，而非一跑到底；这是 P2 的最大设计约束，须在 IDL 阶段先定。

---

## 四、数据接入层（docs/json → kernel Def）

- **按需加载**，不照搬 site 的全量 26 请求首屏：`manifest.json` 常驻；卡池页按途径懒加载；**战斗只加载参战双方技能涉及的途径文件**。
- `catalogBuild.ts`：JSON 卡 `kind:'active'` → `SkillDef`、`kind:'passive'` → `BehaviorTemplate`；`effects` 的 `opSequence/opIf/opRepeat` 保持 AST；`triggers[]` / `hook[]` → 触发点挂载；`TermRef` 在**编目期**一次性展开为扁平 `EffectRef` 并烙印 `originTerm`（运行期零感知）。
- 启动做**全量引用校验**，失败拒启（对应文档「Catalog 加载做全量引用校验」）。
- 复用 site 的路径策略：**相对 fetch**（游戏中 `./docs/json/…`）；`vite.config.ts` 用 dev 中间件把 `/docs/` 映射到仓库 `../docs`；生产由部署把 `docs/` 铺在同层——**全程不拷贝数据**。

---

## 五、战外上下文（游戏侧新增，DDD 已明确排除）

### 5.1 英雄生成 `meta/herogen`

- 力敏智三维、各 ≥0、和 = 3 → 恰好 **10 种组合**：
  `(3,0,0) (0,3,0) (0,0,3) (2,1,0) (2,0,1) (1,2,0) (0,2,1) (1,0,2) (0,1,2) (1,1,1)`。
- **10 种体质**：`docs/ddd` 明确「灵/体/魅未接入属性系统」→ 体质是**游戏侧发明**，必须用现有内核扩展点表达，**不得新增原语**。落点三选一或组合：
  1. `BaseProfile` 派生修正（经 `modifierSet`）
  2. 常驻 `StatusGrant`（带触发器/钩子 = 被动）
  3. 初始 `BehaviorSlot`
  建议做成数据驱动的 `ConstitutionDef` 表（`docs/json/constitutions.json` 或 game 侧常量）；10 项数值须过 `docs/ddd/params/数值标定基准.md`。
- 一次生成：`seed → { 力敏智组合, 体质, 职业, 被动 }`；玩家再手工编排**主动技能槽**。
- 出生即写死 `gender`（战内不可变）、`anchor`。

### 5.2 职业绑定与技能配置 `meta/formation`

- 5 名英雄，职业**从已解锁职业中随机绑定**（22 途径 = 22 职业）。
- 每英雄 ≤4 主动槽（该职业已解锁的 `kind:'active'` 卡）+ ≤4 被动槽（`kind:'passive'`），过滤条件含轴 `axis` / 稀有度 / 性别 `gender`。

### 5.3 站位 `meta/formation`

- 每阵营 2 路 × 4 格；5 英雄分入 2 路，`index0` 为前线，占用恒为**前缀无空洞**（`Placement` 是唯一占位出口，`relocate` 禁跨中线）。UI 拖拽必须落进这套几何。

### 5.4 匹配与对手 `meta/match`

- 初版 `AiController`：实现与人类相同的 `DecisionInput` 产生接口，用启发式策略（贪伤 / 保残血 / 技能优先级）。内核**完全无感**是人还是 AI。
- 预留 `MatchTransport` 端口：`LocalAiTransport`（现在）→ `FirebaseTransport`（后续）。因内核确定性 + 输入序列，在线对战走**确定性 lockstep**：双方各跑内核，只交换 `inputs`；或服务端权威跑一份内核。二选一在接入 Firebase 时定。

### 5.5 存档与排行榜 `meta/persistence`

- 现在 localStorage：`cg.profile.v1`(uuid/用户名/解锁) · `cg.saves.v1`(进行中对局) · `cg.matches.v1` · `cg.leaderboard.v1`。
- **`Storage` 端口 + `LocalStorageAdapter`**，后续可换 IndexedDB / Firestore，元层只依赖端口。
- 对局结束写 `CombatEnded.stats` → 对局记录 + 榜单条目。

---

## 六、与现有 site/ 的关系

- **复用（移植为 TS）**：`ast.js`（AST→中文，可直接做战斗日志）、`term.js` / `tooltip.js`（卡/状态提示）、`charts.js`、`md.js`、`css/app.css` 变量与 22 途径色板。
- **不改动 site/**：现网 wiki 保持冻结，避免破坏线上。共享渲染器用「先拷贝进 `game/src/ui/components/`，待游戏稳定后再反抽公共库」两阶段策略（`site/` 零构建、不能吃 TS，强引会耦合）。
- **入口关系**：游戏首页顶部放「Wiki」链接 → `../site/`。

---

## 七、构建与部署

**技术栈**：TypeScript + Vite + 原生 DOM（无 UI 框架）。内核独立成**框架无关的纯 TS 包**，可单测、可 CLI 跑（AI vs AI 无头验证）。

**布局**（部署产物）：

```
/ (Pages 根)      → 游戏（Vite base = /CardGame/）
/site/            → 现有 wiki（路径与原 URL 不变）
/docs/            → 数据权威源（wiki 用 ../docs/json，游戏用 ./docs/json，皆成立）
```

**本地开发**：`npm run dev`（Vite 于 `game/`），自定义插件把 `/docs/` 中间件指向 `../docs`。

**部署（推荐 GitHub Actions，Pages 源切到 Actions）**：

```
push main → npm ci && vite build (game/dist)
          → 组装 _site/：cp docs/  cp site/  cp game/dist/*  → _site/
          → upload-pages-artifact → deploy-pages
```

优点：不把构建产物提交进 git；**顺带把 `docs/tools/` 四门禁（validate / validate_schema / check_enum_sync / check_glossary）挂成 CI**，文档与数据改动也在同一轮把关。

备选：不用 CI，本地 `vite build` 后提交 `game/dist/`，由分支托管——简单但脏。

---

## 八、需同步改动的仓库文件

1. `CLAUDE.md`：定位段改写为「设计文档 + 数据 + Web 游戏端」，新增 `game/` 文档地图与三条红线。
2. `.gitignore`：加 `game/node_modules/`、`game/dist/`（若走 Actions）。
3. `docs/meta/WORKFLOW.md`：增「游戏端实现」环节说明（可选）。
4. 本文件即设计正源；如需并入文档地图，在 `CLAUDE.md` 文档地图中登记 `game/DESIGN.md`。

---

## 九、分期里程碑

| 期 | 内容 | 完成判据 |
|---|---|---|
| P0 | 工程骨架：Vite+TS+路由+数据加载+主菜单+wiki 链接+部署流程 | Pages 上线，`/CardGame/` 是主菜单 |
| P1 | 内核 IDL 定稿（第三节落成正式文件）+ 数据接入层 | `catalogBuild` 能把 22 途径 JSON 转成 Def |
| P2 | 内核实现（五上下文）——旧码复活 or 全新，**本轮不决** | 单测覆盖 29 原语 / 14 触发点 |
| P3 | 无头对战 AI vs AI | 同 seed 两次跑**逐位相同** |
| P4 | 战外：英雄生成 / 卡池解锁 / 编队 | 能拼出一支合规队伍 |
| P5 | 交互战斗 UI + 决策点选择 + 日志 | 人机对战可玩 |
| P6 | 排行榜 + 设置(uuid/用户名) | 战绩入榜 |
| P7 | Firebase 在线匹配 | — |

---

## 十、风险与待决

- **确定性**：禁裸 `Math.random`，唯一入口 `RandomSource.next()`；UI 层不得旁路改战斗态。
- **可暂停内核**：决策点要求内核写成生成器/状态机，是 P2 的最大设计约束，须在 IDL 阶段先定。
- **旧实现漂移**：若复活 `7e6d01f`（63 文件），需逐条审计触发点（旧 12 → 现 14）、原语（旧 27 → 现 29）、v0.3 维度（界域/位格/迷失/吟唱）等差距。
- **体质是新增设计面**，其数值标定与「不新增内核原语」的约束需专门校订。
- **中文路径 + Edit 工具匹配失败坑**（`CLAUDE.md` 已记），改 JSON / 文档时用整行重写绕过。
