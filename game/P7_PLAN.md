# P7 在线匹配 · 实施方案（lockstep）

> 状态：**方案稿，未实现**。本文件是 P7 的唯一执行入口。换机器执行时，先读本文 + `game/DESIGN.md` §5.4/§5.5。
> 前置（Firebase SDK 接入）已落地并提交：`game/src/meta/firebase.ts`（commit `e1f6854`）。

---

## 〇、目标与已定架构

**目标**：两名玩家联机对战，走**确定性 lockstep**——双方各跑一份同一内核，只交换「输入」（决策）。

**已拍板（2026-10-10）**：

1. **Spark 计划 + lockstep**：不加服务端、不绑卡。免费额度够用。
2. **匿名登录**：身份 = Firebase 匿名 uid，与现有本地 uuid 档案模型对齐；Google 登录留作后续「账号升级」可选路径。**不开匿名账号自动清理**。
3. **榜单客户端可信**：lockstep 下战绩由客户端上报，Spark 阶段不做防作弊；正式排位前需另议（见 §七）。

**范围**：在线匹配（创建/加入房间、输入交换、联机战斗、断线基本处理）。**云榜单为可选收尾**（§五 P7c），默认不阻塞。

---

## 一、Firebase 控制台现状（机器本地，仓库读不到，以此为准）

**项目**：`card-game-e313c`。Web 配置已硬编码进 `game/src/meta/firebase.ts`（Firebase web config 为公开信息，明文入库无碍）。

**已做**：

- Authentication 已启用**匿名登录**（Anonymous）。
- 授权域名含 `itjacob.github.io`（`localhost` 默认已有）。
- Firestore 已建库：**生产模式**，区域 `asia-east1` 系（**不可改**）。
- 安全规则已发布（见下）。

