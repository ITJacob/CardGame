# 武器牌系统（机制扩容提案）

> 状态：**已拍板 · 待实施**（2026-10-23 主人拍板八项）
> 入口：环节⑥骨架重议 → 机制扩容（`WORKFLOW.md`）
> 结论：武器 = 新增的技能卡类型 `kind: "weapon"`，**打出即装备**；无背包、无全局武器池、无锻造/拾取。
> 纪律：本提案**不改**任何 `docs/ddd` / `docs/json` / schema / 脚本；实施须先过环节⑥ Gate 并按 ② 机制落地顺序推进。

## 0. 一页结论

- **卡类型**：新增 `kind: "weapon"`。武器牌是途径卡（内容），武器槽 / 耐久 / 替换 / 破械是全局机制。
- **编队槽位**：武器牌**归主动槽**（`bucketOf(kind) → active`），与主动技能竞争牌位；不新增第三类槽位。
- **生命周期**：打出 → 摧毁当前武器 → 生成 `WeaponInstance` → 执行 on-play（战吼）→ 装备期间提供攻击加值与触发器 → 普攻消耗 1 耐久 → 归零摧毁。
- **无背包**：不存在未装备武器；`disarm` = 卸下并摧毁；没有回到手牌/地上的概念。
- **它解锁的骨架**：换装节奏、破械/缴械对策、武器强化、武器牌构筑（见 §9）。
- **代价**（已实测）：`kind` 判定约 68 行（tools 20 / site 16 / game 32），其中编队 loadout 19 处；4 个装备状态删除、3 张主动卡转 weapon、1 张被动卡改 initialEquip；`has_equipped` 16 处 / 8 文件、`validate.py` 10 处、`score.py` 5 处、schema 3 处、game 内核/数据 5 文件 + 测试。其余 40 张卡提到「武器」只是 lore/flavor，零迁移。

## 1. 设定核查

- 原著中武器是凡俗工具，不承载途径权柄；序列能力才是途径身份。→ **武器机制必须全局，不能成为某途径的私有规则**。
- 武器牌的**内容**可以按途径出（猎人弓、刺客匕首、水手鱼叉），但这不等于途径私有化机制——任何途径都能用同一套武器槽 / 耐久 / 替换规则。
- 「武艺」轴的身份不是「有武器」，而是它在 weapon facet 上实现的机制条目（装备 / 耐久消耗 / 补耐久 / 读已装备 / 夺取 / 打空）。与 SCORING §二·三一致。
- 边界：本提案只做武器牌的存在、装备、损耗、替换与破械；不做武器数值平衡、不做背包/锻造/交易。

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
1. **语义污染**：武器不该叠层、不该自然到期、不该被 `dispel`、不该走状态叠加强度——现在全靠 validate 特例挡住，模型本身不禁止。
2. **无法作为卡参与牌库**：武器没有费用、稀有度、卡面位置，也不进入卡池统计 / 蓝图兑现 / 构筑选择。
3. **定义被压在状态文件**：武器无法与卡的签名键、角色、稀有度曲线统一表达；升级、替换、破械都只能在状态层打补丁。
4. **无法扩展**：武器强化、破械对策、换装节奏都没有一等概念落点。

## 3. 方案对比

| 维度 | A 独立武器槽 | **B kind=weapon，编队归主动槽（推荐）** | C active + weapon 载荷 |
|---|---|---|---|
| 语义 | 武器是第三种卡，独立槽位 | 武器是第三种卡，占主动槽 | 武器不是独立卡类型，靠载荷判定 |
| 编队 / hero 生成 | 新增第三类槽位与生成逻辑 | 复用 `activeSkillIds`，集中 `bucketOf` | 零改动 |
| UI / 统计 / 评分 | 新增一类，改动最大 | 按 kind 分支，改动中等 | 按载荷分支，改动小 |
| `kind` 判定面 | 最大 | 中（约 68 行） | 零（但语义不在枚举上） |
| 推荐 | 过度 | **是** | 语义不够一等 |

**推荐 B**：保留 `kind: "weapon"` 的显式语义，编队层用 `bucketOf(kind)` 把 weapon 归入 active；不新增槽位，也不把类型判断散落成载荷探测。

## 4. 推荐模型 B

### 4.1 卡结构

```json
{
  "id": "skill_warrior_s6_dawn_blade",
  "name": "晨曦之剑",
  "kind": "weapon",
  "sequence": 6,
  "rarity": "uncommon",
  "axis": "武艺",
  "role": "bridge",
  "cost": { "energy": 3, "cooldown": 20, "castTime": 0 },
  "weapon": {
    "slot": "weapon",
    "attack": 4,
    "durability": 4,
    "tags": ["sword", "blade"],
    "modifiers": { "damageBonus": { "value": 2, "filter": { "unitType": ["DEMON", "UNDEAD", "SPIRIT"] } } },
    "triggers": [
      { "event": "on_deal_damage", "effects": [{ "type": "damage", "element": "none", "value": 2 }] }
    ]
  },
  "effects": []
}
```

