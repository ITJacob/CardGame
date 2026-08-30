/**
 * Catalog：定义态数据的不可变快照（§9 / INV-C1 / INV-C3）。
 *
 * Catalog 是独立聚合：定义态数据不可变、无事务需求、可全局缓存与共享。
 * 战斗启动时把它快照进战斗实例，之后配置变更不影响进行中的战斗——
 * 这与 B1 的确定性铁律是同一件事的两面。
 *
 * 编译期一次性完成四件事：
 *   1. 引用完整性校验（INV-C1）
 *   2. 术语展开（INV-T1）
 *   3. 环路与白名单校验（INV-T2 / INV-T3）
 *   4. 目标规格自洽校验（INV-E6）
 */

import type { DefId } from '../shared/ids.js';
import { ok, err, type Result, collectResults, mapResult, invariant } from '../shared/result.js';
import type { TargetSpec } from '../shared/target-spec.js';
import { validateTargetSpec, resolveAutoLaneRef } from '../shared/target-spec.js';
import type {
  BehaviorSlotSpec,
  BehaviorTemplate,
  ClassDef,
  EffectDef,
  EffectRef,
  SkillDef,
  StatusDef,
  TermDef,
  TermNode,
  UnitDef,
  ZoneDef,
} from './model.js';
import {
  DEFAULT_FORMULAS,
  type FormulaConfig,
} from './balance.js';
import { expandTermNodes, type TermLookup } from './term-expander.js';

export interface RawCatalog {
  readonly effects: readonly EffectDef[];
  readonly terms: readonly TermDef[];
  readonly behaviorTemplates: readonly BehaviorTemplate[];
  readonly skills: readonly SkillDef[];
  readonly statuses: readonly StatusDef[];
  readonly zones: readonly ZoneDef[];
  readonly classes: readonly ClassDef[];
  readonly units: readonly UnitDef[];
  /** 全局默认套件：未声明 kit 的职业自动继承它（§5.6）。 */
  readonly defaultKit?: readonly BehaviorSlotSpec[];
  readonly formulas?: Partial<FormulaConfig>;
}

/** 展开后的行为定义。运行期只见 EffectRef，引擎零感知术语（INV-T1）。 */
export interface CompiledBehavior extends Omit<BehaviorTemplate, 'effects'> {
  readonly effects: readonly EffectRef[];
}

export interface CompiledTrigger {
  readonly event: StatusDef['triggers'][number]['event'];
  readonly effects: readonly EffectRef[];
  readonly sourceFilter?: StatusDef['triggers'][number]['sourceFilter'];
  readonly condition?: StatusDef['triggers'][number]['condition'];
}

export interface CompiledStatus extends Omit<StatusDef, 'triggers' | 'payload'> {
  readonly triggers: readonly CompiledTrigger[];
  readonly payload: readonly EffectRef[];
}

export type CompiledZone = Omit<ZoneDef, 'defaultGrant'> & {
  readonly defaultGrant: Omit<ZoneDef['defaultGrant'], 'effects'> & { readonly effects: readonly EffectRef[] };
};

export interface CompiledSkill extends Omit<SkillDef, 'effects'> {
  readonly effects: readonly EffectRef[] | null;
}

function indexById<T extends { readonly id: DefId }>(
  items: readonly T[],
  kind: string,
): Result<Map<DefId, T>> {
  const m = new Map<DefId, T>();
  for (const item of items) {
    if (m.has(item.id)) {
      return err('CATALOG_UNRESOLVED_REF', `编目中 ${kind} 存在重复 id：${item.id}`);
    }
    m.set(item.id, item);
  }
  return ok(m);
}

export class Catalog {
  private constructor(
    private readonly effectMap: ReadonlyMap<DefId, EffectDef>,
    private readonly termMap: ReadonlyMap<DefId, TermDef>,
    private readonly behaviorMap: ReadonlyMap<DefId, CompiledBehavior>,
    private readonly skillMap: ReadonlyMap<DefId, CompiledSkill>,
    private readonly statusMap: ReadonlyMap<DefId, CompiledStatus>,
    private readonly zoneMap: ReadonlyMap<DefId, CompiledZone>,
    private readonly classMap: ReadonlyMap<DefId, ClassDef>,
    private readonly unitMap: ReadonlyMap<DefId, UnitDef>,
    private readonly kit: readonly BehaviorSlotSpec[],
    readonly formulas: FormulaConfig,
  ) {}

