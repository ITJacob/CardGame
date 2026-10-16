# 职业设计评分体系（SCORING）· **2.1（2026-10-16 口径重写 + 全链路指纹）**

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

## 一、原则

1. **全部指标机器可验**：从 JSON AST 实算，不靠人工打分。
2. **每个失分项指向具体卡/轴**：计分卡附失分清单，可直接转为修改动作。
3. **闭环优先**：产出物被**消费**（直接读 / 通道下游 / def 内自闭环）权重最高。
4. **评分不治数值**：全库数值 ⚠️D 是基线状态，不计分；本体系评的是**结构与设计丰富度**。
5. **差异化可度量**：途径级「差异化」维（签名键 + 指纹距离 + 构型多样）使同质化在分数上可见。
6. **承认间接作用（2.0 新增）**：产出物经**全局通道**（相位 / 量表 / 场地 / 召唤…）被他处消费的，
   与卡面直接读等价计分——间接因果链不再隐形。

## 二、轴级指标（0–100，六维）

| 维度 | 权重 | 判据与计分 |
|---|---:|---|
| 身份锚定 | 15 | 身份锚点可解析——`statusId` 命中 statusDef / Pool 轴的 `modify_resource` 资源 / **本轴写入的全局通道**——得 8；身份状态带**机制**（`stackThreshold`/`thresholdTrigger`/`maxStacks>1`/`charges`/`triggers`/`statPerStack`/`formGroup`/`phases`/`cycleTicks`/`behaviorModifiers` 任一）再 +7；`statusId` 悬空 0。（**2.0 起取消「层数引擎」硬要求**：covert_veil 这类以 `triggers` 破隐的机制同样满分） |
| 产层闭环 | 20 | enablers 逐张 **AST 实证产出身份**——挂载身份状态 / Pool 轴的 `modify_resource` 产能段 / **写入身份通道**：实证 ≥2 张得 20，1 张 12；enablers 非空但全未实证 5；空 0 |
| 收束闭环 | 25 | 轴产出物**被消费**的实证，三条路径**取较优**（封顶 25）：① **有 payoff 卡**——读**本轴产出面**（身份状态 **或本轴写入的通道**）每张 9、不读每张 4（notes 级）；② **无 payoff 卡**——**间接收束**：本轴写入的通道，其**下游读者数**分档（≥6→9 / ≥3→6 / ≥1→3，逐通道求和）；③ **def 内闭环**：身份 def 自带动态引擎（`triggers`/`stackThreshold`/`thresholdTrigger`/`statPerStack`/`phases`/`cycleTicks`/`formGroup`）15 分，仅带静态载荷（`effects`/`modifiers`）10 分。真空轴不再需要 `payoffVacuumAccepted` |
| 轴内多样性 | 15 | **（2.1：判据扩到全链路）** 轴内卡的**去重种类和**——原语 + `condition` 谓词 + **选靶 `scope`/`anchor`** + **触发点**（`hook`/`triggers`，含挂载状态 def 的）+ **状态身份**（引用的 statusId），对全库轴最大值归一：15 × 本轴种类和 / 全库最大 |
| 规模均衡 | 10 | 轴卡数 / 途径卡均在 [0.6, 1.4] 区间得 10；区间外线性衰减（每偏 0.1 扣 1） |
| 承接连通 | 15 | 收束方式去重计数（**乘区 / 条件分支 / 耗层 / 存在性 / 通道读**，各 3）；本轴产出面（身份 **或耦合通道**）被他轴/他途径卡消费的来源数 +3/来源；封顶 15 |

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

## 三、途径级指标（0–100，七维）

