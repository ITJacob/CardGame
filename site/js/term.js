// 术语解析：枚举 token → 中文名 + 解释（唯一入口）
import { DB } from './data.js';
import { axisNeedsLift } from './axis-ink.js';

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
  // symbol / name 分开给：符号要单独包一层才好套提亮滤镜，见 axSymHtml
  if (ax) return { zh: `${ax.symbol || ''}${ax.name}`.trim(), symbol: ax.symbol || '', name: ax.name, brief: ax.note || '', key: axisId, cat: 'axis', catLabel: '构筑轴', missing: false };
  return { zh: axisId, symbol: '', name: axisId, brief: '', key: axisId, cat: 'axis', catLabel: '构筑轴', missing: true };
}

// 轴符号的 span。深色的那几个（🌑 暗夜 / 🕳️ 污秽 / 🐾 兽群…）不只在水印里看不见，
// 在近黑的 badge（--panel2）和悬停浮层里同样是块暗斑，所以三处共用这一份判定
// （js/axis-ink.js，与卡面水印同一个门槛、同一条现算路径）。
// **必须把符号单独包起来**：滤镜套在整段文字上，旁边的中文名会跟着一起翻成反色
export function axSymHtml(symbol) {
  if (!symbol) return '';
  return `<span class="ax-sym${axisNeedsLift(symbol) ? ' ax-lift' : ''}">${escapeHtml(symbol)}</span>`;
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
