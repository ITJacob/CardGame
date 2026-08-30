import { describe, it, expect } from 'vitest';
import { compileSample, makeCombat } from './helpers.js';
import { createZone, zoneAffectsUnit } from '../src/index.js';
import type { ZoneGrant } from '../src/index.js';

const grant: ZoneGrant = {
  duration: 5,
  uses: 1,
  affects: 'enemy_of_owner',
  trigger: 'on_enter',
  triggerOnExisting: false,
  effects: [{ ref: 'dmg_flamestorm' }],
  ownerSide: 'blue',
  sourceId: 'test-source',
};

describe('Zone（§4.5 / INV-B6 / INV-B8）', () => {
  it('以坐标为键，与单位解耦（INV-B6）', () => {
    const combat = makeCombat(1);
    const coord = { faction: 'red', lane: 'top', index: 0 } as const;
    const zone = createZone('z1', coord, 'zone_fire_trap', grant);
    combat.battle.addZone(zone);
    expect(combat.battle.zonesAt(coord)).toHaveLength(1);

    combat.battle.removeZone('z1');
    expect(combat.battle.zonesAt(coord)).toHaveLength(0);
  });

  it('阵营过滤：ownerSide + affects 决定谁能吃到', () => {
    const zone = createZone('z1', { faction: 'red', lane: 'top', index: 0 }, 'zone_fire_trap', grant);
    expect(zoneAffectsUnit(zone, 'red')).toBe(true);
    expect(zoneAffectsUnit(zone, 'blue')).toBe(false);
  });

  it('死亡补位导致的坍缩落入视同进入——Zone 只监听 OccupancyChanged', () => {
    // 红方同路两人：前排 index 0、后排 index 1。陷阱埋在 index 0。
    const combat = makeCombat(1, {
      blue: ['unit_warrior'],
      red: [{ unitDefId: 'unit_mage', lane: 'top' }, { unitDefId: 'unit_mage', lane: 'top' }],
    });
    const reds = combat.allUnits().filter((u) => u.faction === 'red');
    const front = reds.find((u) => u.position?.index === 0);
    const back = reds.find((u) => u.position?.index === 1);
    expect(front).toBeDefined();
    expect(back).toBeDefined();
    if (!front || !back) return;

    const trapCoord = front.position as { faction: string; lane: string; index: number };
    combat.battle.addZone(
      createZone('trap-1', trapCoord, 'zone_fire_trap', {
        ...grant,
        ownerSide: 'blue',
        affects: 'any',
        uses: 2,
        duration: 20,
      }),
    );

    const hpBefore = back.hp;
    // 前排阵亡 → 后排坍缩进 index 0 → 判定为"进入"陷阱坐标
    combat.handleDeath(front);

    expect(combat.battle.coordOf(back.id)?.index).toBe(0);
    const triggered = combat.bus.log.filter((e) => e.type === 'ZoneTriggered');
    expect(triggered.length).toBeGreaterThan(0);
    expect(back.hp).toBeLessThan(hpBefore);
  });

  it('INV-B8：整次触发只消耗一次 uses，用尽即移除', () => {
    const combat = makeCombat(2, {
      blue: ['unit_warrior'],
      red: [{ unitDefId: 'unit_mage', lane: 'top' }, { unitDefId: 'unit_mage', lane: 'top' }],
    });
    const reds = combat.allUnits().filter((u) => u.faction === 'red');
    const front = reds.find((u) => u.position?.index === 0);
    const back = reds.find((u) => u.position?.index === 1);
    if (!front || !back) return;

    const trapCoord = front.position as { faction: string; lane: string; index: number };
    combat.battle.addZone(
      createZone('trap-2', trapCoord, 'zone_fire_trap', {
        ...grant,
        ownerSide: 'blue',
        affects: 'any',
        uses: 1,
        duration: 20,
      }),
    );

    combat.handleDeath(front);

    expect(combat.battle.zonesAt(trapCoord)).toHaveLength(0);
    const removed = combat.bus.log.filter(
      (e) => e.type === 'ZoneRemoved' && e.zoneId === 'trap-2',
    );
    expect(removed.length).toBeGreaterThan(0);
  });

  it('区域载荷是 EffectRef 清单（A23），逐条独立判定', () => {
    const catalog = compileSample();
    const def = catalog.zone('zone_fire_trap');
    expect(def?.defaultGrant.effects.length).toBe(2);
    expect(def?.defaultGrant.effects.map((e) => e.ref)).toEqual(['dmg_flamestorm', 'apply_burn']);
  });

  it('duration 到期后由 tick 移除', () => {
    const combat = makeCombat(4, { blue: ['unit_warrior'], red: ['unit_mage'] });
    const redUnit = combat.allUnits().find((u) => u.faction === 'red');
    if (!redUnit) return;
    combat.battle.addZone(
      createZone('trap-3', redUnit.position as never, 'zone_fire_trap', { ...grant, duration: 2 }),
    );
    combat.tick();
    expect(combat.battle.allZones()).toHaveLength(1);
    combat.tick();
    expect(combat.battle.allZones()).toHaveLength(0);
  });
});
