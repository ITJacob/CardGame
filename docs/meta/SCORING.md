# 职业设计评分体系（SCORING）· **2.4（2026-10-19 真 bug 修复 + 差异化重切 + 玩法轨隔离）**

> 配套脚本 `docs/tools/score.py`（唯一计分实现，本文件锁口径）；
> 产物：`docs/analysis/scorecard.md`（勿手改）+ `docs/analysis/scores.json`（网页端消费，site 经
> `../docs/analysis/scores.json` fetch，前端不重算）。
> 用途：① 途径/轴设计质量的可比度量；② 逐职业重设计推进的取榜依据（WORKFLOW 环节⑤）。

## 〇、2.0 改了什么、为什么

1.0 的轴级判据只认**一种形状**（身份状态 → enabler 挂载 → payoff 读身份 → 读法多样），
且身份锚定硬要求「层数引擎」。实测 88 轴里产读闭环型仅 46，其余 42 是资源循环 / 触发器 /
形态轮转 / 召唤军团 / 纯放大器 / 自闭环 / 规则槽 / Pool；19 个轴靠 `payoffVacuumAccepted`
逃生舱拿保底分——**逃生舱的存在即模板不匹配的自证**。更关键的是：1.0 只认**直接引用**
（`statusId` 命中），看不见**间接作用**——不眠者「赶夜 `advance_clock` → 改全局时钟 → 相位入夜
→（跨四轴）点亮相位门控收益」这条链路经过「相位」这个**全局通道**，1.0 完全失明。结果：越按
分数优化越同质化，正是「差异化专项」要防的东西被评分体系自己制造出来。

2.0 的两条改动主线：
- **作用面**取代「身份状态」单点：评分认**状态面 + 全局通道面**两类产出，直接引用与**通道介导的
  间接作用**等价计分——多种轴型都能拿分，不再往一个形状上拧。
- **差异化权重大幅上调**（10→25），并把结构/落地/文本三个「全库已满分、无区分度」的维压到 5。

**2.1（同日追加）**：指纹向量从「原语四族」升级为**全链路八族**（加**状态身份 / 选靶 / 选靶 filter /
触发点**，见 §三·一），轴内多样性同步扩到全链路词表。动机：度量一度只认原语，导致**选靶维度
（全库 571 卡有 `target`、88 轴已逐一设计签名）与私有状态身份对差异化零贡献**——用常规原语做
主题化机制的途径（如战士）被结构性低估。

**2.2（2026-10-17）**：全链路指纹从八族扩到**十二族**（2.3 合并选靶两族后为十一族），并修三处口径缺口：
① `sref`（私有 statusId）→ `sshape`（状态形态）——statusId 是途径私有命名，跨途径几乎零重合，
   距离恒满，等于把"有没有私有状态"当设计差异；改为展开状态 def 的结构 flags / 修正名 /
   自带效果原语 / 时长形态，跨途径可比。
② `stat`（只取 `modify_stat` 的 `stat` 键）→ `param`（所有原语的枚举型参数键值），补
   `modify_resource.resource` / `spawn` 单位与位置 / `move`·`domain`·`translocate` 的 op /
   规则槽 field 等；仍不取数值（原则 4）。
③ 新增 `condarg`（条件谓词的枚举参数）、`reach`（射程）、`cost`（支付形态档）、
   `temporal`（吟唱 / 时长口径）。轴内多样性的"状态身份"同步改为"状态形态"。

**2.3（2026-10-17）**：权重收尾。实测 22 途径的「结构健康 / 机制落地 / 文本完备」全部满分，15 分
对排名零贡献——三项改为**门禁**（不计入 100 分，未达标各扣 3）。腾出的 15 分给轴健康度
（30→35）与差异化（25→35）；差异化内部签名键 10→15、指纹距离 10→15，并把分位计分从四档改
六档（原四档把十二族的距离压扁）。合计 35+15+15+35 = 100。
同日把 `tgt` / `tgtf` 合并为一族（选靶坐标 + filter 键 + 效果级作用对象统一入 `tgt`，前缀区分），
族数回到**十一族**——选靶环节恢复"链路一环一票"。

