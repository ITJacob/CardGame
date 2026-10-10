// Catalog 只读解析包装（编目上下文）。运行时只经此访问定义态。
import type { BehaviorTemplate, Catalog, EffectNode, SkillDef, StatusDef, UnitDef } from './types'

export interface CatalogLookup {
  skillDef(id: string): SkillDef | undefined
  behaviorTemplate(id: string): BehaviorTemplate | undefined
  statusDef(id: string): StatusDef | undefined
  effectNode(id: string): EffectNode | undefined
  unitDef(id: string): UnitDef | undefined
}

export function createLookup(catalog: Catalog): CatalogLookup {
  return {
    skillDef: (id) => catalog.skillDefs.get(id),
    behaviorTemplate: (id) => catalog.behaviorTemplates.get(id),
    statusDef: (id) => catalog.statusDefs.get(id),
    effectNode: (id) => catalog.effectDefs.get(id)?.node,
    unitDef: (id) => catalog.unitDefs.get(id),
  }
}
