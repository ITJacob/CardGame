/**
 * 状态三件套的运行时实例与容器（A7 / §5.5）。
 *
 * StatusSet 只负责"挂载 / 叠加 / 销毁 / 到期"的数据面，
 * 不负责触发副作用——on_apply / on_remove 的触发由效果层编排，
 * 这样状态模块不必反向依赖执行上下文。
 */

import type { DefId, InstanceId, UnitId } from '../shared/ids.js';
import type { StatusCategory } from '../shared/enums.js';
import type { CompiledStatus } from '../catalog/catalog.js';
import type { StatusGrant } from '../catalog/model.js';
import type { IdGenerator } from '../shared/ids.js';

export interface StatusBinding {
  readonly guardTarget?: UnitId;
  readonly transferTarget?: UnitId;
}

export interface StatusInstance {
  readonly instanceId: InstanceId;
  readonly defId: DefId;
  /** Grant 是值对象，创建后不可变；Instance 持有它的副本（§2.2 铁律 2）。 */
  readonly grant: StatusGrant;
  remaining: number;
  currentStacks: number;
  readonly binding?: StatusBinding;
  /** 由效果层在挂载时写入的分类缓存（只读），供 INV-P5 的"分类驱动"清除使用。 */
  readonly category?: StatusCategory;
}

export type MountOutcome = 'mounted' | 'refreshed' | 'rejected';

export interface MountResult {
  readonly outcome: MountOutcome;
  readonly instance: StatusInstance;
}

export class StatusSet {
  private list: StatusInstance[] = [];

  /**
   * 挂载（含叠加）。
   *   remaining ← clamp(grant.duration ?? def.defaultDuration, 0, ∞)
   *   stacks    ← clamp(grant.stacks ?? 1, 1, def.maxStacks)
   */
  mount(def: CompiledStatus, grant: StatusGrant, ids: IdGenerator): MountResult {
    const existing = this.ofDef(def.id);
    const requestedStacks = Math.max(1, Math.floor(grant.stacks ?? 1));

    if (existing !== null) {
      if (def.stackPolicy === 'reject') {
        return { outcome: 'rejected', instance: existing };
      }
      if (existing.currentStacks < def.maxStacks) {
        existing.currentStacks = Math.min(def.maxStacks, existing.currentStacks + requestedStacks);
      }
      // stackPolicy = refresh：时长取较大值。
      const duration = grant.duration ?? def.defaultDuration;
      existing.remaining = Math.max(existing.remaining, Math.max(0, duration));
      return { outcome: 'refreshed', instance: existing };
    }

    const instance: StatusInstance = {
      instanceId: ids.next('status'),
      defId: def.id,
      grant: { ...grant },
      remaining: Math.max(0, grant.duration ?? def.defaultDuration),
      currentStacks: Math.min(def.maxStacks, requestedStacks),
      ...(grant.binding ? { binding: { ...grant.binding } } : {}),
      category: def.category,
    };
    this.list.push(instance);
    return { outcome: 'mounted', instance };
  }

  /** 销毁（调用方负责按顺序完成：触发 on_remove → revertBySource → 移除）。 */
  unmount(instanceId: InstanceId): StatusInstance | null {
    const i = this.list.findIndex((s) => s.instanceId === instanceId);
    if (i < 0) return null;
    return this.list.splice(i, 1)[0] ?? null;
  }

  removeByInstanceIds(ids: readonly InstanceId[]): readonly StatusInstance[] {
    const set = new Set(ids);
    const removed = this.list.filter((s) => set.has(s.instanceId));
    this.list = this.list.filter((s) => !set.has(s.instanceId));
    return removed;
  }

  /** INV-P5：硬控（stun）命中时清除目标身上全部 category == stance 的状态。 */
  removeByCategory(category: StatusCategory): readonly StatusInstance[] {
    const removed = this.list.filter((s) => s.category === category);
    if (removed.length === 0) return [];
    const ids = new Set(removed.map((s) => s.instanceId));
    this.list = this.list.filter((s) => !ids.has(s.instanceId));
    return removed;
  }

  get(instanceId: InstanceId): StatusInstance | null {
    return this.list.find((s) => s.instanceId === instanceId) ?? null;
  }

  ofDef(defId: DefId): StatusInstance | null {
    return this.list.find((s) => s.defId === defId) ?? null;
  }

  has(defId: DefId): boolean {
    return this.list.some((s) => s.defId === defId);
  }

  all(): readonly StatusInstance[] {
    return this.list;
  }

  /** tick 第 6 步：递减剩余时长，返回到期者（由调用方执行 unmount 的副作用）。 */
  tick(): readonly StatusInstance[] {
    const expired: StatusInstance[] = [];
    for (const s of this.list) {
      s.remaining -= 1;
      if (s.remaining <= 0) expired.push(s);
    }
    return expired;
  }

  /** 按 (挂载顺序) 稳定遍历，保证确定性。 */
  snapshot(): readonly StatusInstance[] {
    return this.list.map((s) => ({ ...s }));
  }
}