**2.4（2026-10-19）**：机制期诊断后的口径修复。① `mount_status` 不再计入读层（产层冒充读层）；
② 主被动比去 `round()` 死区改线性、稀有度违规每张扣 2、旗舰卡改布尔；③ 机制落地无登记不再满分
（4.0 且不触发门禁）；④ 文本完备加最短长度与 describe 去重；⑤ 轴内多样性改**密度口径**
（去重形态 ÷ 卡数，cond 仅计 then/else 均非空的 if，上限 6）；⑥ 指纹距离由全库分位改**绝对阈值**
（≥0.30→12 / ≥0.26→10 / ≥0.22→8 / ≥0.18→5 / ≥0.14→3）；⑦ 差异化 35 重切为
**签名 7 + 途径间指纹 12 + 构型 5 + 途径内去重 11**。合计 35+15+15+35 = 100 不变。
玩法轨（`playable_scan.py` 10 项）**永不进 100 分**。

## 一、原则

1. **全部指标机器可验**：从 JSON AST 实算，不靠人工打分。
2. **每个失分项指向具体卡/轴**：计分卡附失分清单，可直接转为修改动作。
3. **闭环优先**：产出物被**消费**（直接读 / 通道下游 / def 内自闭环）权重最高。
4. **评分不治数值**：全库数值 ⚠️D 是基线状态，不计分；本体系评的是**结构与设计丰富度**。
5. **差异化可度量**：途径级「差异化」维（签名键 + 途径间指纹 + 构型多样 + 途径内去重）使同质化在分数上可见。
6. **承认间接作用（2.0 新增）**：产出物经**全局通道**（相位 / 量表 / 场地 / 召唤…）被他处消费的，
   与卡面直接读等价计分——间接因果链不再隐形。
7. **玩法轨隔离（2.4 新增）**：玩家侧指标（`playable_scan.py` 10 项）只作诊断与验收，**永不进 100 分**——
   进分即会在两轮内被优化成新的刷分面。

## 二·零 轴身份锚点体系（2026-10-19 立）

> 原则：**一个轴以「代表玩法 / 机制」为身份，状态只是可选载体**。不得为了评分给每个轴强造一个状态、
> 再让其他卡围绕它做产层/读层——那是 AI 设计模式的核心病灶。

轴可用 `axes.<axis>.anchor = { kind, id }` 声明锚点；`statusId` 是 `kind=status` 的兼容简写。
锚点必须满足两条：**可机器验证**（结构化操作存在）＋ **有闭环**（≥2 张卡操作、≥1 张卡读取或自身机制闭环）。

### 全四类锚点清单（登记版）

| 类 | kind | 例子 | 判定 |
|---|---|---|---|
| 实体/载体 | `status` | 守护、伪装、衰老 | 挂载 + 读层 + 层数/触发机制 |
| 实体/载体 | `status_family` | 月相组、姿态族 | 一组相关状态 ≥2 个共同闭环 |
| 实体/载体 | `resource` | 战意、迷失、恶欲、隐秘 | Pool 读写 + 阈值/档位 |
| 实体/载体 | `equipment` | **武艺=武器槽** | equipSlot 操作 ≥2 卡 + 耐久/换装/补耐久 |
| 实体/载体 | `zone` | 晨曦阵地、陷阱区 | 区域/界域放置 + 进入/停留读取 |
| 行为/原语 | `primitive` | translocate / snapshot / write_rule_slot | 原语使用 ≥2 卡 + 读层联动（限白名单，排除 damage/mount_status 等通用骨架） |
| 行为/原语 | `trigger` | on_kill 收割、on_phase_change | 触发点挂载 ≥2 卡 + 条件/载荷闭环 |
| 行为/原语 | `geometry` | chain_n 连锁、enemy_back 后排 | 选靶几何签名 ≥2 卡 + 读层 |
| 行为/原语 | `action_economy` | 行动机会/行动条 | opportunity/gauge 机制 + 收益闭环 |
| 全局通道 | `channel` | phase / luminance / death_tally / order / secrecy / fate_value / clock | 本轴写入 + 读取/下游读者 |
| 全局通道 | `rule_slot` | 规则改写槽 | write/modify rule slot + 读取 |
| 维度/签名 | `dimension` | 位格、性别、单位类型 | 维度谓词/过滤 ≥2 卡 + 联动 |
| 维度/签名 | `element` | 圣光、冰、暗 | 元素伤害/状态 ≥2 卡 + 克制/反应闭环 |
| 维度/签名 | `form_cycle` | 月相轮转、昼夜形态 | formGroup/phases/cycleTicks + 读取 |

