// 战斗运行时：聚合根 Combat 的实现。持事件总线 / 随机源 / id 生成器 / 注册表 /
// 战场 / Placement / Scheduler，并把一次 step 停在 Manual 决策点。
import type { FactionId, LaneId, Phase, PoolKey, UnitId } from '../ids'
import type { Battle, Coordinate, Faction, Lane, OccupancyChanged } from '../battle/types'
import { LANE_CAPACITY, SUMMON_CAP_BASE } from '../battle/types'
import { BattlePlacement } from '../battle/placement'
import { createLookup, type CatalogLookup } from '../catalog/lookup'
import type { Catalog, EffectNode, EffModifyWeapon, TriggerDef, WeaponDef } from '../catalog/types'
import { EventBus } from '../shared/events'
import { SequentialIdGenerator } from '../shared/id-generator'
import { Mulberry32RandomSource, RandomUsageRegistry, type RandomSource } from '../shared/random-source'
import { round2 } from '../shared/result'
import { Registry } from '../roster/registry'
import { CombatUnit } from '../roster/unit'
import type { BehaviorSlot, StatusGrant, StatusInstance } from '../roster/types'
import { CombatScheduler, phaseOf, PHASE_LUMINANCE as LUM } from '../scheduling/scheduler'
import { resolveInitiative } from '../scheduling/initiative'
import { availableBehaviors } from '../scheduling/filter'
import type { ActionOpportunity } from '../scheduling/types'
import { commitBehavior } from '../execution/commit'
import type { BehaviorSource, PipelineDeps } from '../execution/pipeline'
import type { Consumption } from '../shared/types'
import type { DecisionInput, DecisionRequest } from '../execution/types'
import { numeric, withParams, type EffectContext, type OpportunityPayload } from '../effect/context'
import type { TargetScope, TriggerSubjects } from '../effect/target-scope'
import { checkCondition, executeNodes } from '../effect/executor'
import { BASIC_ATTACK_ID, basicAttackSource } from './basicAttack'
import type {
  CombatEnded, CombatFacade, CombatSetup, CombatStats, CombatView,
  DomainEvent, StepReport, UnitViewLite,
} from './types'

const DEFAULT_LANES = ['lane0', 'lane1']

export interface RuntimeOptions {
  setup: CombatSetup
  /** 缺省由 setup.catalog 构造 */
  lookup?: CatalogLookup
  maxTicks?: number
}

/** 门面 + 诊断（未支持原语计数 / warning），供确定性校验脚本使用 */
export interface CombatRuntimeHandle extends CombatFacade {
  diagnostic(): { warnings: readonly string[]; unsupported: number }
}

export function initCombat(opts: RuntimeOptions): CombatRuntimeHandle {
  return new CombatRuntime(opts)
}

class CombatRuntime implements CombatRuntimeHandle {
  private readonly setupData: CombatSetup
  private readonly lookup: CatalogLookup
  private readonly maxTicks: number
  private readonly events = new EventBus<DomainEvent>()
  private readonly random: RandomSource
  private readonly randomRegistry = new RandomUsageRegistry()
  private readonly ids = new SequentialIdGenerator()
  private readonly units = new Registry()
  private readonly dead = new Set<UnitId>()
  /** 最近阵亡友军坐标（anchor:last_dead_ally） */
  private readonly lastDeadCell = new Map<FactionId, Coordinate>()
  private readonly factions: [FactionId, FactionId]
  private readonly warnings: string[] = []
  private battle: Battle
  /** 有序路 id（buildBattle 依 setup 定；几何解析用） */
  private laneIds: LaneId[] = []
  private placement: BattlePlacement
  private scheduler: CombatScheduler
  private pending: {
    request: DecisionRequest
    continueWith: (p: DecisionInput) => void
    opportunity: ActionOpportunity | null
    freeAction?: boolean
    freeCount?: number
  } | null = null
  private outcome: CombatEnded['outcome'] | null = null
  private tickCount = 0
  private unsupportedCount = 0
  private readonly stats: CombatStats
  private timers: { kind: 'translocate' | 'control'; unitId: UnitId; remaining: number; payload: readonly EffectNode[] }[] = []
  private readonly lastAttacker = new Map<UnitId, UnitId>()
  private prevPhase: Phase = 'day'
  private readonly snapshots = new Map<UnitId, Record<string, unknown>>()
  private readonly lastSkill = new Map<UnitId, { sourceRef: string; effects: readonly EffectNode[] }>()
  private readonly ruleSlots: { field: string; value: unknown }[][] = [[], [], []]
  private domainSeq = 0
  private readonly domainLastFire = new Map<string, number>()
  private echoing = false
  private readonly unsupportedKinds = new Map<string, number>()

  constructor(opts: RuntimeOptions) {
    this.setupData = opts.setup
    this.lookup = opts.lookup ?? createLookup(opts.setup.catalog as Catalog)
    this.maxTicks = opts.maxTicks ?? 300
    this.random = new Mulberry32RandomSource(opts.setup.seed)
    this.factions = [opts.setup.factions[0].id, opts.setup.factions[1].id]
    const stats: CombatStats = {
      ticks: 0, turns: 0,
      damageDealt: { [this.factions[0]]: 0, [this.factions[1]]: 0 },
      healingDone: { [this.factions[0]]: 0, [this.factions[1]]: 0 },
      unitsLost: { [this.factions[0]]: 0, [this.factions[1]]: 0 },
    }
    this.stats = stats

    this.battle = this.buildBattle()
    this.placement = new BattlePlacement(this.battle, {
      unitIds: () => this.units.all().map((u) => u.id),
      setPosition: (id, coord) => { const u = this.units.get(id); if (u) u.position = coord },
      onChange: (e) => this.onOccupancyChanged(e),
    })
    this.scheduler = new CombatScheduler({
      battle: this.battle,
      units: this.units,
      emit: (e) => this.emit(e),
      hooks: {
        onStatusTickEffect: (u) => this.fireStatusTriggers(u, 'on_tick'),
        onStatusExpired: (u, inst) => {
          this.emit({ type: 'StatusExpired', instanceId: inst.instanceId, defId: inst.defId, unitId: u.id })
          // 载荷主体：on_remove 的 target = 到期状态的持有者（执行参数 §2.3）
          this.fireStatusTriggers(u, 'on_remove', inst.defId, undefined, { target: u })
        },
      },
    })
    this.placeUnits()
    this.prevPhase = this.battle.phase
    for (const u of this.units.all()) this.fireStatusTriggers(u, 'on_battle_start')
  }

  // ---------- 初始化 ----------

  private buildBattle(): Battle {
    const laneIds = [...new Set([...DEFAULT_LANES, ...this.setupData.factions.flatMap((f) => f.units.map((u) => u.coordinate.lane))])].sort()
    this.laneIds = laneIds
    const factions: Faction[] = this.setupData.factions.map((fs) => ({
      id: fs.id,
      lanes: new Map<string, Lane>(laneIds.map((l) => [l, { id: l, slots: Array.from({ length: LANE_CAPACITY }, () => ({ occupant: null })) }])),
    }))
    const clock = ((this.setupData.board.clock.base % 72) + 72) % 72
    return { factions, zones: [], domains: [], clock, luminance: 0, phase: phaseOf(clock), lumOverride: null, meters: { secrecy: 0, order: 0, fate_value: 0, death_tally: 0 } }
  }

  private placeUnits(): void {
    const assigned: { faction: FactionId; lane: string; index: number; id: UnitId }[] = []
    for (const fs of this.setupData.factions) {
      for (const us of fs.units) {
        const id = us.unitId ?? this.ids.next('unit')
        const unit = new CombatUnit(
          id,
          fs.id,
          {
            strength: us.attributeSet.strength,
            agility: us.attributeSet.agility,
            intelligence: us.attributeSet.intelligence,
            rank: us.attributeSet.rank ?? 0,
          },
          us.gender,
          { statusDefs: { statusDef: (sid) => this.lookup.statusDef(sid) }, nextStatusId: () => this.ids.next('status') },
          this.tagsOfUnit(us.defId),
        )
        unit.unitType = us.defId ? (this.lookup.unitDef(us.defId)?.unitType ?? null) : null
        unit.unitDefId = us.defId ?? null
        unit.pathwayId = us.pathwayId ?? null
        this.units.add(unit)
        this.installBehaviors(unit, us.activeSlots ?? [])
        this.installPassives(unit, us.passiveSlots ?? [])
        for (const m of us.initialModifiers ?? []) unit.provenance.apply(m.stat, m.value, 'constitution')
        for (const sg of us.initialStatuses ?? []) this.mountStatus(unit, sgDefId(sg) ?? '', sg as Omit<StatusGrant, 'sourceId'>)
        assigned.push({ faction: fs.id, lane: us.coordinate.lane, index: us.coordinate.index, id })
      }
    }
    this.placement.applyExternal((battle) => {
      for (const a of assigned) {
        const lane = battle.factions.find((f) => f.id === a.faction)?.lanes.get(a.lane)
        if (lane && a.index >= 0 && a.index < lane.slots.length) lane.slots[a.index] = { occupant: a.id }
      }
      return battle
    })
  }

