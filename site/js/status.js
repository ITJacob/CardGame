// 状态定义 → 悬停详情：概要数值（持续/叠层/次数/可驱散）+ effects/triggers 的 AST 精读
// effects/triggers 与卡面 effect AST 同构，直接复用 ast.js 的中文渲染器
import { DB } from './data.js';
import { termSpan, escapeHtml } from './term.js';
import { renderEffects } from './ast.js';

// duration 为 null 表示不按回合衰减（由 charges 或驱散决定生命周期），此时不臆断文案
function overviewHtml(def) {
  const chips = [];
  if (def.duration != null) chips.push(`持续 ${def.duration}`);
  if (def.maxStacks != null) chips.push(`上限 ${def.maxStacks} 层`);
  if (def.charges != null) chips.push(`${def.charges} 次`);
  if (def.dispelable === false) chips.push('不可驱散');
  else if (def.dispelable === true) chips.push('可驱散');
  if (!chips.length) return '';
  return `<div class="tt-chips">${chips.map((c) => `<span class="badge">${escapeHtml(c)}</span>`).join('')}</div>`;
}

function triggersHtml(triggers) {
  return triggers.map((tr) => `<div class="ast-node">
    <div class="ast-line"><span class="muted">触发：</span>${termSpan('triggerEvent', tr.event)}</div>
    ${renderEffects(tr.effects)}
  </div>`).join('');
}

export function renderStatusDetail(id) {
  const def = DB.statusMap.get(id);
  if (!def) return '';
  const blocks = [overviewHtml(def)];
  if (def.effects?.length) blocks.push(`<div class="tt-sec">效果</div>${renderEffects(def.effects)}`);
  if (def.triggers?.length) blocks.push(`<div class="tt-sec">触发</div>${triggersHtml(def.triggers)}`);
  return blocks.filter(Boolean).join('');
}
