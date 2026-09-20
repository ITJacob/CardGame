// effects AST → 中文渲染
// 三级兜底：① 原语句式模板 ② 未覆盖字段 key=value 灰显 ③ note 附注行；describe 恒在详情页顶部
import { termSpan, statusSpan, escapeHtml } from './term.js';

// 字段名 → 中文（原始键兜底展示用）
const FIELD_ZH = {
  value: '数值', target: '目标', condition: '条件', duration: '持续', stacks: '层数',
  charges: '次数', stackMode: '叠层方式', statusId: '状态', element: '元素', mul: '系数',
  spread: '溅射', pierce: '穿透', lethal: '致死', neverMiss: '必中', stat: '属性', mode: '方式',
  resource: '资源', op: '方式', distance: '距离', unitId: '单位', position: '位置',
  hpRatio: '生命比例', atkRatio: '攻击比例', reviveOf: '复活对象', dispelTarget: '驱散对象',
  filter: '过滤', category: '类别', count: '数量', healRatio: '回复比例', def: '界域定义',
  returnPayload: '回归载荷', scope: '范围', slot: '槽位', field: '字段', overwrite: '覆盖',
  potency: '强度', rounding: '取整', skillRef: '技能', clearCooldown: '清冷却', costDelta: '消耗增减',
  setInstant: '转瞬发', targetingModeOverride: '选靶改写', addDuration: '延长持续',
  setDuration: '设定持续', maxStacksDelta: '层数上限增减', dispelableOverride: '可驱散改写',
  untargetable: '不可选中', direction: '方向', against: '针对', onExpire: '到期处理',
  actionPolicy: '行为策略', steps: '步骤', then: '则', else: '否则', times: '次数',
  sort: '排序', mapping: '映射', fallback: '兜底', statusesFrom: '状态来源', to: '去向',
  between: '双方', collect: '收集', snapshot: '快照', variant: '变体', template: '模板',
  unit: '单位', zone: '区域', consumption: '消耗', kind: '类型', side: '作用方', tag: '标签',
  durationUnit: '时长单位', anchor: '锚点', sortKey: '排序键', faction: '阵营',
};

// 字段名 → 值所在枚举类别（用于值翻译）
const FIELD_VALUE_CAT = {
  element: 'element', stat: 'stat', resource: 'resource', stackMode: 'stackMode',
  dispelTarget: 'dispelTarget', reviveOf: 'reviveOf', position: 'spawnPosition',
  rounding: 'rounding', direction: 'targetabilityDirection', onExpire: 'onExpire',
  actionPolicy: 'actionPolicy', field: 'ruleSlotField', category: 'statusCategory',
  faction: 'faction', anchor: 'anchor', sortKey: 'sortKey', sort: 'sortKey',
  spread: 'spread', side: 'side', consumption: 'consumption', durationUnit: 'durationUnit',
  scope: 'scope', kind: 'zoneKind',
};

function fmtVal(v) {
  if (v == null) return '';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    if (v.startsWith('$')) return `<span class="mono">${escapeHtml(v)}</span>`;
    if (v.startsWith('statusStacks:')) return `${statusSpan(v.slice(13))}层数`;
    return escapeHtml(v);
  }
  if (Array.isArray(v)) return v.map(fmtVal).join('、');
  if (typeof v === 'object') {
    return `<span class="kv-raw">${escapeHtml(JSON.stringify(v))}</span>`;
  }
  return String(v);
}

function tgt(e) {
  return e.target ? termSpan('effectTarget', e.target) : '目标';
}