  private tagsOfUnit(defId: string | undefined): readonly string[] {
    if (!defId) return []
    return this.lookup.unitDef(defId)?.tags ?? []
  }

  private installBehaviors(unit: CombatUnit, activeSlots: readonly { skillDefId: string }[]): void {
    unit.behaviorSlots.push(this.basicAttackSlot(unit))
    for (const s of activeSlots) {
      const skill = this.lookup.skillDef(s.skillDefId)
      if (!skill) {
        this.warn(`未知技能 ${s.skillDefId}`)
        continue
      }
      unit.behaviorSlots.push({
        instanceId: this.ids.next('bslot'),
        defId: skill.id,
        kind: 'skill',
        reach: skill.reach ?? 'melee',
        cost: { energy: skill.cost?.energy ?? 0, gauge: unit.gauge.threshold, cooldown: skill.cost?.cooldown ?? 0,
                opportunity: skill.cost?.opportunity ?? 1 },
        cooldownRemaining: 0,
      })
    }
  }

  /** 装配被动卡：hook 事件 → 卡面 effects（含模板自带 triggers） */
  private installPassives(unit: CombatUnit, slots: readonly { defId: string }[]): void {
    const initialEquips: string[] = []
    for (const s of slots) {
      const tpl = this.lookup.behaviorTemplate(s.defId)
      if (!tpl) {
        this.warn(`未知被动 ${s.defId}`)
        continue
      }
      const nodes = this.resolveEffectNodes(tpl.effects)
      const triggers: TriggerDef[] = []
      for (const ev of tpl.hook ?? []) if (nodes.length > 0) triggers.push({ event: ev, effects: nodes })
      for (const t of tpl.triggers ?? []) triggers.push(t)
      if (triggers.length > 0) unit.passives.push({ defId: tpl.id, triggers })
      if (tpl.initialEquip) initialEquips.push(tpl.initialEquip)
    }
    // 被动全部登记完再开局装备：on_weapon_equip / 战吼能看到完整被动集
    for (const id of initialEquips) {
      const def = this.lookup.skillDef(id)?.weapon
      if (def) this.equipWeapon(unit, def)
      else this.warn(`initialEquip 未知武器 ${id}`)
    }
  }

  private resolveEffectNodes(refs: readonly { ref: string; params?: unknown }[]): EffectNode[] {
    return refs
      .map((r) => {
        const node = this.lookup.effectNode(r.ref)
        return node ? withParams(node, r.params as Record<string, unknown> | undefined) : undefined
      })
      .filter((n): n is EffectNode => n !== undefined)
  }

  private basicAttackSlot(unit: CombatUnit): BehaviorSlot {
    return {
      instanceId: this.ids.next('bslot'),
      defId: BASIC_ATTACK_ID,
      kind: 'basic_attack',
      reach: 'melee',
      cost: { energy: 0, gauge: unit.gauge.threshold, cooldown: 0, opportunity: 1 },
      cooldownRemaining: 0,
    }
  }

  // ---------- step ----------

  step(): StepReport {
    if (this.pending) {
      return { tick: this.battle.clock, opportunities: [], pending: this.pending.request, ended: this.outcome !== null }
    }
    if (this.outcome !== null) {
      return { tick: this.battle.clock, opportunities: [], pending: null, ended: true }
    }
    this.tickCount += 1
    this.stats.ticks = this.tickCount

    const crossed = this.scheduler.tick()
    this.tickTimers()
    this.fireDomainTriggers('on_tick')
    // 军团维持费断供 / 状态到期后 cap 下降 → 超限部分最老消散（H39）
    this.enforceSummonCaps()
    this.tickZones()
    if (this.battle.phase !== this.prevPhase) {
      this.prevPhase = this.battle.phase
      for (const u of this.units.all()) this.fireStatusTriggers(u, 'on_phase_change')
    }
    const opportunities: ActionOpportunity[] = resolveInitiative(
      crossed,
      this.factions,
      (id) => this.units.get(id)?.faction,
      { positionOf: (id) => this.units.get(id)?.position ?? null },
      this.battle.clock,
      (unitId, tickIndex) => ({ unitId, tickIndex, consumedBy: null }),
    )

    for (const opp of opportunities) {
      this.emit({ type: 'ActionOpportunityGranted', opportunity: opp })
      const unit = this.units.get(opp.unitId)
      // 括号只对存活单位产出：已亡/不存在的机会直接记 wasted（无主体可挂事件）
      if (!unit || unit.isDead) {
        opp.consumedBy = 'wasted'
        continue
      }
      // 括号左端：先递减 self_turn 时长（与 tick 口径的「先推进、后授予」同序），
      // 再 fire on_turn_start——订阅方看到的是本回合已结算后的状态
      this.tickSelfTurn(unit)
      unit.warSpiritGain = 0
      this.fireStatusTriggers(unit, 'on_turn_start', undefined, this.oppPayload(opp))
      this.fireDomainTriggers('on_turn_start', unit)
      this.runOpportunity(opp, unit, 0)
      this.checkDeaths()
      if (this.pending) break
    }

    this.checkDeaths()
    this.breakSpentWeapons()
    this.checkTermination()
    // runOpportunity 可能在方法内改写 this.pending，控制流收窄不可用，这里显式放宽
    const pendingReq = (this.pending as { request: DecisionRequest } | null)?.request ?? null
    return { tick: this.battle.clock, opportunities, pending: pendingReq, ended: this.outcome !== null }
  }

  /**
   * 机会内执行行为。`cost.opportunity = 0` 的免费行为执行后不闭合机会，可继续选择下一个行为；
   * 每次机会内免费行为至多 2 次（防无消耗循环）。
   */
  private runOpportunity(opp: ActionOpportunity, unit: CombatUnit, freeCount: number): void {
    while (true) {
      const behaviors = availableBehaviors(unit, unit.activeForcedBehaviors())
      const slot = this.chooseBehavior(behaviors)
      const source = slot ? this.resolveSource(slot) : undefined
      if (!slot || !source) {
        opp.consumedBy = 'wasted'
        unit.gauge.settleOverflow()
        this.fireStatusTriggers(unit, 'on_turn_end', undefined, this.oppPayload(opp))
        return
      }
      const r = commitBehavior(unit, slot, opp, source, this.pipelineDeps())
      if (!r.ok) {
        opp.consumedBy = 'wasted'
        unit.gauge.settleOverflow()
        this.fireStatusTriggers(unit, 'on_turn_end', undefined, this.oppPayload(opp))
        return
      }
      if (slot.kind === 'basic_attack') {
        this.fireStatusTriggers(unit, 'on_attack')
        this.fireDomainTriggers('on_attack', unit)
        this.consumeWeaponDurability(unit)
      } else {
        this.lastSkill.set(unit.id, { sourceRef: source.sourceRef, effects: source.effects })
        this.fireStatusTriggers(unit, 'on_active_skill')
        this.fireGlobalStatusTriggers('on_active_skill', unit)
      }
      const freeAction = (slot.cost.opportunity ?? 1) === 0
      if (r.value) {
        // 需玩家选靶：机会挂起，等 submitDecision 跑完 O 节点后再决定闭合或继续
        const awaiting = r.value
        this.pending = {
          request: awaiting.request,
          continueWith: (p) => awaiting.continueWith(p),
          opportunity: opp,
          freeAction,
          freeCount,
        }
        return
      }
      if (!freeAction || freeCount >= 1) {
        this.fireStatusTriggers(unit, 'on_turn_end', undefined, this.oppPayload(opp))
        return
      }
      freeCount += 1
    }
  }

  /** 本步末尾清掉耐久归零的武器（期间若被 on_kill 补满则保留）。 */
  private breakSpentWeapons(): void {
    for (const unit of this.units.all()) {
      if (unit.weapon && unit.weapon.durability <= 0) this.destroyWeapon(unit, 'durability')
    }
  }