**已发布的安全规则**（控制台 → Firestore → 规则；换机器若换项目需原样重贴）：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function uid() { return request.auth.uid; }

    match /rooms/{roomId} {
      // 建房：必须自报 host、未占 guest
      allow create: if signedIn()
        && request.resource.data.host == uid()
        && request.resource.data.guest == null;

      // 登录用户可读（匹配扫描 + 对手读取）
      allow read: if signedIn();

      // 更新只放两种：① 对手加入（guest: null → 自己）② 参与者在房内更新
      allow update: if signedIn() && (
        (resource.data.guest == null
          && request.resource.data.guest == uid()
          && request.resource.data.host == resource.data.host)
        || resource.data.host == uid()
        || resource.data.guest == uid()
      );

      // 参与者可退房
      allow delete: if signedIn()
        && (resource.data.host == uid() || resource.data.guest == uid());

      match /moves/{moveId} {
        allow read: if signedIn();

        // 只能写自己那条，且 id 必须是 {seq}_{自己的 uid}
        allow create: if signedIn()
          && request.resource.data.uid == uid()
          && moveId == uid() + '_' + string(request.resource.data.seq);

        // 输入一经写入不可改、不可删（保证双方视图一致）
        allow update, delete: if false;
      }
    }
  }
}
```

---

## 二、代码现状（P7 相关的既有接缝与缺口）

### 2.1 内核契约（`game/src/kernel/`）

- 出口 `src/kernel/index.ts`：`createCombat(setup: CombatSetup): CombatRuntimeHandle`。
- 门面 `combat/types.ts:128-139` `CombatFacade`：`state()` / `drainEvents()` / `pendingDecision()` / `submitDecision(d)` / `step()` / `ended()` / `setup()`。
- 关键类型：
  - `CombatSetup`（`combat/types.ts:53-63`）：`{ seed, catalog, board, factions:[FactionSetup,FactionSetup], inputs }`。
  - `FactionSetup`（:36-40）：`{ id, name, units: UnitSetup[] }`；`UnitSetup`（:20-34）**全字段 JSON 可序列化**（defId/coordinate/attributeSet/gender/anchor/activeSlots/passiveSlots/initialStatuses/initialModifiers/pools/gauge）。
  - `DecisionRequest`（`execution/types.ts:112-118`）：`{ actionId, caster: UnitId, candidates: ResolvedTarget[], pickCount, fallbackSort? }`。
  - `DecisionInput = ResolvedTarget[]`（`execution/types.ts:120`）；`ResolvedTarget = { coord: Coordinate, occupant: UnitId | null }`（:33-37）——**只是坐标 + 单位 id 字符串，天然可 JSON 上线**。
  - `Coordinate = { faction, lane, index }`。
- **决策点语义**：`pendingDecision()` 非 null ⇔ 内核暂停。唯一挂起点 `combat/runtime.ts:282-285`（`commitBehavior` 遇 `AwaitingDecision`）。触发条件 `execution/pipeline.ts:67`：`selectionMode==='manual' && candidates.length > pickCount`；否则 `:80` 自动 `slice(0,pickCount)`。`submitDecision`（`runtime.ts:836-843`）清 pending → 续跑 → 结算死亡/终止。
- **确定性**：seed → `Mulberry32RandomSource`（`runtime.ts:84`）。事件流为纯 JSON 判别联合，FNV-1a 指纹 `shared/fingerprint.ts:4-12`，验收脚本 `scripts/check-determinism.ts`（同机两次逐位比对）。

### 2.2 ★ 关键缺口：内核不读 `inputs`

`CombatSetup.inputs`（`InputSequence.decisions: Map<string, DecisionInput>`）**在 runtime 中从未被读取**。当前战斗用**内置 AI**：
- 技选：`runtime.ts:298-303` `chooseBehavior`（按 `tickCount % skills.length` 轮转，确定性）。
- 靶选：`pipeline.ts:80` 自动 `slice(0,pickCount)`；仅当 `manual && candidates>pickCount` 才挂起等 `submitDecision`。

**判定与后果**：P7 **不需要改造内核**。内核已是「可暂停状态机」，`step()`/`submitDecision()` 的实时驱动即 lockstep 的自然接缝——双方跑同一内核、按同一顺序喂入同一批决策，状态逐位一致。唯一必须遵守的纪律见 §三.3。

### 2.3 战外层

- 存储端口：`meta/matchLog.ts`（`MatchStore`：`all/append/clear`，KEY `cg.matches.v1`）、`meta/progression.ts`（`ProfileStore`，KEY `cg.profile.v1`）。
- `meta/buildSetup.ts`：`buildCombatSetup({seed,catalog,own,enemy,...})` → `CombatSetup`（factions=[A"我方", B"敌方"]）；`heroToUnitSetup(hero)` 由 `PlacedHero` 派生 `UnitSetup`。
- 会话：`ui/session.ts` `BattleSession`（模块级单例 `set/get/clearSession`）。
- 驱动：`ui/views/newgame.ts:70-78` 建 setup → `createCombat` → `setSession` → `#/battle`；`ui/views/battle.ts` 用 `stepOnce→facade.step()`（:219-222）、读 `pendingDecision`（:28）、`submitDecision`（:201-216）、结束时 `matchStore.append`（:29-33）。
- 路由表 `ui/router.ts:14-22`；菜单 `ui/views/menu.ts`。
- `meta/firebase.ts`：`ensureUid()`（匿名登录，会话内复用）/`onUidChange()`；**当前无任何业务 import**。
- 数据版本：`data/version.ts` `dataVersion`（构建注入 `__DATA_VERSION__`，含 `dataHash`）。

---

## 三、设计

### 3.1 数据模型（Firestore，与 §一 规则一致）

**`rooms/{roomId}`**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `host` | string(uid) | 建房者 |
| `guest` | string(uid) \| null | 加入者 |
| `status` | `'waiting'\|'ready'\|'playing'\|'done'\|'aborted'` | |
| `seed` | number | 房主选定，双方共用 |
| `dataHash` | string | 双方 dataVersion.dataHash，不一致拒开（§三.4） |
| `hostRoster` | `PlacedHero[]` | 房主名册（复用 `meta/formation` 类型，JSON 可序列化） |
| `guestRoster` | `PlacedHero[]` \| null | 加入者名册 |
| `createdAt` | number | epoch ms |

**`rooms/{roomId}/moves/{uid}_{seq}`**：

| 字段 | 类型 |
|---|---|
| `uid` | string（= auth uid，规则强制） |
| `seq` | number（决策序号，双方一致，从 0 起） |
| `decision` | `ResolvedTarget[]`（即 `DecisionInput`） |

> 选 `PlacedHero[]` 而非直接存 `UnitSetup[]`：复用现有 `heroToUnitSetup`，且 UI 渲染对手单位需要 `name/classId/constitutionId` 元数据，`PlacedHero` 一次带全。**代价**：wire 与 meta 层类型耦合，`formation` 改结构会破坏对局兼容——数据模型动 `PlacedHero` 时须同步此文档。

### 3.2 阵营与视角

