// 编目 def（召唤物 unitDef / 区域 zoneDef / 界域 domainDef）→ 详情块，供两处渲染：
// 悬停浮层（tooltip.js 的 fillTip）与卡面「界域定义 / 区域定义」折叠块（views/card.js）。
// 一律读池——池是权威定义，卡级 zone/domain 是「引用池 def + 展示副本」（实现在 entities.js 有注：
// 两出同名时以池为准）。与 status.js 的 renderStatusDetail 同构：分组 + 末段兜底列其余字段
import { DB } from './data.js';
import { termSpan, escapeHtml } from './term.js';
import { renderEffects } from './ast.js';

const DEF_CAT = { unitDef: 'unitDefMap', zoneDef: 'zoneDefMap', domainDef: 'domainDefMap' };

const chips = (arr) => {
  const c = arr.filter(Boolean);
  return c.length ? `<div class="tt-chips">${c.map((x) => `<span class="badge">${x}</span>`).join('')}</div>` : '';
};
const kvRow = (label, inner) => `<div class="tt-kv"><span class="muted">${escapeHtml(label)}</span> ${inner}</div>`;
const sec = (title, inner) => (inner ? `<div class="tt-sec">${title}</div>${inner}` : '');
const noteHtml = (s) => (s ? `<div class="ast-note">${escapeHtml(s)}</div>` : '');

function valHtml(v) {
  if (v == null) return '';
  if (typeof v === 'boolean') return v ? '✓' : '✗';
  if (typeof v === 'object') return `<span class="kv-raw">${escapeHtml(JSON.stringify(v))}</span>`;
  return escapeHtml(String(v));
}

// 持续时长：与 status.js / card.js 同一写法（durationUnit 缺失时不臆断单位）
function durationText(d) {
  if (d.duration == null) return null;
  const unit = d.durationUnit ? ` ${termSpan('durationUnit', d.durationUnit, { showKey: false })}` : '';
  return `持续 ${d.duration}${unit}`;
}

// 规则补丁 = 声明式规则改写（不写新原语）。与 card.js 的同名函数保持一致的字段读法
function rulePatchHtml(rp) {
  if (!rp) return '';
  const parts = [`规则补丁：${termSpan('rulePatchKind', rp.kind)}`];
  if (rp.side) parts.push(termSpan('side', rp.side));
  if (rp.tag) parts.push(`tag=${escapeHtml(JSON.stringify(rp.tag))}`);
  if (rp.stat) parts.push(`属性 ${termSpan('stat', rp.stat)}`);
  if (rp.effectType) parts.push(`原语 ${termSpan('primitive', rp.effectType)}`);
  if (rp.mul != null) parts.push(`×${rp.mul}`);
  if (rp.delta != null) parts.push(`Δ${rp.delta}`);
  const html = `<div>${parts.join(' · ')}</div>`;
  return rp.note ? html + noteHtml(rp.note) : html;
}

function triggersHtml(triggers) {
  return triggers.map((tr) => `<div class="ast-node">
    <div class="ast-line"><span class="muted">触发：</span>${termSpan('triggerEvent', tr.event)}</div>
    ${renderEffects(tr.effects)}
  </div>`).join('');
}

// 各池显式消费的字段；其余字段走末段兜底，保证任何一个有值都看得见（口径同 status.js 的 HANDLED）
const HANDLED = {
  unitDef: new Set(['id', 'name', 'base', 'baseOn', 'unitType', 'hpRatio', 'atkRatio', 'element', 'reach', 'tags', 'gender', 'triggers', 'note']),
  zoneDef: new Set(['id', 'kind', 'trigger', 'affects', 'effects', 'duration', 'durationUnit', 'interval', 'placement', 'modifiers', 'envRulesText', 'note']),
  domainDef: new Set(['id', 'tier', 'dispelable', 'duration', 'durationUnit', 'triggers', 'rulePatches', 'envRules', 'extraRuleNote', 'note']),
};