  /** 装备武器：销毁旧武器 → 建实例 → fire on_weapon_equip（战吼由流水线随后执行）。 */
  private equipWeapon(unit: CombatUnit, def: WeaponDef): void {
    if (unit.weapon) this.destroyWeapon(unit, 'replaced')
    const inst = unit.equipWeapon(def, this.ids.next('weapon'))
    this.emit({ type: 'WeaponEquipped', instanceId: inst.instanceId, defId: inst.defId, unitId: unit.id })
    this.fireStatusTriggers(unit, 'on_weapon_equip')
  }

  private destroyWeapon(unit: CombatUnit, reason: string): void {
    const inst = unit.destroyWeapon()
    if (!inst) return
    this.emit({ type: 'WeaponDestroyed', instanceId: inst.instanceId, defId: inst.defId, unitId: unit.id, reason })
  }

  /** 普攻后扣 1 耐久（步末统一判定销毁，on_kill 补耐久可救回）。 */
  private consumeWeaponDurability(unit: CombatUnit): void {
    if (!unit.weapon) return
    unit.weapon.durability = Math.max(0, unit.weapon.durability - 1)
  }

  private opModifyWeapon(unit: CombatUnit, node: EffModifyWeapon): void {
    const w = unit.weapon
    if (!w) return
    if (node.restoreDurability) {
      const def = this.lookup.skillDef(w.defId)?.weapon
      if (def) w.durability = def.durability
    }
    if (typeof node.durabilityDelta === 'number') {
      w.durability = Math.max(0, w.durability + node.durabilityDelta)
    }
    if (typeof node.attackDelta === 'number' && node.attackDelta !== 0) {
      unit.provenance.revertBySource(w.instanceId)
      w.attack += node.attackDelta
      unit.provenance.apply('attack', w.attack, w.instanceId)
    }
  }

  // ---------- 行为源 ----------

  /** P2a 内置 AI：优先用技能（按 tick 轮转），无技能则普攻。确定性。 */
  private chooseBehavior(behaviors: readonly BehaviorSlot[]): BehaviorSlot | undefined {
    const skills = behaviors.filter((b) => b.kind === 'skill')
    if (skills.length > 0) return skills[this.tickCount % skills.length]
    return behaviors[0]
  }

