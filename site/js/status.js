// 状态定义 → 悬停详情：按 docs/meta/DESIGN_CHECKLIST.md「设计一个状态：7 步」分组——
// 身份（分类）/ 时长模型（chips）/ 读档能力 / 行为载荷 / 跨系开关 / 特殊机制件 / 其余字段兜底，
// 外加 effects/triggers 的 AST 精读（与卡面 effect AST 同构，复用 ast.js 的中文渲染器）
import { DB } from './data.js';
import { termSpan, statusSpan, escapeHtml } from './term.js';
import { renderEffects } from './ast.js';

// duration 为 null 表示不按回合衰减（由 charges 或驱散决定生命周期），此时不臆断文案
function overviewHtml(def) {
  const chips = [];
  if (def.duration != null) chips.push(`持续 ${def.duration}`);
  if (def.maxStacks != null) chips.push(`上限 ${def.maxStacks} 层`);
  if (def.charges != null) chips.push(`${def.charges} 次`);
  if (def.dispelable === false) chips.push('不可驱散');
  else if (def.dispelable === true) chips.push('可驱散');
  if (def.stackPolicy) chips.push(`叠层·${termSpan('stackPolicy', def.stackPolicy, { showKey: false })}`);
  if (def.stackCapOverride != null) chips.push(`叠层上限覆盖 ${def.stackCapOverride}`);
  if (!chips.length) return '';
  return `<div class="tt-chips">${chips.map((c) => `<span class="badge">${c}</span>`).join('')}</div>`;
}

// 标量/对象 → 紧凑展示：对象给压缩 JSON（结构由 schema 定，键名本身就是最准的注释）
function valHtml(v) {
  if (v == null) return '';
  if (typeof v === 'boolean') return v ? '✓' : '✗';
  if (typeof v === 'object') return `<span class="kv-raw">${escapeHtml(JSON.stringify(v))}</span>`;
  return escapeHtml(String(v));
}

// k=v 内联串（statPerStack 这类小表用，不另起行）
function inlineKv(obj) {
  return Object.entries(obj).map(([k, v]) => `${escapeHtml(k)}=${valHtml(v)}`).join('，');
}

function kvRow(label, inner) {
  return `<div class="tt-kv"><span class="muted">${escapeHtml(label)}</span> ${inner}</div>`;
}

// label 已是 HTML（术语 span）的版本——修饰键等行首要走词典悬停，不能过 escapeHtml
function kvRowHtml(labelHtml, inner) {
  return `<div class="tt-kv"><span class="muted">${labelHtml}</span> ${inner}</div>`;
}

function triggersHtml(triggers) {
  return triggers.map((tr) => `<div class="ast-node">
    <div class="ast-line"><span class="muted">触发：</span>${termSpan('triggerEvent', tr.event)}</div>
    ${renderEffects(tr.effects)}
  </div>`).join('');
}

// 第 3 步「读档能力」：状态的 payoff 接口——层数引擎对外的全部读法
function readLayerHtml(def) {
  const rows = [];
  // stackThreshold 两种形态：裸数字 / {stacks: n}（19 处全为对象形态，兼容裸值）
  const stackThresh = typeof def.stackThreshold === 'object'
    ? def.stackThreshold?.stacks : def.stackThreshold;
  if (def.statPerStack) rows.push(kvRow('每层载荷', inlineKv(def.statPerStack)));
  if (stackThresh != null) rows.push(kvRow('层数档', `≥ ${stackThresh} 层`));
  if (def.thresholdTrigger) {
    const tt = def.thresholdTrigger;
    if (tt.effects?.length) rows.push(kvRow(`到档触发（≥${tt.stacks ?? stackThresh ?? '?'} 层）`, renderEffects(tt.effects)));
    if (tt.note) rows.push(`<div class="ast-note">${escapeHtml(tt.note)}</div>`);
  }
  if (def.ramp?.length) rows.push(kvRow('递增载荷', escapeHtml(def.ramp.join(' → '))));
  if (def.phases?.length) {
    const chain = def.phases.map((p) => statusSpan(p)).join(' → ');
    rows.push(kvRow('形态轮转', chain + (def.nextPhase ? `（下一相 ${statusSpan(def.nextPhase)}）` : '')));
  }
  return rows.join('');
}

