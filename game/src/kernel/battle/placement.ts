// Placement：唯一占位出口（战场上下文 §三、四）。重写自 7e6d01f:src/battle/placement.ts，
// 实现现 IDL 的 Placement 接口，内部沿用 8 步模板：
// snapshot → 变更 → collapse → syncProjections → invariantCheck(失败回滚) → diff → emit → return。

import type { FactionId, LaneId, UnitId } from '../ids'
import type { Battle, Coordinate, Lane, OccupancyChanged, OccupancyResult, Placement } from './types'
import { collapseLane, isCompact } from './collapse'
import { coordKey } from './coordinate'
import { diffOccupancy, hasChanges, toOccupancyChanged, type OccupancyEntry } from './occupancy'
import { err, ok, type Result } from '../shared/result'

export interface PlacementHooks {
  unitIds(): readonly UnitId[]
  setPosition(unitId: UnitId, coord: Coordinate | null): void
  onChange(e: OccupancyChanged): void
}

type SlotSnapshot = { faction: FactionId; lane: LaneId; slots: (UnitId | null)[] }

export class BattlePlacement implements Placement {
  constructor(
    private readonly battle: Battle,
    private readonly hooks: PlacementHooks,
  ) {}

  insert(unit: UnitId, c: Coordinate): OccupancyResult {
    return this.run(() => {
      const lane = this.laneOf(c.faction, c.lane)
      if (!lane) return err('INVALID_COORD', `未知阵营或路：${c.faction}/${c.lane}`)
      if (c.index < 0 || c.index >= lane.slots.length) return err('INVALID_COORD', `index 越界：${c.index}`)
      if (this.findCoords(unit)) return err('UNIT_ALREADY_PRESENT', `单位已在场：${unit}`)
      if (lane.slots.filter((s) => s.occupant != null).length >= lane.slots.length) {
        return err('LANE_FULL', `路已满：${c.faction}/${c.lane}`)
      }
      if (lane.slots[c.index]!.occupant != null) return err('INVALID_COORD', `格位已占：${coordKey(c)}`)
      lane.slots[c.index] = { occupant: unit }
      return ok(undefined)
    })
  }

  remove(unit: UnitId): OccupancyResult {
    return this.run(() => {
      const found = this.findCoords(unit)
      if (!found) return err('UNIT_NOT_PRESENT', `单位不在场：${unit}`)
      const lane = this.laneOf(found.faction, found.lane)
      lane!.slots[found.index] = { occupant: null }
      return ok(undefined)
    })
  }

  swap(a: Coordinate, b: Coordinate): OccupancyResult {
    return this.run(() => {
      const la = this.laneOf(a.faction, a.lane)
      const lb = this.laneOf(b.faction, b.lane)
      if (!la || !lb) return err('INVALID_COORD', '未知阵营或路')
      const oa = la.slots[a.index]?.occupant ?? null
      const ob = lb.slots[b.index]?.occupant ?? null
      if (oa == null || ob == null) return err('UNIT_NOT_PRESENT', 'swap 需要两个格位均有单位')
      la.slots[a.index] = { occupant: ob }
      lb.slots[b.index] = { occupant: oa }
      return ok(undefined)
    })
  }

  relocate(unit: UnitId, to: Coordinate): OccupancyResult {
    return this.run(() => {
      const from = this.findCoords(unit)
      if (!from) return err('UNIT_NOT_PRESENT', `单位不在场：${unit}`)
      if (from.faction !== to.faction) return err('CROSS_FACTION_RELOCATE', '禁跨中线迁移')
      if (from.lane === to.lane) return ok(undefined) // 同路迁移为 no-op
      const target = this.laneOf(to.faction, to.lane)
      if (!target) return err('INVALID_COORD', `未知路：${to.lane}`)
      if (target.slots.filter((s) => s.occupant != null).length >= target.slots.length) {
        return err('LANE_FULL', `目标路已满：${to.lane}`)
      }
      const src = this.laneOf(from.faction, from.lane)!
      if (target.slots[to.index]?.occupant != null) return err('INVALID_COORD', `目标格位已占：${coordKey(to)}`)
      src.slots[from.index] = { occupant: null }
      target.slots[to.index] = { occupant: unit }
      return ok(undefined)
    })
  }