function condToText(c) {
  if (!c || typeof c !== 'object') return '';
  const k = c.kind;
  const KT = (s) => termSpan('conditionKind', s);
  switch (k) {
    case 'has_status':
    case 'caster_status_exists': {
      const raw = c.statusId || c.status || c.id || '?';
      const ids = [].concat(raw);
      const who = k === 'caster_status_exists' ? '施法者' : (c.side ? termSpan('side', c.side) : '目标');
      const cmpN = c.cmp && c.n != null ? ` ${c.cmp} ${c.n} 层` : '';
      return `${who}持有${ids.map(statusSpan).join(' 或 ')}${cmpN}`;
    }
    case 'has_category': return `${c.side ? termSpan('side', c.side) : '目标'}持有${termSpan('statusCategory', c.category)}类状态`;
    case 'chance': return `${Math.round((c.p ?? 0) * 100)}% 概率`;
    case 'hp_percent': return `${c.side ? termSpan('side', c.side) : '目标'}生命 ${c.cmp || ''} ${c.value ?? c.percent ?? '?'}%`;
    case 'stat_compare': {
      if (c.key) {
        const a = c.aUnit ? termSpan('effectTarget', c.aUnit) : '施法者';
        const b = c.bUnit ? termSpan('effectTarget', c.bUnit) : '目标';
        return `${a}的${termSpan('stat', c.key)} ${c.cmp || ''} ${b}的${termSpan('stat', c.key)}`;
      }
      return `${termSpan('stat', c.stat || '?')} ${c.cmp || ''} ${fmtVal(c.value)}`;
    }
    case 'target_unit_type': {
      const ts = [].concat(c.unitType || c.unitTypes || c.type || c.value || '?');
      return `目标类型为${ts.map((t) => termSpan('unitType', t)).join(' 或 ')}`;
    }
    case 'target_is_summoned': return '目标是召唤物';
    case 'caster_has_summon': return '施法者有召唤物在场';
    case 'target_has_tag': return `目标带「${escapeHtml(c.tag || '?')}」标签`;
    case 'target_faction_is': return `目标阵营为${termSpan('faction', c.faction || c.value || '?')}`;
    case 'target_dead': return '目标已死亡';
    case 'zone_active': return `区域激活`;
    case 'gauge_rank': return `行动条位次 ${c.cmp || ''} ${fmtVal(c.value)}`;
    case 'dead_count': return `死亡数 ${c.cmp || ''} ${fmtVal(c.value)}`;
    case 'dispelled_count': return `被驱散数 ${c.cmp || ''} ${fmtVal(c.value)}`;
    case 'consumed_count': return `已消耗数 ${c.cmp || ''} ${fmtVal(c.value)}`;
    case 'any_of': {
      const subs = (c.conds || c.conditions || c.items || []).map(condToText).filter(Boolean);
      return subs.length ? `（${subs.join(' 或 ')}）` : KT(k);
    }
    default: {
      const extras = Object.entries(c).filter(([kk]) => kk !== 'kind')
        .map(([kk, vv]) => `${FIELD_ZH[kk] || kk}=${fmtVal(vv)}`).join(' ');
      return `${KT(k)}${extras ? ` <span class="kv-raw">${extras}</span>` : ''}`;
    }
  }
}

