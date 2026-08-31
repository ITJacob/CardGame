/**
 * 编目期不变量断言（C / T / EL / D1 / D5 / E6）。
 *
 * 这些不变量在 `Catalog.compile()` 时就应该成立；断言器独立再跑一遍，
 * 是为了让"编译器的盲区"能被验证脚本扫出来——编译器只报第一个错，
 * 断言器会一次性列出全部违规。
 */

import { ELEMENTS, ELEMENT_TO_DAMAGE_CATEGORY, damageCategoryOf } from '../shared/enums.js';
import type { Element } from '../shared/enums.js';
import { validateTargetSpec } from '../shared/target-spec.js';
import { DEFAULT_DAMAGE_CHAIN } from '../effect/damage-chain.js';
import { isComposition, isTermRef } from '../catalog/model.js';
import type { EffectRef, StatusDef, TermNode } from '../catalog/model.js';
import { expandTermNodes } from '../catalog/term-expander.js';
import type { Catalog } from '../catalog/catalog.js';
import type { InvariantViolationReport } from './types.js';

/** canonical 的 element → damageCategory 映射（INV-EL3：直接复用 enums 的权威定义，避免双份来源）。 */
const EXPECTED_CATEGORY = ELEMENT_TO_DAMAGE_CATEGORY;

/** canonical 的伤害链阶段顺序（INV-D1：顺序固定且配置可见）。 */
const EXPECTED_CHAIN_ORDER: readonly string[] = [
  'absorb:shield',
  'absorb:armor',
  'mitigation',
  'resistance',
  'multiplier',
  'floor',
];

export function checkCatalogInvariants(catalog: Catalog): readonly InvariantViolationReport[] {
  const out: InvariantViolationReport[] = [];
  const push = (v: InvariantViolationReport): void => void out.push(v);

  // ——— INV-EL3：映射表单点定义，派生结果必须与预期一致 ———
  for (const element of ELEMENTS) {
    if (damageCategoryOf(element) !== EXPECTED_CATEGORY[element]) {
      push({
        id: 'INV-EL3',
        subject: element,
        message: `damageCategory 派生错误：期望 ${EXPECTED_CATEGORY[element]}，实得 ${damageCategoryOf(element)}`,
      });
    }
  }

  // ——— INV-D1：阶段顺序固定 ———
  const actualOrder = DEFAULT_DAMAGE_CHAIN.map((s) =>
    s.kind === 'absorb' ? `absorb:${s.pool}` : s.kind,
  );
  if (JSON.stringify(actualOrder) !== JSON.stringify(EXPECTED_CHAIN_ORDER)) {
    push({
      id: 'INV-D1',
      message: `伤害链阶段顺序被改动：期望 ${EXPECTED_CHAIN_ORDER.join(' → ')}，实得 ${actualOrder.join(' → ')}`,
    });
  }

  // ——— 遍历所有编译后的效果清单 ———
  const scopes: { readonly where: string; readonly effects: readonly EffectRef[] }[] = [];
  for (const b of allBehaviors(catalog)) {
    scopes.push({ where: `behavior:${b.id}`, effects: b.effects });
    checkTargetSpec(b.targetSpec, `behavior:${b.id}.targetSpec`, push);
  }
  for (const s of allStatuses(catalog)) {
    scopes.push({ where: `status:${s.id}.payload`, effects: s.payload });
    for (const [i, t] of s.triggers.entries()) {
      scopes.push({ where: `status:${s.id}.triggers[${i}]`, effects: t.effects });
    }
    checkStatusDef(s, push);
  }
  for (const z of allZones(catalog)) {
    scopes.push({ where: `zone:${z.id}.grant`, effects: z.defaultGrant.effects });
    if (!Array.isArray(z.defaultGrant.effects)) {
      push({ id: 'INV-B8', subject: `zone:${z.id}`, message: 'Zone 载荷必须是 EffectRef 数组' });
    }
  }

  for (const scope of scopes) {
    checkEffectsResolved(scope.where, scope.effects, catalog, push);
    checkElementLayer(scope.where, scope.effects, catalog, push);
    checkHealResourceMix(scope.where, scope.effects, catalog, push);
  }

  // ——— INV-T2 / T3 / T4 ———
  checkTerms(catalog, push);

  return out;
}

// ————————————————————————————————————————————————

function allBehaviors(catalog: Catalog): NonNullable<ReturnType<Catalog['behavior']>>[] {
  return catalog
    .behaviorIds()
    .map((id) => catalog.behavior(id))
    .filter((b): b is NonNullable<typeof b> => b !== undefined);
}