  private resolveSource(slot: BehaviorSlot): BehaviorSource | undefined {
    if (slot.kind === 'basic_attack') return basicAttackSource()
    const skill = this.lookup.skillDef(slot.defId)
    if (!skill) return undefined
    const effects = skill.effects
      .map((ref) => {
        const node = this.lookup.effectNode(ref.ref)
        return node ? withParams(node, ref.params as Record<string, unknown> | undefined) : undefined
      })
      .filter((n): n is NonNullable<typeof n> => n !== undefined)
    return {
      sourceRef: skill.id,
      effects,
      targetSpec: skill.targetSpec ?? { request: { mode: 'unit', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      secondaryTargets: skill.secondaryTargets,
      consumption: (skill.targetSpec?.consumption as Consumption) ?? 'instant',
      zoneGrant: skill.zoneGrant ? { def: skill.zoneGrant.def, duration: skill.zoneGrant.duration } : undefined,
      domainGrant: skill.domainGrant ? { def: skill.domainGrant.def, duration: skill.domainGrant.duration } : undefined,
      weapon: skill.weapon,
    }
  }

  private pipelineDeps(): PipelineDeps {
    return {
      units: this.units,
      enemyOf: (f) => (f === this.factions[0] ? this.factions[1] : this.factions[0]),
      makeContext: (actionId, caster, targetScope, sourceRef) => this.makeContext(actionId, caster, undefined, targetScope, sourceRef),
      equipWeapon: (caster, weapon) => this.equipWeapon(caster, weapon),
      effectNode: (id) => this.lookup.effectNode(id),
      emit: (e) => this.emit(e),
      nextActionId: () => this.ids.next('action'),
      unsupported: (k, d) => this.unsupported(k, d),
      lanes: this.laneIds,
      laneCapacity: LANE_CAPACITY,
      lastDeadCellFor: (f) => this.lastDeadCell.get(f) ?? null,
      onAction: (info) => {
        const targets = info.targets
          .map((t) => (t.occupant ? this.units.get(t.occupant) : undefined))
          .filter((u): u is CombatUnit => u != null)
        if (info.consumption === 'zone' && info.zoneGrant) {
          this.opPlaceZone(info.caster, info.zoneGrant.def, info.zoneGrant.duration ?? -1, targets)
        } else if (info.consumption === 'domain' && info.domainGrant) {
          this.opDomain('overlay', info.domainGrant.def, info.domainGrant.duration ?? -1, info.caster)
        }
      },
    }
  }

  // ---------- 效果上下文与触发器 ----------

  /** 机会括号载荷（INV-S6）：opportunityId 由 unitId+tickIndex 唯一确定 */
  private oppPayload(opp: ActionOpportunity): OpportunityPayload {
    return { opportunityId: `${opp.unitId}@${opp.tickIndex}`, consumedBy: opp.consumedBy }
  }

  /**
   * 机会括号左端：递减该单位的 self_turn 时长（状态与溯源条目，调度参数 §〇点五）。
   * 到期处理与 tick 第 6 步一致——状态走 revertBySource + on_remove，账本条目走 revertBySource。
   */
  private tickSelfTurn(unit: CombatUnit): void {
    for (const inst of unit.statuses.tickSelfTurn()) {
      unit.provenance.revertBySource(inst.instanceId)
      this.emit({ type: 'StatusExpired', instanceId: inst.instanceId, defId: inst.defId, unitId: unit.id })
      // 载荷主体：on_remove 的 target = 到期状态的持有者（执行参数 §2.3）
      this.fireStatusTriggers(unit, 'on_remove', inst.defId, undefined, { target: unit })
    }
    unit.provenance.tickSelfTurn()
  }

  private makeContext(
    actionId: string,
    caster: CombatUnit | null,
    opportunity?: OpportunityPayload,
    targetScope?: TargetScope,
    sourceRef?: string,
  ): EffectContext {
    return {
      units: this.units,
      random: this.random,
      registry: this.randomRegistry,
      ids: this.ids,
      phase: this.battle.phase,
      caster,
      actionId,
      opportunity,
      targetScope,
      dimMul: (target) => this.dimHookMul(sourceRef, target),
      warn: (m) => this.warn(m),
      emit: (e) => this.emit(e),
      mountStatus: (host, statusId, grant) => this.mountStatus(host, statusId, grant, caster),
      effectNode: (id) => this.lookup.effectNode(id),
      defCategory: (id) => this.lookup.statusDef(id)?.category,
      statusDef: (id) => this.lookup.statusDef(id),
      unsupported: (k, d) => this.unsupported(k, d),
      reportDamage: (faction, amount) => {
        if (faction) this.stats.damageDealt[faction] = round2((this.stats.damageDealt[faction] ?? 0) + amount)
      },
      onDamage: (attacker, defender, amount) => {
        if (attacker) this.lastAttacker.set(defender.id, attacker.id)
        // 战意：实际承伤者（含嘲讽/替伤/转向后的落点）每受击 +1，受每回合与总量上限约束
        this.gainWarSpirit(defender, 1)
        // 载荷主体（执行参数 §2.3）：on_deal_damage 的 target = 承伤方；on_take_damage 的 attacker = 造成方
        if (attacker) {
          this.fireStatusTriggers(attacker, 'on_deal_damage', undefined, undefined, {
            target: defender,
            attacker,
          })
        }
        this.fireStatusTriggers(defender, 'on_take_damage', undefined, undefined, { attacker, target: defender })
        void amount
      },
      ops: {
        destroyWeapon: (u, reason) => this.destroyWeapon(u, reason),
        modifyWeapon: (u, node) => this.opModifyWeapon(u, node),
        move: (u, op, dist, c) => this.opMove(u, op, dist, c),
        spawn: (c, node, near) => this.opSpawn(c, node, near),
        translocate: (u, dur, payload) => this.opTranslocate(u, dur, payload),
        takeControl: (u, dur, c) => this.opTakeControl(u, dur, c),
        grantImmunity: (u, node) => {
          u.immunities.push({ categories: node.against ?? [], charges: node.charges ?? null, remaining: node.duration ?? null })
        },
        damageMod: (u, scope, delta, rem) => { u.damageMods.push({ scope, delta, remaining: rem }) },
        targetability: (u, rec) => { u.manualUntargetable.push(rec) },
        setLuminance: (v, d, dur, dispelable) => this.opSetLuminance(v, d, dur, dispelable),
        advanceClock: (ticks) => this.opAdvanceClock(ticks),
        applyDomain: (op, defId, dur, caster) => this.opDomain(op, defId, dur, caster),
        placeZone: (c, defId, dur, targets) => this.opPlaceZone(c, defId, dur, targets),
        snapshotUnit: (u, fields) => this.opSnapshot(u, fields),
        restoreUnit: (u, fields) => this.opRestore(u, fields),
        echoLastSkill: (u, potency) => this.opEcho(u, potency),
        shuffleGauges: (us, res) => this.opShuffleGauges(us, res),
        shuffleStatuses: (us, count) => this.opShuffleStatuses(us, count),
        modifySkillOf: (u, node) => this.opModifySkill(u, node),
        applyTargetOverride: (u, spec) => { u.pendingTargetOverride = spec },
        writeRuleSlot: (node, caster) => this.opWriteRuleSlot(node, caster),
        modifyRuleSlot: (node, caster) => this.opModifyRuleSlot(node, caster),
        boardMeter: (key, value, set) => {
          const cur = this.battle.meters[key] ?? 0
          const next = set ? value : cur + value
          this.battle.meters[key] = Math.max(-10, Math.min(10, round2(next)))
        },
        meterOf: (key) => this.dimValue(key),
        dispelSummons: (owner, sel) => this.opDispelSummons(owner, sel),
        dispelDomain: (tier, count) => this.opDispelDomain(tier, count),
      },
    }
  }

  // ---------- 维度乘区（SCHEMA §7 dimHooks） ----------

  /** 战场维度现值：luminance 走覆写栈，其余读 meters（secrecy / order / fate_value / death_tally） */
  private dimValue(dim: string): number {
    if (dim === 'luminance') return this.battle.lumOverride?.value ?? LUM[this.battle.phase]
    return this.battle.meters[dim] ?? 0
  }

  /** 行动卡 dimHooks 对指定结算桶的乘区积；同维度多档只取最贴合的一档（微光档不自叠白昼档） */
  private dimHookMul(cardId: string | undefined, target: 'damage' | 'heal'): number {
    if (!cardId) return 1
    const def = this.lookup.skillDef(cardId) ?? this.lookup.behaviorTemplate(cardId)
    const hooks = def?.dimHooks
    if (!hooks?.length) return 1
    const cardTags = def?.tags ?? []
    const best = new Map<string, { threshold: number; mul: number; cmp: string }>()
    for (const h of hooks) {
      if (h.target !== undefined && h.target !== 'all' && h.target !== target) continue
      if (h.filterTags?.length && !h.filterTags.some((t) => cardTags.includes(t))) continue
      if (!this.dimCompare(this.dimValue(h.dim), h.comparator ?? '>=', h.threshold)) continue
      const key = `${h.dim}|${h.target ?? 'damage'}`
      const prev = best.get(key)
      const cmp = h.comparator ?? '>='
      // 同组只保留最极端阈值的一档：>= / > 取更高阈值，<= / < 取更低阈值
      const better = !prev || (cmp === '<=' || cmp === '<'
        ? h.threshold < prev.threshold
        : h.threshold > prev.threshold)
      if (better) best.set(key, { threshold: h.threshold, mul: h.mul, cmp })
    }
    let mul = 1
    for (const b of best.values()) mul *= b.mul
    return mul
  }

  private dimCompare(actual: number, cmp: string, threshold: number): boolean {
    switch (cmp) {
      case '<=': return actual <= threshold
      case '>': return actual > threshold
      case '<': return actual < threshold
      case '==': return actual === threshold
      default: return actual >= threshold
    }
  }

  // ---------- P2b-2：界域 / 区域 / 记录 / 重排 / 规则槽 ----------

  private opSetLuminance(value: number | null, delta: number | null, duration: number | null, _dispelable: boolean): void {
    const base = value ?? this.dimValue('luminance') + (delta ?? 0)
    this.battle.lumOverride = {
      value: Math.max(0, Math.min(10, Math.round(base))),
      duration: duration ?? -1,
      sourceId: this.ids.next('lum'),
    }
  }

  private opAdvanceClock(ticks: number): void {
    this.battle.clock = (((this.battle.clock + ticks) % 72) + 72) % 72
    const next = phaseOf(this.battle.clock)
    if (next !== this.battle.phase) {
      this.battle.phase = next
      for (const u of this.units.all()) this.fireStatusTriggers(u, 'on_phase_change')
    }
    this.battle.luminance = LUM[next]
  }

  private opDomain(_op: string, defId: string | undefined, duration: number, _caster: CombatUnit | null): void {
    const def = defId ? this.lookup.domainDef?.(defId) : undefined
    if (!def) {
      this.unsupported('domain', `未知界域 ${String(defId)}`)
      return
    }
    this.domainSeq += 1
    this.battle.domains.push({
      def,
      grant: {
        duration: duration < 0 ? -1 : Math.max(1, duration),
        priority: this.domainSeq,
        sourceId: this.ids.next('domain'),
        ownerFaction: _caster?.faction,
        casterId: _caster?.id,
      },
    })
  }

  /** 界域触发器（战场参数 §1.2）：全局第三方监听，filter.side 相对界域所有者 */
  private fireDomainTriggers(event: 'on_tick' | 'on_turn_start' | 'on_attack', subject?: CombatUnit): void {
    if (this.battle.domains.length === 0) return
    for (const d of this.battle.domains) {
      const owner = d.grant.ownerFaction
      if (!owner) continue
      // 事件主体在场时它就是触发器宿主（on_attack 的 self = 攻击者；on_turn_start 的 self = 行动者）
      const host = subject
        ?? (d.grant.casterId ? this.units.get(d.grant.casterId) : undefined)
        ?? this.units.all().find((u) => u.faction === owner && !u.isDead)
      if (!host || host.isDead) continue
      const triggers = d.def.triggers ?? []
      for (let i = 0; i < triggers.length; i += 1) {
        const t = triggers[i]!
        if (t.event !== event) continue
        const filter = t.filter
        if (subject) {
          const side = filter?.side
          if (side === 'enemy' && subject.faction === owner) continue
          if (side === 'ally' && subject.faction !== owner) continue
        }
        const key = `${d.grant.sourceId}#${i}#${event}`
        const last = this.domainLastFire.get(key)
        if (t.minIntervalTicks && last !== undefined && this.tickCount - last < t.minIntervalTicks) continue
        this.domainLastFire.set(key, this.tickCount)
        const targets = subject
          ? [subject]
          : this.units.all().filter((u) => !u.isDead && u.position != null && this.domainMatches(u, filter, owner))
        if (!subject && filter?.side && targets.length === 0) continue
        const enemyFaction = this.factions.find((f) => f !== owner) ?? null
        const ctx = this.makeContext(this.ids.next('domain'), host, undefined, {
          host,
          caster: host,
          targets,
          secondary: [],
          attacker: subject ?? null,
          killed: null,
          enemyFaction,
        }, d.def.id)
        executeNodes(t.effects ?? [], targets, ctx)
      }
    }
  }

  /** 界域触发器的单位过滤（side 已在上层判定；此处处理 category / hasStatus / unitType） */
  private domainMatches(u: CombatUnit, filter: { hasCategory?: string | string[]; hasStatus?: boolean | string | { id?: string; stacksAtLeast?: number }; unitType?: string | string[] } | undefined, owner: FactionId): boolean {
    if (!filter) return true
    const side = (filter as { side?: string }).side
    if (side === 'ally' && u.faction !== owner) return false
    if (side === 'enemy' && u.faction === owner) return false
    if (filter.unitType !== undefined) {
      const types = Array.isArray(filter.unitType) ? filter.unitType : [filter.unitType]
      if (u.unitType == null || !types.includes(u.unitType)) return false
    }
    if (filter.hasStatus !== undefined) {
      const hs = filter.hasStatus
      if (typeof hs === 'string') { if (u.statusStacks(hs) <= 0) return false }
      else if (hs !== true && hs && hs.id && u.statusStacks(hs.id) < (hs.stacksAtLeast ?? 1)) return false
    }
    if (filter.hasCategory !== undefined) {
      const cats = Array.isArray(filter.hasCategory) ? filter.hasCategory : [filter.hasCategory]
      const hit = u.statuses.all().some((i) => cats.some((c) => (this.lookup.statusDef(i.defId)?.category ?? []).includes(c)))
      if (!hit) return false
    }
    return true
  }

  private opPlaceZone(caster: CombatUnit | null, defId: string | undefined, duration: number, targets: readonly CombatUnit[]): void {
    const def = defId ? this.lookup.zoneDef?.(defId) : undefined
    if (!def) {
      this.unsupported('zone', `未知区域 ${String(defId)}`)
      return
    }
    for (const t of targets) {
      if (!t.position) continue
      this.battle.zones.push({
        def,
        grant: { trigger: def.trigger as 'on_enter' | 'on_exit' | 'on_occupy_tick' | undefined, affects: def.affects, effects: [], duration: duration < 0 ? -1 : duration, sourceId: this.ids.next('zone') },
        coord: { ...t.position },
        status: 'Active',
      })
    }
    void caster
  }

  private opSnapshot(unit: CombatUnit, fields: readonly string[]): void {
    const s: Record<string, unknown> = {}
    for (const f of fields) {
      if (f === 'hp') s.hp = unit.pool('hp').current
      else if (f === 'pools') s.pools = [...unit.pools.entries()].map(([k, p]) => [k, p.current])
      else if (f === 'gauge') s.gauge = unit.gauge.current
    }
    this.snapshots.set(unit.id, s)
  }

  private opRestore(unit: CombatUnit, fields: readonly string[]): void {
    const s = this.snapshots.get(unit.id)
    if (!s) return
    for (const f of fields) {
      if (f === 'hp' && typeof s.hp === 'number') unit.pool('hp').setValue(s.hp)
      else if (f === 'gauge' && typeof s.gauge === 'number') unit.gauge.setValue('current', s.gauge)
      else if (f === 'pools' && Array.isArray(s.pools)) {
        for (const [k, v] of s.pools as [PoolKey, number][]) unit.pool(k).setValue(v)
      }
    }
  }

  private opEcho(unit: CombatUnit, potency: number): void {
    if (this.echoing) return // 防止「回响回响」无限递归
    const rec = this.lastSkill.get(unit.id)
    if (!rec) return
    const scaled = rec.effects.map((n) => scaleNode(n, potency))
    this.echoing = true
    try {
      executeNodes(scaled, [null], this.makeContext(this.ids.next('echo'), unit))
    } finally {
      this.echoing = false
    }
  }

  private opShuffleGauges(units: readonly CombatUnit[], _resource: string): void {
    // 集合守恒重排：按 index 升序取当前值，整体轮转一位
    const vals = units.map((u) => u.gauge.current)
    if (vals.length < 2) return
    const rotated = [vals[vals.length - 1] as number, ...vals.slice(0, -1)]
    units.forEach((u, i) => u.gauge.setValue('current', rotated[i] as number))
  }

  private opShuffleStatuses(units: readonly CombatUnit[], count: number): void {
    if (units.length < 2) return
    const taken: (readonly StatusInstance[] | null)[] = units.map((u) => u.statuses.all().slice(0, count))
    // 顺时针轮转：A 的状态给 B，B 给 C…（保序、确定性）
    units.forEach((u, i) => {
      const src = taken[i]
      if (!src) return
      for (const inst of src) {
        this.mountStatus(u, inst.defId, {
          duration: inst.remaining,
          stacks: inst.currentStacks,
          charges: inst.charges ?? undefined,
        })
      }
    })
  }

  private opModifySkill(unit: CombatUnit, node: EffectNode): void {
    const n = node as {
      skillRef?: { selector?: string; skillId?: string }
      costDelta?: { energy?: number; cooldown?: number }
      cooldownDelta?: number
      clearCooldown?: boolean
      setOpportunity?: number
    }
    // by_id 精确匹配技能实例；其余 selector 保持既有「作用于全部技能」口径
    const byId = n.skillRef?.selector === 'by_id' ? n.skillRef.skillId : undefined
    for (const slot of unit.behaviorSlots) {
      if (slot.kind !== 'skill') continue
      if (byId && slot.defId !== byId) continue
      if (n.costDelta?.energy) slot.cost.energy = Math.max(0, slot.cost.energy + n.costDelta.energy)
      if (n.costDelta?.cooldown) slot.cost.cooldown = Math.max(0, slot.cost.cooldown + n.costDelta.cooldown)
      if (n.cooldownDelta) slot.cooldownRemaining = Math.max(0, slot.cooldownRemaining + n.cooldownDelta)
      if (n.clearCooldown) slot.cooldownRemaining = 0
      if (typeof n.setOpportunity === 'number') slot.cost.opportunity = n.setOpportunity ? 1 : 0
    }
  }

  private opWriteRuleSlot(node: EffectNode, _caster: CombatUnit | null): void {
    const n = node as { slot?: number; field?: string; value?: unknown; overwrite?: boolean }
    const slot = this.ruleSlots[n.slot ?? 0]
    if (!slot) return
    if (n.overwrite) slot.length = 0
    slot.push({ field: n.field ?? 'trigger', value: n.value })
  }

  private opModifyRuleSlot(node: EffectNode, _caster: CombatUnit | null): void {
    const n = node as { slot?: number; field?: string; value?: unknown; mode?: string }
    const slot = this.ruleSlots[n.slot ?? 0]
    if (!slot) return
    if (n.mode === 'remove') {
      const idx = slot.findIndex((e) => e.field === n.field)
      if (idx >= 0) slot.splice(idx, 1)
    } else {
      slot.push({ field: n.field ?? 'punish', value: n.value })
    }
  }

  private onOccupancyChanged(e: OccupancyChanged): void {
    for (const entry of e.enter) {
      const unit = this.units.get(entry.unitId)
      if (!unit) continue
      for (const zone of this.battle.zones) {
        if (!this.zoneHits(zone, entry.coord)) continue
        if (zone.grant.trigger !== 'on_enter' && zone.grant.trigger !== 'on_occupy_tick') continue
        const effects = zone.def.effects
        if (effects && effects.length > 0) {
          executeNodes(effects, [unit], this.makeContext(this.ids.next('zone'), null))
        }
      }
    }
  }

  /** 每 tick：站在「逐 tick 触发」区域上的单位吃一次效果 */
  private tickZones(): void {
    for (const zone of this.battle.zones) {
      if (zone.status !== 'Active' || zone.grant.trigger !== 'on_occupy_tick') continue
      const def = zone.def
      if (!def.effects || def.effects.length === 0) continue
      for (const u of this.units.all()) {
        if (!u.position || u.isDead || u.detached) continue
        if (!this.zoneHits(zone, u.position)) continue
        executeNodes(def.effects, [u], this.makeContext(this.ids.next('zone'), null))
      }
    }
  }

  private zoneHits(zone: { coord: Coordinate; grant: { affects: string; sourceId: string } }, coord: Coordinate): boolean {
    void zone.grant
    return zone.coord.faction === coord.faction && zone.coord.lane === coord.lane && zone.coord.index === coord.index
  }

  // ---------- 战力类操作（move / spawn / translocate / take_control） ----------

  private opMove(unit: CombatUnit, op: string, distance: number, _caster: CombatUnit | null): void {
    const pos = unit.position
    if (!pos) return
    if (op === 'swap_ally') {
      const ally = this.units
        .aliveIn(unit.faction)
        .find((u) => u.id !== unit.id && u.position?.lane === pos.lane)
      if (ally?.position) this.placement.swap(pos, ally.position)
      return
    }
    let target = pos.index
    switch (op) {
      case 'pull_forward':
      case 'charge_forward':
      case 'swap_neighbor':
        target = Math.max(0, pos.index - Math.max(1, distance))
        break
      case 'push_back':
        target = Math.min(LANE_CAPACITY - 1, pos.index + distance)
        break
      case 'insert_tail_cross_lane':
      case 'param':
        this.moveToFreeSlot(unit)
        return
      default:
        this.unsupported(`move:${op}`)
        return
    }
    this.placement.applyExternal((battle) => {
      const lane = battle.factions.find((f) => f.id === pos.faction)?.lanes.get(pos.lane)
      if (!lane) return battle
      const occ = lane.slots.map((s) => s.occupant).filter((o): o is UnitId => o != null)
      const from = occ.indexOf(unit.id)
      if (from < 0) return battle
      occ.splice(from, 1)
      occ.splice(Math.max(0, Math.min(target, occ.length)), 0, unit.id)
      for (let i = 0; i < lane.slots.length; i += 1) lane.slots[i] = { occupant: occ[i] ?? null }
      return battle
    })
  }

  private opSpawn(
    caster: CombatUnit | null,
    node: { unitId?: string; def?: string; kind?: string; position?: string; hpRatio?: unknown; atkRatio?: unknown; count?: unknown; summonCap?: unknown; summonCapOverride?: unknown },
    near: CombatUnit | null,
  ): void {
    const defId = node.unitId ?? node.def ?? node.kind
    const def = defId ? this.lookup.unitDef(defId) : undefined
    if (!def) {
      this.unsupported('spawn', `未知召唤物 ${String(defId)}`)
      return
    }
    const owner = caster
    if (!owner) return
    const count = Math.max(1, Math.floor(numeric(node.count, 1)))
    // 卡面 spawn 段可做一次性 cap 覆写（H39）：overrides 只抬不压
    const capOverride = this.spawnCapOf(node.summonCap ?? node.summonCapOverride)
    const cap = Math.max(owner.effectiveSummonCap(SUMMON_CAP_BASE), capOverride ?? 0)
    for (let i = 0; i < count; i += 1) {
      if (cap <= 0) {
        this.warn(`召唤失败：召唤位上限为 0（${defId}）`)
        return
      }
      // H39：超限 = 最早在场者先消散，再落新单位
      this.disperseOverCap(owner, cap)
      const unit = this.spawnOne(owner, def, near)
      if (!unit) return
      this.emit({ type: 'UnitSpawned', unitId: unit.id })
      // 载荷主体：on_spawn 的 target = 新生单位（执行参数 §2.3），需求本身落在召唤物身上
      this.fireStatusTriggers(owner, 'on_spawn', undefined, undefined, { target: unit })
    }
  }

  /** 单个召唤物落场；半场已满返回 null */
  private spawnOne(owner: CombatUnit, def: { id: string; base?: unknown; tags?: readonly string[]; unitType?: string }, near: CombatUnit | null): CombatUnit | null {
    const base = typeof def.base === 'object' && def.base ? (def.base as { hp?: number; atk?: number }) : {}
    const hp = typeof base.hp === 'number' ? base.hp : 12
    const unit = new CombatUnit(
      this.ids.next('summon'),
      owner.faction,
      { strength: Math.max(0, Math.round((hp - 30) / 10)), agility: 0, intelligence: 0, rank: 0 },
      owner.gender,
      { statusDefs: { statusDef: (sid) => this.lookup.statusDef(sid) }, nextStatusId: () => this.ids.next('status') },
      def.tags ?? [],
    )
    unit.unitType = def.unitType ?? null
    unit.unitDefId = def.id
    unit.summonerId = owner.id
    this.units.add(unit)
    unit.behaviorSlots.push(this.basicAttackSlot(unit))
    const nearPos = near?.position ?? owner.position
    const ownLanes = [...(this.battle.factions.find((x) => x.id === owner.faction)?.lanes.keys() ?? [])].sort()
    const ordered = nearPos ? [nearPos.lane, ...ownLanes.filter((l) => l !== nearPos.lane)] : ownLanes
    let placed = false
    for (const lane of ordered) {
      if (this.placeAtFree(unit.id, owner.faction, lane)) {
        placed = true
        break
      }
    }
    if (!placed) {
      this.units.remove(unit.id)
      this.warn(`召唤失败：己方半场已满（${def.id}）`)
      return null
    }
    return unit
  }

  /** spawn 段 summonCap：number 直接用；对象取 default（valueFrom 属战外阶梯数据，不在此求值） */
  private spawnCapOf(raw: unknown): number | null {
    if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw)
    if (raw && typeof raw === 'object') {
      const v = (raw as { default?: unknown }).default
      if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v)
    }
    return null
  }

