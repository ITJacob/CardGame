// 引擎内置普攻（数据面无对应卡；`basic_attack` 仅是 actionLock 枚举值）。
// 基础伤害取施法者 attack（=2）；缺省目标 = 敌方同路最前排，本路无候选回退全场。
import type { BehaviorSource } from '../execution/pipeline'
import type { TargetSpec } from '../shared/types'

export const BASIC_ATTACK_ID = '__basic_attack__'

export function basicAttackSource(): BehaviorSource {
  const targetSpec: TargetSpec = {
    request: { faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane', sort: 'index_asc', pickCount: 1 },
    selectionMode: 'auto',
  }
  return {
    sourceRef: BASIC_ATTACK_ID,
    effects: [{ type: 'damage', element: 'physical' }],
    targetSpec,
    consumption: 'instant',
  }
}
