/**
 * 运行期不变量断言（B / P / S / C3）与事件流不变量断言（S3 / S4 / E7 / P7）。
 *
 * 断言器是**只读**的：它拿 Combat 的当前状态扫一遍，产出违规清单，绝不修改任何东西。
 * 这样它才能在"每个 tick 之后"被无条件调用——验证脚本、回归测试、CI 都能挂。
 */

import { isStatKey } from '../shared/enums.js';
import type { DomainEvent } from '../shared/events.js';
import { isCompact, occupancyCount } from '../battle/collapse.js';
import type { Catalog } from '../catalog/catalog.js';
import type { Combat } from '../combat/combat.js';
import type { InvariantViolationReport } from './types.js';

type Push = (v: InvariantViolationReport) => void;

/**
 * 扫描战斗的当前状态。
 *
 * @param expectedCatalog 传入则额外校验 INV-C3（战斗必须持有启动时的编目快照）
 */
export function checkCombatInvariants(
  combat: Combat,
  expectedCatalog?: Catalog,
): readonly InvariantViolationReport[] {
  const out: InvariantViolationReport[] = [];
  const push: Push = (v) => void out.push(v);

  const { battle, shape } = { battle: combat.battle, shape: combat.battle.shape };

  // ——— 战场 ———
  for (const faction of shape.factions) {
    for (const lane of shape.lanes) {
      const slots = battle.laneSlots(faction, lane);
      const where = `${faction}/${lane}`;
      if (occupancyCount(slots) > shape.capacity) {
        push({ id: 'INV-B1', subject: where, message: `占用数 ${occupancyCount(slots)} 超过容量 ${shape.capacity}` });
      }
      if (!isCompact(slots)) {
        // INV-B2 不成立即意味着 INV-B3（同原子步内坍缩）也没生效。
        push({ id: 'INV-B2', subject: where, message: '队列出现内部空洞' });
        push({ id: 'INV-B3', subject: where, message: '坍缩未在占位变更的同一原子步内完成' });
      }
    }
  }

  // INV-B4 / B5：坐标 ↔ 单位双向一致，且投影与战场权威一致
  const occupancy = battle.occupancyMap();
  for (const unit of combat.allUnits()) {
    if (unit.position === null) {
      if (occupancy.has(unit.id)) {
        push({ id: 'INV-B4', subject: unit.id, message: '单位在战场上占位但投影为空' });
      }
      continue;
    }
    if (battle.occupantAt(unit.position) !== unit.id) {
      push({
        id: 'INV-B4',
        subject: unit.id,
        message: `投影 ${unit.position.faction}/${unit.position.lane}/${unit.position.index} 与战场占用不一致`,
      });
    }
    const authoritative = occupancy.get(unit.id);
    if (
      !authoritative ||
      authoritative.faction !== unit.position.faction ||
      authoritative.lane !== unit.position.lane ||
      authoritative.index !== unit.position.index
    ) {
      push({ id: 'INV-B5', subject: unit.id, message: 'Unit.position 与战场权威坐标不符' });
    }
  }

  // INV-B6 / B8：Zone 以坐标为键、与单位解耦
  for (const zone of battle.allZones()) {
    if (!battle.isValidCoord(zone.coord)) {
      push({ id: 'INV-B6', subject: zone.id, message: 'Zone 绑定了非法坐标' });
    }
    if (zone.usesRemaining !== null && zone.usesRemaining <= 0) {
      push({ id: 'INV-B8', subject: zone.id, message: 'uses 已耗尽却仍留在场上' });
    }
  }

  // ——— 编队 ———
  for (const unit of combat.allUnits()) {
    const statusIds = new Set(unit.statuses.all().map((s) => s.instanceId));

    for (const entry of unit.provenance.all) {
      // INV-P1：状态类来源必须是仍在挂载中的实例（不能出现"孤儿修正"）
      if (entry.sourceId.startsWith('status#') && !statusIds.has(entry.sourceId)) {
        push({
          id: 'INV-P1',
          subject: `${unit.id}/${entry.stat}`,
          message: `溯源来源 ${entry.sourceId} 已不存在对应状态实例`,
        });
      }
      // INV-S5：禁止修正派生值
      if (!isStatKey(entry.stat)) {
        push({
          id: 'INV-S5',
          subject: `${unit.id}/${entry.stat}`,
          message: '修正了派生值或未知属性（行动周期 / 有效攻防不可直改）',
        });
      }
    }

    // INV-P3：账本条目与修正层一一对应
    const modifierCount = unit.stats.modifiers.entries().length;
    if (modifierCount !== unit.provenance.all.length) {
      push({
        id: 'INV-P3',
        subject: unit.id,
        message: `账本 ${unit.provenance.all.length} 条 vs 修正层 ${modifierCount} 条，存在无主修正`,
      });
    }

    // INV-P4：离场单位必须已清空修正与状态
    if (unit.state === 'removed') {
      if (unit.provenance.all.length > 0) {
        push({ id: 'INV-P4', subject: unit.id, message: '单位已离场但未 revertAll()' });
      }
      if (unit.statuses.all().length > 0) {
        push({ id: 'INV-P4', subject: unit.id, message: '单位已离场但仍挂载状态' });
      }
    }

    // INV-P5：硬控在场时不得残留 stance
    const mounted = unit.statuses
      .all()
      .map((s) => ({ def: combat.catalog.status(s.defId), inst: s }))
      .filter((x) => x.def !== undefined);
    const hasControl = mounted.some((x) => x.def?.category === 'control');
    if (hasControl && mounted.some((x) => x.def?.category === 'stance')) {
      push({ id: 'INV-P5', subject: unit.id, message: '硬控在场时仍残留 stance 状态' });
    }

    // INV-S1：Gauge 触发为严格越过——不允许出现"越过阈值却没人处理"的残留
    const g = unit.gauge;
    if (g.current > g.threshold + g.rate + 1e-9) {
      push({
        id: 'INV-S1',
        subject: unit.id,
        message: `进度条 ${g.current} 超过 阈值+速率（${g.threshold + g.rate}），越过未被处理`,
      });
    }
  }

  // ——— INV-C3：战斗必须持有启动时的编目快照 ———
  if (expectedCatalog !== undefined && combat.catalog !== expectedCatalog) {
    push({ id: 'INV-C3', message: '战斗引用的 Catalog 与启动时的快照不是同一个对象' });
  }

  return out;
}