- `effects` = **on-play 战吼**（可选），承接现有三张卡「打出即造成伤害」的段。
- `weapon.attack` = 装备期间攻击加值；`weapon.durability` = 普攻次数。
- `weapon.modifiers` / `weapon.triggers` = 装备期间生效，离开槽即失效，不需要 `on_apply` / `on_attack` 样板。
- 无 `reach` / `target`：武器牌默认对自身装备（拍板项 4）。

### 4.2 生命周期

```
play(weapon card)
  → 若持有者已有武器：摧毁旧 WeaponInstance（不返还）
  → 生成 WeaponInstance { cardId, durability, holderUnitId }
  → 执行 card.effects（战吼）

basicAttack(holder)
  → 武器 attack 加值生效
  → durability -= 1
  → durability == 0：摧毁

disarm(unit)
  → 卸载并摧毁当前武器
```

三条不变量：

1. **单槽单实例**：一个单位至多一个 WeaponInstance；装备新武器必须先销毁旧的。
2. **无背包**：WeaponInstance 只能由武器牌创建，且只存在于单位槽位；不存在游离实例。
3. **武器效果随槽**：`weapon.modifiers / triggers` 只在装备期间参与结算，卸载即撤销，不写任何持久状态。

## 5. 原语与谓词

| 名称 | 类型 | 语义 | 优先级 |
|---|---|---|---|
| `modify_weapon` | 新原语 | 改当前武器：耐久 ±N / 攻击加值 ±N / 加标签 | P1 |
| `disarm` | 语义改写 | 卸下并**摧毁**目标武器（无背包，不保留定义） | P0 |
| `has_equipped` | 谓词重实现 | 读单位武器槽；选项：slot / tag / any | P0 |
| `weapon_tag` / `weapon_is` | 新谓词 | 按标签 / 卡 id 判定 | P2 |

**不新增**：`equip_weapon`（打出武器牌就是装备）、`forge_weapon`、`destroy_weapon`（`disarm` 覆盖）。

> 新原语 `modify_weapon` 须先在 `docs/meta/SCHEMA.md` §5.2 登记、再改 schema，并跑 `check_enum_sync.py`——本提案不预登记。

## 6. 所有权

- **机制全局**：武器槽、耐久、替换、破械、`has_equipped` 归战斗内核，任何途径共用。
- **内容按途径**：武器牌是普通途径卡，带自己的稀有度 / 序列 / 轴 / 角色；不存在全局武器定义池。
- 途径身份只认 facet（SCORING §二·三），不认「有武器」；防全体途径靠加武器牌凑差异化——蓝图「风格边界」须声明本途径的主签名维度。
- 跨途径读取：其他途径可用 `has_equipped` / `weapon_tag` 读武器状态；`disarm` 与 `modify_weapon` 可作用于敌方武器，构成破械对策。

## 7. 影响面审计（实测）

| 面 | 数量 | 位置 | 迁移 |
|---|---:|---|---|
| 装备状态定义 | 4 | `warrior.statuses.json`（dawn_blade / weapon_silver_rapier / weapon_dusk_greatsword / weapon_standard_blade） | 删除，内容并入武器牌 |
| 主动卡 | 3 | `warrior.skills.json`（s6_dawn_blade / s3_silver_rapier / s2_twilight_greatsword） | 转 `kind:"weapon"`；原伤害/条件段 → `effects`（战吼） |
| 被动卡 | 1 | `warrior.skills.json`（s9_arms_mastery 兵械通晓） | 保持 passive；开局装备改为引用武器卡 id |
| `kind` 判定 | 约 68 行 | tools 20 / site 16 / game 32 | 新增 weapon 分支；武器牌按 active 统计 |
| 编队 loadout | 19 处 | `game/src/meta/loadout.ts` / `herogen.ts` / `buildSetup.ts` / `ui/views/prep.ts` 等 | 集中 `bucketOf(kind)`；weapon → activeSkillIds |
| `has_equipped` 引用 | 16 处 / 8 文件 | ddd params 2 / schema 2 / warrior JSON 6 / `SCHEMA.md` 2 / glossary 1 / `score.py` 2 / `build_overview.py` 1 | 谓词重实现 + 调用点改名 |
| `validate.py` 规则 | 10 处 | `59, 255, 259, 261, 373, 380, 403, 442, 472, 484` | 改查武器牌；禁 `equipSlot` 状态旧形 |
| `score.py` | 5 处 + facet 段 | `237, 266, 1053, 1097, 1112`（291-300 同改） | 武器 facet 改扫 weapon 卡；weapon 计为 active |
| schema | 3 处 + 新增 | `card.kind`(枚举) / `weapon` 载荷 / 状态 `equipSlot` 退役 / `disarm` 语义 | 先改 schema 再改数据 |
| site | 5 文件 | `ast.js` / `status.js` / `views/card.js` / `views/cards.js` / `views/stats.js` | 渲染武器牌与 weapon 载荷 |
| game 内核/数据 | 5 文件 | `catalog/types.ts` / `combat/runtime.ts` / `effect/handlers2.ts` / `roster/unit.ts` / `data/catalogBuild.ts` | 卡牌打出分支 + 武器实例 + 普攻耐久 + disarm |
| game 测试 | 1 文件 | `game/tests/weaponSlot.test.ts` | 按武器牌模型重写 |
| 文本提及 | 40 卡 / 11 途径 | lore / flavor / conversionNotes | 零迁移（无机制） |