  /** 活着的在场召唤物（注册表插入序 = 召唤序） */
  private liveSummons(ownerId: string): CombatUnit[] {
    return this.units.all().filter((u) => u.summonerId === ownerId && !u.isDead)
  }

  /** 超出上限时按「最早在场者先消散」逐个腾位 */
  private disperseOverCap(owner: CombatUnit, cap: number): void {
    const list = this.liveSummons(owner.id)
    while (list.length >= cap) {
      const oldest = list.shift()
      if (!oldest) break
      this.disperseSummon(oldest)
    }
  }

  /** 消散：不走死亡链（不记死亡簿/击杀），状态按 on_remove 路径卸载 */
  private disperseSummon(unit: CombatUnit): void {
    for (const inst of [...unit.statuses.all()]) {
      unit.statuses.unmount(inst.instanceId, 'summon_cap')
      unit.provenance.revertBySource(inst.instanceId)
      this.emit({ type: 'StatusExpired', instanceId: inst.instanceId, defId: inst.defId, unitId: unit.id })
      this.fireStatusTriggers(unit, 'on_remove', inst.defId, undefined, { target: unit })
    }
    unit.provenance.revertAll()
    this.placement.remove(unit.id)
    this.units.remove(unit.id)
    this.emit({ type: 'UnitDispersed', unitId: unit.id, reason: 'summon_cap' })
  }

