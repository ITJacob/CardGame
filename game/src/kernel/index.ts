// 战斗内核唯一对外出口。
// 契约：createCombat(setup) => CombatFacade；结果是纯函数 f(初始状态, 输入序列, seed)。
// 实现留待 P2；本文件先固定对外形状（IDL 定稿）。

import type { CombatSetup } from './combat/types'
import { initCombat, type CombatRuntimeHandle } from './combat/runtime'

export type * from './ids'
export type * from './shared/types'
export type * from './catalog/types'
export type * from './battle/types'
export type * from './roster/types'
export type * from './scheduling/types'
export type * from './execution/types'
export type * from './effect/types'
export type * from './combat/types'

// 常量需要值导出（非 type）
export {
  LANE_CAPACITY, LANE_COUNT, FACTION_COUNT,
  TICK_PER_DAY, TICK_MINUTES, GAUGE_THRESHOLD,
} from './battle/types'

// 实现出口
export { initCombat } from './combat/runtime'
export type { CombatRuntimeHandle, RuntimeOptions } from './combat/runtime'
export { fingerprintOf, serializeReplay } from './combat/fingerprint'
export { BASIC_ATTACK_ID, basicAttackSource } from './combat/basicAttack'
export { createLookup } from './catalog/lookup'
export { createHttpSource, loadCatalog, loadManifest, statusFileOf } from '../data/loader'
export { buildCatalog, EFFECT_TYPES, TRIGGER_EVENTS } from '../data/catalogBuild'

/**
 * 创建一场战斗。契约：结果 = f(初始状态, 输入序列, seed)，同 seed 逐位相同。
 */
export function createCombat(setup: CombatSetup): CombatRuntimeHandle {
  return initCombat({ setup })
}
