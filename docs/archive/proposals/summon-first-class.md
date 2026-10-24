# 召唤牌系统（机制扩容提案）

> 状态：**已拍板（2026-10-23）**；P0/P1/P2/P3 全部落地（13 张纯 spawn 卡转 kind=summon、24 个 unitDef 补登、召唤谓词与复合卡二评、corpse 2 张转 summon、军团 cap 特权卡与引擎 cap 结算）
> 入口：环节⑥骨架重议 → 机制扩容（`WORKFLOW.md`）；对标 `weapon-first-class.md`（同套迁移模式）
> 结论：召唤单位 = 新增的技能卡类型 `kind: "summon"`，**打出即落场**；引用 unitDef 蓝本；无背包、单位不回手。
> 纪律：本提案**不改**任何 `docs/ddd` / `docs/json` / schema / 脚本；实施须先过环节⑥ Gate 并按 ② 机制落地顺序推进。

## 0. 一页结论

- **卡类型**：新增 `kind: "summon"`。召唤牌是途径卡（内容），落位 / summon_cap / 消散 / 克制是全局机制（已全部存在，不新建）。
- **编队槽位**：召唤牌**归主动槽**（`bucketOf(kind) → active`），与主动技能、武器牌竞争牌位；不新增槽位。
- **生命周期**：打出 → 支付 cost → summon_cap 检查（满则最早者走 on_remove 消散）→ spawn 落位（on_spawn fire）→ 执行 on-play（战吼）→ 卡进弃牌。单位离场走既有规则（死亡 / 寿命 / cap 挤掉），**不回手、不返费**。
- **与武器的本质差异**：不需要新运行时实体——UnitInstance 本是一等单位；本提案只修「卡 → spawn」的直通管道与数据面（kind + 载荷 + unitDefs 补全）。
- **首批迁移**：13 张主动纯 spawn 卡（9 途径，避开 corpse_collector）；3 张被动纯 spawn 卡不动（开局/触发自动召唤非「打出」语义）。实测纯 spawn 主动卡 17 张，剔除 2 张违反「一卡一单位」不变量者：apothecary s3_summon_gate（一卡双单位）、spectator s3_identity_split（inheritSkills 模板语义）——转二批评审。
- **它解锁的骨架**：召唤牌构筑、召唤节奏（cap 管理）、破召对策扩面、军团规模、单位养成（见 §9）。

## 1. 设定核查

- 原著中召唤物是途径能力的产物（亡灵军团 / 通识造物 / 灵界生物 / 放牧灵魂），**不是凡俗工具**——与武器不同，召唤牌天然承载途径权柄，内容必须按途径出。
- 但**机制必须全局**：落位、占位、被攻击、cap、消散、unitType 克制是战场规则，任何途径共用；途径身份只认 facet（SCORING §二·三），不认「有召唤物」。
- 边界：本提案只做召唤卡的存在、打出、落场与数据面补全；不做数值平衡、不做军团 cap 特权卡设计（P3）、不做复合卡迁移（二批评审）。

## 2. 现状与问题

现状（实测 2026-10-23）：

| 现状 | 数量 | 说明 |
|---|---:|---|
| 含单位 spawn 的卡 | 83 | 20 纯 spawn + 63 复合（spawn+伤害/条件/触发） |
| 纯 spawn 主动卡 | 17 | apothecary 5 / corpse 3 / planter 3 / sleepless 2 / spectator 2 / prisoner·reader·sailor·savant·seer 各 1 |
| 纯 spawn 被动卡 | 3 | 开局/触发自动召唤，非打出语义 |
| 具名 unitId | 24 | 全部无数据层定义（unit_automaton、unit_beastling、unit_vermin 等大用量单位均在列） |
| unitDefs 池 | 4 文件 12 单位 | corpse / seer / sleepless / supplicant；大户 planter / savant 反而无池 |
| zone/revive 类 spawn | 9 | 8 zone + 1 reviveOf:self；非单位语义，不动 |