  // ——— 读取 ———

  effect(id: DefId): EffectDef | undefined {
    return this.effectMap.get(id);
  }

  term(id: DefId): TermDef | undefined {
    return this.termMap.get(id);
  }

  behavior(id: DefId): CompiledBehavior | undefined {
    return this.behaviorMap.get(id);
  }

  skill(id: DefId): CompiledSkill | undefined {
    return this.skillMap.get(id);
  }

  status(id: DefId): CompiledStatus | undefined {
    return this.statusMap.get(id);
  }

  zone(id: DefId): CompiledZone | undefined {
    return this.zoneMap.get(id);
  }

  classDef(id: DefId): ClassDef | undefined {
    return this.classMap.get(id);
  }

  unit(id: DefId): UnitDef | undefined {
    return this.unitMap.get(id);
  }

  requireEffect(id: DefId): EffectDef {
    const d = this.effectMap.get(id);
    invariant(d !== undefined, 'CATALOG_UNRESOLVED_REF', `效果 ${id} 不存在`);
    return d;
  }

  requireStatus(id: DefId): CompiledStatus {
    const d = this.statusMap.get(id);
    invariant(d !== undefined, 'CATALOG_UNRESOLVED_REF', `状态 ${id} 不存在`);
    return d;
  }

  requireBehavior(id: DefId): CompiledBehavior {
    const d = this.behaviorMap.get(id);
    invariant(d !== undefined, 'CATALOG_UNRESOLVED_REF', `行为模板 ${id} 不存在`);
    return d;
  }

  requireZone(id: DefId): CompiledZone {
    const d = this.zoneMap.get(id);
    invariant(d !== undefined, 'CATALOG_UNRESOLVED_REF', `区域 ${id} 不存在`);
    return d;
  }

  /**
   * 把定义态节点展开为扁平 EffectRef。
   *
   * 正常的入口是 compile()（它在编译期一次性展开好）；这里留给运行期实例化的
   * 场景——行为槽位由模板 + 覆写拼装，覆写里可能带新的术语引用。
   * 编译期已做过环路与白名单校验，所以此处失败即为实现缺陷，直接抛。
   */
  expand(nodes: readonly TermNode[], origin: string): readonly EffectRef[] {
    const r = expandTermNodes(nodes, { get: (id) => this.termMap.get(id) }, origin);
    invariant(r.ok, 'CATALOG_TERM_CYCLE', `${origin}: 术语展开失败 —— ${r.ok ? '' : r.error.message}`);
    return r.ok ? r.value : [];
  }

  // ——— 套件解析（§5.6）———

  /** 未声明 kit 的职业自动继承全局默认套件。 */
  resolveKit(classId: DefId | null | undefined): readonly BehaviorSlotSpec[] {
    if (classId === null || classId === undefined) return this.kit;
    const cls = this.classMap.get(classId);
    const base = cls?.defaultKit ?? this.kit;
    if (!cls?.kitOps || cls.kitOps.length === 0) return base;

    let slots: BehaviorSlotSpec[] = [...base];
    for (const op of cls.kitOps) {
      switch (op.op) {
        case 'add':
          slots.push(op.slot);
          break;
        case 'remove':
          slots = slots.filter((s) => this.templateKeyOf(s) !== op.key);
          break;
        case 'modify': {
          const target = slots.find((s) => this.templateKeyOf(s) === op.key);
          if (target) {
            slots = slots.map((s) =>
              s === target ? { ...s, overrides: { ...(s.overrides ?? {}), ...op.patch } } : s,
            );
          }
          break;
        }
      }
    }
    return slots;
  }

  private templateKeyOf(spec: BehaviorSlotSpec): string {
    return this.behaviorMap.get(spec.templateId)?.key ?? spec.templateId;
  }

  // ——— 编译 ———