// modifiers 两种形态：对象 {键: 值} / 数组 [{kind, ...}]（口径同 views/status.js 的 modifierKeys）。
// 行首走词典 modifierKey 术语（中文名+释义悬停，未登记键带 missing 标红——治理批 2026-10-02 的同一正典）
function modifiersRows(def) {
  const m = def.modifiers;
  if (!m) return '';
  if (Array.isArray(m)) {
    return m.map((x) => typeof x === 'string'
      ? kvRowHtml(termSpan('modifierKey', x), '✓')
      : kvRowHtml(termSpan('modifierKey', x.kind || '?'), valHtml({ ...x, kind: undefined }))).join('');
  }
  return Object.entries(m).map(([k, v]) => kvRowHtml(termSpan('modifierKey', k), valHtml(v))).join('');
}

// 第 4 步「行为载荷」：modifiers / 行为修正 / 禁行动 / 防御语义件
function behaviorHtml(def) {
  const rows = [modifiersRows(def)];
  if (def.behaviorModifiers?.length) {
    rows.push(def.behaviorModifiers.map((x) => kvRow('行为修正', valHtml(x))).join(''));
  }
  if (def.disallowActions?.length) {
    rows.push(kvRow('禁行动', def.disallowActions.map((a) => termSpan('actionLock', a, { showKey: false })).join('、')));
  }
  if (def.lethalProtect) rows.push(kvRow('免死保护', '✓'));
  if (def.reviveBlocked) rows.push(kvRow('阻断复活', '✓'));
  if (def.silent_immune) rows.push(kvRow('沉默免疫', '✓'));
  if (def.immune) rows.push(kvRow('免疫', valHtml(def.immune)));
  if (def.suppress) rows.push(kvRow('压制', valHtml(def.suppress)));
  if (def.redirectRule) {
    rows.push(kvRow('重定向规则', valHtml(def.redirectRule)));
    if (def.redirectRule.note) rows.push(`<div class="ast-note">${escapeHtml(def.redirectRule.note)}</div>`);
  }
  if (def.healReceivedMul != null) rows.push(kvRow('受疗倍率', `×${def.healReceivedMul}`));
  if (def.damageTransfer) {
    const t = def.damageTransfer;
    const segs = [];
    if (t.ratio != null) segs.push(`比例 ${Math.round(t.ratio * 100)}%`);
    if (t.direction) segs.push(termSpan('transferDirection', t.direction, { showKey: false }));
    if (t.split) segs.push(`分摊 ${escapeHtml(t.split)}`);
    if (t.selfKeep != null) segs.push(t.selfKeep ? '源头自留' : '源头不留');
    if (t.linkedTo) segs.push(`链接 ${escapeHtml(String(t.linkedTo))}`);
    if (t.linkedFrom) {
      const lf = t.linkedFrom;
      segs.push(`承伤方 ${escapeHtml(lf.scope)}·${escapeHtml(lf.sort)}`);
    }
    rows.push(kvRow('伤害转嫁', segs.join(' · ')));
    if (t.linkedFrom?.note) rows.push(`<div class="ast-note">${escapeHtml(t.linkedFrom.note)}</div>`);
    if (t.note) rows.push(`<div class="ast-note">${escapeHtml(t.note)}</div>`);
  }
  if (def.statMods) rows.push(kvRow('属性修正', inlineKv(def.statMods)));
  return rows.join('');
}

// 第 5 步「跨系开关」：不写默认途径私有；participants 是可悬停查途径的 term
function crossHtml(def) {
  if (!def.crossPathway && !(def.participants || []).length) return '';
  const names = (def.participants || []).map((pid) => {
    const p = DB.pathways.find((x) => x.id === pid);
    return `<span class="term" data-cat="pathway" data-key="${escapeHtml(pid)}">${escapeHtml(p?.name || pid)}</span>`;
  }).join('、');
  return kvRow('跨途径', `${def.crossPathway ? '✓ ' : ''}${names || '—'}`);
}

