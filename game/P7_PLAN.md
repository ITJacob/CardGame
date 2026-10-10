# P7 在线匹配 · 实施方案（lockstep）

> 状态：**P7a + P7b 已实现并实测通过**（2026-10-10）。P7c（云榜单）未做，按设计不阻塞。
> 实现落点：`game/src/meta/match/`（types/channel/memoryChannel/runner/buildOnlineSetup/firebaseChannel）、
> `game/src/ui/views/online.ts`、`game/src/ui/views/battle.ts`（联机驱动）、`game/src/ui/session.ts`。
> 本文件是 P7 的唯一执行入口。换机器执行时，先读本文 + `game/DESIGN.md` §5.4/§5.5。
> 前置（Firebase SDK 接入）已落地并提交：`game/src/meta/firebase.ts`（commit `e1f6854`）。
> ⚠️ **实现期修正了本文三处**（下述 §一/§3.1/§3.4 已就地更新）：房间/决策文档 id 形如 `${uid}_${seq}`、
> 房间多一个 `guestDataHash`、以及新增两条铁律（决策键序归一化 / 名册改 id）。

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

        // 只能写自己那条，且 id 必须是 {自己的 uid}_{seq}（以本规则正文为准，非注释）
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

**`rooms/{roomId}`**：`roomId` 即 6 位房间码（大写、去掉易混的 0/O/1/I），建房时生成，碰撞则换码重试。

| 字段 | 类型 | 说明 |
|---|---|---|
| `host` | string(uid) | 建房者 |
| `guest` | string(uid) \| null | 加入者 |
| `status` | `'waiting'\|'ready'\|'playing'\|'done'\|'aborted'` | 建房 `waiting` → 加入 `ready` → 房主开战写 `playing` |
| `seed` | number | 房主选定，双方共用 |
| `dataHash` | string | 房主的 dataVersion.dataHash，不一致拒开（§3.4 铁律 2） |
| `guestDataHash` | string \| null | 加入者的 dataHash：房主据此校验对手（实现期新增，否则房主无从对账） |
| `hostRoster` | `PlacedHero[]` | 房主名册（复用 `meta/formation` 类型，JSON 可序列化） |
| `guestRoster` | `PlacedHero[]` \| null | 加入者名册 |
| `createdAt` | number | epoch ms |
| `fingerprints` | `Record<uid,string>` \| 无 | 结束后各端写自己的事件指纹（§3.4 铁律 4） |

**`rooms/{roomId}/moves/{uid}_{seq}`**（文档 id 必须 `${自己的 uid}_${seq}`，规则强制；写后不可改）：

| 字段 | 类型 |
|---|---|
| `uid` | string（= auth uid，规则强制） |
| `seq` | number（决策序号，双方一致，从 0 起） |
| `decision` | `ResolvedTarget[]`（即 `DecisionInput`，落库前过 `canonicalDecision`，见 §3.4 铁律 5） |

> 选 `PlacedHero[]` 而非直接存 `UnitSetup[]`：复用现有 `heroToUnitSetup`，且 UI 渲染对手单位需要 `name/classId/constitutionId` 元数据，`PlacedHero` 一次带全。**代价**：wire 与 meta 层类型耦合，`formation` 改结构会破坏对局兼容——数据模型动 `PlacedHero` 时须同步此文档。

### 3.2 阵营与视角

- **规范顺序**：`factions[0] = host = 'A'`，`factions[1] = guest = 'B'`（与谁在构建无关，保证两份 `CombatSetup` 逐位相同）。
- 各端 `myFaction = host ? 'A' : 'B'`；UI 的 own/enemy 按 `myFaction` 映射（guest 端把 'B' 当自己）。
- 新增构建函数（`meta/match/buildOnlineSetup.ts` 或扩展 `buildSetup.ts`）：`buildOnlineCombatSetup({seed, catalog, hostRoster, guestRoster})`，**强制**把 host 单位 faction 设为 'A'、guest 设 'B'（忽略 `PlacedHero.coordinate.faction` 的本地值）。

### 3.3 传输层（新端口，落 DESIGN §5.4 `MatchTransport` 预留）

`game/src/meta/match/` 新增：

