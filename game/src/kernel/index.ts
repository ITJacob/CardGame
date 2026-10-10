// 战斗内核唯一对外出口。
// 契约：createCombat(setup) => CombatFacade；结果是纯函数 f(初始状态, 输入序列, seed)。
// 实现留待 P2；本文件先固定对外形状（IDL 定稿）。

import type { CombatFacade, CombatSetup } from './combat/types'

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

/**
 * 创建一场战斗。
 * @throws 永远抛出——内核尚未实现（P2 里程碑）。
 */
export function createCombat(_setup: CombatSetup): CombatFacade {
  throw new Error('战斗内核尚未实现（P2 里程碑）')
}