// 每个原语：模板已消费的字段
const PRIMITIVE_TEMPLATES = {
  damage: (e, used) => {
    used.push('value', 'element', 'mul', 'spread', 'pierce', 'lethal', 'neverMiss');
    const elem = typeof e.element === 'string' && e.element.startsWith('$')
      ? `<span class="mono">${escapeHtml(e.element)}</span>`
      : (e.element ? termSpan('element', e.element) : '');
    let s = `对${tgt(e)}造成 ${fmtVal(e.value)} 点${elem}伤害`;
    const extras = [];
    if (e.mul != null) extras.push(`×${fmtVal(e.mul)}`);
    if (e.spread) extras.push(termSpan('spread', e.spread));
    if (e.pierce) extras.push(`穿透${[].concat(e.pierce).map((p) => termSpan('damagePierce', p)).join('/')}`);
    if (e.lethal) extras.push('可致死');
    if (e.neverMiss) extras.push('必中');
    return s + (extras.length ? `（${extras.join('，')}）` : '');
  },
  heal: (e, used) => {
    used.push('value', 'mode');
    let s = `治疗${tgt(e)} ${fmtVal(e.value)} 点生命`;
    if (e.mode) s += `（${termSpan('healMode', e.mode)}）`;
    return s;
  },
  mount_status: (e, used) => {
    used.push('statusId', 'status', 'duration', 'stacks', 'stackMode', 'charges');
    const id = e.statusId || e.status;
    const parts = [];
    if (e.duration != null) parts.push(`持续 ${fmtVal(e.duration)}`);
    if (e.stacks != null) parts.push(`${fmtVal(e.stacks)} 层`);
    if (e.stackMode) parts.push(termSpan('stackMode', e.stackMode));
    if (e.charges != null) parts.push(`${fmtVal(e.charges)} 次`);
    return `给${tgt(e)}挂载${id ? statusSpan(id) : '状态'}${parts.length ? `（${parts.join('，')}）` : ''}`;
  },
  modify_stat: (e, used) => {
    used.push('stat', 'value', 'mode', 'duration', 'sourceRef', 'spread');
    const modeTxt = { delta: '增减', set: '设为', mul: '乘以', to_at_least: '至少提到', to_at_most: '至多压到' }[e.mode] || e.mode || '增减';
    let s = `${tgt(e)}的${termSpan('stat', e.stat)} ${modeTxt} ${fmtVal(e.value)}`;
    const parts = [];
    if (e.duration != null) parts.push(`持续 ${fmtVal(e.duration)}`);
    if (e.sourceRef) parts.push(`参照${termSpan('sourceRef', e.sourceRef)}`);
    if (parts.length) s += `（${parts.join('，')}）`;
    return s;
  },
  modify_resource: (e, used) => {
    used.push('resource', 'value', 'mode', 'op', 'between');
    const modeTxt = { delta: '增减', set: '设为', swap: '交换' }[e.mode || e.op] || (e.mode || e.op || '增减');
    let s = `${tgt(e)}的${termSpan('resource', e.resource)} ${modeTxt} ${fmtVal(e.value)}`;
    if (e.between) s += `（在${[].concat(e.between).map((b) => termSpan('effectTarget', b)).join(' 与 ')}之间）`;
    return s;
  },
  move: (e, used) => {
    used.push('op', 'distance');
    let s = `${tgt(e)}${termSpan('moveOp', e.op)}`;
    if (e.distance != null) s += ` ${fmtVal(e.distance)} 格`;
    return s;
  },
  spawn: (e, used) => {
    used.push('unitId', 'unit', 'template', 'position', 'hpRatio', 'atkRatio', 'reviveOf', 'kind', 'zone', 'def', 'consumption', 'variant');
    const what = e.unitId || e.unit || e.template || e.def || e.zone;
    if (e.reviveOf) return `复活${termSpan('reviveOf', e.reviveOf)}${e.hpRatio != null ? `（生命 ${Math.round(e.hpRatio * 100)}%）` : ''}`;
    let s = `召唤 <span class="mono">${escapeHtml(String(what || '?'))}</span>`;
    const parts = [];
    if (e.position) parts.push(`位置：${termSpan('spawnPosition', e.position)}`);
    if (e.hpRatio != null) parts.push(`生命比例 ${fmtVal(e.hpRatio)}`);
    if (e.atkRatio != null) parts.push(`攻击比例 ${fmtVal(e.atkRatio)}`);
    if (parts.length) s += `（${parts.join('，')}）`;
    return s;
  },
  dispel: (e, used) => {
    used.push('dispelTarget', 'filter', 'category', 'count', 'mode', 'collect');
    let s = `驱散${tgt(e)}的`;
    s += e.category ? `${termSpan('statusCategory', e.category)}类状态` : '状态';
    const parts = [];
    if (e.dispelTarget) parts.push(`对象：${termSpan('dispelTarget', e.dispelTarget)}`);
    if (e.count != null) parts.push(`数量：${fmtVal(e.count)}`);
    if (e.mode) parts.push(termSpan('dispelMode', e.mode));
    if (parts.length) s += `（${parts.join('，')}）`;
    return s;
  },
  drain: (e, used) => {
    used.push('resource', 'value', 'healRatio', 'category', 'count');
    let s = `从${tgt(e)}汲取 ${fmtVal(e.value)} 点${termSpan('resource', e.resource)}`;
    if (e.healRatio != null) s += `，按 ${Math.round(e.healRatio * 100)}% 回复自身`;
    return s;
  },
  domain: (e, used) => {
    used.push('op', 'def', 'duration', 'durationUnit');
    let s = `${termSpan('domainOp', e.op)}界域 <span class="mono">${escapeHtml(String(e.def || '?'))}</span>`;
    if (e.duration != null) s += `（持续 ${fmtVal(e.duration)}${e.durationUnit ? ' ' + termSpan('durationUnit', e.durationUnit, { showKey: false }) : ''}）`;
    return s;
  },
  translocate: (e, used) => {
    used.push('op', 'duration', 'returnPayload');
    let s = `${termSpan('translocateOp', e.op)}${tgt(e)}`;
    if (e.duration != null) s += `（${fmtVal(e.duration)} tick 后回归）`;
    return s;
  },
  modify_damage: (e, used) => {
    used.push('scope', 'mul');
    return `修正${termSpan('modifyDamageScope', e.scope)} ×${fmtVal(e.mul)}`;
  },
  target_override: (e, used) => {
    used.push('faction', 'anchor', 'sort');
    const parts = [];
    if (e.faction) parts.push(`阵营 ${termSpan('faction', e.faction)}`);
    if (e.anchor) parts.push(`锚点 ${termSpan('anchor', e.anchor)}`);
    if (e.sort) parts.push(`排序 ${termSpan('sortKey', e.sort)}`);
    return `改写目标：${parts.join('，') || '（默认）'}`;
  },
  transfer_status: (e, used) => {
    used.push('mode', 'mapping', 'fallback', 'statusesFrom', 'to');
    return `转移状态（${termSpan('transferMode', e.mode)}）到${tgt(e)}`;
  },
  write_rule_slot: (e, used) => {
    used.push('slot', 'field', 'value', 'overwrite');
    return `写入规则槽 ${e.slot ?? '?'}：${termSpan('ruleSlotField', e.field)} = ${fmtVal(e.value)}`;
  },
  modify_rule_slot: (e, used) => {
    used.push('slot', 'field', 'value', 'mode', 'filter');
    return `${termSpan('ruleSlotMode', e.mode)}规则槽 ${e.slot ?? '?'} 的${termSpan('ruleSlotField', e.field)}${e.value != null ? `：${fmtVal(e.value)}` : ''}`;
  },
  snapshot: (e, used) => { used.push('fields'); return `快照${e.fields ? `（${fmtVal(e.fields)}）` : ''}`; },
  restore_snapshot: (e, used) => { used.push('fields'); return `恢复快照${e.fields ? `（${fmtVal(e.fields)}）` : ''}`; },
  echo_last_skill: (e, used) => {
    used.push('potency', 'rounding', 'snapshot');
    let s = `回响上一技能`;
    if (e.potency != null) s += `（强度 ${fmtVal(e.potency)}${e.rounding ? '，' + termSpan('rounding', e.rounding, { showKey: false }) : ''}）`;
    return s;
  },
  gauge_shuffle: (e, used) => { used.push('resource'); return `重排行动条`; },
  status_shuffle: (e, used) => {
    used.push('mode', 'sort');
    return `重排状态${e.mode ? `（${termSpan('shuffleMode', e.mode)}）` : ''}${e.sort ? `（按${termSpan('sortKey', e.sort)}）` : ''}`;
  },
  modify_skill: (e, used) => {
    used.push('skillRef', 'clearCooldown', 'costDelta', 'setInstant', 'targetingModeOverride', 'selector', 'ofSkill');
    const parts = [];
    if (e.clearCooldown) parts.push('清除冷却');
    if (e.costDelta != null) parts.push(`消耗 ${e.costDelta > 0 ? '+' : ''}${fmtVal(e.costDelta)}`);
    if (e.setInstant) parts.push('转为瞬发');
    if (e.targetingModeOverride) parts.push(`选靶改为${termSpan('targetingModeOverride', e.targetingModeOverride)}`);
    return `修改技能：${parts.join('，') || '（运行时属性）'}`;
  },
  modify_status: (e, used) => {
    used.push('statusId', 'addDuration', 'setDuration', 'maxStacksDelta', 'dispelableOverride');
    const id = e.statusId;
    const parts = [];
    if (e.addDuration != null) parts.push(`持续 +${fmtVal(e.addDuration)}`);
    if (e.setDuration != null) parts.push(`持续设为 ${fmtVal(e.setDuration)}`);
    if (e.maxStacksDelta != null) parts.push(`层数上限 ${e.maxStacksDelta > 0 ? '+' : ''}${fmtVal(e.maxStacksDelta)}`);
    return `修改${id ? statusSpan(id) : '状态'}：${parts.join('，') || '（实例属性）'}`;
  },
  modify_targetability: (e, used) => {
    used.push('untargetable', 'direction', 'duration', 'pierce');
    let s = `${tgt(e)}${e.untargetable === false ? '恢复可被选中' : '不可被选中'}`;
    const parts = [];
    if (e.direction) parts.push(`方向：${termSpan('targetabilityDirection', e.direction)}`);
    if (e.duration != null) parts.push(`持续 ${fmtVal(e.duration)}`);
    if (parts.length) s += `（${parts.join('，')}）`;
    return s;
  },
  reveal: (e, used) => {
    used.push('scope', 'dispel', 'pierceTargetability');
    return `揭示${tgt(e)}${e.scope ? `（${termSpan('revealScope', e.scope)}）` : ''}`;
  },
  grant_immunity: (e, used) => {
    used.push('against', 'element', 'damageType', 'charges', 'duration');
    const what = e.against ? [].concat(e.against).map((a) => termSpan('statusCategory', a)).join('、') : (e.element ? termSpan('element', e.element) : '效果');
    let s = `${tgt(e)}免疫${what}`;
    if (e.duration != null) s += `（持续 ${fmtVal(e.duration)}）`;
    return s;
  },
  take_control: (e, used) => {
    used.push('duration', 'onExpire', 'actionPolicy');
    let s = `夺取${tgt(e)}控制权`;
    const parts = [];
    if (e.duration != null) parts.push(`持续 ${fmtVal(e.duration)}`);
    if (e.onExpire) parts.push(`到期：${termSpan('onExpire', e.onExpire)}`);
    if (e.actionPolicy) parts.push(termSpan('actionPolicy', e.actionPolicy));
    if (parts.length) s += `（${parts.join('，')}）`;
    return s;
  },
};

