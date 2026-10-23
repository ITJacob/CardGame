# 武器系统一等化（机制扩容提案）

> 状态：**草案 · 待主人拍板**（2026-10-23）
> 入口：环节⑥骨架重议 → 机制扩容（`WORKFLOW.md`）
> 纪律：本提案**不改**任何 `docs/ddd` / `docs/json` / schema / 脚本；拍板并过 Gate 后才落地。

## 0. 一页结论

- **问题**：武器现在是 `StatusDef` 的一个子类（带 `equipSlot: 'weapon'`），复用状态的全部生命周期（叠层、时长、触发器、驱散规则）；validate 里堆特例，武器无法离开单位存活，也无法成为全局资产。
- **推荐落地形态**：**B「一等实体 + 状态载荷」**——`WeaponDef/Kind` 独立成池、`WeaponInstance` 自有耐久与持有者；效果仍由一个**绑定在武器实例上的** StatusInstance 承载（`bearer = weapon`），对外不再把武器称为状态。**A（纯一等，效果也不走状态）列为终态方向**，不在首轮实施。
- **为什么不是 A 一步到位**：战斗内核已实现（`game/src/kernel/combat/runtime.ts` 等），且 `game/tests/weaponSlot.test.ts` 深度覆盖「武器 = 带 equipSlot 的状态」这条路径。A 等于重写内核的效果承载层；B 能用原子事务 + 不变量拿到一等武器的全部语义收益。
- **它解锁的骨架**：夺械/破械、兵器谱成长、多武器切换、附魔改装（见 §9）。
- **代价**（已实测）：4 个装备状态 + 4 张战士卡迁移；`has_equipped` 16 处 / 8 文件、`validate.py` 10 处、`score.py` 5 处、schema 3 处、site 3 文件、game 内核/数据 5 文件 + 1 个测试文件同步。其余 40 张卡提到「武器」只是 lore/flavor，零迁移。

## 1. 设定核查

- 原著中武器是凡俗工具，不承载途径权柄；序列能力才是途径身份。→ **武器必须是全局机制，不能成为某途径的私有定义**。
- 因此「武艺」轴的身份不是「有武器」，而是它在 weapon facet 上实现的机制条目（装备 / 耐久消耗 / 补耐久 / 读已装备 / 夺取 / 打空）。与 SCORING §二·三一致：用过武器不等于占有武器机制。
- 边界：本提案只做「武器的存在、持有、损耗、转移」，不做武器数值平衡，也不把武器变成第二条技能树。

## 2. 现状与问题

现状（`docs/ddd/contexts/效果上下文.md`、`params/编队参数.md`、`SCHEMA.md`）：

| 现状 | 位置 | 说明 |
|---|---|---|
| 武器 = 状态 | `StatusDef.equipSlot='weapon'` | `mount_status` 施加；同槽互斥、后装替换 |
| 耐久 = charges | `validate.py:259` | 强制 charges ≥1、duration = null |
| 不可驱散 | `dispelable: false` | `dispel` 不拆装备 |
| 卸下 = `disarm` | 效果上下文 | 只作用于 equipSlot 实例；武器定义保留 |
| 持械判定 = `has_equipped` | 共享内核参数 | 按 `statusDef.equipSlot` 判定 |
| 出伤过滤 = `weaponDamage` | 编队参数 / warrior JSON | 仅「会消耗武器耐久的攻击」 |
| 被动限装 | `validate.py:472` | 仅 `initialEquip` 可在开局自动装备 |

问题：
1. **语义污染**：武器不该叠层、不该自然到期、不该被 `dispel`、不该走状态叠加强度——这些都要靠 validate 特例挡住，而不是模型本身不允许。
2. **无法离开单位**：武器一卸下即消失（状态实例被移除），不存在「地上的武器」「被夺走的武器」「被摧毁的武器」，因此无法构成战场资源。
3. **无法全局共享**：武器定义挂在途径 statuses 文件里，其他途径要用只能复制；`has_equipped` 只好按 slot 泛判，读不到武器身份。
4. **无法扩展**：锻造、附魔、多武器切换、武器标签克制都没有概念落点。

## 3. 方案对比