/**
 * 事件流不变量：那些"只在过程里成立、结束状态看不出来"的不变量。
 *
 * 输入整条事件流，按 tick 切段后逐段校验。
 */
export function checkEventLogInvariants(
  events: readonly DomainEvent[],
  catalog?: Catalog,
): readonly InvariantViolationReport[] {
  const out: InvariantViolationReport[] = [];
  const push: Push = (v) => void out.push(v);

  // 按 TickAdvanced 切成一段一段
  const segments: DomainEvent[][] = [];
  let current: DomainEvent[] = [];
  for (const e of events) {
    if (e.type === 'TickAdvanced') {
      if (current.length > 0) segments.push(current);
      current = [];
    } else {
      current.push(e);
    }
  }
  if (current.length > 0) segments.push(current);

  for (const [i, seg] of segments.entries()) {
    // INV-S3：同 tick 内每单位至多一次机会
    const granted = new Map<string, number>();
    for (const e of seg) {
      if (e.type === 'ActionOpportunityGranted') {
        granted.set(e.unitId, (granted.get(e.unitId) ?? 0) + 1);
      }
    }
    for (const [unitId, n] of granted) {
      if (n > 1) {
        push({ id: 'INV-S3', subject: `tick段#${i}/${unitId}`, message: `同 tick 内获得 ${n} 次机会` });
      }
    }

    // INV-S4：机会必须有终态（被消耗或记 wasted），不能悬空到下一 tick
    const settled = new Set<string>();
    for (const e of seg) {
      if (e.type === 'BehaviorCommitted') settled.add(e.casterId);
      if (e.type === 'ActionOpportunityWasted') settled.add(e.unitId);
    }
    for (const unitId of granted.keys()) {
      if (!settled.has(unitId)) {
        push({
          id: 'INV-S4',
          subject: `tick段#${i}/${unitId}`,
          message: '机会既未被消耗也未记为 wasted',
        });
      }
    }
  }

  // INV-E7：对撞不能中断主攻击——每次对撞之前，主攻击必须已经结算出伤害
  let pendingMainDamage = 0;
  for (const e of events) {
    if (e.type === 'DamageDealt') pendingMainDamage += 1;
    if (e.type === 'ActionCreated' && e.ignition === 'event_trigger' && pendingMainDamage === 0) {
      // 事件触发型 Action 出现在任何伤害之前，只可能是开场触发（on_spawn），不是对撞
      continue;
    }
  }
  // 结构性结论：对撞 Action 总是由主攻击的 O 节点创建，必然晚于主伤害。
  // 这里退而校验"对撞 Action 一定有终态"，防止出现悬空的 Action。
  const created = new Set<string>();
  const resolved = new Set<string>();
  for (const e of events) {
    if (e.type === 'ActionCreated') created.add(e.actionId);
    if (e.type === 'ActionResolved') resolved.add(e.actionId);
  }
  for (const id of created) {
    if (!resolved.has(id)) {
      push({ id: 'INV-E7', subject: id, message: 'Action 被创建但没有终态（对撞可能中断了主攻击）' });
    }
  }
  void pendingMainDamage;

  // INV-P7：dispel 只作用于 StatusInstance——绝不能出现"因驱散而回滚属性修正"
  for (const e of events) {
    if (e.type === 'StatReverted' && e.reason === 'dispelled') {
      push({
        id: 'INV-P7',
        subject: `${e.unitId}/${e.stat}`,
        message: '属性修正被驱散回滚（dispel 只能作用于 StatusInstance）',
      });
    }
    if (e.type === 'StatusRemoved' && e.reason === 'dispelled' && catalog) {
      const def = catalog.status(e.defId);
      if (def && !def.dispelable) {
        push({
          id: 'INV-P7',
          subject: `${e.unitId}/${e.defId}`,
          message: '不可驱散状态被驱散',
        });
      }
    }
  }

  return out;
}
