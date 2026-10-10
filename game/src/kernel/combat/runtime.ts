// 战斗运行时：聚合根 Combat 的实现。持事件总线 / 随机源 / id 生成器 / 注册表 /
// 战场 / Placement / Scheduler，并把一次 step 停在 Manual 决策点。
import type { FactionId, Phase, PoolKey, UnitId } from '../ids'
import type { Battle, Coordinate, Faction, Lane, OccupancyChanged } from '../battle/types'
import { LANE_CAPACITY } from '../battle/types'
import { BattlePlacement } from '../battle/placement'
import { createLookup, type CatalogLookup } from '../catalog/lookup'
import type { Catalog, EffectNode, TriggerDef } from '../catalog/types'
import { EventBus } from '../shared/events'
import { SequentialIdGenerator } from '../shared/id-generator'
import { Mulberry32RandomSource, RandomUsageRegistry, type RandomSource } from '../shared/random-source'
import { round2 } from '../shared/result'
import { Registry } from '../roster/registry'
import { CombatUnit } from '../roster/unit'
import type { BehaviorSlot, StatusGrant } from '../roster/types'
import { CombatScheduler, phaseOf, PHASE_LUMINANCE as LUM } from '../scheduling/scheduler'
import { resolveInitiative } from '../scheduling/initiative'
import { availableBehaviors } from '../scheduling/filter'
import type { ActionOpportunity } from '../scheduling/types'
import { commitBehavior } from '../execution/commit'
import type { BehaviorSource, PipelineDeps } from '../execution/pipeline'
import type { Consumption } from '../shared/types'
import type { DecisionInput, DecisionRequest } from '../execution/types'
import { withParams, type EffectContext } from '../effect/context'
import { executeNodes } from '../effect/executor'
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
  private readonly factions: [FactionId, FactionId]
  private readonly warnings: string[] = []
  private battle: Battle
  private placement: BattlePlacement
  private scheduler: CombatScheduler
  private pending: { request: DecisionRequest; continueWith: (p: DecisionInput) => void } | null = null
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
  private echoing = false

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
          this.emit({ type: 'StatusExpired', instanceId: inst.instanceId, defId: inst.defId })
          this.fireStatusTriggers(u, 'on_remove', inst.defId)
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
    const factions: Faction[] = this.setupData.factions.map((fs) => ({
      id: fs.id,
      lanes: new Map<string, Lane>(laneIds.map((l) => [l, { id: l, slots: Array.from({ length: LANE_CAPACITY }, () => ({ occupant: null })) }])),
    }))
    const clock = ((this.setupData.board.clock.base % 72) + 72) % 72
    return { factions, zones: [], domains: [], clock, luminance: 0, phase: phaseOf(clock), lumOverride: null }
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
        this.units.add(unit)
        this.installBehaviors(unit, us.activeSlots ?? [])
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
        cost: { energy: skill.cost?.energy ?? 0, gauge: unit.gauge.threshold, cooldown: skill.cost?.cooldown ?? 0 },
        cooldownRemaining: 0,
      })
    }
  }

  private basicAttackSlot(unit: CombatUnit): BehaviorSlot {
    return {
      instanceId: this.ids.next('bslot'),
      defId: BASIC_ATTACK_ID,
      kind: 'basic_attack',
      reach: 'melee',
      cost: { energy: 0, gauge: unit.gauge.threshold, cooldown: 0 },
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
    this.tickZones()
    if (this.battle.phase !== this.prevPhase) {
      this.prevPhase = this.battle.phase
      for (const u of this.units.all()) this.fireStatusTriggers(u, 'on_phase_change')
    }
    if (this.tickCount % 5 === 0) {
      for (const u of this.units.all()) this.fireStatusTriggers(u, 'on_turn_start')
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
      if (!unit || unit.isDead) {
        opp.consumedBy = 'wasted'
        continue
      }
      const behaviors = availableBehaviors(unit)
      const slot = this.chooseBehavior(behaviors)
      const source = slot ? this.resolveSource(slot) : undefined
      if (!slot || !source) {
        opp.consumedBy = 'wasted'
        unit.gauge.settleOverflow()
        continue
      }
      const r = commitBehavior(unit, slot, opp, source, this.pipelineDeps())
      if (!r.ok) {
        opp.consumedBy = 'wasted'
        unit.gauge.settleOverflow()
      } else {
        if (slot.kind === 'basic_attack') {
          this.fireStatusTriggers(unit, 'on_attack')
        } else {
          this.lastSkill.set(unit.id, { sourceRef: source.sourceRef, effects: source.effects })
          this.fireStatusTriggers(unit, 'on_active_skill')
        }
        if (r.value) {
          const awaiting = r.value
          this.pending = { request: awaiting.request, continueWith: (p) => awaiting.continueWith(p) }
        }
      }
      this.checkDeaths()
      if (this.pending) break
    }

    this.checkDeaths()
    this.checkTermination()
    return { tick: this.battle.clock, opportunities, pending: this.pending?.request ?? null, ended: this.outcome !== null }
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
      targetSpec: skill.targetSpec ?? { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      consumption: (skill.targetSpec?.consumption as Consumption) ?? 'instant',
      zoneGrant: skill.zoneGrant ? { def: skill.zoneGrant.def, duration: skill.zoneGrant.duration } : undefined,
      domainGrant: skill.domainGrant ? { def: skill.domainGrant.def, duration: skill.domainGrant.duration } : undefined,
    }
  }

  private pipelineDeps(): PipelineDeps {
    return {
      units: this.units,
      enemyOf: (f) => (f === this.factions[0] ? this.factions[1] : this.factions[0]),
      makeContext: (actionId, caster) => this.makeContext(actionId, caster),
      effectNode: (id) => this.lookup.effectNode(id),
      emit: (e) => this.emit(e),
      nextActionId: () => this.ids.next('action'),
      unsupported: (k, d) => this.unsupported(k, d),
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

  private makeContext(actionId: string, caster: CombatUnit | null): EffectContext {
    return {
      units: this.units,
      random: this.random,
      registry: this.randomRegistry,
      ids: this.ids,
      phase: this.battle.phase,
      caster,
      actionId,
      warn: (m) => this.warn(m),
      emit: (e) => this.emit(e),
      mountStatus: (host, statusId, grant) => this.mountStatus(host, statusId, grant),
      effectNode: (id) => this.lookup.effectNode(id),
      defCategory: (id) => this.lookup.statusDef(id)?.category,
      unsupported: (k, d) => this.unsupported(k, d),
      reportDamage: (faction, amount) => {
        if (faction) this.stats.damageDealt[faction] = round2((this.stats.damageDealt[faction] ?? 0) + amount)
      },
      onDamage: (attacker, defender, amount) => {
        if (attacker) this.lastAttacker.set(defender.id, attacker.id)
        if (attacker) this.fireStatusTriggers(attacker, 'on_deal_damage')
        this.fireStatusTriggers(defender, 'on_take_damage')
        void amount
      },
      ops: {
        move: (u, op, dist, c) => this.opMove(u, op, dist, c),
        spawn: (c, node, near) => this.opSpawn(c, node, near),
        translocate: (u, dur, payload) => this.opTranslocate(u, dur, payload),
        takeControl: (u, dur, c) => this.opTakeControl(u, dur, c),
        grantImmunity: (u, node) => {
          u.immunities.push({ categories: node.against ?? [], charges: node.charges ?? null, remaining: node.duration ?? null })
        },
        damageMod: (u, scope, delta, rem) => { u.damageMods.push({ scope, delta, remaining: rem }) },
        targetability: (u, untargetable, rem) => { u.manualUntargetable.push({ untargetable, remaining: rem }) },
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
      },
    }
  }

  // ---------- P2b-2：界域 / 区域 / 记录 / 重排 / 规则槽 ----------

  private opSetLuminance(value: number | null, delta: number | null, duration: number | null, _dispelable: boolean): void {
    const base = value ?? this.battle.luminance + (delta ?? 0)
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
      grant: { duration: duration < 0 ? -1 : Math.max(1, duration), priority: this.domainSeq, sourceId: this.ids.next('domain') },
    })
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
    const taken: (readonly { instanceId: string; defId: string; remaining: number; currentStacks: number }[] | null)[] =
      units.map((u) => u.statuses.all().slice(0, count) as never)
    // 顺时针轮转：A 的状态给 B，B 给 C…（保序、确定性）
    units.forEach((u, i) => {
      const src = taken[i] as readonly { instanceId: string; defId: string; remaining: number; currentStacks: number }[] | null
      if (!src) return
      for (const inst of src) {
        u.statuses.mount(inst.defId, { duration: inst.remaining, stacks: inst.currentStacks, sourceId: this.ids.next('shuffle') })
      }
    })
  }

  private opModifySkill(unit: CombatUnit, node: EffectNode): void {
    const n = node as { costDelta?: { energy?: number; cooldown?: number }; cooldownDelta?: number; clearCooldown?: boolean }
    for (const slot of unit.behaviorSlots) {
      if (slot.kind !== 'skill') continue
      if (n.costDelta?.energy) slot.cost.energy = Math.max(0, slot.cost.energy + n.costDelta.energy)
      if (n.costDelta?.cooldown) slot.cost.cooldown = Math.max(0, slot.cost.cooldown + n.costDelta.cooldown)
      if (n.cooldownDelta) slot.cooldownRemaining = Math.max(0, slot.cooldownRemaining + n.cooldownDelta)
      if (n.clearCooldown) slot.cooldownRemaining = 0
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

  private opSpawn(caster: CombatUnit | null, node: { unitId?: string; def?: string; kind?: string; position?: string; hpRatio?: unknown; atkRatio?: unknown }, near: CombatUnit | null): void {
    const defId = node.unitId ?? node.def ?? node.kind
    const def = defId ? this.lookup.unitDef(defId) : undefined
    if (!def) {
      this.unsupported('spawn', `未知召唤物 ${String(defId)}`)
      return
    }
    const owner = caster
    if (!owner) return
    const base = typeof def.base === 'object' && def.base ? (def.base as { hp?: number; atk?: number }) : {}
    const hp = typeof base.hp === 'number' ? base.hp : 12
    const atk = typeof base.atk === 'number' ? base.atk : 3
    const id = this.ids.next('summon')
    const unit = new CombatUnit(
      id,
      owner.faction,
      { strength: Math.max(0, Math.round((hp - 30) / 10)), agility: 0, intelligence: 0, rank: 0 },
      owner.gender,
      { statusDefs: { statusDef: (sid) => this.lookup.statusDef(sid) }, nextStatusId: () => this.ids.next('status') },
      def.tags ?? [],
    )
    this.units.add(unit)
    unit.behaviorSlots.push(this.basicAttackSlot(unit))
    const nearPos = near?.position ?? owner.position
    const placed = this.placeAtFree(unit.id, owner.faction, nearPos?.lane ?? 'lane0')
    if (!placed) {
      this.units.remove(unit.id)
      this.warn(`召唤失败：无可落位（${defId}）`)
      return
    }
    this.emit({ type: 'UnitSpawned', unitId: unit.id })
    this.fireStatusTriggers(owner, 'on_spawn')
    void atk
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

  private mountStatus(host: CombatUnit, statusId: string, grant: Omit<StatusGrant, 'sourceId'>): void {
    if (!statusId) return
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
    const inst = host.statuses.mount(statusId, { ...grant, sourceId: this.ids.next('status') })
    if (!inst) return
    this.emit({ type: 'StatusMounted', instanceId: inst.instanceId, defId: statusId })
    this.fireTriggers(host, 'on_apply', def?.triggers, host)
    this.fireStatusTriggers(host, 'on_status_gain')
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
    for (const u of this.units.all()) {
      tickRecords(u.damageMods)
      tickRecords(u.manualUntargetable)
      tickImmunities(u)
    }
  }

  private fireStatusTriggers(unit: CombatUnit, event: string, onlyDefId?: string): void {
    for (const inst of unit.statuses.all()) {
      if (onlyDefId && inst.defId !== onlyDefId) continue
      this.fireTriggers(unit, event, this.lookup.statusDef(inst.defId)?.triggers, unit)
    }
  }

  private fireTriggers(unit: CombatUnit, event: string, triggers: readonly TriggerDef[] | undefined, caster: CombatUnit | null): void {
    for (const t of triggers ?? []) {
      if (t.event !== event) continue
      const ctx = this.makeContext(this.ids.next('trig'), caster)
      executeNodes(t.effects ?? [], [unit], ctx)
    }
  }

  // ---------- 收尾 ----------

  private checkDeaths(): void {
    for (const u of this.units.all()) {
      if (!u.isDead || this.dead.has(u.id)) continue
      this.dead.add(u.id)
      this.emit({ type: 'UnitDied', unitId: u.id })
      this.stats.unitsLost[u.faction] = (this.stats.unitsLost[u.faction] ?? 0) + 1
      this.fireStatusTriggers(u, 'on_death')
      const killerId = this.lastAttacker.get(u.id)
      const killer = killerId ? this.units.get(killerId) : undefined
      if (killer && !killer.isDead) this.fireStatusTriggers(killer, 'on_kill')
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
      statuses: u.statuses.all().map((s) => ({ defId: s.defId, stacks: s.currentStacks })),
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

  diagnostic(): { warnings: readonly string[]; unsupported: number } {
    return { warnings: this.warnings, unsupported: this.unsupportedCount }
  }

  private emit(event: DomainEvent): void {
    this.events.emit(event)
  }

  private warn(msg: string): void {
    this.warnings.push(msg)
  }

  private unsupported(kind: string, detail?: string): void {
    this.unsupportedCount += 1
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
