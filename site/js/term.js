// 术语解析：枚举 token → 中文名 + 解释（唯一入口）
import { DB } from './data.js';

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const warned = new Set();

// 本函数的匹配规则（精确命中 + patterns 的 * 前缀匹配）被 docs/tools/check_glossary.py
// 镜像（见其 match 注释）——改这里的匹配行为要同步那边，否则词典对账和站点实际渲染会分叉
export function lookup(cat, key) {
  if (key == null || key === '') return null;
  const g = DB.glossary?.categories?.[cat];
  if (g) {
    const hit = g.terms[key];
    if (hit) return { ...hit, key, cat, catLabel: g.label, source: g.source, missing: false };
    // 模式匹配（如 resist:*）
    for (const p of g.patterns || []) {
      if (p.match.endsWith('*') && key.startsWith(p.match.slice(0, -1))) {
        const rest = key.slice(p.match.length - 1);
        const sub = cat === 'stat' ? DB.glossary?.categories?.element?.terms?.[rest] : null;
        const zh = p.zh.replace('{1}', sub ? sub.zh : rest);
        return { zh, brief: p.brief || '', key, cat, catLabel: g.label, source: g.source, missing: false };
      }
    }
  }
  if (!warned.has(`${cat}:${key}`)) {
    warned.add(`${cat}:${key}`);
    console.warn(`[术语未收录] ${cat}: ${key}`);
  }
  return { zh: key, brief: '', key, cat, catLabel: g?.label || cat, source: g?.source || '', missing: true };
}

// 枚举值 → 中文名。统计页图表轴标签用：拿不到中文就原样显示 key，
// 同时 lookup 会打一条「术语未收录」告警——图表上出现英文 key 即值域漂移的信号
export function zh(cat, key) {
  return lookup(cat, key)?.zh || key;
}

// 状态：优先 statuses 文件的 name/note
export function lookupStatus(id) {
  const s = DB.statusMap.get(id);
  if (s) return { zh: s.name || id, brief: s.note || '', key: id, cat: 'status', catLabel: '状态', missing: false };
  if (!warned.has(`status:${id}`)) {
    warned.add(`status:${id}`);
    console.warn(`[状态未定义] ${id}`);
  }
  return { zh: id, brief: '', key: id, cat: 'status', catLabel: '状态', missing: true };
}

export function lookupPathway(id) {
  const p = DB.pathways.find((x) => x.id === id);
  return { zh: p?.name || id, brief: '', key: id, cat: 'pathway', catLabel: '途径', missing: !p };
}

export function lookupAxis(pathwayId, axisId) {
  const ax = DB.axesByPathway.get(pathwayId)?.[axisId];
  if (ax) return { zh: `${ax.symbol || ''}${ax.name}`.trim(), symbol: ax.symbol || '', name: ax.name, brief: ax.note || '', key: axisId, cat: 'axis', catLabel: '构筑轴', missing: false };
  return { zh: axisId, symbol: '', name: axisId, brief: '', key: axisId, cat: 'axis', catLabel: '构筑轴', missing: true };
}

export function axSymHtml(symbol) {
  return escapeHtml(symbol || '');
}

// 编目 def（召唤物 / 区域 / 界域）：查池里的定义。三池都是「Def 编目独立化」批之后的
// 权威定义（卡级 zone/domain 只是引用 + 展示副本，两出同名时以池为准）
const DEF_CAT = { unitDef: 'unitDefMap', zoneDef: 'zoneDefMap', domainDef: 'domainDefMap' };
const DEF_LABEL = { unitDef: '召唤物', zoneDef: '区域', domainDef: '界域' };

// def 的 brief 留空：状态用 note 当一句话摘要有信息量，def 的 tier/kind/duration 由
// renderDefDetail 的 chips 以徽章呈现，这里再写一遍就是同一行信息出现两次
export function lookupDef(cat, id) {
  const label = DEF_LABEL[cat] || cat;
  const d = DB[DEF_CAT[cat]]?.get(id);
  if (d) {
    return { zh: d.name || DB.defName?.get(id) || id, brief: '', key: id, cat, catLabel: label, missing: false };
  }
  return { zh: id, brief: '', key: id, cat, catLabel: label, missing: true };
}

// def 引用 → 可悬停 span。池里查不到就退回原来的裸 mono：给一个查不到的 def 加下划线，
// 等于承诺一个空弹窗（与浮层内嵌套术语「看得见才点得着」是同一条纪律）
export function defSpan(cat, id, { showKey = true } = {}) {
  if (id == null || id === '') return '';
  const t = lookupDef(cat, id);
  if (t.missing) return `<span class="mono">${escapeHtml(String(id))}</span>`;
  const keyHtml = showKey && t.zh !== id ? `<span class="tk">${escapeHtml(id)}</span>` : '';
  return `<span class="term" data-cat="${cat}" data-key="${escapeHtml(id)}">${escapeHtml(t.zh)}${keyHtml}</span>`;
}

// spawn 的引用字段（unitId / template / def / zone 四选一）不自带类别，按池成员判定。
// 全库 38 个 spawn 引用里 27 个（unit_beast / unit_vermin / unit_automaton 等）根本不在 unitDefs 池里
// ——那是设计数据缺口，不是站点能补的，这里一律退回裸 mono，不标未收录（标了就是半屏红字）
export function defSpanAuto(id) {
  if (id == null || id === '') return '';
  if (DB.unitDefMap?.has(id)) return defSpan('unitDef', id);
  if (DB.zoneDefMap?.has(id)) return defSpan('zoneDef', id);
  if (DB.domainDefMap?.has(id)) return defSpan('domainDef', id);
  return `<span class="mono">${escapeHtml(String(id))}</span>`;
}

// 渲染为带 tooltip 的 span；showKey=true 时附英文小字
export function termSpan(cat, key, { showKey = true } = {}) {
  if (key == null || key === '') return '';
  const t = lookup(cat, key);
  const cls = t.missing ? 'term missing' : 'term';
  const keyHtml = showKey && t.zh !== key ? `<span class="tk">${escapeHtml(key)}</span>` : '';
  return `<span class="${cls}" data-cat="${escapeHtml(cat)}" data-key="${escapeHtml(key)}">${escapeHtml(t.zh)}${keyHtml}</span>`;
}

export function statusSpan(id) {
  const t = lookupStatus(id);
  const cls = t.missing ? 'term missing' : 'term';
  return `<span class="${cls}" data-cat="status" data-key="${escapeHtml(id)}">${escapeHtml(t.zh)}<span class="tk">${escapeHtml(id)}</span></span>`;
}

export function axisSpan(pathwayId, axisId) {
  const t = lookupAxis(pathwayId, axisId);
  const cls = t.missing ? 'term missing' : 'term';
  return `<span class="${cls}" data-cat="axis" data-key="${escapeHtml(pathwayId + '/' + axisId)}">${axSymHtml(t.symbol)}${escapeHtml(t.name)}</span>`;
}