| 维度 | 权重 | 判据与计分 |
|---|---:|---|
| 轴健康度 | 30 | 四轴级得分均值 ×0.75 + 最低轴得分 ×0.25（短板加权）；最低轴 <40 再 −5、<25 再 −10 |
| 跨轴耦合 | 15 | 途径内卡读**本途径他轴产出面**（身份状态 **或耦合通道**）的（卡×轴）次数，CAP=12 封顶归一 ×15 |
| 跨系联动 | 15 | 本途径被跨途径消费：`crossPathway` 枢纽状态数 ×4 + 读他途径枢纽实证次数 + **他途径卡读本途径写入的耦合通道**次数；CAP=16 封顶归一 ×15 |
| 结构健康 | 5 | 稀有度×序列合规 2 + 主被动比在 [1.5, 3.0] 得 1.5 + 旗舰卡 = 4 得 1.5（**2.0：10→5**，全库已满分无区分度，压到 5 保合规底线） |
| 机制落地 | 5 | 途径卡 `frameworkFlags.landed` 占比 ×5（**2.0：10→5**，同上） |
| 文本完备 | 5 | 卡 lore/flavor/describe 三字段齐备率 ×5（**2.0：10→5**，同上） |
| **差异化** | **25** | **（2.0：10→25，让位给差异化）** 三项相加：① **签名键落地 10**：`途径设计身份.md` 签名键逐键——≥2 卡 AST 实证 4 分 / 1 卡 2 分，封顶 10（键表 = score.py `PATHWAY_SIGNATURES`）；② **指纹距离 10**：**全链路指纹**（见 §三·一）对他 21 途径的**分族等权均距**，分位计分（≥75%→10 / ≥50%→6 / ≥25%→2）；③ **构型多样 5**：本途径四轴的（产出面 ∪ 原语 ∪ 全链路词表）两两 1−Jaccard 均距 ×5，奖励四轴各走不同形状 |

合计 30+15+15+5+5+5+25 = 100。

### 三·一 全链路指纹（2.1 新增，差异化②的向量口径）

> 动机：**机制的复杂性不单单是原语**——施法作用的整条链路（选靶 → 触发 → 效果 → 状态）都是设计语言，
> 且**状态身份**（私有 statusId）不进向量会让"用常规原语做主题化机制"的途径被结构性低估。

指纹 = 若干**族**，每族独立 **L2 归一**后参与距离；`cos_dist` = **各族余弦距离的均值**（族等权，可调）。

| 族 | 键 | 来源 |
|---|---|---|
| `prim` | 原语种类 | `card_effect_types`（每卡去重） |
| `elem` | 元素 | effects 的 `element` |
| `cond` | 条件谓词 | `_cond_kinds` |
| `stat` | `modify_stat` 键 | effects 的 `stat` |
| `sref` | **状态身份** | 卡面引用的 statusId（mount/modify/condition/filter） |
| `tgt` | **选靶** | `card.target.request`：`faction` / `scope` / `anchor` / `mode` / `selectionMode`（缺省不写） |
| `tgtf` | **选靶 filter 键** | `request.filter` 的键名 |
| `hook` | **触发点** | 卡级 `hook` / `triggers[].event` **＋挂载状态 def 的 `triggers[].event`**（口径：挂状态 = 接入其触发点） |

> 消费通道 `consumption`、`cost`/`reach` 等暂未入族；需扩展时加进 `score.py` 的 `FAMILIES` 并同步本表。

## 四、产物与消费

- `score.py` 一次跑产出两份：`docs/analysis/scorecard.md`（全库排行 + 逐途径/逐轴计分卡与失分清单）、
  `docs/analysis/scores.json`（网页端评分页直接数据源，前端不重算，经 `../docs/analysis/scores.json` fetch）。
- **进门禁**：`score.py` 为只读脚本，与四脚本同轮跑（不阻塞通过），重设计迭代里用它确认「改后涨分」。
- 重设计推进按途径总分升序取榜（最低分先做），一途径一 commit，改前改后分记入
  `docs/archive/meta/REDESIGN_LOG.md`。
- 口径改动同轮需同步：`docs/tools/score.py`、`docs/tools/build_style_analysis.py`（`import score`，同源）、
  `site/js/views/score.js`（维度常量 `DIMS`/`AXIS_DIMS`）、`docs/analysis/`（`build_analysis.py` 重跑）。
