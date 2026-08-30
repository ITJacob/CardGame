/**
 * BehaviorSlot：单位可执行的行为（含单位级覆写）（§5.6）。
 *
 * 引擎全程不特判任何具体行为键——basic_attack 与任何自定义行为在调度器眼里无差别。
 */

import type { DefId, InstanceId } from '../shared/ids.js';
import type { BehaviorTrigger, Reach, TriggerEvent } from '../shared/enums.js';
import type { TargetSpec } from '../shared/target-spec.js';
import type { BehaviorCost, BehaviorSlotSpec, EffectRef } from '../catalog/model.js';
import type { Catalog } from '../catalog/catalog.js';
import type { IdGenerator } from '../shared/ids.js';

export interface BehaviorSlot {
  readonly instanceId: InstanceId;
  readonly templateId: DefId;
  readonly key: string;
  readonly trigger: BehaviorTrigger;
  readonly passiveHook?: TriggerEvent;
  readonly reach: Reach;
  readonly cost: BehaviorCost;
  readonly castTime: number;
  readonly cooldown: number;
  readonly targetSpec: TargetSpec | null;
  /** 已展开的扁平 EffectRef 序列（INV-T1）。 */
  readonly effects: readonly EffectRef[];
  cooldownRemaining: number;
}

/**
 * 技能 → 行为槽位（A19：模板优先 + 逃生舱）。
 *
 * - templateRef 非空：以模板为底，只用 SkillDef.init 覆写数值（90% 的情况）。
 * - templateRef 为空：SkillDef 自带完整行为定义（10% 的特异技能）。
 */
export function instantiateSkills(
  skillIds: readonly DefId[],
  catalog: Catalog,
  ids: IdGenerator,
): readonly BehaviorSlot[] {
  const out: BehaviorSlot[] = [];
  for (const skillId of skillIds) {
    const skill = catalog.skill(skillId);
    if (!skill) continue;
    const init = skill.init ?? {};
    const template = skill.templateRef ? catalog.behavior(skill.templateRef) : undefined;

    if (template) {
      out.push({
        instanceId: ids.next('behavior'),
        templateId: template.id,
        key: init.key ?? skill.id,
        trigger: template.trigger,
        ...(template.passiveHook !== undefined ? { passiveHook: template.passiveHook } : {}),
        reach: init.reach ?? template.reach,
        cost: {
          gaugeAmount: init.cost?.gaugeAmount ?? template.cost.gaugeAmount,
          energyAmount: init.cost?.energyAmount ?? template.cost.energyAmount,
        },
        castTime: init.castTime ?? template.castTime,
        cooldown: init.cooldown ?? template.cooldown,
        targetSpec: init.targetSpec !== undefined ? init.targetSpec : template.targetSpec,
        effects: catalog.expand(skill.effects ?? template.effects, `skill:${skill.id}`),
        cooldownRemaining: 0,
      });
      continue;
    }

    // 逃生舱：SkillDef 自带完整定义。
    if (!skill.effects) continue;
    out.push({
      instanceId: ids.next('behavior'),
      templateId: skill.id,
      key: init.key ?? skill.id,
      trigger: 'active',
      reach: init.reach ?? 'none',
      cost: {
        gaugeAmount: init.cost?.gaugeAmount ?? 75,
        energyAmount: init.cost?.energyAmount ?? 0,
      },
      castTime: init.castTime ?? 0,
      cooldown: init.cooldown ?? 0,
      targetSpec: init.targetSpec ?? null,
      effects: catalog.expand(skill.effects, `skill:${skill.id}`),
      cooldownRemaining: 0,
    });
  }
  return out;
}

/** 把定义态套件（模板 + 覆写）实例化为运行态槽位。 */
export function instantiateKit(
  specs: readonly BehaviorSlotSpec[],
  catalog: Catalog,
  ids: IdGenerator,
): readonly BehaviorSlot[] {
  return specs.map((spec) => {
    const tpl = catalog.requireBehavior(spec.templateId);
    const ov = spec.overrides ?? {};
    return {
      instanceId: ids.next('behavior'),
      templateId: tpl.id,
      key: tpl.key,
      trigger: tpl.trigger,
      ...(tpl.passiveHook !== undefined ? { passiveHook: tpl.passiveHook } : {}),
      reach: ov.reach ?? spec.reach ?? tpl.reach,
      cost: {
        gaugeAmount: ov.cost?.gaugeAmount ?? tpl.cost.gaugeAmount,
        energyAmount: ov.cost?.energyAmount ?? tpl.cost.energyAmount,
      },
      castTime: ov.castTime ?? tpl.castTime,
      cooldown: ov.cooldown ?? tpl.cooldown,
      targetSpec: ov.targetSpec !== undefined ? ov.targetSpec : tpl.targetSpec,
      effects: catalog.expand(ov.effects ?? tpl.effects, `kit:${tpl.id}`),
      cooldownRemaining: 0,
    };
  });
}
