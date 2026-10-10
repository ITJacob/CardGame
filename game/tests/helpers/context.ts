// 直接调用效果处理器所需的最小 EffectContext 桩（ops 为空操作）。
import type { StatusDef } from '../../src/kernel/catalog/types'
import type { EffectContext, EffectOps } from '../../src/kernel/effect/context'
import { Registry } from '../../src/kernel/roster/registry'
import type { CombatUnit } from '../../src/kernel/roster/unit'
import { SequentialIdGenerator } from '../../src/kernel/shared/id-generator'
import { Mulberry32RandomSource, RandomUsageRegistry } from '../../src/kernel/shared/random-source'

const NOOP_OPS: EffectOps = {
  move: () => {}, spawn: () => {}, translocate: () => {}, takeControl: () => {},
  grantImmunity: () => {}, damageMod: () => {}, targetability: () => {},
  setLuminance: () => {}, advanceClock: () => {}, applyDomain: () => {}, placeZone: () => {},
  snapshotUnit: () => {}, restoreUnit: () => {}, echoLastSkill: () => {},
  shuffleGauges: () => {}, shuffleStatuses: () => {}, modifySkillOf: () => {},
  applyTargetOverride: () => {}, writeRuleSlot: () => {}, modifyRuleSlot: () => {}, boardMeter: () => {},
}

export function stubContext(
  units: Registry,
  caster: CombatUnit | null,
  defs: StatusDef[] = [],
  overrides: Partial<EffectOps> = {},
): EffectContext {
  const defMap = new Map(defs.map((d) => [d.id, d]))
  let n = 0
  return {
    units,
    random: new Mulberry32RandomSource(1),
    registry: new RandomUsageRegistry(),
    ids: new SequentialIdGenerator(),
    phase: 'day',
    caster,
    actionId: 'action#1',
    warn: () => {},
    emit: () => {},
    mountStatus: (host, statusId, grant) => {
      host.statuses.mount(statusId, { ...grant, sourceId: `st#${++n}` })
    },
    effectNode: () => undefined,
    defCategory: (id) => defMap.get(id)?.category,
    unsupported: () => {},
    ops: { ...NOOP_OPS, ...overrides },
  }
}

export function registryOf(...units: CombatUnit[]): Registry {
  const r = new Registry()
  for (const u of units) r.add(u)
  return r
}