- **规范顺序**：`factions[0] = host = 'A'`，`factions[1] = guest = 'B'`（与谁在构建无关，保证两份 `CombatSetup` 逐位相同）。
- 各端 `myFaction = host ? 'A' : 'B'`；UI 的 own/enemy 按 `myFaction` 映射（guest 端把 'B' 当自己）。
- 新增构建函数（`meta/match/buildOnlineSetup.ts` 或扩展 `buildSetup.ts`）：`buildOnlineCombatSetup({seed, catalog, hostRoster, guestRoster})`，**强制**把 host 单位 faction 设为 'A'、guest 设 'B'（忽略 `PlacedHero.coordinate.faction` 的本地值）。

### 3.3 传输层（新端口，落 DESIGN §5.4 `MatchTransport` 预留）

`game/src/meta/match/` 新增：

```
types.ts          Side, MatchLobby, MatchChannel, WireDecision
channel.ts        MatchChannel 接口
memoryChannel.ts  内存双工通道（单测用，两端直连）
firebaseChannel.ts Firestore 实现（createRoom/joinRoom/awaitStart/publish/receive）
runner.ts         MatchRunner：在线驱动循环
buildOnlineSetup.ts 双方名册 → CombatSetup（§3.2）
```

**接口草案**：

```ts
export type Side = 'host' | 'guest'

export interface MatchLobby {
  createRoom(roster: PlacedHero[]): Promise<{ roomId: string; code: string }>
  joinRoom(code: string, roster: PlacedHero[]): Promise<{ roomId: string }>
  /** 等待对手就绪（第二次 onSnapshot 触发），返回开战所需全部信息 */
  awaitStart(): Promise<{ seed: number; hostRoster: PlacedHero[]; guestRoster: PlacedHero[] }>
}

export interface MatchChannel {
  readonly side: Side
  /** 本侧在 seq 决策点的选择 → 广播落库 */
  publish(seq: number, d: DecisionInput): Promise<void>
  /** 等待对侧（caster 非本侧）在 seq 决策点的选择 */
  receive(seq: number): Promise<DecisionInput>
}
```

**`MatchRunner`（核心驱动循环）**：

```ts
// 伪代码：与 battle.ts 的 stepOnce 同构，但决策经通道路由
while (!facade.ended()) {
  const req = facade.pendingDecision()
  if (!req) { facade.step(); continue }
  const casterSide = sideOf(req.caster)        // 由 facade.state().units 的 faction 反查
  let d: DecisionInput
  if (casterSide === channel.side) {
    d = await chooseLocally(req)               // 人类选靶（复用 battle.ts 的选靶 UI）
    await channel.publish(this.seq, d)
  } else {
    onWait(true)                               // UI 显示「等待对手决策…」
    d = await channel.receive(this.seq)        // 绝不本地回退！
    onWait(false)
  }
  this.seq++
  facade.submitDecision(d)
}
```

「何时暂停」由 `manual && candidates>pickCount` 决定，双方 setup 相同 ⇒ 候选数相同 ⇒ 暂停点一致 ⇒ `seq` 一致。

### 3.4 ★ 铁律（违反即 desync）

1. **对手的决策绝不本地回退**：caster 非本侧时只能 `receive` 等待，禁止调 `slice(0,pickCount)` 或让用户代选。本地 AI 只在**离线人机**里用。
2. **双方数据版本必须一致**：`dataHash` 不符 → 拒绝开局并提示，不得降级。
3. **决策按 `seq` 严格顺序**：先 publish/receive 完当前 seq 再进下一个。
4. **开局前交换 `dataHash` + 结束后交换事件指纹**：`fingerprintOf(ended.events)` 双侧比对，不一致 → 标记本局 `aborted` 并提示（跨端确定性兜底，§七）。

### 3.5 UI

- 新增 `ui/views/online.ts`（路由 `#/online`，菜单加入口）：
  - 未登录时先 `ensureUid()`。
  - 三个动作：**创建房间**（建房→显示 6 位房间码→等待）、**加入房间**（输码）、**快速匹配**（查 `status=='waiting' && host!=me` 的第一间，无则建房）。
  - 名册：复用 `newgame` 的英雄生成/编队流程产出 `PlacedHero[]`；「开战」按钮在联机模式下改为「创建/加入房间」。
  - 等待态：`onSnapshot(roomDoc)` 监听 guest 就位 → 双方 `awaitStart()` 后进入 `#/battle`。
- 改造 `ui/views/battle.ts`（或抽公共层）：
  - 判定联机模式（`session.online` 存在时）；own/enemy 按 `myFaction` 映射。
  - 决策：caster 本侧 → 现有选靶 UI；他侧 → 「等待对手决策…」遮罩。
  - 驱动改走 `MatchRunner`（不再直接 `stepOnce`）。
  - 结束：本地 `matchStore.append` 照旧；可选上报云榜（§五 P7c）。