function allStatuses(catalog: Catalog): NonNullable<ReturnType<Catalog['status']>>[] {
  return catalog
    .statusIds()
    .map((id) => catalog.status(id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);
}

function allZones(catalog: Catalog): NonNullable<ReturnType<Catalog['zone']>>[] {
  return catalog
    .zoneIds()
    .map((id) => catalog.zone(id))
    .filter((z): z is NonNullable<typeof z> => z !== undefined);
}

type Push = (v: InvariantViolationReport) => void;

/** INV-C1 / INV-T1：全部 ref 可解析，且不含未展开的 TermRef / 内联算子节点。 */
function checkEffectsResolved(
  where: string,
  effects: readonly EffectRef[],
  catalog: Catalog,
  push: Push,
): void {
  for (const [i, e] of effects.entries()) {
    if (catalog.effect(e.ref) === undefined) {
      push({ id: 'INV-C1', subject: `${where}[${i}]`, message: `效果 ${e.ref} 不可解析` });
    }
    // INV-T1 / INV-C4：运行期不应再出现 TermRef 或内联 composition 节点。
    if (isTermRef(e as TermNode) || isComposition(e as TermNode)) {
      push({ id: 'INV-T1', subject: `${where}[${i}]`, message: '存在未展开的术语节点（应在编目期展开）' });
    }
  }
}

/** INV-EL2：元素挂在 effect 层（EffectDef 上），且取值合法。 */
function checkElementLayer(
  where: string,
  effects: readonly EffectRef[],
  _catalog: Catalog,
  push: Push,
): void {
  for (const [i, e] of effects.entries()) {
    const raw = e.params?.['element'];
    if (raw === undefined) continue;
    if (typeof raw !== 'string' || !ELEMENTS.includes(raw as Element)) {
      push({
        id: 'INV-EL2',
        subject: `${where}[${i}]`,
        message: `元素取值非法：${String(raw)}`,
      });
    }
  }
}

/**
 * INV-D5：heal 与 modify_resource 不得混用。
 * 同一份效果清单里，若对同一个池既用 heal 又用会使其增加的 modify_resource，
 * 就是"同一次资源增加走了两条路径"。
 */
function checkHealResourceMix(
  where: string,
  effects: readonly EffectRef[],
  catalog: Catalog,
  push: Push,
): void {
  const healPools = new Set<string>();
  const boostPools = new Set<string>();

  for (const e of effects) {
    const def = catalog.effect(e.ref);
    if (!def) continue;
    if (def.type === 'heal') {
      const pool = typeof e.params?.['pool'] === 'string' ? (e.params['pool'] as string) : 'hp';
      healPools.add(pool);
    }
    if (def.type === 'modify_resource') {
      const resource = typeof e.params?.['resource'] === 'string' ? (e.params['resource'] as string) : '';
      const mode = typeof e.params?.['mode'] === 'string' ? (e.params['mode'] as string) : 'delta';
      const value = typeof e.params?.['value'] === 'number' ? (e.params['value'] as number) : 0;
      const increases = mode === 'set' ? true : value > 0;
      if (resource && increases) boostPools.add(resource);
    }
  }

  for (const pool of healPools) {
    if (boostPools.has(pool)) {
      push({
        id: 'INV-D5',
        subject: where,
        message: `资源 ${pool} 同时被 heal 与 modify_resource 增加（A22 禁止混用）`,
      });
    }
  }
}

/** INV-E6：Manual 目标规格必须定义 fallbackSort；mode 与 consumption 自洽。 */
function checkTargetSpec(
  spec: { readonly mode?: string; readonly consumption?: string; readonly selectionMode?: string; readonly fallbackSort?: string } | null | undefined,
  where: string,
  push: Push,
): void {
  if (!spec) return;
  const r = validateTargetSpec(spec as never, where);
  if (!r.ok) push({ id: 'INV-E6', subject: where, message: r.error.message });
  if (spec.selectionMode === 'manual' && spec.fallbackSort === undefined) {
    push({ id: 'INV-E6', subject: where, message: 'Manual 目标规格缺少 fallbackSort（违反确定性兜底）' });
  }
}

/** INV-C2：StatusDef 必须自带 defaultDuration，否则 Grant 就没有默认值可依。 */
function checkStatusDef(def: StatusDef, push: Push): void {
  if (!Number.isFinite(def.defaultDuration) || def.defaultDuration < 0) {
    push({
      id: 'INV-C2',
      subject: `status:${def.id}`,
      message: 'defaultDuration 缺失或非法——默认时长必须单点定义于 Def',
    });
  }
  if (def.maxStacks < 1) {
    push({ id: 'INV-C2', subject: `status:${def.id}`, message: 'maxStacks 必须 >= 1' });
  }
}

/** INV-T2 / T3 / T4：术语引用图无环、覆写在白名单内、文案占位符可渲染。 */
function checkTerms(catalog: Catalog, push: Push): void {
  for (const termId of catalog.termIds()) {
    const def = catalog.term(termId);
    if (!def) continue;
    const r = expandTermNodes([{ termRef: termId }], { get: (id) => catalog.term(id) }, `term:${termId}`);
    if (!r.ok) {
      const id = r.error.code === 'CATALOG_TERM_CYCLE' ? 'INV-T2' : 'INV-C1';
      push({ id, subject: `term:${termId}`, message: r.error.message });
      continue;
    }
    // INV-T3：把 def.overridable 之外的值塞进 overrides 必须被拒。
    const probe = expandTermNodes(
      [{ termRef: termId, overrides: { __forbidden_probe__: 1 } }],
      { get: (id) => catalog.term(id) },
      `term:${termId}`,
    );
    if (probe.ok) {
      push({
        id: 'INV-T3',
        subject: `term:${termId}`,
        message: '白名单外的覆写未被拒绝',
      });
    }

    // INV-T4：描述里的占位符必须是可渲染的参数（overridable 或 composition 已知键）。
    const placeholders = [...(def.description ?? '').matchAll(/\{(\w+)\}/g)].map((m) => m[1] as string);
    for (const ph of placeholders) {
      const known = def.overridable.includes(ph) || ph === 'count' || ph === 'threshold' || ph === 'ratio';
      if (!known) {
        push({
          id: 'INV-T4',
          subject: `term:${termId}`,
          message: `文案占位符 {${ph}} 无法由实参渲染（不在 overridable 白名单）`,
        });
      }
    }
  }
}