```
types.ts            Side/StartInfo/RoomDoc/MoveDoc/Create·JoinRoomInput
channel.ts          MatchLobby/MatchChannel/MatchConnection 接口 + opponentOf + canonicalDecision
memoryChannel.ts    内存双工通道（单测用，两端直连；发布即 JSON 往返，模拟 wire）
firebaseChannel.ts  Firestore 实现（createRoom/joinRoom/awaitStart/publish/receive/fingerprints/abandonRoom）
runner.ts           MatchRunner：lockstep 驱动循环（可暂停、可断言 remoteDecisionCount）
buildOnlineSetup.ts 双方名册 → CombatSetup（§3.2；阵营规范化 + 撞 id 校验）
index.ts            桶导出（不含 firebaseChannel——它 import 即初始化 SDK）
```

**接口草案**：

```ts
export type Side = 'host' | 'guest'

export interface MatchLobby {
  createRoom(input: { roster: PlacedHero[]; seed: number; dataHash: string }): Promise<{ roomId: string; code: string }>
  joinRoom(input: { code: string; roster: PlacedHero[]; dataHash: string }): Promise<{ roomId: string; code: string }>
  /** 等待对手就绪（第二次 onSnapshot 触发），返回开战所需全部信息；版本不符抛错 */
  awaitStart(): Promise<StartInfo>   // { roomId, seed, hostUid, guestUid, hostRoster, guestRoster, dataHash }
  /** 可选：快速匹配（内存通道不实现） */
  findWaitingRoom?(): Promise<string | null>
}

export interface MatchChannel {
  readonly side: Side
  readonly roomId: string
  readonly myUid: string
  /** 本侧在 seq 决策点的选择 → 广播落库 */
  publish(seq: number, d: DecisionInput): Promise<void>
  /** 等待对侧（caster 非本侧）在 seq 决策点的选择；超时抛错，不本地回退 */
  receive(seq: number, timeoutMs?: number): Promise<DecisionInput>
  publishFingerprint(fp: string): Promise<void>
  receiveFingerprint(timeoutMs?: number): Promise<string | null>   // 超时返回 null
}
```

**`MatchRunner`（核心驱动循环）**：

```ts
// 实装形态（runner.ts）：决策经通道路由，逐 tick 推进且可暂停观战
while (!stopped && !facade.ended()) {
  await gate()                                 // pause/resume
  const req = facade.pendingDecision()
  if (!req) { facade.step(); onUpdate(); await sleep(stepDelayMs); continue }
  const casterFaction = factionOf(req.caster)  // 由 facade.state().units 的 faction 反查
  let d: DecisionInput
  if (casterFaction === myFaction) {
    d = canonicalDecision(await chooseLocally(req))   // 人类选靶（battle.ts 的选靶 UI）
    await channel.publish(this.seq, d)
  } else {
    waiting = true; onUpdate()                          // UI 显示「等待对手决策…」
    d = canonicalDecision(await channel.receive(this.seq))  // 绝不本地回退！
    waiting = false; onUpdate()
  }
  this.seq++
  facade.submitDecision(d)
  onUpdate()
}
```

`stepDelayMs` 是纯观战节拍（450ms，与离线「自动播放」同速），不参与确定性；测试传 0。

「何时暂停」由 `manual && candidates>pickCount` 决定，双方 setup 相同 ⇒ 候选数相同 ⇒ 暂停点一致 ⇒ `seq` 一致。

### 3.4 ★ 铁律（违反即 desync）

1. **对手的决策绝不本地回退**：caster 非本侧时只能 `receive` 等待，禁止调 `slice(0,pickCount)` 或让用户代选。本地 AI 只在**离线人机**里用。
2. **双方数据版本必须一致**：`dataHash` 不符 → 拒绝开局并提示，不得降级。
3. **决策按 `seq` 严格顺序**：先 publish/receive 完当前 seq 再进下一个。
4. **开局前交换 `dataHash` + 结束后交换事件指纹**：`fingerprintOf(ended.events)` 双侧比对，不一致 → 标记本局 `aborted` 并提示（跨端确定性兜底，§七）。
5. ★ **决策过 wire 前必须归一化键序**（`canonicalDecision`，`meta/match/channel.ts`）。实测：内核本地造的
   `ResolvedTarget` 是 `{coord, occupant}`（`execution/target.ts`），Firestore 回来后键序变成 `{occupant, coord}`；
   而 `fingerprintOf` 是 `JSON.stringify`——**键序敏感**。不归一就会出现「局面完全相同、指纹不同」的假 desync
   （浏览器实测踩到过，两端 tick/胜负全一致却判不一致）。本地选择与 receive 两条路都要归一。
