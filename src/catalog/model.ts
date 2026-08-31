/**
 * 编目上下文的定义态模型（§9）。
 *
 * 全部遵循 Definition + Grant 模式（A7 / §2.2）三条铁律：
 * 1. 默认值与上下限只写在 Def，实例值只写在 Grant / params。任何一处都不许两写（INV-C2）。
 * 2. Grant 是值对象，创建后不可变；Instance 持有它的副本。
 * 3. Def 不可变、可缓存、可共享；同一 Def 可产生任意多个不同 Grant 的实例。
 */

import type { DefId, FactionId, InstanceId, UnitId } from '../shared/ids.js';
import type {
  Affects,
  BehaviorModifierOp,
  BehaviorTrigger,
  EffectType,
  Element,
  Reach,
  RedirectTo,
  SourceFilter,
  StackPolicy,
  StatusCategory,
  TriggerEvent,
  ZoneKind,
  ZoneTrigger,
} from '../shared/enums.js';
import type { Params } from '../shared/json.js';
import type { EffectCondition } from '../shared/effect-condition.js';
import type { TargetSpec } from '../shared/target-spec.js';

// ————————————————————————————————————————————————
// Effect
// ————————————————————————————————————————————————

export interface EffectDefMeta {
  /** 跳过吸收型阶段（护甲 / 护盾）。用于 DoT 穿透护甲。 */
  readonly bypassArmor?: boolean;
  /**
   * INV-D4：状态来源的伤害默认不进通用乘区。
   * 如需进入，必须在这里显式开启——不默认进入。
   */
  readonly enterGeneralMultiplier?: boolean;
  /** R3 登记辅助：声明该效果引入随机，便于平衡审计筛出。 */
  readonly usesRandom?: boolean;
}

export interface EffectDef {
  readonly id: DefId;
  readonly type: EffectType;
  /** 纯标签，自身无数值语义（INV-EL1）。挂在 effect 层，不在 behavior 层（INV-EL2）。 */
  readonly element?: Element;
  /** 默认参数。实例覆写只写 EffectRef.params。 */
  readonly params: Params;
  readonly meta?: EffectDefMeta;
  readonly displayName?: string;
}

export interface EffectRef {
  readonly ref: DefId;
  /** 覆写默认参数（INV-C2：实例值只写这里）。 */
  readonly params?: Params;
  /** 逐目标判定：决定对谁生效。 */
  readonly condition?: EffectCondition;
  /** 覆盖行为级目标（状态触发常用）。 */
  readonly target?: TargetSpec;
  /** 术语展开烙印，只读、不参与结算（INV-T1）。 */
  readonly originTerm?: string;
}

// ————————————————————————————————————————————————
// Term（§8.4）
// ————————————————————————————————————————————————

export interface TermRef {
  readonly termRef: DefId;
  /** 必须在 TermDef.overridable 白名单内（INV-T3）。 */
  readonly overrides?: Params;
  /** 嵌套引用路径，仅供文案与溯源。 */
  readonly originPath?: string;
}

/**
 * 术语节点：效果引用 / 嵌套术语引用 / 内联的算子节点。
 *
 * 第三种是嵌套所必需的——`Sequence([damage, If(...)])` 里那个 If 既不是
 * EffectRef 也不是 TermRef，而是一个内联的 composition 节点。
 */
export type TermNode = EffectRef | TermRef | TermComposition;

export function isTermRef(node: TermNode): node is TermRef {
  return (node as TermRef).termRef !== undefined;
}

export function isEffectRef(node: TermNode): node is EffectRef {
  return (node as EffectRef).ref !== undefined;
}

export function isComposition(node: TermNode): node is TermComposition {
  const kind = (node as TermComposition).kind;
  return kind === 'sequence' || kind === 'repeat' || kind === 'if';
}

