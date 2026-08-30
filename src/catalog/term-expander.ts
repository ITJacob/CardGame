/**
 * 术语编目期展开（A11 / §8.4）。
 *
 * 这是「编译期宏 + 溯源烙印」：
 *   BehaviorTemplate.effects : (EffectRef | TermRef)[]
 *        │ Catalog 编译 —— 战斗启动前，一次性完成
 *        ▼
 *   BehaviorTemplate.effects : EffectRef[]     // 扁平序列，每个带 originTerm
 *
 * 运行期引擎完全不知道"术语"的存在，只看到一串扁平 EffectRef（INV-T1）。
 * 因此术语不会变成第二条执行路径——那才是架构真正的风险。
 */

import type { DefId } from '../shared/ids.js';
import { ok, err, type Result, collectResults, mapResult } from '../shared/result.js';
import type { Params } from '../shared/json.js';
import type { EffectCondition } from '../shared/effect-condition.js';
import type { EffectRef, TermComposition, TermDef, TermNode, TermRef } from './model.js';
import { isComposition, isTermRef } from './model.js';

export interface TermLookup {
  get(id: DefId): TermDef | undefined;
}

/** Repeat 的重复次数覆写键。它是 composition 级参数，不是 EffectRef 参数。 */
export const REPEAT_COUNT_KEY = 'count';

interface ExpandContext {
  readonly terms: TermLookup;
  readonly visiting: Set<DefId>;
  /** 当前术语路径，形如 `wind_fury>ignite`。 */
  readonly path: string;
  /** 生效中的覆写包（已校验过白名单）。 */
  readonly overrides: Params;
}

/**
 * 把一串（可能含术语引用的）节点展开为扁平 EffectRef 序列。
 *
 * @param nodes   定义态节点
 * @param terms   术语索引
 * @param origin  顶层归属标识，用于错误定位（如 `behavior:fireball`）
 */
export function expandTermNodes(
  nodes: readonly TermNode[],
  terms: TermLookup,
  origin: string,
): Result<readonly EffectRef[]> {
  const ctx: ExpandContext = { terms, visiting: new Set(), path: '', overrides: {} };
  const results = nodes.map((n, i) => expandNode(n, ctx, `${origin}[${i}]`));
  return mapResult(collectResults(results), (groups) => groups.flat());
}

function expandNode(node: TermNode, ctx: ExpandContext, where: string): Result<readonly EffectRef[]> {
  if (isTermRef(node)) return expandTermRef(node, ctx, where);
  if (isComposition(node)) return expandComposition(node, ctx, `${where}.inline`);
  return ok([materializeEffect(node, ctx)]);
}

function materializeEffect(ref: EffectRef, ctx: ExpandContext): EffectRef {
  const { [REPEAT_COUNT_KEY]: _count, ...paramOverrides } = ctx.overrides;
  const mergedParams = mergeParams(ref.params, paramOverrides);
  const originTerm = ctx.path === '' ? ref.originTerm : joinPath(ctx.path, ref.originTerm);
  return {
    ...ref,
    ...(mergedParams !== undefined ? { params: mergedParams } : {}),
    ...(originTerm !== undefined ? { originTerm } : {}),
  };
}

function expandTermRef(ref: TermRef, ctx: ExpandContext, where: string): Result<readonly EffectRef[]> {
  const def = ctx.terms.get(ref.termRef);
  if (!def) {
    return err('CATALOG_UNRESOLVED_REF', `${where}: 术语 ${ref.termRef} 不存在`);
  }
  // INV-T2：术语引用图无环，Catalog 加载时静态校验。
  if (ctx.visiting.has(def.id)) {
    return err('CATALOG_TERM_CYCLE', `${where}: 术语 ${def.id} 存在循环引用（INV-T2）`);
  }
  // INV-T3：覆写项必须在本体 overridable 白名单内。
  const overrides = ref.overrides ?? {};
  for (const key of Object.keys(overrides)) {
    if (!def.overridable.includes(key)) {
      return err(
        'CATALOG_TERM_OVERRIDE_NOT_ALLOWED',
        `${where}: 术语 ${def.id} 不允许覆写参数 "${key}"（INV-T3）`,
        { allowed: def.overridable },
      );
    }
  }

  ctx.visiting.add(def.id);
  const next: ExpandContext = {
    terms: ctx.terms,
    visiting: ctx.visiting,
    path: joinPath(ctx.path, def.id),
    overrides: { ...ctx.overrides, ...overrides },
  };
  const out = expandComposition(def.composition, next, `${where}/${def.id}`);
  ctx.visiting.delete(def.id);
  return out;
}

function expandComposition(
  comp: TermComposition,
  ctx: ExpandContext,
  where: string,
): Result<readonly EffectRef[]> {
  switch (comp.kind) {
    case 'sequence': {
      const groups = comp.of.map((n, i) => expandNode(n, ctx, `${where}.seq[${i}]`));
      return mapResult(collectResults(groups), (g) => g.flat());
    }

    case 'repeat': {
      // INV-T5：多段共享同一冻结坐标——展开为同一组效果的 N 次重复即可，
      // 坐标冻结由 I 节点统一完成，段间不重新解析目标。
      const count = resolveCount(comp.count, ctx.overrides);
      if (count <= 0) return ok([]);
      const groups: Result<readonly EffectRef[]>[] = [];
      for (let i = 0; i < count; i += 1) {
        for (const [j, n] of comp.body.entries()) {
          groups.push(expandNode(n, ctx, `${where}.rep[${i}][${j}]`));
        }
      }
      return mapResult(collectResults(groups), (g) => g.flat());
    }

    case 'if': {
      // 编目期无法判定条件，于是把 If 编译成"带条件的效果"：
      // then 分支挂 and(existing, cond)，else 分支挂 and(existing, not(cond))。
      const thenGroups = comp.then.map((n, i) =>
        expandNode(n, ctx, `${where}.then[${i}]`),
      );
      const thenRes = mapResult(collectResults(thenGroups), (g) => g.flat());
      if (!thenRes.ok) return thenRes;
      const thenEffects = thenRes.value.map((e) => withExtraCondition(e, comp.cond));

      if (!comp.else || comp.else.length === 0) return ok(thenEffects);

      const elseGroups = comp.else.map((n, i) => expandNode(n, ctx, `${where}.else[${i}]`));
      const elseRes = mapResult(collectResults(elseGroups), (g) => g.flat());
      if (!elseRes.ok) return elseRes;
      const elseEffects = elseRes.value.map((e) => withExtraCondition(e, { kind: 'not', of: comp.cond }));

      return ok([...thenEffects, ...elseEffects]);
    }

    default:
      return ok([]);
  }
}

function resolveCount(base: number, overrides: Params): number {
  const v = overrides[REPEAT_COUNT_KEY];
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  return Math.max(0, Math.floor(base));
}

function withExtraCondition(ref: EffectRef, cond: EffectCondition): EffectRef {
  const existing = ref.condition;
  const combined: EffectCondition =
    existing === undefined ? cond : { kind: 'and', of: [existing, cond] };
  return { ...ref, condition: combined };
}

function mergeParams(base: Params | undefined, overrides: Params): Params | undefined {
  if (Object.keys(overrides).length === 0) return base;
  return { ...(base ?? {}), ...overrides };
}

function joinPath(parent: string, child: string | undefined): string {
  if (!child) return parent;
  return parent === '' ? child : `${parent}>${child}`;
}