### 评分口径

- **最小实现集**：`status` / `resource` / `channel` / `equipment` / `primitive`（本轮落在 score.py）。
- 身份锚定 15 = 锚点可解析 8 + 机制闭环 7（按 kind 判定；`status` 沿用现有状态机制判据）。
- 产层闭环 / 收束闭环按锚点的「产出面」计算：
  - status → `status:<id>`；equipment → 该槽全部状态；channel → 通道键；resource → 资源读写；primitive → 原语使用。
- 未声明 anchor 且无 statusId 的轴：回退旧逻辑（Pool 资源 / 本轴通道）。
- 不适合作锚点：单一元素/单张卡签名、纯数值维度、通用骨架原语（damage / mount_status）。

## 二、轴级指标（0–100，六维）

| 维度 | 权重 | 判据与计分 |
|---|---:|---|
| 身份锚定 | 15 | 身份锚点可解析——`statusId` 命中 statusDef / Pool 轴的 `modify_resource` 资源 / **本轴写入的全局通道**——得 8；身份状态带**机制**（`stackThreshold`/`thresholdTrigger`/`maxStacks>1`/`charges`/`triggers`/`statPerStack`/`formGroup`/`phases`/`cycleTicks`/`behaviorModifiers` 任一）再 +7；`statusId` 悬空 0。（**2.0 起取消「层数引擎」硬要求**：covert_veil 这类以 `triggers` 破隐的机制同样满分） |
| 产层闭环 | 20 | enablers 逐张 **AST 实证产出身份**——挂载身份状态 / Pool 轴的 `modify_resource` 产能段 / **写入身份通道**：实证 ≥2 张得 20，1 张 12；enablers 非空但全未实证 5；空 0 |
| 收束闭环 | 25 | 轴产出物**被消费**的实证，三条路径**取较优**（封顶 25）：① **有 payoff 卡**——读**本轴产出面**（身份状态 **或本轴写入的通道**）每张 9、不读每张 4（notes 级）；② **无 payoff 卡**——**间接收束**：本轴写入的通道，其**下游读者数**分档（≥6→9 / ≥3→6 / ≥1→3，逐通道求和）；③ **def 内闭环**：身份 def 自带动态引擎（非 `on_apply` 的 `triggers`/`stackThreshold`/`thresholdTrigger`/`statPerStack`/`phases`/`cycleTicks`/`formGroup`）15 分，仅带静态载荷（`on_apply` 载荷/`modifiers`）10 分。真空轴不再需要 `payoffVacuumAccepted` |
| 轴内多样性 | 15 | **（2.4：密度口径）** 轴内卡的**去重形态密度** =（原语种类 + 条件谓词种类 + 选靶 `scope`/`anchor` 种类 + 触发点种类 + 状态形态种类）÷ 本轴卡数；条件谓词只计 **then/else 均非空**的 if（空 else 不算分支），且上限 6；对全库轴最大值归一：15 × 本轴密度 / 全库最大。密度化消除「堆卡 / 空 if 刷种类」的规模代理 |
| 规模均衡 | 10 | 轴卡数 / 途径卡均在 [0.6, 1.4] 区间得 10；区间外线性衰减（每偏 0.1 扣 1） |
| 承接连通 | 15 | 收束方式去重计数（**乘区 / 条件分支 / 耗层 / 存在性 / 通道读**，各 3），封顶 15。跨轴/跨系消费不在此计——由途径级「跨轴耦合」「跨系联动」承担，避免同一批读取双计 |