function restHtml(cat, def) {
  const handled = HANDLED[cat] || new Set(['id']);
  const rest = Object.entries(def).filter(([k, v]) => !handled.has(k) && !k.startsWith('_') && v != null
    && !(Array.isArray(v) && !v.length)
    && !(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length));
  if (!rest.length) return '';
  return rest.map(([k, v]) => kvRow(k, valHtml(v))).join('');
}

function unitHtml(d) {
  const rows = [];
  // base 是基准档对象 {hpRatio, atkRatio, reach}（不是字符串），顶层 hpRatio/atkRatio/reach 是覆盖
  if (d.baseOn) rows.push(kvRow('承自', escapeHtml(String(d.baseOn))));
  if (typeof d.base === 'string') rows.push(kvRow('基型', escapeHtml(d.base)));
  if (d.base && typeof d.base === 'object') {
    const segs = [];
    if (d.base.hpRatio != null) segs.push(`生命×${d.base.hpRatio}`);
    if (d.base.atkRatio != null) segs.push(`攻击×${d.base.atkRatio}`);
    if (d.base.reach) segs.push(`距离 ${termSpan('reach', d.base.reach, { showKey: false })}`);
    if (segs.length) rows.push(kvRow('基准档', segs.join(' · ')));
  }
  if (d.gender) rows.push(kvRow('性别', termSpan('gender', d.gender, { showKey: false })));
  if (d.reach) rows.push(kvRow('覆盖距离', termSpan('reach', d.reach, { showKey: false })));
  if (d.hpRatio != null) rows.push(kvRow('覆盖生命', `×${d.hpRatio}`));
  if (d.atkRatio != null) rows.push(kvRow('覆盖攻击', `×${d.atkRatio}`));
  const trig = (d.triggers || []).length ? sec('定义内触发', triggersHtml(d.triggers)) : '';
  return [
    chips([d.unitType ? termSpan('unitType', d.unitType) : '', d.element ? termSpan('element', d.element) : '']),
    (d.tags || []).length ? `<div class="tt-chips">${d.tags.map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join('')}</div>` : '',
    rows.join(''),
    trig,
    noteHtml(d.note),
    sec('其余字段', restHtml('unitDef', d)),
  ];
}

function zoneHtml(d) {
  const rows = [];
  if (d.affects) rows.push(kvRow('作用对象', termSpan('zoneAffects', d.affects, { showKey: false })));
  if (d.trigger) rows.push(kvRow('触发时机', termSpan('zoneTrigger', d.trigger, { showKey: false })));
  if (d.interval != null) rows.push(kvRow('触发间隔', `${d.interval}`));
  if (d.placement) rows.push(kvRow('落位', valHtml(d.placement)));
  if (d.modifiers) rows.push(kvRow('modifiers', valHtml(d.modifiers)));
  return [
    chips([d.kind ? termSpan('zoneKind', d.kind) : '', d.duration != null ? durationText(d) : '']),
    rows.join(''),
    (d.effects || []).length ? sec('领域效果', renderEffects(d.effects)) : '',
    noteHtml(d.envRulesText),
    noteHtml(d.note),
    sec('其余字段', restHtml('zoneDef', d)),
  ];
}

function domainHtml(d) {
  const rows = [];
  if (d.dispelable === false) rows.push(kvRow('驱散', '不可驱散'));
  else if (d.dispelable === true) rows.push(kvRow('驱散', '可驱散'));
  const rps = d.rulePatches || [];
  const trig = (d.triggers || []).length ? sec('域内触发', triggersHtml(d.triggers)) : '';
  return [
    chips([d.tier ? termSpan('domainTier', d.tier) : '', d.duration != null ? durationText(d) : '']),
    rows.join(''),
    rps.length ? sec('规则补丁', rps.map(rulePatchHtml).join('')) : '',
    trig,
    noteHtml(d.extraRuleNote),
    noteHtml(d.note),
    sec('其余字段', restHtml('domainDef', d)),
  ];
}

export function renderDefDetail(cat, id) {
  const def = DB[DEF_CAT[cat]]?.get(id);
  if (!def) return '';
  const body = cat === 'unitDef' ? unitHtml(def) : cat === 'zoneDef' ? zoneHtml(def) : domainHtml(def);
  return body.filter(Boolean).join('');
}