function renderRestFields(e, used) {
  const skip = new Set(['type', 'op', 'note', 'target', 'condition', ...used]);
  const items = [];
  for (const [k, v] of Object.entries(e)) {
    if (skip.has(k) || v == null) continue;
    const label = FIELD_ZH[k] || k;
    const cat = FIELD_VALUE_CAT[k];
    const valHtml = (cat && typeof v === 'string') ? termSpan(cat, v)
      : (k === 'statusId' || k === 'status') && typeof v === 'string' ? statusSpan(v)
      : fmtVal(v);
    items.push(`<span class="kv-raw">${escapeHtml(label)}=${valHtml}</span>`);
  }
  return items.length ? `<div class="ast-line">${items.join(' · ')}</div>` : '';
}

function renderConditionBlock(c) {
  if (!c) return '';
  return `<div class="ast-line"><span class="muted">条件：</span>${condToText(c)}</div>`;
}

export function renderEffectNode(e) {
  if (!e || typeof e !== 'object') return '';
  // 算子
  if (e.op && (e.steps || e.then || e.op === 'repeat' || e.op === 'sequence' || e.op === 'if')) {
    let head = '';
    if (e.op === 'sequence') head = termSpan('operator', 'sequence');
    else if (e.op === 'repeat') head = `${termSpan('operator', 'repeat')}${e.count != null || e.times != null ? ` ×${fmtVal(e.count ?? e.times)}` : ''}`;
    else if (e.op === 'if') head = `${termSpan('operator', 'if')}：${condToText(e.condition)}`;
    else head = termSpan('operator', e.op);
    let html = `<div class="ast-node"><div class="ast-line">${head}</div>`;
    const kids = [];
    if (e.op === 'if') {
      const thenHtml = (e.then || []).map(renderEffectNode).join('');
      const elseHtml = (e.else || []).map(renderEffectNode).join('');
      if (thenHtml) kids.push(`<div class="ast-line muted">则：</div><div class="ast-children">${thenHtml}</div>`);
      if (elseHtml) kids.push(`<div class="ast-line muted">否则：</div><div class="ast-children">${elseHtml}</div>`);
    } else {
      const stepsHtml = (e.steps || []).map(renderEffectNode).join('');
      if (stepsHtml) kids.push(`<div class="ast-children">${stepsHtml}</div>`);
    }
    html += kids.join('');
    if (e.op !== 'if') html += renderConditionBlock(e.condition);
    if (e.note) html += `<div class="ast-note">${escapeHtml(e.note)}</div>`;
    html += '</div>';
    return html;
  }
  // 原语
  const used = [];
  const tpl = PRIMITIVE_TEMPLATES[e.type];
  let main;
  if (tpl) {
    main = tpl(e, used);
  } else {
    main = `${termSpan('primitive', e.type)}${e.value != null ? ` ${fmtVal(e.value)}` : ''}`;
    used.push('value');
  }
  let html = `<div class="ast-node"><div class="ast-line">▸ ${main}</div>`;
  html += renderRestFields(e, used);
  html += renderConditionBlock(e.condition);
  if (e.note) html += `<div class="ast-note">${escapeHtml(e.note)}</div>`;
  html += '</div>';
  return html;
}