  /** 编译 + 全量校验。任一处不合法即拒绝启动（INV-C1）。 */
  static compile(raw: RawCatalog): Result<Catalog> {
    const termsRes = indexById(raw.terms, '术语');
    if (!termsRes.ok) return termsRes;
    const terms = termsRes.value;

    const lookup: TermLookup = {
      get: (id: DefId) => terms.get(id),
    };

    // 1) 展开所有定义里的术语（INV-T1 / T2 / T3）。
    const expand = (nodes: readonly TermNode[], origin: string): Result<readonly EffectRef[]> =>
      expandTermNodes(nodes, lookup, origin);

    const behaviorResults = raw.behaviorTemplates.map((t) =>
      mapResult(expand(t.effects, `behavior:${t.id}`), (effects) => ({ ...t, effects })),
    );
    const behaviorList = collectResults(behaviorResults);
    if (!behaviorList.ok) return behaviorList;

    const behaviorMap = collectResults(
      behaviorList.value.map((b, i) => {
        const dup = behaviorList.value.findIndex((x) => x.id === b.id) !== i;
        if (dup) return err<CompiledBehavior>('CATALOG_UNRESOLVED_REF', `行为模板 id 重复：${b.id}`);
        return ok(b);
      }),
    );
    if (!behaviorMap.ok) return behaviorMap;

    const statusResults = raw.statuses.map((s) => {
      const payloadRes = expand(s.payload ?? [], `status:${s.id}.payload`);
      if (!payloadRes.ok) return payloadRes;
      const triggers = s.triggers.map((t, i) =>
        mapResult(expand(t.effects, `status:${s.id}.triggers[${i}]`), (effects) => ({
          event: t.event,
          effects,
          ...(t.sourceFilter !== undefined ? { sourceFilter: t.sourceFilter } : {}),
          ...(t.condition !== undefined ? { condition: t.condition } : {}),
        })),
      );
      return mapResult(collectResults(triggers), (trs) => ({
        ...s,
        triggers: trs,
        payload: payloadRes.value,
      }));
    });
    const statusList = collectResults(statusResults);
    if (!statusList.ok) return statusList;

    const zoneResults = raw.zones.map((z) =>
      mapResult(expand(z.defaultGrant.effects, `zone:${z.id}.grant`), (effects) => ({
        ...z,
        defaultGrant: { ...z.defaultGrant, effects },
      })),
    );
    const zoneList = collectResults(zoneResults);
    if (!zoneList.ok) return zoneList;

    const skillResults = raw.skills.map((s) =>
      s.effects
        ? mapResult(expand(s.effects, `skill:${s.id}`), (effects) => ({ ...s, effects }))
        : ok<CompiledSkill>({ ...s, effects: null }),
    );
    const skillList = collectResults(skillResults);
    if (!skillList.ok) return skillList;

    // 2) 建索引。
    const effectMap = indexById(raw.effects, '效果');
    if (!effectMap.ok) return effectMap;
    const statusMap = indexById(statusList.value, '状态');
    if (!statusMap.ok) return statusMap;
    const zoneMap = indexById(zoneList.value, '区域');
    if (!zoneMap.ok) return zoneMap;
    const skillMap = indexById(skillList.value, '技能');
    if (!skillMap.ok) return skillMap;
    const classMap = indexById(raw.classes, '职业');
    if (!classMap.ok) return classMap;
    const unitMap = indexById(raw.units, '单位蓝本');
    if (!unitMap.ok) return unitMap;
    const behaviorIndex = indexById(behaviorMap.value, '行为模板');
    if (!behaviorIndex.ok) return behaviorIndex;

    const catalog = new Catalog(
      effectMap.value,
      terms,
      behaviorIndex.value,
      skillMap.value,
      statusMap.value,
      zoneMap.value,
      classMap.value,
      unitMap.value,
      raw.defaultKit ?? [],
      { ...DEFAULT_FORMULAS, ...(raw.formulas ?? {}) },
    );

    // 3) 全量校验。
    return catalog.validate(raw);
  }