  applyExternal(mutator: (b: Battle) => Battle): OccupancyResult {
    return this.run(() => {
      // 约定：就地修改传入的 Battle（返回值仅为链式写法）
      mutator(this.battle)
      return ok(undefined)
    })
  }

  // ---------- 内部 ----------

  private run(mutate: () => Result<void>): OccupancyResult {
    const before = this.occupancy()
    const snap = this.snapshot()
    const r = mutate()
    if (!r.ok) {
      this.restore(snap)
      this.syncProjections()
      return { ok: false, snapshot: this.battle, reason: r.error.message }
    }
    this.collapseAll()
    const after = this.occupancy()
    const inv = this.checkInvariants()
    if (!inv.ok) {
      this.restore(snap)
      this.syncProjections()
      return { ok: false, snapshot: this.battle, reason: inv.error.message }
    }
    this.syncProjections()
    const diff = diffOccupancy(before, after)
    if (hasChanges(diff)) this.hooks.onChange(toOccupancyChanged(diff))
    return { ok: true, next: this.battle }
  }

  private laneOf(faction: FactionId, lane: LaneId): Lane | undefined {
    return this.battle.factions.find((f) => f.id === faction)?.lanes.get(lane)
  }

  private findCoords(unit: UnitId): Coordinate | null {
    for (const f of this.battle.factions) {
      for (const [laneId, lane] of f.lanes) {
        for (let i = 0; i < lane.slots.length; i += 1) {
          if (lane.slots[i]!.occupant === unit) return { faction: f.id, lane: laneId, index: i }
        }
      }
    }
    return null
  }

  /** 全占位，按 faction 数组序 → lane id 升序 → index 升序（确定性） */
  private occupancy(): OccupancyEntry[] {
    const out: OccupancyEntry[] = []
    for (const f of this.battle.factions) {
      const lanes = [...f.lanes.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      for (const [laneId, lane] of lanes) {
        for (let i = 0; i < lane.slots.length; i += 1) {
          const occ = lane.slots[i]!.occupant
          if (occ != null) out.push({ unitId: occ, coord: { faction: f.id, lane: laneId, index: i } })
        }
      }
    }
    return out
  }

  private snapshot(): SlotSnapshot[] {
    const out: SlotSnapshot[] = []
    for (const f of this.battle.factions) {
      for (const [laneId, lane] of f.lanes) {
        out.push({ faction: f.id, lane: laneId, slots: lane.slots.map((s) => s.occupant) })
      }
    }
    return out
  }

  private restore(snap: SlotSnapshot[]): void {
    for (const s of snap) {
      const lane = this.laneOf(s.faction, s.lane)
      if (!lane) continue
      for (let i = 0; i < lane.slots.length; i += 1) lane.slots[i] = { occupant: s.slots[i] ?? null }
    }
  }

  private collapseAll(): void {
    for (const f of this.battle.factions) {
      for (const lane of f.lanes.values()) {
        const collapsed = collapseLane(lane.slots.map((s) => s.occupant))
        for (let i = 0; i < lane.slots.length; i += 1) lane.slots[i] = { occupant: collapsed[i] ?? null }
      }
    }
  }

  private checkInvariants(): Result<void> {
    for (const f of this.battle.factions) {
      for (const [laneId, lane] of f.lanes) {
        const occupants = lane.slots.map((s) => s.occupant)
        if (!isCompact(occupants)) return err('INVARIANT', `路 ${f.id}/${laneId} 出现空洞`)
        if (occupants.filter((o) => o != null).length > lane.slots.length) {
          return err('INVARIANT', `路 ${f.id}/${laneId} 超容`)
        }
      }
    }
    return ok(undefined)
  }

  private syncProjections(): void {
    const coordById = new Map<UnitId, Coordinate>()
    for (const e of this.occupancy()) coordById.set(e.unitId, e.coord)
    for (const id of this.hooks.unitIds()) this.hooks.setPosition(id, coordById.get(id) ?? null)
  }
}
