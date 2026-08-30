/**
 * Unit：编队上下文的核心实体（§5.1 / §5.8）。
 *
 * 注意：Unit 不是聚合根。整场战斗是一个聚合，根是 Combat（§1）——
 * 因为队列坍缩、先手序列、转向防环这些不变量全都横跨多个单位。
 */

import type { ActionId, DefId, FactionId, InstanceId, UnitId } from '../shared/ids.js';
import type { Element, PoolKey, TriggerEvent, UnitState } from '../shared/enums.js';
import type { Coordinate } from '../battle/coordinate.js';
import type { Catalog, CompiledStatus } from '../catalog/catalog.js';
import type { UnitDef } from '../catalog/model.js';
import { deriveBaseProfile, type BaseProfile, type FormulaConfig } from '../catalog/balance.js';
import type { IdGenerator } from '../shared/ids.js';
import type { ConditionSubject } from '../shared/effect-condition.js';
import { ModifierLayer, StatBlock, zeroResistances, type ResistanceMap } from './attributes.js';
import { Gauge, Pool } from './resources.js';
import { StatProvenance } from './provenance.js';
import { StatusSet, type StatusInstance } from './status.js';
import type { BehaviorSlot } from './behavior-slot.js';
import { instantiateKit, instantiateSkills } from './behavior-slot.js';
import {
  aggregateBehaviorModifiers,
  NO_CONSTRAINTS,
  type BehaviorConstraints,
} from './behavior-constraints.js';

export interface Channel {
  readonly actionId: ActionId;
  readonly sourceInstanceId: InstanceId;
  /** 点火时已解析并冻结的目标快照。 */
  remaining: number;
  readonly interruptible: boolean;
}

export interface UnitInit {
  readonly id: UnitId;
  readonly faction: FactionId;
  readonly unitDef: UnitDef;
  readonly catalog: Catalog;
  readonly ids: IdGenerator;
}

export class Unit implements ConditionSubject {
  readonly attributes: UnitDef['attributes'];
  readonly baseProfile: BaseProfile;
  readonly stats: StatBlock;
  readonly provenance: StatProvenance;
  readonly statuses = new StatusSet();
  readonly gauge: Gauge;
  readonly pools: Map<PoolKey, Pool>;
  readonly behaviorSlots: readonly BehaviorSlot[];
  readonly skillSlots: readonly DefId[];
  readonly cooldowns = new Map<InstanceId, number>();

  /** 只读投影，由 Placement 单向写入（INV-B5）。 */
  position: Coordinate | null = null;
  state: UnitState = 'active';
  channel: Channel | null = null;

  private constraintCache: BehaviorConstraints | null = null;

  /** 只读编目快照（INV-C3）。编队需要它来解析状态本体的声明式约束与转向规则。 */
  private readonly catalog: Catalog;

  constructor(
    readonly id: UnitId,
    readonly faction: FactionId,
    readonly defId: DefId,
    init: UnitInit,
  ) {
    const { unitDef, catalog, ids } = init;
    this.catalog = catalog;
    const f: FormulaConfig = catalog.formulas;
    this.attributes = unitDef.attributes;
    this.baseProfile = deriveBaseProfile(unitDef.attributes, f);

    const modifiers = new ModifierLayer();
    this.stats = new StatBlock(this.baseProfile, modifiers, f);
    this.provenance = new StatProvenance(modifiers, (stat) => this.onStatChanged(stat));

    const p = this.stats.profile();
    this.gauge = new Gauge('action', 0, p.gaugeRate, p.gaugeThreshold, 'keep');
    this.pools = new Map<PoolKey, Pool>([
      ['hp', new Pool('hp', p.hpMax, 0, p.hpMax, 0)],
      ['energy', new Pool('energy', 0, 0, p.energyMax, p.energyRegen)],
      ['shield', new Pool('shield', 0, 0, Number.POSITIVE_INFINITY, 0)],
      ['armor', new Pool('armor', unitDef.initialArmor ?? 0, 0, Number.POSITIVE_INFINITY, 0)],
    ]);

    const cls = unitDef.classId ? catalog.classDef(unitDef.classId) : undefined;
    const known = [...(unitDef.skills ?? []), ...(cls?.knownSkills ?? [])];
    this.skillSlots = known;
    this.behaviorSlots = [
      ...instantiateKit(catalog.resolveKit(unitDef.classId), catalog, ids),
      ...instantiateSkills(known, catalog, ids),
    ];
  }

  static create(init: UnitInit): Unit {
    return new Unit(init.id, init.faction, init.unitDef.id, init);
  }

  // ——— 属性与资源 ———

  private onStatChanged(stat: string): void {
    this.stats.invalidate(stat as never);
    this.syncCaps();
  }