## 8. 迁移与 MVP

**迁移选项**：一次性整批，**不留兼容壳**。理由：无持久化战斗存档；4+4 规模可控；留壳只会长期保留 `equipSlot` 状态双真源。`validate.py` 在迁移同轮直接禁旧形。

| 阶段 | 内容 | 验收 |
|---|---|---|
| P0 | schema：`card.kind` 加 `weapon`、`weapon` 载荷、状态 `equipSlot` 退役；`bucketOf` 映射 | schema 校验通过 + 文档评审 |
| P1 | 4 状态删除；3 张主动卡转 weapon（战吼承接）；兵械通晓 initialEquip；内核装备/普攻耐久/disarm；weaponSlot.test 重写 | 四门禁全绿 + `npm test` + `score.py` 不退化 |
| P2 | `modify_weapon` + `weapon_tag/weapon_is`；武器牌 UI / 卡面耐久显示 | `playable_scan` 新增变量可测 |
| P3 | 其他途径武器牌（猎人弓 / 刺客匕首等），配环节⑥ 骨架试点 | 环节⑥ Gate 通过 |

## 9. 解锁的骨架（示例，待环节⑥裁定）

| 骨架 | 一句话命题 | 需要的武器能力 |
|---|---|---|
| 换装节奏 | 武器是消耗品：何时换、换哪把决定输出窗口 | 单槽替换 / 耐久 / 战吼 |
| 破械对策 | 武器是敌方资产：缴械与耐久压制是防御手段 | disarm / modify_weapon |
| 武器强化 | 先花牌位强化现有武器，而不是换新武器 | modify_weapon |
| 武器牌构筑 | 武器牌与主动技能竞争同一个牌位，构筑时要取舍 | 编队归主动槽 |
| 持械条件 | 有武器/无武器是状态，可被读、被剥夺 | has_equipped / weapon_tag |

## 10. 拍板记录（2026-10-23）

| # | 议题 | 拍板 |
|---|---|---|
| 1 | 卡类型 | 新增 `kind: "weapon"`；武器牌归主动槽（`bucketOf → active`），不新增第三类槽位 |
| 2 | on-play 效果 | 允许（战吼式），用于承接现有三张卡的「造成伤害 + 装备」 |
| 3 | 攻击模型 | 武器给攻击加值；普攻消耗 1 耐久；不新增「武器攻击」动作 |
| 4 | 装备对象 | 打出者自身；给友军装备留到 P2 |
| 5 | 替换 / 摧毁 / 缴械 | 打出新武器直接摧毁旧的；耐久 0 摧毁；`disarm` 改为「卸下并摧毁」 |
| 6 | 新原语 | 只加 `modify_weapon`（P1）；不加 `equip_weapon` / `forge_weapon` / `destroy_weapon`；`has_equipped` 重实现，`weapon_tag/weapon_is` P2 |
| 7 | 存量迁移 | 删 4 状态；3 张主动卡转 weapon，原伤害段转战吼；兵械通晓保持 passive + 引用武器卡；validate 直接禁旧形 |
| 8 | 兼容壳 | 不留；一次性整批迁移 |

## 11. 实施前仍需明确的细节（不阻塞拍板）

1. 武器牌是否允许同名多张进入同一套牌（建议沿用现有牌库规则）。
2. 耐久消耗是否只发生在**普攻**（建议是；技能攻击不消耗）。
3. 武器 attack 加值与 `modify_stat` 的叠加顺序（建议先加武器、再乘乘区）。
4. 其他途径本轮是否同步出武器牌（建议 P3 再做，先只迁移战士）。
