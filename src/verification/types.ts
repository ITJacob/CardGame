/**
 * 不变量断言器的公共类型（§12 不变量总表 → 可执行断言）。
 *
 * 47 条不变量里有相当一部分是**结构性保证**——靠类型与构造方式就已经成立，
 * 运行时再断言一遍纯属浪费。所以这里把每条不变量归到三类之一：
 *
 *   enforced  构造即保证（类型系统 / 单一出口），断言器只做"回归哨兵"
 *   checked   每次调用都真正校验
 *   logged    只能在事件流上做事后校验
 *
 * 归类的意义：当一条不变量被破坏时，能立刻知道该去改代码还是改配置。
 */

export type InvariantId =
  // 战场
  | 'INV-B1' | 'INV-B2' | 'INV-B3' | 'INV-B4' | 'INV-B5' | 'INV-B6' | 'INV-B7' | 'INV-B8'
  // 编队
  | 'INV-P1' | 'INV-P2' | 'INV-P3' | 'INV-P4' | 'INV-P5' | 'INV-P6' | 'INV-P7'
  // 调度
  | 'INV-S1' | 'INV-S2' | 'INV-S3' | 'INV-S4' | 'INV-S5'
  // 执行
  | 'INV-E1' | 'INV-E2' | 'INV-E3' | 'INV-E4' | 'INV-E5' | 'INV-E6' | 'INV-E7' | 'INV-E8' | 'INV-E9'
  // 效果
  | 'INV-D1' | 'INV-D2' | 'INV-D3' | 'INV-D4' | 'INV-D5'
  | 'INV-EL1' | 'INV-EL2' | 'INV-EL3' | 'INV-EL4'
  // 编目
  | 'INV-T1' | 'INV-T2' | 'INV-T3' | 'INV-T4' | 'INV-T5'
  | 'INV-C1' | 'INV-C2' | 'INV-C3' | 'INV-C4';

export type InvariantEnforcement = 'enforced' | 'checked' | 'logged';

export interface InvariantViolationReport {
  readonly id: InvariantId;
  readonly message: string;
  readonly subject?: string;
}

export interface InvariantRegistryEntry {
  readonly id: InvariantId;
  readonly enforcement: InvariantEnforcement;
  readonly statement: string;
}