问题：

1. **召唤强度藏在 AST**：召唤卡的战力藏在 effects 树里，卡池统计 / 稀有度曲线 / 蓝图兑现 / 构筑选择都读不到「这是一张召唤牌」。
2. **unitDef 数据面残缺**：24 个被引用单位无定义，unitType / 基线属性只在文档层（`召唤物参数.md`），校验器无法机器对账。
3. **卡面表达缺失**：召唤物是一等单位（占格 / 血量 / 技能组），但卡面无法直接呈现单位属性，site/game 只能渲染一段效果文本。
4. **预留键空转**：schema 已有 summonCap / inheritSkills / template / variant 预留，数据侧基本未启用，语义没有一等落点。

## 3. 方案对比

| 维度 | A 独立召唤槽 | **B kind=summon，编队归主动槽（推荐）** | C active + summon 载荷 |
|---|---|---|---|
| 语义 | 召唤是第四种卡，独立槽位 | 召唤是第四种卡，占主动槽 | 召唤不是独立卡类型，靠载荷判定 |
| 编队 / hero 生成 | 新增槽位与生成逻辑 | 复用 `activeSkillIds`，集中 `bucketOf` | 零改动 |
| 构筑取舍 | 无（白送的槽） | 召唤牌与主动技/武器牌竞争牌位 | 同 B 但语义不在枚举上 |
| `kind` 判定面 | 最大 | 中（对标武器约 68 行） | 零（但语义不在枚举上） |
| 推荐 | 过度 | **是** | 语义不够一等 |

## 4. 推荐模型 B

### 4.1 卡结构

```json
{
  "id": "skill_corpse_collector_s6_raise_skeleton",
  "name": "唤起骷髅",
  "kind": "summon",
  "sequence": 6,
  "rarity": "common",
  "axis": "亡者",
  "role": "enabler",
  "cost": { "energy": 3, "cooldown": 20, "castTime": 0 },
  "summon": {
    "unitId": "unit_skeleton",
    "count": 1,
    "hpRatio": 0.6,
    "position": "tail"
  },
  "effects": []
}
```

- `summon` 载荷键 = effSpawn 键子集：`unitId`（必填）/ `count` / `hpRatio` / `atkRatio` / `position` / `lifetime`。不含 `template` / `reviveOf` / `zone`（动态模板与区域语义留在 spawn 原语）。
- `effects` = **on-play 战吼**（可选），但**不得含 spawn 段**（一卡一单位语义；多体用 `count`）。
- 无 `target`：召唤牌默认落己方战场（position 默认 tail）。

### 4.2 生命周期

```
play(summon card)
  → 支付 cost
  → summon_cap 检查：满员则最早在场者走 on_remove 消散（H39 既有规则）
  → spawn 落位：unitDef base × 卡面比率，on_spawn fire
  → 执行 card.effects（战吼）
  → 卡进弃牌

单位离场（既有规则，本提案不新增）
  → 死亡（on_death）/ lifetime 到期 / cap 挤掉
  → 不回手、不返费、不留游离实例
```

三条不变量：

1. **蓝本恒定**：卡面 summon 段只写实例参数（count / 比率 / 落位 / 寿命）；unitType / 基线属性 / 技能组只写 unitDefs 池——与「Def/Grant 默认值不两写」铁律一致。
2. **无背包**：召唤单位只存在于战场格子；离场即消散，不存在回手牌 / 回牌库。
3. **一卡一单位**：一张召唤牌引用一个 unitId；`effects` 战吼不得再含 spawn 段。

## 5. 原语与谓词

**不新增任何原语**。`spawn` 原语保留，承接：复合卡（63 张）、zone / revive / template 动态模板、on_kill 触发召唤。