- `ui/session.ts`：`BattleSession` 增加可选 `online?: { runner: MatchRunner; channel: MatchChannel; myFaction: FactionId }`。

---

## 四、实现步骤

1. **类型与序列化**：`meta/match/types.ts`、`channel.ts`；`ResolvedTarget[]` 直接 JSON（已有类型即 wire 格式，无需转换层）。
2. **内存通道**：`memoryChannel.ts`（两 `MatchChannel` 互连）+ `runner.ts`。
3. **联机驱动单测**（先于 Firebase）：见 §六。
4. **Firebase 通道**：`firebaseChannel.ts`——`ensureUid` → `addDoc(rooms)` / `updateDoc` 占 guest → `onSnapshot` 等就绪 → `publish`=`setDoc(moves/{uid}_{seq})`、`receive`=`onSnapshot` 等文档出现。房间码：`roomId` 取 `doc.id`（或截断 6 位映射，二者择一，如用短码需在客户端做「短码→roomId」查询字段）。
5. **在线构建**：`buildOnlineSetup.ts`（§3.2）。
6. **UI**：`views/online.ts` + 路由/菜单；`battle.ts` 联机改造；`session.ts` 扩展。
7. **事件指纹校验**：结束后双侧交换 `fingerprintOf(events)`（走 moves 通道或房间字段），不一致置 `aborted`。
8. （可选 P7c）**云榜单**：`Storage` 端口 Firestore 实现 + `views/leaderboard.ts` 读云榜。

---

## 五、分期

| 子期 | 内容 | 完成判据 |
|---|---|---|
| P7a | 端口 + 内存通道 + 驱动循环 + 单测 | 内存双端 lockstep 事件指纹 == 单机同决策结果 |
| P7b | Firestore 通道 + 建房/加入/匹配 UI | 两个浏览器（双账号）能开局并同步打完 |
| P7c（可选） | 云榜单 / 断线超时 / 再战 | 战绩入云榜；对手掉线可判负 |

---

## 六、验证

- **单测**（`game/tests/match/`，vitest）：
  1. `memoryChannel` 双端跑一场（同 seed/名册），断言两端 `ended().events` 指纹相同，**且等于单机用同一决策序列的结果**（把人类选择固化为脚本）。
  2. `unit` 断言：某端在对手决策点**不会**本地回退（receive 被调用、未产生本地选择）。
  3. 序列化往返：`PlacedHero[]` ↔ Firestore 文档无损。
- **端到端**（需浏览器，本环境无浏览器，须在用户机器上验证）：
  - `npm run dev`，两个浏览器 profile（或一普通一隐身）各自 `#/online` → A 建房得码 → B 输码加入 → 双方名册确认 → 开战 → 各出一手 → 打完 → 比对结果一致、双方 `cg.matches.v1` 各记一局。
  - 断线：一端关标签，另一端应在超时后判负/中止。
- **回归**：`npm run typecheck && npm test`；离线人机 (`#/new`) 不受影响。

---

## 七、风险与已知限制

1. **跨端确定性**：`check:determinism` 只验同机。跨浏览器/引擎（V8 vs SpiderMonkey）理论上有差异风险（浮点、Map 序、对象键序）。**兜底**：结束比对事件指纹，不符即 `aborted`。必要时中途定期抽样比对。
2. **无服务端 = 无防作弊**：Spark+lockstep 下榜单分客户端可信。正式排位需升级 Blaze + 服务端权威（与当前决策冲突，须先与用户确认）。
3. **断线/存在性**：Firestore 不像 RTDB 有 `onDisconnect` 原生存在检测。v1 用房间 `status` + 客户端超时（如 30s 无对侧决策）判中止；P7c 再做完善。
4. **房间堆积**：Spark 不计费但垃圾房间会积累。可加客户端「过期清理」（建房超时未匹配自删），暂不阻塞。
5. **规则偏宽**：房间 `read` 放给所有登录用户（匹配扫描需要）；`move` 只可写自己的、不可改。见 §一 规则。
6. **wire 与 meta 耦合**：`PlacedHero` 结构变更会破坏对局兼容（§3.1）。

---

## 八、明确不做（本方案范围外）

- 服务端权威 / 防作弊 / 权威榜单。
- 技能选择决策点（现内核自动轮转技能，P7 沿用，不新增交互）。
- 好友系统 / 观战 / 聊天 / 再战匹配优化。
- 账号升级（匿名→Google）。
- 换掉 GitHub Pages 改用 Firebase Hosting。