// 第 6 步「特殊机制件」：用到才出现的机制挂钩，逐个给可读行
function mechanismHtml(def) {
  const rows = [];
  if (def.formGroup || def.cycleTicks != null) {
    rows.push(kvRow('形态轮转',
      [def.formGroup ? `组 ${escapeHtml(def.formGroup)}` : '', def.cycleTicks != null ? `${def.cycleTicks} tick/相` : ''].filter(Boolean).join(' · ')));
  }
  if (def.slots) rows.push(kvRow('槽位', valHtml(def.slots)));
  if (def.lineageStack) rows.push(kvRow('异类谱系', valHtml(def.lineageStack)));
  if (def.summonMapping?.length) {
    rows.push(def.summonMapping.map((m) =>
      kvRow(`刻印 ≥${m.stacks} 层`,
        `召唤 ×${m.count}（攻×${m.atkRatio ?? '?'} 生×${m.hpRatio ?? '?'}）${m.note ? ` <span class="muted">${escapeHtml(m.note)}</span>` : ''}`)
    ).join(''));
  }
  if (def.contagious) rows.push(kvRow('可传染', '✓'));
  if (def.transferOnDeath) rows.push(kvRow('死亡时转移', '✓'));
  return rows.join('');
}

// 兜底：已结构化展示之外、仍有值的字段（hpRatio / countMode / priority 等长尾）压缩列出，
// 保证 38 字段任何一个有值都看得见。已消费字段清单 = 上面各节显式处理的并集
const HANDLED = new Set([
  'id', 'name', 'category', 'note', 'duration', 'maxStacks', 'charges', 'dispelable',
  'stackPolicy', 'stackCapOverride', 'effects', 'triggers',
  'statPerStack', 'stackThreshold', 'thresholdTrigger', 'ramp', 'phases', 'nextPhase',
  'modifiers', 'behaviorModifiers', 'disallowActions', 'lethalProtect', 'reviveBlocked',
  'silent_immune', 'immune', 'suppress', 'redirectRule', 'healReceivedMul', 'damageTransfer', 'statMods',
  'crossPathway', 'participants', 'formGroup', 'cycleTicks', 'slots', 'lineageStack',
  'summonMapping', 'contagious', 'transferOnDeath',
]);

function restHtml(def) {
  const rest = Object.entries(def).filter(([k, v]) => !HANDLED.has(k) && k !== '_owner' && v != null
    && !(Array.isArray(v) && !v.length)
    && !(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length));
  if (!rest.length) return '';
  return rest.map(([k, v]) => kvRow(k, valHtml(v))).join('');
}

const sec = (title, inner) => (inner ? `<div class="tt-sec">${title}</div>${inner}` : '');

export function renderStatusDetail(id) {
  const def = DB.statusMap.get(id);
  if (!def) return '';
  const blocks = [overviewHtml(def)];
  const cats = [].concat(def.category || []);
  if (cats.length) {
    blocks.push(`<div class="tt-chips">${cats.map((c) => `<span class="badge">${termSpan('statusCategory', c, { showKey: false })}</span>`).join('')}</div>`);
  }
  blocks.push(sec('读档能力', readLayerHtml(def)));
  blocks.push(sec('行为载荷', behaviorHtml(def)));
  blocks.push(sec('跨系开关', crossHtml(def)));
  blocks.push(sec('特殊机制件', mechanismHtml(def)));
  blocks.push(sec('其余字段', restHtml(def)));
  if (def.effects?.length) blocks.push(`<div class="tt-sec">效果</div>${renderEffects(def.effects)}`);
  if (def.triggers?.length) blocks.push(`<div class="tt-sec">触发</div>${triggersHtml(def.triggers)}`);
  return blocks.filter(Boolean).join('');
}