  /** dispel 的召唤物销毁分支：按蓝本/归属筛出召唤物，走消散路径（不上死亡链） */
  private opDispelSummons(owner: CombatUnit | null, sel: { unitId?: string | string[]; ownOnly?: boolean; count?: number }): void {
    const ids = sel.unitId ? (Array.isArray(sel.unitId) ? sel.unitId : [sel.unitId]) : undefined
    const list = this.units.all().filter((u) => u.summonerId != null && !u.isDead
      && (!sel.ownOnly || u.summonerId === owner?.id)
      && (!ids || (u.unitDefId != null && ids.includes(u.unitDefId))))
    const limit = typeof sel.count === 'number' ? sel.count : list.length
    for (const u of list.slice(0, limit)) this.disperseSummon(u)
  }

  /** dispel=domain：解除可驱散界域（tier 过滤；base 不可驱散，INV-B11） */
  private opDispelDomain(tier?: string, count?: number): void {
    const keep: typeof this.battle.domains = []
    let removed = 0
    for (const d of this.battle.domains) {
      const hit = d.def.dispelable
        && (tier === undefined || d.def.tier === tier)
        && (count === undefined || removed < count)
      if (!hit) {
        keep.push(d)
        continue
      }
      removed += 1
      this.emit({ type: 'DomainExpired', defId: d.def.id, tier: d.def.tier })
    }
    this.battle.domains = keep
  }

  /** cap 下降后（状态到期/被打断）在 tick 边界收敛：超限部分最老消散 */
  private enforceSummonCaps(): void {
    const owners = this.units.all().filter((u) => this.liveSummons(u.id).length > 0)
    for (const owner of owners) {
      this.disperseOverCap(owner, Math.max(0, owner.effectiveSummonCap(SUMMON_CAP_BASE)))
    }
  }

  /** 移到己方半场的第一个空位（param / insert_tail_cross_lane 的落点语义） */
  private moveToFreeSlot(unit: CombatUnit): void {
    const f = this.battle.factions.find((x) => x.id === unit.faction)
    if (!f) return
    const laneIds = [...f.lanes.keys()].sort()
    for (const laneId of laneIds) {
      const lane = f.lanes.get(laneId) as Lane
      if (lane.slots.filter((s) => s.occupant != null).length >= lane.slots.length) continue
      const idx = lane.slots.findIndex((s) => s.occupant == null)
      this.placement.applyExternal((battle) => {
        const l = battle.factions.find((x) => x.id === unit.faction)?.lanes.get(laneId)
        if (!l) return battle
        for (const other of f.lanes.values()) {
          const o = battle.factions.find((x) => x.id === unit.faction)?.lanes.get(other.id)
          if (!o) continue
          for (let i = 0; i < o.slots.length; i += 1) if (o.slots[i]!.occupant === unit.id) o.slots[i] = { occupant: null }
        }
        l.slots[idx] = { occupant: unit.id }
        return battle
      })
      return
    }
  }

  private placeAtFree(unitId: UnitId, faction: FactionId, lane: string): boolean {
    const f = this.battle.factions.find((x) => x.id === faction)
    const l = f?.lanes.get(lane)
    if (!l) return false
    const idx = l.slots.findIndex((s) => s.occupant == null)
    if (idx < 0) return false
    return this.placement.insert(unitId, { faction, lane, index: idx }).ok
  }