/** §12 不变量总表：编号 → 表述 + 归类。总数固定为 47。 */
export const INVARIANTS: readonly InvariantRegistryEntry[] = [
  { id: 'INV-B1', enforcement: 'checked', statement: '队列占用数 ≤ 容量' },
  { id: 'INV-B2', enforcement: 'checked', statement: '队列无内部空洞（占用必须是前缀）' },
  { id: 'INV-B3', enforcement: 'checked', statement: '任何占位变更后同原子步内坍缩' },
  { id: 'INV-B4', enforcement: 'checked', statement: '坐标 ↔ 占用单位双向一致' },
  { id: 'INV-B5', enforcement: 'checked', statement: 'Unit.position 只读，仅 Placement 可写' },
  { id: 'INV-B6', enforcement: 'checked', statement: 'Zone 以坐标为键，与单位解耦' },
  { id: 'INV-B7', enforcement: 'enforced', statement: '满员时插入被拒绝并返回原因' },
  { id: 'INV-B8', enforcement: 'checked', statement: 'Zone 载荷是 EffectRef[]，整次触发只消耗一次 uses' },

  { id: 'INV-P1', enforcement: 'checked', statement: '溯源 sourceId 全局唯一（实例 ID，非类型 ID）' },
  { id: 'INV-P2', enforcement: 'checked', statement: '撤销恢复到"写入前的值"，非"减去写入量"' },
  { id: 'INV-P3', enforcement: 'checked', statement: '修正条目与账本条目一一对应' },
  { id: 'INV-P4', enforcement: 'checked', statement: '单位离场必须 revertAll()' },
  { id: 'INV-P5', enforcement: 'checked', statement: '硬控命中时清除全部 stance 状态' },
  { id: 'INV-P6', enforcement: 'enforced', statement: 'reach 与 targetSpec 正交' },
  { id: 'INV-P7', enforcement: 'logged', statement: 'dispel 只作用于 StatusInstance，不碰属性修正' },

  { id: 'INV-S1', enforcement: 'checked', statement: 'Gauge 触发为严格越过（>）' },
  { id: 'INV-S2', enforcement: 'enforced', statement: '先手序列按双方各自排序后交替合并' },
  { id: 'INV-S3', enforcement: 'logged', statement: '同 tick 内每单位至多一次机会' },
  { id: 'INV-S4', enforcement: 'logged', statement: '未消耗机会记为 wasted，不累积' },
  { id: 'INV-S5', enforcement: 'checked', statement: '行动周期是派生值，不可被 modify_stat 直改' },

  { id: 'INV-E1', enforcement: 'enforced', statement: '转向单跳 + visited 防环' },
  { id: 'INV-E2', enforcement: 'enforced', statement: '伤害随转向走，状态类效果留原目标' },
  { id: 'INV-E3', enforcement: 'enforced', statement: '群攻 = N 条独立结算链' },
  { id: 'INV-E4', enforcement: 'enforced', statement: 'on_take_damage 触发的 Action 不再二次触发同类事件' },
  { id: 'INV-E5', enforcement: 'enforced', statement: 'committedTargets 不可变，干预只做增量' },
  { id: 'INV-E6', enforcement: 'checked', statement: 'Manual 目标规格必须定义 fallbackSort' },
  { id: 'INV-E7', enforcement: 'logged', statement: '近战对撞同步结算：对撞致死不中断主攻击' },
  { id: 'INV-E8', enforcement: 'enforced', statement: '对撞伤害属行为伤害，正常进入通用乘区' },
  { id: 'INV-E9', enforcement: 'enforced', statement: '候选池提交时校验 stateVersion，不一致则重算' },

  { id: 'INV-D1', enforcement: 'checked', statement: '减伤阶段顺序固定且配置可见' },
  { id: 'INV-D2', enforcement: 'enforced', statement: '伤害结算全程无随机' },
  { id: 'INV-D3', enforcement: 'enforced', statement: '伤害链是纯函数，不修改状态' },
  { id: 'INV-D4', enforcement: 'enforced', statement: '状态来源伤害默认不进通用乘区' },
  { id: 'INV-D5', enforcement: 'checked', statement: 'heal 与 modify_resource 不得混用' },

  { id: 'INV-EL1', enforcement: 'enforced', statement: '元素是纯标签，语义由外部机制赋予' },
  { id: 'INV-EL2', enforcement: 'checked', statement: '元素挂在 effect 层，不在 behavior 层' },
  { id: 'INV-EL3', enforcement: 'checked', statement: 'damageCategory 是 element 的只读派生，映射表单点定义' },
  { id: 'INV-EL4', enforcement: 'enforced', statement: '元素与状态互不隐含，桥接必须显式配置' },

  { id: 'INV-T1', enforcement: 'checked', statement: '术语在编目期展开，运行期引擎零感知' },
  { id: 'INV-T2', enforcement: 'checked', statement: '术语引用图无环' },
  { id: 'INV-T3', enforcement: 'checked', statement: '覆写键必须是 overridable 子集' },
  { id: 'INV-T4', enforcement: 'checked', statement: '术语文案由实际生效参数渲染' },
  { id: 'INV-T5', enforcement: 'enforced', statement: '术语多段共享同一冻结坐标' },

  { id: 'INV-C1', enforcement: 'checked', statement: '所有 ref 可解析，加载时全量校验' },
  { id: 'INV-C2', enforcement: 'checked', statement: '数值单点定义（Def 管默认，Grant 管实例值）' },
  { id: 'INV-C3', enforcement: 'checked', statement: '战斗启动时快照 Catalog' },
  { id: 'INV-C4', enforcement: 'checked', statement: '展开与环路/白名单校验在 Catalog 加载时完成' },
];

export const INVARIANT_COUNT = INVARIANTS.length;

export function invariantStatement(id: InvariantId): string {
  return INVARIANTS.find((i) => i.id === id)?.statement ?? '';
}

/** 把违规清单渲染成人类可读的报告（验证脚本 / CI 用）。 */
export function formatViolations(violations: readonly InvariantViolationReport[]): string {
  if (violations.length === 0) return '无违规';
  return violations.map((v) => `[${v.id}] ${v.subject ?? ''} ${v.message}`).join('\n');
}
