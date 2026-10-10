// 属性三层派生：AttributeSet → BaseProfile（派生一次）→ EffectiveProfile（叠加修正层）。
// 公式锚点：hp_max=30+10·力；energy_max=50；energy_regen=0.2+0.2·智；gauge.rate=15+8·敏；
// gauge.threshold=75；普攻=2；防御=0；抗性基线 0。

import { round2 } from '../shared/result'
import { zeroResistances } from './attributes'
import type { AttributeSet, BaseProfile, EffectiveProfile, ModifierLayer, ResistanceSet } from './types'

export function deriveBaseProfile(attr: AttributeSet): BaseProfile {
  return {
    hpMax: 30 + 10 * attr.strength,
    energyMax: 50,
    energyRegen: round2(0.2 + 0.2 * attr.intelligence),
    gaugeRate: round2(15 + 8 * attr.agility),
    gaugeThreshold: 75,
    attack: 2,
    defense: 0,
    rank: attr.rank,
    resistances: zeroResistances(),
  }
}

export function computeEffective(base: BaseProfile, m: ModifierLayer): EffectiveProfile {
  const resistances = { ...base.resistances }
  for (const el of Object.keys(resistances) as (keyof ResistanceSet)[]) {
    resistances[el] = round2(base.resistances[el] + m.deltaOf(`resist:${el}`))
  }
  return {
    hpMax: Math.max(0, round2(base.hpMax + m.deltaOf('hp_max'))),
    energyMax: Math.max(0, round2(base.energyMax + m.deltaOf('energy_max'))),
    energyRegen: round2(base.energyRegen + m.deltaOf('energy_regen')),
    gaugeRate: Math.max(0, round2(base.gaugeRate + m.deltaOf('gauge.rate'))),
    gaugeThreshold: Math.max(1, round2(base.gaugeThreshold + m.deltaOf('gauge.threshold'))),
    attack: round2(base.attack + m.deltaOf('attack')),
    defense: round2(base.defense + m.deltaOf('defense')),
    rank: Math.max(0, Math.round(base.rank + m.deltaOf('rank'))),
    resistances,
  }
}