  private opTranslocate(unit: CombatUnit, duration: number, payload: readonly EffectNode[]): void {
    if (unit.detached) return
    const r = this.placement.remove(unit.id)
    if (!r.ok) return
    unit.detached = true
    this.timers.push({ kind: 'translocate', unitId: unit.id, remaining: Math.max(1, duration), payload })
  }

  private opTakeControl(unit: CombatUnit, duration: number, caster: CombatUnit): void {
    if (unit.faction === caster.faction) return
    unit.originalFaction = unit.faction
    unit.faction = caster.faction
    this.timers.push({ kind: 'control', unitId: unit.id, remaining: Math.max(1, duration), payload: [] })
  }

  /** 战意产出统一入口：每自身回合最多 +3，总量上限 10（状态 maxStacks）。 */
  private gainWarSpirit(unit: CombatUnit | null, amount: number): void {
    if (!unit || unit.isDead || unit.pathwayId !== 'warrior' || amount <= 0) return
    this.mountStatus(unit, 'war_spirit', { stacks: amount }, unit)
  }

  private mountStatus(host: CombatUnit, statusId: string, grant: Omit<StatusGrant, 'sourceId'>, caster: CombatUnit | null = null): void {
    if (!statusId) return
    let effectiveGrant = grant
    // 战意正向产出：默认走「受击每自身回合 3 层」上限；被动击杀产层可标记绕过回合上限，
    // 但仍受总量 10 层限制。主动消费的负层数不受此限。
    if (statusId === 'war_spirit' && (grant.stacks ?? 1) > 0) {
      const cur = host.statuses.all().find((i) => i.defId === 'war_spirit')?.currentStacks ?? 0
      const bypassTurnCap = grant.ignoreWarSpiritCap === true
      const allowed = bypassTurnCap
        ? Math.max(0, Math.min(grant.stacks ?? 1, 10 - cur))
        : Math.max(0, Math.min(grant.stacks ?? 1, 3 - host.warSpiritGain, 10 - cur))
      if (allowed <= 0) return
      effectiveGrant = { ...grant, stacks: allowed }
      if (!bypassTurnCap) host.warSpiritGain += allowed
    }
    const def = this.lookup.statusDef(statusId)
    // 免疫拦截（grant_immunity）
    const cats = def?.category ?? []
    const idx = host.immunities.findIndex((r) => (r.charges === null || r.charges > 0) && r.categories.some((c) => cats.includes(c)))
    if (idx >= 0) {
      const rec = host.immunities[idx] as { charges: number | null }
      if (rec.charges !== null) {
        rec.charges -= 1
        if (rec.charges <= 0) host.immunities.splice(idx, 1)
      }
      return
    }
    const inst = host.statuses.mount(statusId, { ...effectiveGrant, sourceId: this.ids.next('status'), casterId: effectiveGrant.casterId ?? caster?.id })
    if (!inst) return
    // 消耗层数不是「新获得状态」，不触发 on_apply / on_status_gain
    if (effectiveGrant.stackMode === 'consume') return
    this.emit({ type: 'StatusMounted', instanceId: inst.instanceId, defId: statusId, unitId: host.id })
    // 载荷主体：on_apply / on_status_gain 的 caster = 施加者，target = 宿主（执行参数 §2.3）
    const subjects: TriggerSubjects = { caster, target: host }
    this.fireTriggers(host, 'on_apply', def?.triggers, host, undefined, this.scopeFor(host, inst.grant.casterId, subjects))
    this.fireStatusTriggers(host, 'on_status_gain', undefined, undefined, subjects)
  }

  /** 每 tick 处理限时记录（translocate 回归 / take_control 归还 / 临时增减伤与可选中性） */
  private tickTimers(): void {
    const keep: typeof this.timers = []
    for (const t of this.timers) {
      t.remaining -= 1
      const unit = this.units.get(t.unitId)
      if (t.remaining > 0) {
        keep.push(t)
        continue
      }
      if (t.kind === 'translocate' && unit) {
        unit.detached = false
        const lane = unit.position?.lane ?? 'lane0'
        const placed = this.placeAtFree(unit.id, unit.faction, lane)
        if (!placed) this.placeAtFree(unit.id, unit.faction, [...(this.battle.factions[0]?.lanes.keys() ?? [])][0] ?? 'lane0')
        this.emit({ type: 'UnitReturned', unitId: unit.id })
        if (t.payload.length > 0) executeNodes(t.payload, [unit], this.makeContext(this.ids.next('trig'), unit))
      } else if (t.kind === 'control' && unit && unit.originalFaction) {
        unit.faction = unit.originalFaction
        unit.originalFaction = null
      }
    }
    this.timers = keep
    // 光照覆写：tick 口径计时（-1 = 永续，不自然到期）
    const lum = this.battle.lumOverride
    if (lum && lum.duration > 0) {
      lum.duration -= 1
      if (lum.duration <= 0) this.battle.lumOverride = null
    }
    for (const u of this.units.all()) {
      tickRecords(u.damageMods)
      tickRecords(u.manualUntargetable)
      tickImmunities(u)
    }
  }

  /**
   * 组装触发器载荷语境（执行参数 §2.1b）：宿主已知，其余主体来自事件。
   * 状态触发器的 `caster` 优先取该状态实例的施加者（grant.casterId），被动卡没有施加者故退回宿主。
   * `targets` 按 §2.1b 缺省回退填成 [host]——无受害主体的触发点上 `target` 等于宿主。
   */
  private scopeFor(
    host: CombatUnit,
    applierId: string | undefined,
    subjects: TriggerSubjects | undefined,
    opportunity?: OpportunityPayload,
  ): TargetScope {
    const applier = applierId ? (this.units.get(applierId) ?? null) : null
    const target = subjects?.target ?? null
    return {
      host,
      caster: applier ?? subjects?.caster ?? host,
      targets: [target ?? host],
      secondary: [],     // 触发链无第二组选靶（仅卡片语境有）；secondary_target 回退 targets
      attacker: subjects?.attacker ?? null,
      killed: subjects?.killed ?? null,
      enemyFaction: this.factions.find((f) => f !== host.faction) ?? null,
      opportunity,
    }
  }

  private fireStatusTriggers(
    unit: CombatUnit,
    event: string,
    onlyDefId?: string,
    opportunity?: OpportunityPayload,
    subjects?: TriggerSubjects,
  ): void {
    // 快照：触发器效果可能卸载自身或其它状态
    for (const inst of [...unit.statuses.all()]) {
      if (onlyDefId && inst.defId !== onlyDefId) continue
      const def = this.lookup.statusDef(inst.defId)
      const scope = this.scopeFor(unit, inst.grant.casterId, subjects, opportunity)
      this.fireTriggers(unit, event, def?.triggers, unit, opportunity, scope, false, null, inst)
    }
    // 武器（无 onlyDefId 时参与；装备期触发器，不支持 consumeCharge）
    if (!onlyDefId && unit.weapon) {
      const wdef = this.lookup.skillDef(unit.weapon.defId)?.weapon
      const scope = this.scopeFor(unit, undefined, subjects, opportunity)
      this.fireTriggers(unit, event, wdef?.triggers, unit, opportunity, scope, false, undefined, undefined, unit.weapon.defId)
    }
    // 被动卡（无 onlyDefId 时全部参与）
    if (!onlyDefId) {
      for (const p of unit.passives) {
        const scope = this.scopeFor(unit, undefined, subjects, opportunity)
        this.fireTriggers(unit, event, p.triggers, unit, opportunity, scope, false, undefined, undefined, p.defId)
      }
    }
  }

  /** 全局监听：遍历所有存活单位的状态/被动，只执行 global:true 的触发器；事件源作为条件 target。 */
  private fireGlobalStatusTriggers(event: string, subject: CombatUnit, subjects?: TriggerSubjects): void {
    for (const host of this.units.all()) {
      if (host.isDead) continue
      for (const inst of [...host.statuses.all()]) {
        const def = this.lookup.statusDef(inst.defId)
        const scope = this.scopeFor(host, inst.grant.casterId, { ...subjects, target: subject })
        this.fireTriggers(host, event, def?.triggers, host, undefined, scope, true, subject, inst)
      }
      if (host.weapon) {
        const wdef = this.lookup.skillDef(host.weapon.defId)?.weapon
        const scope = this.scopeFor(host, undefined, { ...subjects, target: subject })
        this.fireTriggers(host, event, wdef?.triggers, host, undefined, scope, true, subject, undefined, host.weapon.defId)
      }
      for (const p of host.passives) {
        const scope = this.scopeFor(host, undefined, { ...subjects, target: subject })
        this.fireTriggers(host, event, p.triggers, host, undefined, scope, true, subject, undefined, p.defId)
      }
    }
  }