6. **双方名册的 `unitId` 必须不同**：双方名册是同构生成的（同前缀 `hero_1..5`），内核要求 unitId 全局唯一。
   `online.ts` 在**上线前按座位改 id**（`A_h1..` / `B_h1..`），`buildOnlineCombatSetup` 撞车即抛错。

### 3.5 UI

- 新增 `ui/views/online.ts`（路由 `#/online`，菜单加入口）：
  - 进页面即 `getCatalog()` + `loadProfile()` 生成 5 人名册并预览（复用 `herogen`/`autoFormation`）。
  - 三个动作：**创建房间**（建房→大字显示 6 位房间码→等待）、**加入房间**（输码，回车即提交）、
    **快速匹配**（查 `status=='waiting' && host!=me` 的第一间，无则建房）。
  - 上线前按座位改 id 与阵营（§3.4 铁律 6）；等待页离开（非去开战）→ 房主撤房（`abandonRoom`），
    避免废弃房间把快速匹配的人坑住。
  - 等待态：`awaitStart()`（房主 `onSnapshot` 等 guest）→ 建 setup/facade/unitMeta → `#/battle`。
- 改造 `ui/views/battle.ts`（或抽公共层）：
  - 判定联机模式（`session.online` 存在时）；own/enemy 按 `myFaction` 映射（win/foe 也按 `myFaction` 换算）。
  - 决策：caster 本侧 → 现有选靶 UI（提交后禁用按钮，等 runner 同步）；他侧 → 「等待对手决策…」提示。
    板面高亮 tile 也可点选（与下方按钮同一条路径），仅在**本侧该决策**时给抓手光标 + 挂监听
    （`.tile.pickable`；对侧决策只高亮不可点，避免 cursor 空承诺与本地代选）；板面 `user-select: none`。
  - 驱动改走 `MatchRunner`（不再直接 `stepOnce`）；控制区把「推进/自动播放」换成**暂停/继续**（联机自动推进）。
  - 结束：`finishOnline` 先交换指纹 → 一致才 `matchStore.append` 正常战绩，否则记 `aborted`；
    结算框展示比对结果（一致哈希 / 未验证 / 不一致）。
- `ui/session.ts`：`BattleSession` 增加可选 `online?: OnlineSession`，即 `{ channel, myFaction, runner?, verify? }`
  （`runner` 由 battle 视图建一次并挂回，`verify` 记结束时的指纹比对结果）；另加 `myFaction?` 供离线/联机统一取阵营。

---

## 四、实现步骤

1. ✅ **类型与序列化**：`meta/match/types.ts`、`channel.ts`（含 `canonicalDecision`）；`ResolvedTarget[]` 直接 JSON（已有类型即 wire 格式，无需转换层）。
2. ✅ **内存通道**：`memoryChannel.ts`（两 `MatchChannel` 互连，写时 JSON 往返）+ `runner.ts`。
3. ✅ **联机驱动单测**（先于 Firebase）：`tests/match/lockstep.test.ts` + `onlineSetup.test.ts`，见 §六。
4. ✅ **Firebase 通道**：`firebaseChannel.ts`——`ensureUid` → `setDoc(rooms/{6位码})`（碰撞重试 4 次）/ `updateDoc` 占 guest → `onSnapshot` 等就绪 → `publish`=`setDoc(moves/{uid}_{seq})`、`receive`=`onSnapshot` 等文档出现。房间码即 `doc.id`（短码直接做 docId，无「短码→roomId」映射层）。
5. ✅ **在线构建**：`buildOnlineSetup.ts`（§3.2 + 重复 unitId 守卫）。
6. ✅ **UI**：`views/online.ts` + 路由/菜单；`battle.ts` 联机改造；`session.ts` 扩展。
7. ✅ **事件指纹校验**：`finishOnline` 结束后双侧交换 `fingerprintOf(events)`（房间字段 `fingerprints.{uid}`），不一致记 `aborted`。
8. ⬜（可选 P7c）**云榜单**：`Storage` 端口 Firestore 实现 + `views/leaderboard.ts` 读云榜。**未做**。

---

## 五、分期

| 子期 | 内容 | 完成判据 | 状态 |
|---|---|---|---|
| P7a | 端口 + 内存通道 + 驱动循环 + 单测 | 内存双端 lockstep 事件指纹 == 单机同决策结果 | ✅ 完成 |
| P7b | Firestore 通道 + 建房/加入/匹配 UI | 两个浏览器（双账号）能开局并同步打完 | ✅ 完成 |
| P7c（可选） | 云榜单 / 断线超时 / 再战 | 战绩入云榜；对手掉线可判负 | ⬜ 未做 |