/** 首批三个算子（A17）。跨效果传值（吸血）不进术语，做成独立 EffectDef(drain)。 */
export type TermComposition =
  | { readonly kind: 'sequence'; readonly of: readonly TermNode[] }
  | {
      readonly kind: 'repeat';
      readonly body: readonly TermNode[];
      readonly count: number;
      /** true = 多段共享同一冻结坐标（INV-T5）。 */
      readonly shareTarget: boolean;
    }
  | {
      readonly kind: 'if';
      readonly cond: EffectCondition;
      readonly then: readonly TermNode[];
      readonly else?: readonly TermNode[];
    };

export interface TermDef {
  readonly id: DefId;
  readonly displayName: string;
  /** 取值域开放，服务于 UI 分组与流派检索。 */
  readonly category: string;
  /** 玩家可读文本模板，含占位符，由实参渲染（INV-T4）。 */
  readonly description?: string;
  readonly composition: TermComposition;
  /** 允许被覆写的参数白名单，默认空 = 完全固定（INV-T3）。 */
  readonly overridable: readonly string[];
  /** 流派 / 检索用。 */
  readonly tags?: readonly string[];
}

// ————————————————————————————————————————————————
// Behavior / Skill（§9、A19）
// ————————————————————————————————————————————————

export interface BehaviorCost {
  /** 扣减的行动条进度。默认纪律：等于 Gauge.threshold（A2）。 */
  readonly gaugeAmount: number;
  readonly energyAmount: number;
}

export interface BehaviorOverrides {
  readonly cost?: Partial<BehaviorCost>;
  readonly castTime?: number;
  readonly cooldown?: number;
  readonly targetSpec?: TargetSpec | null;
  readonly effects?: readonly TermNode[];
  readonly reach?: Reach;
}

export interface BehaviorTemplate {
  readonly id: DefId;
  readonly key: string;
  readonly trigger: BehaviorTrigger;
  readonly passiveHook?: TriggerEvent;
  /** 攻击类行为的属性；与站位、与 targetSpec 正交（INV-P6）。 */
  readonly reach: Reach;
  readonly cost: BehaviorCost;
  readonly castTime: number;
  readonly cooldown: number;
  readonly targetSpec: TargetSpec | null;
  /** 定义态可含 TermRef；编目期展开为扁平 EffectRef[]（INV-T1）。 */
  readonly effects: readonly TermNode[];
  readonly displayName?: string;
}

/**
 * SkillDef：模板优先 + 逃生舱（A19）。
 * 默认填 templateRef 只覆写数值；templateRef 为空时由 SkillDef 自带完整行为定义。
 */
export interface SkillDef {
  readonly id: DefId;
  readonly displayName?: string;
  readonly templateRef?: DefId | null;
  readonly init?: BehaviorOverrides & { readonly key?: string; readonly reach?: Reach };
  readonly effects?: readonly TermNode[];
}

// ————————————————————————————————————————————————
// Status（§5.5、§9）
// ————————————————————————————————————————————————

export interface TriggerDef {
  readonly event: TriggerEvent;
  readonly effects: readonly TermNode[];
  readonly sourceFilter?: SourceFilter;
  readonly condition?: EffectCondition;
}

export interface BehaviorModifier {
  readonly op: BehaviorModifierOp;
  /** disable / force 作用于哪个行为键；'*' 表示全部。 */
  readonly behaviorKey?: string;
  /** 数值类修正用 number / string；target_override 用完整 TargetSpec。 */
  readonly value?: number | string | TargetSpec;
}

/** 守卫姿态：同路且 index 大于自己的全部单位。首批只需 same_lane_behind。 */
export type CoordinateRelation = 'same_lane_behind';

export type ProtectedSelector =
  /** 保护指定单位（原「守护」）。unitId 不在 Def 里，由 StatusInstance.binding 提供。 */
  | { readonly kind: 'unit_ref' }
  /** 按坐标关系动态确定（守卫姿态）。 */
  | { readonly kind: 'coordinate_relation'; readonly relation: CoordinateRelation };

export interface RedirectRule {
  readonly op: 'redirect';
  readonly to: RedirectTo;
  readonly protectedSelector?: ProtectedSelector;
  /** 只拦截特定来源（守卫姿态填 ranged，守护填 any）。 */
  readonly sourceFilter: SourceFilter;
  readonly ratio: number;
  /** 转向优先级：守护 10 > 自转移 5。单跳防环（INV-E1）。 */
  readonly priority: number;
}

