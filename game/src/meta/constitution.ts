// 体质（游戏侧新增设计）：`docs/ddd` 明确「灵/体/魅未接入属性系统」，
// 故体质是**游戏侧概念**，只能落在现有内核扩展点上——此处用「初始属性修正」表达
// （UnitSetup.initialModifiers → 账本源 'constitution'），不引入任何新原语。
//
// ⚠️ 数值全部为初版占位（对应仓库惯例 ⚠️D），需过 `docs/ddd/params/数值标定基准.md`。

export interface ConstitutionDef {
  id: string
  name: string
  note: string
  /** 初始属性修正：stat 键 = 内核 StatKey（hp_max/energy_regen/gauge.rate/attack/defense/resist:<el>…） */
  modifiers: { stat: string; value: number }[]
}

export const CONSTITUTIONS: readonly ConstitutionDef[] = [
  {
    id: 'robust',
    name: '强健',
    note: '体魄厚实，最大生命 +20%',
    modifiers: [{ stat: 'hp_max', value: 12 }], // 基准 60 → 72（+20%）
  },
  {
    id: 'swift',
    name: '迅捷',
    note: '神经敏锐，行动条累积 +3/tick',
    modifiers: [{ stat: 'gauge.rate', value: 3 }],
  },
  {
    id: 'keen',
    name: '明悟',
    note: '思维敏捷，能量回复 +0.2/tick',
    modifiers: [{ stat: 'energy_regen', value: 0.2 }],
  },
  {
    id: 'bulwark',
    name: '坚壁',
    note: '护体成习，防御 +2',
    modifiers: [{ stat: 'defense', value: 2 }],
  },
  {
    id: 'sharp',
    name: '锋锐',
    note: '长于搏杀，攻击 +1',
    modifiers: [{ stat: 'attack', value: 1 }],
  },
  {
    id: 'fireproof',
    name: '耐火',
    note: '皮肉焦痕不侵，火焰抗性 +25%',
    modifiers: [{ stat: 'resist:fire', value: 0.25 }],
  },
  {
    id: 'antitoxic',
    name: '抗毒',
    note: '久服毒而耐毒，毒素抗性 +25%',
    modifiers: [{ stat: 'resist:poison', value: 0.25 }],
  },
  {
    id: 'warded',
    name: '心防',
    note: '心志坚固，精神抗性 +25%',
    modifiers: [{ stat: 'resist:mental', value: 0.25 }],
  },
  {
    id: 'tenacious',
    name: '坚韧',
    note: '久战不竭，能量上限 +15',
    modifiers: [{ stat: 'energy_max', value: 15 }],
  },
  {
    id: 'medium',
    name: '灵媒',
    note: '感官通灵，全元素抗性 +10%',
    modifiers: [
      { stat: 'resist:fire', value: 0.1 },
      { stat: 'resist:ice', value: 0.1 },
      { stat: 'resist:poison', value: 0.1 },
      { stat: 'resist:lightning', value: 0.1 },
      { stat: 'resist:mental', value: 0.1 },
      { stat: 'resist:physical', value: 0.1 },
      { stat: 'resist:holy', value: 0.1 },
      { stat: 'resist:dark', value: 0.1 },
    ],
  },
]

export function constitutionById(id: string): ConstitutionDef | undefined {
  return CONSTITUTIONS.find((c) => c.id === id)
}