---

## 六、验证

- **单测**（`game/tests/match/`，vitest）：`lockstep.test.ts`（5）+ `onlineSetup.test.ts`（3），共 8 例全绿。
  1. `memoryChannel` 双端跑一场（同 seed/名册），断言两端 `ended().events` 指纹相同，**且等于单机用同一决策序列的结果**（把人类选择固化为脚本）。
  2. `unit` 断言：某端在对手决策点**不会**本地回退（`hostSeen` 全是 `A_*`，且 `hostSeen.length + remoteDecisionCount === decisionSeq`）。
  3. 序列化往返：`PlacedHero[]` ↔ Firestore 文档无损（JSON 往返后指纹一致）。
- **端到端**（浏览器 + 真 Firestore，已在用户机器跑通）：
  - `npm run dev`，双 Chrome 各开 `#/online` → A 建房得码 → B 输码加入（快速匹配亦验）→ 双方名册确认 → 开战。
  - 实测结果：**房间码建房/加入成立；两端 tick 同步；非决策侧显示等待遮罩；结算一致（同 tick 同结果）；
    指纹一致 `1e96c509`（双端同值）；双方各落 1 条战绩；无页面错误**。撤房：房主离开等待页 → 该房删除，
    快速匹配改配到新建的房（旧码 `32HASM` 已删，新配 `LTFW6E`）。
  - 回归：离线人机 `#/new` 不受影响；`npm run typecheck && npm test` 全绿。
- **实测暴露并已修的两处缺陷**：
  1. **unitId 撞车**：双方名册同构生成（`hero_1..5`），开局即「单位 id 重复」。修：`online.ts` 按座位改名
     `${A|B}_h{i}`，并在 `buildOnlineCombatSetup` 加重复 id 守卫（附单测）。
  2. **键序假 desync**：Firestore 会重排 map 键，`fingerprintOf` 走 `JSON.stringify` 对键序敏感，
     同一 `ResolvedTarget` 在两端序列化成 `{coord,occupant}` / `{occupant,coord}` → 指纹不一致（实为同一决策）。
     修：`canonicalDecision()` 在 `MatchRunner.decide` 的本地/远端两条分支统一规整键序；
     **回归测试已验证：不修则该例失败（1 failed | 4 passed），修后全绿**。
- **断线**：本环境未做真断线演练；逻辑上 `receive`/`waitForRoom`/`receiveFingerprint` 均有超时（60s / 5min / 20s），
  超时后 `MatchRunner` 置 `lastError` 并结束，UI 记 `aborted`（见 §七.3）。

---

## 七、风险与已知限制

1. ~~**跨端确定性**~~ → **部分落地**：`check:determinism` 仍只验同机；跨引擎（V8 vs SpiderMonkey）差异仍是理论风险，
   但**对象键序**这条已实测命中（双 Chrome 同引擎也会因 Firestore 重排键序而假 desync），已由 `canonicalDecision` 修掉。
   剩余兜底不变：结束比对事件指纹，不符即 `aborted`。
2. **无服务端 = 无防作弊**：Spark+lockstep 下榜单分客户端可信。正式排位需升级 Blaze + 服务端权威（与当前决策冲突，须先与用户确认）。
3. **断线/存在性**：Firestore 不像 RTDB 有 `onDisconnect` 原生存在检测。v1 用房间 `status` + 客户端超时（60s 无对侧决策）判中止；P7c 再做完善。
4. **房间堆积**：已加**房主离开等待页即撤房**（`abandonRoom`，仅当 `status=='waiting' && guest==null`）；但
   **已开局（`ready`/`playing`）后掉线的房间仍会残留**，`fingerprints`/`moves` 子集合亦然。Spark 不计费，暂不阻塞。
5. **规则偏宽**：房间 `read` 放给所有登录用户（匹配扫描需要）；`move` 只可写自己的、不可改。见 §一 规则。
6. **wire 与 meta 耦合**：`PlacedHero` 结构变更会破坏对局兼容（§3.1）。

---

## 八、明确不做（本方案范围外）

- 服务端权威 / 防作弊 / 权威榜单。
- 技能选择决策点（现内核自动轮转技能，P7 沿用，不新增交互）。
- 好友系统 / 观战 / 聊天 / 再战匹配优化。
- 账号升级（匿名→Google）。
- 换掉 GitHub Pages 改用 Firebase Hosting。