| 名称 | 类型 | 语义 | 优先级 |
|---|---|---|---|
| `target_is_summoned` / `target_unit_type` | 已有谓词 | 破召对策与克制面，自动覆盖召唤牌产物 | — |
| `caster_has_summon` | 已有谓词 | 读持有召唤物 | — |
| `summon_tag` / `summon_is` | 并入 `caster_has_summon` | 按 tag / unitId 判定己方在场召唤——P2 评审裁定**不另立同义谓词**，扩 `caster_has_summon` 既有参数（`tag?` / `unitId?`）承载；`target_is_summoned` 同步落地 | P2 |

## 6. 所有权

- **机制全局**：落位、cap、消散、克制谓词归战斗内核，任何途径共用。
- **内容按途径**：召唤牌是普通途径卡，带自己的稀有度 / 序列 / 轴 / 角色；unitDefs 池随途径文件走，无全局单位池。
- 跨途径共享 unitId 时**种类恒定**（wraith：corpse/planter；relic/homunculus：prisoner/savant），差异只许出现在卡面实例参数上（沿用 `召唤物参数.md` §二裁定）。
- 防「全体途径靠加召唤牌凑差异化」：蓝图「风格边界」须声明本途径的主签名维度，同武器 §6。

## 7. 影响面审计（实测 + 预估）

| 面 | 数量 | 位置 | 迁移 |
|---|---:|---|---|
| 首批迁移卡 | 14 | 9 途径（apothecary 5 / planter 3 / sleepless 2 / spectator 2 / savant·seer·prisoner·reader·sailor 各 1） | 转 `kind:"summon"`，effects 内 spawn 段提升为 `summon` 载荷 |
| corpse 批次（P3） | 2 | corpse_collector | 与⑤重构第 3 轮合并评审：唤起骷髅 / 唤起活尸转 summon；完全的死亡 / 死亡之国为 zone 形态不转 |
| 被动纯 spawn 卡 | 3 | 待实施时点名 | 不动（非打出语义） |
| unitDefs 补全 | 24 单位（12 途径） | 按主要引用途径落入对应文件顶层 `unitDefs` | 补 unitType / note；unit_automaton→savant、unit_beastling 等→planter、unit_sea_beast→sailor 等 |
| schema | 2 处 + 新增 | `card.kind` 枚举 + `summonSpec` 载荷 + 条件约束（summon 必填 cost+summon） | 先改 schema 再改数据 |
| `kind` 判定面 | 对标武器约 68 行 | tools / site / game | 新增 summon 分支；按 active 统计 |
| validate.py | 预估 4-6 处 | 新规则：summon 卡 unitId 必须存在于某途径 unitDefs 池；summon 卡 effects 禁含 spawn 段；载荷键白名单 | 新增 |
| score.py | 预估 3-5 处 | summon 计 active bucket；召唤 facet 改扫 summon 卡 + spawn 段 | 新增分支 |
| site | 渲染 summon 载荷与单位属性 | ast.js / views/card.js 等 | 新增 |
| game 内核 | 打出分支 | summon 卡 → 直通既有 spawn 结算（cap→落位→on_spawn） | 预估 3-5 文件 |
| 文本提及 | 未定 | lore / flavor | 零迁移 |

与武器的关键差别：**无「禁旧形」**——spawn 原语继续合法存在（63 张复合卡在用它），本次是增量升格而非替换。

## 8. 迁移与 MVP

| 阶段 | 内容 | 验收 |
|---|---|---|
| P0 | schema（kind + summonSpec + 条件约束）；SCHEMA.md 登记；unitDefs 补全 24 单位 | schema 校验 + `validate_schema.py` + 文档评审 |
| P1 | 13 张首批迁移（避开 corpse）；validate 新规则；内核打出分支；site/game 渲染 | 四门禁全绿 + `npm test` + `score.py` 不退化 |
| P2 | 召唤谓词（`caster_has_summon.tag/unitId` + `target_is_summoned`，不另立别名）；卡面单位属性面板；复合卡二批评审 | `playable_scan` 可测 |
| P3 | corpse 2 张转 summon（唤起骷髅 / 唤起活尸；zone 形态两张不转）；军团 cap 特权卡（收尸人·尸山号令 / 药师·兽群号令）与引擎 cap 结算 | 环节⑥ Gate 通过 |