  private validate(raw: RawCatalog): Result<Catalog> {
    const problems: string[] = [];

    // INV-C1：所有 EffectRef 必须可解析。
    for (const b of this.behaviorMap.values()) {
      for (const [i, e] of b.effects.entries()) {
        if (!this.effectMap.has(e.ref)) problems.push(`behavior:${b.id}.effects[${i}] → 效果 ${e.ref} 不存在`);
      }
      const ts = this.validateTarget(b.targetSpec, `behavior:${b.id}.targetSpec`);
      if (ts) problems.push(ts);
      if (b.trigger === 'passive' && !b.passiveHook) {
        problems.push(`behavior:${b.id}: passive 行为必须声明 passiveHook`);
      }
    }
    for (const s of this.statusMap.values()) {
      for (const [i, e] of s.payload.entries()) {
        if (!this.effectMap.has(e.ref)) problems.push(`status:${s.id}.payload[${i}] → 效果 ${e.ref} 不存在`);
      }
      for (const [ti, t] of s.triggers.entries()) {
        for (const [i, e] of t.effects.entries()) {
          if (!this.effectMap.has(e.ref)) {
            problems.push(`status:${s.id}.triggers[${ti}].effects[${i}] → 效果 ${e.ref} 不存在`);
          }
        }
      }
      if (!Number.isFinite(s.defaultDuration) || s.defaultDuration < 0) {
        problems.push(`status:${s.id}: defaultDuration 缺失或非法（INV-C2 要求单点定义）`);
      }
      if (s.maxStacks < 1) problems.push(`status:${s.id}: maxStacks 必须 >= 1`);
      if (s.redirect && s.redirect.priority === undefined) {
        problems.push(`status:${s.id}: redirect 必须声明 priority`);
      }
    }
    for (const z of this.zoneMap.values()) {
      for (const [i, e] of z.defaultGrant.effects.entries()) {
        if (!this.effectMap.has(e.ref)) problems.push(`zone:${z.id}.grant.effects[${i}] → 效果 ${e.ref} 不存在`);
      }
    }
    // A19：逃生舱——templateRef 为空时必须自带完整行为定义。
    for (const s of this.skillMap.values()) {
      if (s.effects) {
        for (const [i, e] of s.effects.entries()) {
          if (!this.effectMap.has(e.ref)) problems.push(`skill:${s.id}.effects[${i}] → 效果 ${e.ref} 不存在`);
        }
      }
      if (s.templateRef) {
        if (!this.behaviorMap.has(s.templateRef)) {
          problems.push(`skill:${s.id}: templateRef ${s.templateRef} 不存在`);
        }
      } else if (!s.effects || s.effects.length === 0) {
        problems.push(`skill:${s.id}: templateRef 为空时（逃生舱）必须自带完整 effects`);
      }
      if (s.init?.targetSpec) {
        const ts = this.validateTarget(s.init.targetSpec, `skill:${s.id}.init.targetSpec`);
        if (ts) problems.push(ts);
      }
    }
    for (const c of raw.classes) {
      for (const [i, op] of (c.kitOps ?? []).entries()) {
        if (op.op === 'add' && !this.behaviorMap.has(op.slot.templateId)) {
          problems.push(`class:${c.id}.kitOps[${i}].add → 行为模板 ${op.slot.templateId} 不存在`);
        }
      }
      for (const [i, sid] of (c.knownSkills ?? []).entries()) {
        if (!this.skillMap.has(sid)) problems.push(`class:${c.id}.knownSkills[${i}] → 技能 ${sid} 不存在`);
      }
    }
    for (const u of raw.units) {
      if (u.classId && !this.classMap.has(u.classId)) {
        problems.push(`unit:${u.id}: classId ${u.classId} 不存在`);
      }
      for (const [i, sid] of (u.skills ?? []).entries()) {
        if (!this.skillMap.has(sid)) problems.push(`unit:${u.id}.skills[${i}] → 技能 ${sid} 不存在`);
      }
    }
    for (const [i, spec] of (raw.defaultKit ?? []).entries()) {
      if (!this.behaviorMap.has(spec.templateId)) {
        problems.push(`defaultKit[${i}] → 行为模板 ${spec.templateId} 不存在`);
      }
    }

    if (problems.length > 0) {
      return err('CATALOG_UNRESOLVED_REF', `编目校验失败（${problems.length} 项）`, { problems });
    }
    return ok(this);
  }

  private validateTarget(spec: TargetSpec | null | undefined, where: string): string | null {
    if (!spec) return null;
    // A13：auto 不应出现在编目里——它必须在 I 节点之前已被预处理为具体值。
    // 这里不报错（允许配置里写 auto），但明确它的归属：由施法者上下文预处理。
    const concrete = resolveAutoLaneRef(spec, 'same_lane');
    const r = validateTargetSpec(concrete, where);
    return r.ok ? null : r.error.message;
  }
}