export function renderEffects(effects) {
  if (!effects || !effects.length) return '<span class="muted">（无效果）</span>';
  return `<div class="ast">${effects.map(renderEffectNode).join('')}</div>`;
}

// 遍历一张卡的全部效果节点（递归整卡任意嵌套，口径对齐 docs/tools/build_profession_analysis.py）
const PRIMITIVE_TYPES = new Set([
  'damage', 'heal', 'mount_status', 'modify_stat', 'modify_resource', 'move', 'spawn',
  'dispel', 'drain', 'domain', 'translocate', 'modify_damage', 'target_override',
  'transfer_status', 'write_rule_slot', 'modify_rule_slot', 'snapshot', 'restore_snapshot',
  'echo_last_skill', 'gauge_shuffle', 'status_shuffle', 'modify_skill', 'modify_status',
  'modify_targetability', 'reveal', 'grant_immunity', 'take_control',
]);
export function walkCardEffects(card, cb) {
  const walk = (n) => {
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (!n || typeof n !== 'object') return;
    if (typeof n.type === 'string' && PRIMITIVE_TYPES.has(n.type)) cb(n, 'primitive');
    else if (typeof n.op === 'string' && (n.steps || n.then || n.else)) cb(n, 'op');
    for (const v of Object.values(n)) {
      if (v && typeof v === 'object') walk(v);
    }
  };
  walk(card);
}