| 维度 | A 纯一等（终态） | **B 一等实体 + 状态载荷（推荐落地）** | C 新军械上下文 |
|---|---|---|---|
| 归属 | 编队子域 | 编队子域；未持有武器进 `Combat` 级 WeaponLedger | 新增独立上下文 |
| 三件套 | WeaponDef → Grant → Instance | 同左 + 绑定一个 payload StatusInstance | 同左，跨上下文引用 |
| 武器效果 | 原生：静态修行走 `StatProvenance`、触发器共用事件总线 | 由 payload StatusInstance 承载（bearer = 武器实例） | 原生 |
| 武器能否脱离单位 | 能（Ledger） | 能（Ledger，payload 随之卸下） | 能 |
| 内核改动 | 大（效果承载层重写） | 小（装备/卸下事务 + 持有者字段 + 谓词） | 最大 |
| 存量迁移 | 4+4 整批 + 内核 | 4+4 整批 + 内核小改 | 全链路 |
| 风险 | 首轮成本过高 | 双真源（武器耐久 vs payload charges）→ 用不变量消除 | 4 把武器下过度建模 |

**推荐：B 落地，A 作为终态方向，C 暂不做。**

## 4. 推荐模型 B

```
WeaponDef（Catalog · 不可变）
  id, name, slot='weapon', tags[]（sword/blade/heavy/ranged…）,
  defaultDurability, attackProfile?（reach / 基础伤害档）,
  payloadStatusId（效果载荷）, enchantSlots[]

WeaponGrant（值对象）
  durability, sourceId, enchantments[]

WeaponInstance（战斗内实体）
  instanceId, defId, grant, durability, holderUnitId | null（null = 在 WeaponLedger）
  payloadInstanceId（绑定关系）
```

三条不变量（消除双真源）：

1. **载荷随持有**：payload StatusInstance 存在 ⇔ `holderUnitId != null`；payload 的 `bearer = weaponInstanceId`，不可被独立挂载或驱散。
2. **耐久单一写者**：耐久只由 `WeaponInstance.durability` 写；payload 上的 `charges` 是只读镜像（终态 A 删除）。
3. **原子换装**：装备/卸下是一个事务——同时更新 holder、挂载/卸载 payload、写 `StatProvenance`；任一步失败整笔回滚。

生命周期：

```
forge → Ledger → equip → 消耗耐久 → 打空/被破坏 → Ledger（或销毁）
disarm：holder = null + 卸载 payload + 进 Ledger（定义保留）
```

## 5. 原语与谓词候选

| 名称 | 类型 | 语义 | 优先级 |
|---|---|---|---|
| `equip_weapon` | 新原语 | 从 Ledger 或直接生成装备到槽；同槽互斥 | P0 |
| `disarm` | 语义改写 | 从「卸 status」改为「卸 WeaponInstance 到 Ledger」 | P0 |
| `has_equipped` | 谓词重实现 | 读单位武器槽；选项：slot / tag / any | P0 |
| `weapon_tag` / `weapon_is` | 新谓词 | 按标签 / 定义 id 判定，不点名具体武器时用 tag | P1 |
| `weapon_durability_cmp` / `weapon_count` | 新谓词 | 耐久阈值 / 持械数（多槽后） | P1 |
| `destroy_weapon` | 新原语 | 耐久归零或被主动摧毁，移出 Ledger | P1 |
| `forge_weapon` | 新原语 | 生成 WeaponInstance 进 Ledger | P1 |
| `enchant_weapon` / `modify_weapon` | 新原语 | 挂附魔 / 改标签、耐久、攻击档 | P2 |

> 新原语必须先在 `docs/meta/SCHEMA.md` §5.2 登记、再改 `skills.schema.json`，并跑 `check_enum_sync.py` —— 本提案不预登记。

## 6. 所有权

- **WeaponDef 入全局池**（建议 `docs/json/common.weapons.json` 或 `common.statuses.json` 同级新文件），**禁 pathway 字段**。
- 途径不得声明某武器私有；只能在自己的轴里声明 weapon facet（六词沿用 SCORING §二·三）。
- 跨系联动：武器实例可被夺取/转移，成为跨途径共享资产；写入归属仍按写入卡，不按武器原属途径。
- 防刷：`equipment` 锚点仍要求 ≥2 卡操作 + 读层闭环；不得靠「拥有武器」自动算轴身份。

## 7. 影响面审计（实测）