export interface StatusDef {
  readonly id: DefId;
  readonly displayName?: string;
  readonly category: StatusCategory;
  /** 默认时长。单点定义于此（INV-C2）；缺失会让 INV-C2 无法成立。 */
  readonly defaultDuration: number;
  readonly maxStacks: number;
  /**
   * 次数型状态（C6）：状态可触发的"响应式事件"次数上限。
   * 缺省表示非次数型（无限次触发，直到 duration 到期）。
   * 单点定义于此（INV-C2）；实例值由 StatusGrant.charges 覆盖。
   */
  readonly charges?: number;
  readonly stackPolicy: StackPolicy;
  readonly dispelable: boolean;
  readonly triggers: readonly TriggerDef[];
  readonly behaviorModifiers: readonly BehaviorModifier[];
  readonly redirect?: RedirectRule | null;
  /** on_tick 等事件的效果载荷，结构对齐 ZoneGrant.effects（INV-B8）。 */
  readonly payload?: readonly TermNode[];
  readonly params?: Params;
}

/** 本次挂载的参数包（Grant 层）。创建后不可变。 */
export interface StatusGrant {
  readonly duration?: number;
  readonly stacks?: number;
  /** 次数型状态（C6）：覆盖 StatusDef.charges 的初始次数。 */
  readonly charges?: number;
  readonly params?: Params;
  /** 特殊绑定：守护目标 / 转移目标。 */
  readonly binding?: {
    readonly guardTarget?: UnitId;
    readonly transferTarget?: UnitId;
  };
}

// ————————————————————————————————————————————————
// Zone（§4.5、A23）
// ————————————————————————————————————————————————

/** ZoneDef 里的默认参数包模板；实例化时补上 sourceId。 */
export interface ZoneGrantTemplate {
  readonly duration: number | null;
  readonly uses: number | null;
  readonly affects: Affects;
  readonly trigger: ZoneTrigger;
  /** 放置时是否结算已在场的单位（默认 false）。 */
  readonly triggerOnExisting?: boolean;
  /** 载荷是清单（A23），逐条独立判定。定义态可含 TermRef。 */
  readonly effects: readonly TermNode[];
  readonly ownerSide: FactionId | null;
}

export interface ZoneDef {
  readonly id: DefId;
  readonly kind: ZoneKind;
  readonly defaultGrant: ZoneGrantTemplate;
  readonly maxDuration: number | null;
  readonly displayName?: string;
}

// ————————————————————————————————————————————————
// Class / Unit（§5.6、§9）
// ————————————————————————————————————————————————

export interface BehaviorSlotSpec {
  readonly templateId: DefId;
  readonly overrides?: BehaviorOverrides;
  /** 单位级覆写所需的实例 id 由运行时分配；这里是定义态模板。 */
  readonly reach?: Reach;
}

export type KitOp =
  | { readonly op: 'add'; readonly slot: BehaviorSlotSpec }
  | { readonly op: 'remove'; readonly key: string }
  | { readonly op: 'modify'; readonly key: string; readonly patch: BehaviorOverrides };

export interface ClassDef {
  readonly id: DefId;
  /** 未声明 kit 的职业自动继承全局默认套件（§5.6）。 */
  readonly defaultKit?: readonly BehaviorSlotSpec[];
  readonly kitOps?: readonly KitOp[];
  readonly knownSkills?: readonly DefId[];
}

/** 属性点。战斗内不可变（§5.2）。 */
export interface AttributeSet {
  readonly strength: number;
  readonly agility: number;
  readonly intellect: number;
}

export interface UnitDef {
  readonly id: DefId;
  readonly displayName?: string;
  readonly classId?: DefId | null;
  readonly attributes: AttributeSet;
  /** 初始护甲池（吸收型资源）。 */
  readonly initialArmor?: number;
  readonly skills?: readonly DefId[];
}

/** 运行时 SourceId 的统一来源：一切走 StatProvenance 的写入都要带它。 */
export type ProvenanceSourceId = InstanceId;