迁移选项：整批一次，**不留兼容壳**（同武器拍板 8）；被动纯 spawn 卡与复合卡本就不在迁移范围，无需壳。

**P2 复合卡二批评审结果（2026-10-23）**

| 卡 | 判定 | 依据 |
|---|---|---|
| apothecary `skill_apothecary_s3_summon_gate` | 维持 `kind:"active"` | 一卡两个 unitId（unit_elder_thing + unit_beast×2），违反一卡一单位 |
| thief `skill_thief_s0_confuse_doppel` | 转 `kind:"summon"` | 单一 unitId + count:2，不违反一卡一单位；target_override / mount_status 留作战吼 |
| spectator `skill_spectator_s3_identity_split` | 维持 `kind:"active"` | inheritSkills 模板语义不属 summon 载荷，留在 spawn 原语 |

## 9. 解锁的骨架（示例，待环节⑥裁定）

| 骨架 | 一句话命题 | 需要的召唤能力 |
|---|---|---|
| 召唤牌构筑 | 召唤牌与主动技/武器牌竞争牌位，带几只进场是构筑决策 | 编队归主动槽 |
| 召唤节奏 | cap 是硬约束：何时召、召哪只、何时挤掉旧的 | summon_cap + 打出直通 |
| 破召对策 | 召唤物是资产也是破绽：克制谓词与击杀优先级的博弈 | target_is_summoned / unitType（已有） |
| 军团规模 | 以 cap 特权换取多单位同时在场 | ✅ 已落地（2026-10-23）：基数 3 + 维持费型特权卡；`modifiers.summon_cap_bonus` / `summon_cap_override` / spawn `summonCap` 引擎接通 |
| 单位养成 | 召唤物在场期间被强化/继承，养成线是独立玩法 | companionBuff / inheritSkills（已有，待首张卡） |

## 10. 拍板记录（2026-10-23）

| # | 议题 | 拍板 |
|---|---|---|
| 1 | 卡类型 | 新增 `kind: "summon"`；归主动槽（`bucketOf → active`），不新增第四类槽位 |
| 2 | 载荷形态 | 引用 unitDef 蓝本：卡面只写实例参数，unitType / 基线由蓝本兜底；跨途径复用种类恒定 |
| 3 | 蓝本落点 | 途径文件顶层 `unitDefs`（维持现状结构），扩到全部持有途径并补齐 24 个无定义单位；无全局池 |
| 4 | 首批迁移范围 | 只迁纯 spawn 主动卡（实测 17 张→剔 2 张违反一卡一单位→13 张）；复合卡 / 被动纯 spawn / zone / revive / template 一律不动 |
| 5 | 推进节奏 | 整批但避开 corpse_collector（其 3 张与⑤重构第 3 轮合并评审） |
| 6 | on-play 战吼 | 允许 `effects`（对标武器拍板 2），但禁含 spawn 段（一卡一单位） |
| 7 | 新原语 | 不新增；`summon_tag` / `summon_is` 谓词留 P2 |
| 8 | 兼容壳 | 不留；spawn 原语继续合法（增量升格，非替换） |
| 9 | 军团 cap（2026-10-23） | 基数全局 3；特权用维持费型；先落收尸人·尸山号令（能量 −0.4/tick）与药师·兽群号令（生命 −0.4/tick），各 +2 cap、25tick；断供/到期后超限最老消散 |

## 11. 实施前仍需明确的细节（不阻塞拍板）

1. 同名召唤牌多张进同一套牌：沿用现有牌库规则。
2. `count > 1` 与 cap 交互：一次召多体导致超 cap 时，按落位顺序逐个触发挤掉（建议；实施时内核定）。
3. 迁移卡的费用 / 稀有度原样平移，平衡期再调（同武器迁移口径）。
4. 被动纯 spawn 卡 3 张的点名清单，实施 P1 时确认不迁移。