### 二·一 全局通道表（「间接作用」的载体）

通道 = 战场级共享变量，跨轴 / 跨途径可见。轴产出面 = 「状态面」∪「通道面」。
作用面 item 统一字符串：`status:<sid>` 或通道名。

| 通道 | 写入原语 | 读取谓词 |
|---|---|---|
| 相位 `phase` | `advance_clock`（时钟推进） | `phase_is` / 卡级 `phaseHooks` |
| 量表 `luminance` / `fate_value` / `secrecy` / `order` / `death_tally` | `set_luminance` / `modify_resource(board)` / 击杀（death_tally） | 卡级 `dimHooks(dim:X)` / `resource_compare` / `dead_count` |
| 场地 `zone` | `spawn(zone)` / `domain` | `zone_active` / `zone` |
| 召唤 `summon` | `spawn(unit)` | `caster_has_summon` / `target_is_summoned` / `filter.unitType` |
| 资源 `resource` | `modify_resource` | `resource_compare` / `hp_percent` |
| 位格 `rank` | — | `rank_gap` |
| 状态 `status`（轴内通道） | `mount_status` / `modify_status` | `has_status` / `caster_status_exists` / `field_status_count` |

> **耦合通道**（跨轴耦合 / 跨系联动 / 承接连通里的"消费"计数）= 上表**剔除 `zone` / `summon`**
> 之后的通道——二者是库内结构性脚手架（写卡 41 / 117 张），纳入会让"有区域/有召唤"人人拿满耦合分；
> 它们仍计入轴的产出面供「收束」判定。

### 二·二 归一说明

跨轴耦合 / 跨系联动原始量为**重尾分布**（通道读者可达数十），2.0 用**封顶归一**（`15 × min(raw, CAP)/CAP`，
跨轴 CAP=12、跨系 CAP=16）而非「÷全库最大」，避免单点离群把其余途径压平。

## 三、途径级指标（0–100，四维 + 三项门禁）

| 维度 | 权重 | 判据与计分 |
|---|---:|---|
| 轴健康度 | 35 | 四轴级得分均值 ×0.75 + 最低轴得分 ×0.25（短板加权）；最低轴 <40 再 −5、<25 再 −10 |
| 跨轴耦合 | 15 | 途径内卡读**本途径他轴产出面**（身份状态 **或耦合通道**）的（卡×轴）次数，CAP=12 封顶归一 ×15 |
| 跨系联动 | 15 | 本途径被跨途径消费：`crossPathway` 枢纽状态数 ×4 + 读他途径枢纽实证次数 + **他途径卡读本途径写入的耦合通道**次数；CAP=16 封顶归一 ×15 |
| **差异化** | **35** | 四项相加（2.4 重切）：① **签名键落地 7**：签名键逐键——≥2 卡 AST 实证 3 分 / 1 卡 1.5 分，封顶 7（键表 = score.py `PATHWAY_SIGNATURES`）；② **途径间指纹 12**：全链路指纹（§三·一）对他 21 途径的分族等权均距，**绝对阈值** ≥0.30→12 / ≥0.26→10 / ≥0.22→8 / ≥0.18→5 / ≥0.14→3 / 其余 0；③ **构型多样 5**：四轴 1−Jaccard 均距 ×5；④ **途径内去重 11**：卡级指纹两两距离 <0.20 的对数占比，0%→11、≥15%→0 线性（整组复制会直接归零） |
| 结构健康 | 门禁 | 稀有度×序列合规（每张违规扣 2）+ 主被动比在 [1.5, 3.0]（出界按距离线性衰减，满分 3）+ 旗舰卡恰 4 张（布尔，3 分），满分 5；**达标不扣分，不达标总分 −3**，不计入 100 分 |
| 机制落地 | 门禁 | 有 `frameworkFlags` 时按 landed 占比满 5；无登记给 4.0 且**不触发门禁**（缺口的底账不可验证，但不再白送满分）；同上门禁规则 |
| 文本完备 | 门禁 | lore/flavor 齐备 + describe 最短 20 字 + 途径内 describe 不重复，达标率满 5；同上门禁规则 |

