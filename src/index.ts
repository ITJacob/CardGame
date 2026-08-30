/**
 * 卡牌对战系统 · 核心逻辑层。
 *
 * 这一层不含任何 UI、渲染、网络、持久化——它只负责一件事：
 * 把战斗当成一个**确定性纯函数**推进。
 *
 *   结果 = f(初始状态, 输入序列, seed)      （B1 / R6）
 *
 * 目录结构与《02_详细设计》的限界上下文一一对应：
 *   shared/       共享内核：标识、Result、事件字典、元素、目标规格、条件谓词
 *   catalog/      编目（独立聚合）：各 Def、术语编目期展开、编译期校验
 *   battle/       战场：坐标 / 路线 / Placement 唯一占位出口 / Zone
 *   roster/       编队：Unit、属性三层、Gauge / Pool、StatProvenance、状态
 *   scheduling/   调度：BattleClock、ActionOpportunity、先手、可选行为
 *   execution/    执行：Action、I→R→M→O 流水线、近战对撞
 *   effect/       效果：DamageChain、九种效果执行体
 *   random/       随机源治理（R1–R6）
 *   combat/       聚合根 Combat
 */

// ——— shared ———
export * from './shared/ids.js';
export * from './shared/result.js';
export * from './shared/json.js';
export * from './shared/enums.js';
export * from './shared/events.js';
export * from './shared/target-spec.js';
export * from './shared/effect-condition.js';

// ——— random ———
export * from './random/random-source.js';

// ——— catalog ———
export * from './catalog/model.js';
export * from './catalog/balance.js';
export * from './catalog/term-expander.js';
export * from './catalog/catalog.js';

// ——— battle ———
export * from './battle/coordinate.js';
export * from './battle/battlefield.js';
export * from './battle/collapse.js';
export * from './battle/occupancy.js';
export * from './battle/zone.js';
export * from './battle/battle.js';
export * from './battle/placement.js';

// ——— roster ———
export * from './roster/attributes.js';
export * from './roster/resources.js';
export * from './roster/provenance.js';
export * from './roster/status.js';
export * from './roster/behavior-slot.js';
export * from './roster/behavior-constraints.js';
export * from './roster/unit.js';
export * from './roster/registry.js';

// ——— scheduling ———
export * from './scheduling/opportunity.js';
export * from './scheduling/initiative.js';
export * from './scheduling/filter.js';
export * from './scheduling/clock.js';

// ——— effect ———
export * from './effect/context.js';
export * from './effect/damage-chain.js';
export * from './effect/handlers.js';
export * from './effect/executor.js';

// ——— execution ———
export * from './execution/target.js';
export * from './execution/action.js';
export * from './execution/host.js';
export * from './execution/pipeline-i.js';
export * from './execution/pipeline-r.js';
export * from './execution/pipeline.js';
export * from './execution/commit.js';

// ——— combat ———
export * from './combat/combat.js';

// ——— 示例编目 ———
export { sampleCatalog } from './data/sample-catalog.js';