| 面 | 数量 | 位置 | 迁移 |
|---|---:|---|---|
| 装备状态定义 | 4 | `warrior.statuses.json`（dawn_blade / weapon_silver_rapier / weapon_dusk_greatsword / weapon_standard_blade） | 平移为 WeaponDef + payload |
| 直接引用卡 | 4 | `warrior.skills.json`（s9_arms_mastery / s6_dawn_blade / s3_silver_rapier / s2_twilight_greatsword） | 改 `equip_weapon` 或兼容写法 |
| 出伤过滤 | 1 | `warrior.statuses.json:61` `weaponDamage: true` | 改读 WeaponInstance |
| `has_equipped` 引用 | 16 处 / 8 文件 | ddd params 2 / schema 2 / warrior JSON 6 / `SCHEMA.md` 2 / glossary 1 / `score.py` 2 / `build_overview.py` 1 | 谓词重实现 + 调用点改名 |
| `validate.py` 规则 | 10 处 | `59, 255, 259, 261, 373, 380, 403, 442, 472, 484` | 改查 WeaponDef 池；禁新数据旧形 |
| `score.py` | 5 处 | `237, 266, 1053, 1097, 1112`（facet 段 291-300 同改） | 改扫武器池；facet 六词不变 |
| schema | 3 处 | `equipSlot`(2981) / `initialEquip`(3302) / `disarm`(1800) | 新 weaponDefs 池 + 原语登记 |
| site | 3 文件 | `site/js/ast.js:85,216` / `status.js:14,159` / `views/blueprint.js:77` | 读 WeaponDef |
| game 内核/数据 | 5 文件 | `catalog/types.ts:132,363` / `combat/runtime.ts:346,859-860,987` / `effect/handlers2.ts:71` / `roster/unit.ts:143` / `data/catalogBuild.ts:162,247` | 装备事务 + 持有者字段 + 谓词 |
| game 测试 | 1 文件 | `game/tests/weaponSlot.test.ts`（整文件） | 按新模型重写 |
| 文本提及 | 40 卡 / 11 途径 | lore / flavor / conversionNotes | 零迁移（无机制） |

## 8. 迁移与 MVP

**迁移选项**（逐机制评估后建议：整批 4+4 + 兼容壳一个版本）：

- 兼容壳：保留 `mount_status(equipSlot)` 一版，内部转译为 `equip_weapon`；`validate.py` 对新数据报错、对旧数据告警。
- 一个版本后删除旧形，避免双真源长期存在。

**分阶段**：

| 阶段 | 内容 | 验收 |
|---|---|---|
| P0 | WeaponDef 结构、三条不变量、validate 规则、score facet 映射 | 文档评审 + 空跑四门禁 |
| P1 | 4 个武器平移 + 4 张战士卡迁移 + 内核装备事务 + weaponSlot.test 重写 | 四门禁全绿 + `npm test` + `score.py` 不退化 |
| P2 | Ledger + disarm 改写 + destroy/drop + 夺取 | `playable_scan` 新增变量可测 |
| P3 | forge / enchant / 多武器切换 | 至少一个骨架重构试点通过环节⑥ Gate |
| P4（可选） | 终态 A：payload 效果迁到 WeaponDef-native | payload 状态退役 |

## 9. 解锁的骨架（示例，待环节⑥裁定）

| 骨架 | 一句话命题 | 需要的武器能力 |
|---|---|---|
| 兵器谱 / 锻造 | 武器是投资品：锻造、升级、替换，强度来自投入而非卡面 | forge / modify / Ledger |
| 夺械 / 破械 | 武器是战场资源：夺取、破坏、弃置，剥夺对手的攻击档 | disarm / destroy / steal / Ledger |
| 多武器切换 | 单回合内按需换装，换装本身是节奏决策 | 槽数组化 / 换装成本 |
| 武器附魔 / 改装 | 给武器挂载模块，模块与武器组合出不同打法 | enchant / tags |

## 10. 拍板项（不可逆）

1. 落地形态选 **B（一等实体 + 状态载荷）** 还是直接 **A（纯一等）**？
2. 是否新增 `equip_weapon` 等原语，还是先复用 `mount_status` + 兼容壳？
3. 武器槽是否保持单槽 `weapon`，还是本轮就数组化（影响 schema、选靶、内核）？
4. 未持有武器是否进入 `Combat` 级 WeaponLedger（影响纯函数快照与可复现性）？
5. 武器定义池放哪里、是否允许跨途径共享 / 夺取？
6. 耐久是否继续沿用 charges 口径（B 的镜像），还是立即改为 WeaponInstance 单一字段？
7. 兼容壳保留几个版本、存量迁移批次（建议一次 4+4）。
