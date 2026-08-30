import { describe, it, expect } from 'vitest';
import {
  BattlefieldShape,
  DEFAULT_BATTLEFIELD,
  Battle,
  Placement,
  EventBus,
  collapseLane,
  isCompact,
  coord,
} from '../src/index.js';
import { UnitRegistry, type Unit } from '../src/index.js';
import type { DomainEvent } from '../src/index.js';

function setup() {
  const shape = new BattlefieldShape(DEFAULT_BATTLEFIELD);
  const battle = new Battle(shape);
  const bus = new EventBus();
  const registry = new UnitRegistry();
  const placement = new Placement(battle, bus, (moves) => registry.syncProjections(moves));
  return { shape, battle, bus, registry, placement };
}

describe('Collapse（§4.4 / INV-B2 / INV-B3）', () => {
  it('把空洞压成前缀，保持相对顺序', () => {
    const collapsed = collapseLane([null, 'b', null, 'c'] as never);
    expect(collapsed).toEqual(['b', 'c', null, null]);
  });

  it('幂等：对已紧凑的队列调用结果不变', () => {
    const once = collapseLane([null, 'b', null, 'c'] as never);
    const twice = collapseLane(once);
    expect(twice).toEqual(once);
  });

  it('isCompact 能识别内部空洞', () => {
    expect(isCompact(['a', 'b', null, null] as never)).toBe(true);
    expect(isCompact(['a', null, 'b', null] as never)).toBe(false);
  });
});

describe('Placement（A1 / §4.3）', () => {
  it('插入后自动坍缩，并同步 Unit.position 投影', () => {
    const { battle, placement, registry } = setup();
    makeUnit(registry, 'u1');
    makeUnit(registry, 'u2');

    expect(placement.insert('u1', coord('blue', 'top', 3)).ok).toBe(true);
    expect(placement.insert('u2', coord('blue', 'top', 3)).ok).toBe(true);

    expect(battle.coordOf('u1')).toEqual(coord('blue', 'top', 0));
    expect(battle.coordOf('u2')).toEqual(coord('blue', 'top', 1));
    expect(registry.get('u1')?.position).toEqual(coord('blue', 'top', 0));
  });

  it('INV-B7：满员时插入被拒绝并返回失败原因（不静默丢弃）', () => {
    const { placement, registry } = setup();
    const ids = ['a', 'b', 'c', 'd', 'e'];
    for (const id of ids) makeUnit(registry, id);
    for (const id of ids.slice(0, 4)) {
      expect(placement.insert(id, coord('blue', 'top', 3)).ok).toBe(true);
    }
    const r = placement.insert('e', coord('blue', 'top', 3));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('LANE_FULL');
  });

  it('移除后坍缩，补位单位被判定为"进入"该坐标', () => {
    const { battle, placement, registry } = setup();
    makeUnit(registry, 'a');
    makeUnit(registry, 'b');
    placement.insert('a', coord('blue', 'top', 3));
    placement.insert('b', coord('blue', 'top', 3));

    const r = placement.remove('a');
    expect(r.ok).toBe(true);
    if (r.ok) {
      // b 从 index 1 落到 index 0：既 left(1) 又 entered(0)
      expect(r.value.left).toContainEqual({ unitId: 'b', coord: coord('blue', 'top', 1) });
      expect(r.value.entered).toContainEqual({ unitId: 'b', coord: coord('blue', 'top', 0) });
    }
    expect(battle.coordOf('b')).toEqual(coord('blue', 'top', 0));
  });

  it('swap 交换两个单位的位置', () => {
    const { battle, placement, registry } = setup();
    makeUnit(registry, 'a');
    makeUnit(registry, 'b');
    placement.insert('a', coord('blue', 'top', 3));
    placement.insert('b', coord('blue', 'top', 3));
    expect(placement.swap('a', 'b').ok).toBe(true);
    expect(battle.coordOf('a')).toEqual(coord('blue', 'top', 1));
    expect(battle.coordOf('b')).toEqual(coord('blue', 'top', 0));
  });

  it('relocate 跨路迁移并双端坍缩', () => {
    const { battle, placement, registry } = setup();
    makeUnit(registry, 'a');
    placement.insert('a', coord('blue', 'top', 3));
    expect(placement.relocate('a', coord('blue', 'bottom', 3)).ok).toBe(true);
    expect(battle.coordOf('a')).toEqual(coord('blue', 'bottom', 0));
  });

  it('applyExternal：非法的 mutator 走快照回滚，不留下半截状态', () => {
    const { battle, placement, registry } = setup();
    makeUnit(registry, 'a');
    placement.insert('a', coord('blue', 'top', 3));
    const before = battle.snapshot();

    // setSlot 一个越界坐标会抛 RangeError → Placement 捕获并回滚到快照。
    const r = placement.applyExternal((draft) => {
      draft.setSlot(coord('blue', 'top', 99), 'zzz');
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_COORDINATE');
    expect(battle.snapshot().slots).toEqual(before.slots);
    expect(battle.coordOf('a')).toEqual(coord('blue', 'top', 0));
  });

  it('OccupancyChanged 是 Zone 的唯一触发入口', () => {
    const { bus, placement, registry } = setup();
    makeUnit(registry, 'a');
    const events: DomainEvent[] = [];
    bus.subscribe((e) => events.push(e));

    placement.insert('a', coord('red', 'bottom', 3));
    const occupancy = events.filter((e) => e.type === 'OccupancyChanged');
    expect(occupancy).toHaveLength(1);
  });
});

/**
 * 只造一个"够用的单位替身"。
 * 战场上下文只关心 id 与坐标投影（INV-B5），不需要编队上下文的完整 Unit。
 */
function makeUnit(registry: UnitRegistry, id: string): void {
  registry.add({ id, position: null } as unknown as Unit);
}