  private fireTriggers(unit: CombatUnit, event: string, triggers: readonly TriggerDef[] | undefined, caster: CombatUnit | null, opportunity?: OpportunityPayload, targetScope?: TargetScope, globalPass = false, conditionTarget?: CombatUnit | null, ownerInstance?: StatusInstance, originCardId?: string): void {
    for (const t of triggers ?? []) {
      if (t.event !== event) continue
      if ((t.global === true) !== globalPass) continue
      const ctx = this.makeContext(this.ids.next('trig'), caster, opportunity, targetScope, originCardId)
      // P2a：触发器级 condition 先在全局监听上接线；非全局触发器的条件评估待 side 口径统一
      if (globalPass && t.condition && !checkCondition(t.condition, conditionTarget ?? targetScope?.targets[0] ?? unit, ctx, targetScope?.caster ?? null)) continue
      executeNodes(t.effects ?? [], [unit], ctx)
      if (!ownerInstance || !t.consumeCharge) continue
      // 效果可能已自行卸载该状态：按 instanceId 重新取，避免重复卸载
      const live = unit.statuses.all().find((i) => i.instanceId === ownerInstance.instanceId)
      if (!live || live.charges === null) continue
      const amount = t.consumeCharge === true ? 1 : Math.max(0, Math.floor(t.consumeCharge))
      if (amount <= 0) continue
      live.charges = Math.max(0, live.charges - amount)
      if (live.charges <= 0) {
        unit.statuses.unmount(live.instanceId, 'charges')
        this.emit({ type: 'StatusExpired', instanceId: live.instanceId, defId: live.defId, unitId: unit.id })
      }
    }
  }

  // ---------- 收尾 ----------

  private checkDeaths(): void {
    for (const u of this.units.all()) {
      if (!u.isDead || this.dead.has(u.id)) continue
      this.dead.add(u.id)
      if (u.position) this.lastDeadCell.set(u.faction, { ...u.position })
      this.emit({ type: 'UnitDied', unitId: u.id })
      this.stats.unitsLost[u.faction] = (this.stats.unitsLost[u.faction] ?? 0) + 1
      // 死亡簿维度（源质维度 §一点五）：任何单位走完死亡结算链 +1，cap 10
      this.battle.meters.death_tally = Math.min(10, (this.battle.meters.death_tally ?? 0) + 1)
      // 战意：击杀不再默认产层——击杀产层由被动卡 on_kill 载荷附加（带 ignoreWarSpiritCap）
      const killerId = this.lastAttacker.get(u.id)
      const killer = killerId ? this.units.get(killerId) : undefined
      // 载荷主体（执行参数 §2.3）：on_death 的 attacker / target = 击杀者，killed_unit = 自身；
      // on_kill 的 killed_unit / target = 受害者。故先解出击杀者再 fire。
      this.fireStatusTriggers(u, 'on_death', undefined, undefined, { attacker: killer ?? null, target: killer ?? null, killed: u })
      this.fireGlobalStatusTriggers('on_death', u, { attacker: killer ?? null, target: u, killed: u })
      if (killer && !killer.isDead) {
        this.fireStatusTriggers(killer, 'on_kill', undefined, undefined, { attacker: killer, target: u, killed: u })
      }
      u.provenance.revertAll()
      this.placement.remove(u.id)
    }
  }

  private checkTermination(): void {
    if (this.outcome !== null) return
    const a = this.units.aliveIn(this.factions[0]).length
    const b = this.units.aliveIn(this.factions[1]).length
    if (a === 0 && b === 0) this.outcome = 'draw'
    else if (a === 0) this.outcome = 'side_b'
    else if (b === 0) this.outcome = 'side_a'
    else if (this.tickCount >= this.maxTicks) this.outcome = 'draw'
  }

  // ---------- 门面 ----------

  state(): CombatView {
    const units: UnitViewLite[] = this.units.all().map((u) => ({
      id: u.id,
      faction: u.faction,
      coordinate: u.position,
      hp: u.hp,
      hpMax: u.hpMax,
      energy: u.pool('energy').current,
      gauge: u.gauge.current,
      gaugeRate: u.gauge.rate,
      gaugeThreshold: u.gauge.threshold,
      statuses: u.statuses.all().map((s) => ({ defId: s.defId, stacks: s.currentStacks, charges: s.charges, maxCharges: s.maxCharges })),
      weapon: u.weapon ? { defId: u.weapon.defId, attack: u.weapon.attack, durability: u.weapon.durability } : null,
      unitDefId: u.unitDefId,
      unitType: u.unitType,
      summonerId: u.summonerId,
    }))
    return { tick: this.battle.clock, phase: this.battle.phase, units, pending: this.pending?.request ?? null, finished: this.outcome !== null }
  }

  drainEvents(): readonly DomainEvent[] {
    return this.events.log
  }

  pendingDecision(): DecisionRequest | null {
    return this.pending?.request ?? null
  }

  submitDecision(d: DecisionInput): void {
    const p = this.pending
    if (!p) return
    this.pending = null
    p.continueWith(d)
    // 机会闭合：manual 选靶挂起的 Action 在此走完 O 节点，括号右端随之产出（INV-S6；
    // 出手者可能在此过程中自尽，故只判存在不判存活——与循环内成功分支口径一致）
    if (p.opportunity) {
      const u = this.units.get(p.opportunity.unitId)
      if (!u) {
        // 单位不存在：无事可做
      } else if (p.freeAction && !u.isDead) {
        // 免费行为：机会不闭合，继续同一机会选择下一个行为
        this.runOpportunity(p.opportunity, u, (p.freeCount ?? 0) + 1)
      } else {
        this.fireStatusTriggers(u, 'on_turn_end', undefined, this.oppPayload(p.opportunity))
      }
    }
    this.checkDeaths()
    this.checkTermination()
  }

  ended(): CombatEnded | null {
    if (this.outcome === null) return null
    const winner = this.outcome === 'side_a' ? this.factions[0] : this.outcome === 'side_b' ? this.factions[1] : undefined
    return {
      outcome: this.outcome,
      winnerFactionId: winner,
      events: this.events.log,
      finalState: { battle: this.battle, units: this.units.all() },
      randomSnapshot: { seed: this.random.seed, state: [this.random.snapshot().s, this.random.snapshot().cursor] },
      stats: this.stats,
    }
  }

  setup(): Readonly<CombatSetup> {
    return this.setupData
  }

  diagnostic(): { warnings: readonly string[]; unsupported: number; unsupportedKinds: Record<string, number> } {
    const kinds: Record<string, number> = {}
    for (const [k, v] of [...this.unsupportedKinds.entries()].sort()) kinds[k] = v
    return { warnings: this.warnings, unsupported: this.unsupportedCount, unsupportedKinds: kinds }
  }

  private emit(event: DomainEvent): void {
    this.events.emit(event)
  }

  private warn(msg: string): void {
    this.warnings.push(msg)
  }

  private unsupported(kind: string, detail?: string): void {
    this.unsupportedCount += 1
    this.unsupportedKinds.set(kind, (this.unsupportedKinds.get(kind) ?? 0) + 1)
    if (this.warnings.length < 50) this.warnings.push(`未实现：${kind}${detail ? ` (${detail})` : ''}`)
  }
}

function scaleNode(node: EffectNode, potency: number): EffectNode {
  const rec = node as unknown as Record<string, unknown>
  if (typeof rec.value === 'number' && (rec.type === 'damage' || rec.type === 'heal')) {
    return { ...rec, value: Math.round(rec.value * potency * 100) / 100 } as unknown as EffectNode
  }
  return node
}

function sgDefId(sg: unknown): string | undefined {
  return (sg as { defId?: string }).defId
}

function tickRecords(list: { remaining: number | null }[]): void {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const r = list[i] as { remaining: number | null }
    if (r.remaining === null) continue
    r.remaining -= 1
    if (r.remaining <= 0) list.splice(i, 1)
  }
}

function tickImmunities(u: CombatUnit): void {
  for (let i = u.immunities.length - 1; i >= 0; i -= 1) {
    const r = u.immunities[i] as { remaining: number | null }
    if (r.remaining === null) continue
    r.remaining -= 1
    if (r.remaining <= 0) u.immunities.splice(i, 1)
  }
}