合计 35+15+15+35 = 100；三项门禁不计分，未达标各 −3（`scores.json` 的 `gates` / `gatePenalty`）。

### 三·一 全链路指纹（2.1 新增；2.3 十一族，差异化②的向量口径）

> 动机：**机制的复杂性不单单是原语**——施法作用的整条链路（选靶 → 条件 → 效果 → 状态 → 时序）
> 都是设计语言。2.2 起状态不再用私有 statusId 当键（跨途径不可比），改为状态 def 的形态指纹。

指纹 = 若干**族**，每族独立 **L2 归一**后参与距离；`cos_dist` = **各族余弦距离的均值**（族等权，可调）。
距离计分用**绝对阈值**（0.14–0.30 五档，见 §三），不再用全库分位——分位制会让「全库一起优化」排名不动、
单卡微改跨档套利。

| 族 | 键 | 来源 |
|---|---|---|
| `prim` | 原语种类 | `card_effect_types`（每卡去重） |
| `elem` | 元素 | effects 的 `element` |
| `cond` | 条件谓词 | `_cond_kinds` |
| `condarg` | 条件谓词的枚举参数 | `kind:field=value`（cmp/side/key/stat/unitIdx/…；**私有 statusId 不取**） |
| `param` | 效果原语的枚举参数 | `field=value`（`modify_stat.stat` / `modify_resource.resource` / spawn 单位与位置 / `move`·`domain`·`translocate` 的 op / 规则槽 field 等；**数值不取**） |
| `reach` | 射程 | active 卡 `reach`（none/melee/spell/thrown） |
| `tgt` | 选靶（卡级坐标 + filter + 效果级作用对象） | `target.request`：`faction`/`scope`/`anchor`/`mode`/`selectionMode`；`request.filter` 键（前缀 `filter:`）；effects 的 `target`（前缀 `eff:`） |
| `hook` | 触发点 | 卡级 `hook`/`triggers[].event` ＋挂载状态 def 的 `triggers[].event`；**排除 `on_apply`**（状态挂载载荷的固有生命周期事件，不体现触发点设计） |
| `sshape` | **状态形态** | 引用状态 def 的结构 flags（triggers/charges/stack/threshold/form/phases/cycle/ramp/behavior/action_lock/immune/redirect…）+ 修正名 + 自带效果原语（`on_apply` 载荷）+ 时长形态；**不含私有 statusId** |
| `cost` | 消耗形态 | `energy` 档（zero/low/mid/high）+ `cooldown` 档（none/short/long）+ 血费（自伤 hp 支付） |
| `temporal` | 时序形态 | 吟唱有无（`castTime>0`）/ `durationUnit`（tick、self_turn）/ 吟唱转瞬发 |

> 不取数值：上述键只记录**形态/档位**，不含 amount、value、duration 等数值（SCORING 原则 4）。
> 消费通道 `consumption`、选靶几何形状（schema 无字段）等暂未入族；需扩展时加进 `score.py`
> 的 `FAMILIES` 并同步本表。

## 四、产物与消费

- `score.py` 一次跑产出两份：`docs/analysis/scorecard.md`（全库排行 + 逐途径/逐轴计分卡与失分清单）、
  `docs/analysis/scores.json`（网页端评分页直接数据源，前端不重算，经 `../docs/analysis/scores.json` fetch）。
- **进门禁**：`score.py` 为只读脚本，与四脚本同轮跑（不阻塞通过），重设计迭代里用它确认「改后涨分」。
- 重设计推进按途径总分升序取榜（最低分先做），一途径一 commit，改前改后分记入
  `docs/archive/meta/REDESIGN_LOG.md`。
- 口径改动同轮需同步：`docs/tools/score.py`、`docs/tools/build_style_analysis.py`（`import score`，同源）、
  `site/js/views/score.js`（维度常量 `DIMS`/`GATE_DIMS`/`AXIS_DIMS`）、`docs/analysis/`（`build_analysis.py` 重跑）。