  /** 属性上限变化后同步池的 max，并把当前值钳回区间。 */
  syncCaps(): void {
    const p = this.stats.profile();
    this.pools.get('hp')?.setMax(p.hpMax);
    const energy = this.pools.get('energy');
    if (energy) {
      energy.setMax(p.energyMax);
      energy.regen = p.energyRegen;
    }
    // Gauge 的 rate / threshold 是源属性，可被 modify_stat 改（A24）——但周期是派生值，不可直改。
    this.gauge.rate = p.gaugeRate;
    this.gauge.threshold = p.gaugeThreshold;
  }

  pool(key: PoolKey): Pool {
    const p = this.pools.get(key);
    if (!p) throw new Error(`未知池型资源：${key}`);
    return p;
  }

  get hp(): number {
    return this.pool('hp').current;
  }

  get hpMax(): number {
    return this.stats.get('hp_max');
  }

  get energy(): number {
    return this.pool('energy').current;
  }

  get shield(): number {
    return this.pool('shield').current;
  }

  get armor(): number {
    return this.pool('armor').current;
  }

  get attack(): number {
    return this.stats.get('attack');
  }

  get defense(): number {
    return this.stats.get('defense');
  }

  resistanceOf(element: Element): number {
    return this.stats.resistanceOf(element);
  }

  resistances(): ResistanceMap {
    const out = zeroResistances() as Record<Element, number>;
    for (const e of ['fire', 'ice', 'poison', 'shock', 'mental', 'physical'] as const) {
      out[e] = this.resistanceOf(e);
    }
    return out;
  }

  get isAlive(): boolean {
    return this.state !== 'removed' && this.state !== 'dying' && this.hp > 0;
  }

  get isOnField(): boolean {
    return this.position !== null && this.state !== 'removed';
  }

  // ——— 状态 ———

  hasStatus(defId: DefId): boolean {
    return this.statuses.has(defId);
  }

  /** 声明式约束的聚合结果；状态变化后失效。 */
  get constraints(): BehaviorConstraints {
    if (this.constraintCache) return this.constraintCache;
    const inputs = this.statuses
      .all()
      .flatMap((s) => this.catalog.status(s.defId)?.behaviorModifiers ?? []);
    this.constraintCache = aggregateBehaviorModifiers(inputs);
    return this.constraintCache;
  }

  invalidateConstraints(): void {
    this.constraintCache = null;
  }

  /** 供 R 节点读取转向规则：遍历挂载状态里的 RedirectRule。 */
  redirectRules(): readonly { sourceId: InstanceId; rule: NonNullable<CompiledStatus['redirect']> }[] {
    const out: { sourceId: InstanceId; rule: NonNullable<CompiledStatus['redirect']> }[] = [];
    for (const s of this.statuses.all()) {
      const def = this.catalog.status(s.defId);
      if (def?.redirect) out.push({ sourceId: s.instanceId, rule: def.redirect });
    }
    return out;
  }

  statusDef(defId: DefId): CompiledStatus | undefined {
    return this.catalog.status(defId);
  }

  // ——— 冷却与引导 ———

  cooldownOf(slot: BehaviorSlot): number {
    return this.cooldowns.get(slot.instanceId) ?? 0;
  }

  startCooldown(slot: BehaviorSlot, mul: number): void {
    const cd = Math.max(0, Math.round(slot.cooldown * mul));
    if (cd > 0) this.cooldowns.set(slot.instanceId, cd);
  }

  tickCooldowns(): void {
    for (const [k, v] of [...this.cooldowns]) {
      const next = v - 1;
      if (next <= 0) this.cooldowns.delete(k);
      else this.cooldowns.set(k, next);
    }
  }

  // ——— 快照 ———

  snapshot(): UnitSnapshot {
    return {
      id: this.id,
      faction: this.faction,
      state: this.state,
      position: this.position,
      hp: this.hp,
      energy: this.energy,
      shield: this.shield,
      armor: this.armor,
      gauge: this.gauge.snapshot(),
      statuses: this.statuses.snapshot(),
    };
  }
}

export interface UnitSnapshot {
  readonly id: UnitId;
  readonly faction: FactionId;
  readonly state: UnitState;
  readonly position: Coordinate | null;
  readonly hp: number;
  readonly energy: number;
  readonly shield: number;
  readonly armor: number;
  readonly gauge: { current: number; rate: number; threshold: number };
  readonly statuses: readonly StatusInstance[];
}

export function passiveSlotsOf(unit: Unit, hook: TriggerEvent): readonly BehaviorSlot[] {
  return unit.behaviorSlots.filter((b) => b.trigger === 'passive' && b.passiveHook === hook);
}

export { NO_CONSTRAINTS };
