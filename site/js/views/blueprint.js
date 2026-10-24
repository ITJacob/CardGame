// 玩法蓝图页：总览（22 途径对账表）+ 单途径页（声明 / 实证 / 兑现三层）。
// 数据来自 docs/analysis/blueprints.json（blueprint_score.py 预计算）：前端不解析
// rounds/*.md 的蓝图章、不重算 rubric 与兑现率——解析规则只在 blueprint_parse.py 一处。
// 声明正源仍是 docs/meta/rounds/<pid>.md；本页只是把声明、卡池实证与对账结果并排。
import { DB, loadBlueprints, loadScores, loadRoundDoc, statusesReady, onStatusesReady } from '../data.js';
import { escapeHtml, statusSpan, termSpan, axisSpan, defSpan } from '../term.js';
import { ROLE_ORDER, ROLE_INFO, ROLE_LABEL } from '../roles.js';
import { renderMarkdown } from '../md.js';

const FULFIL_ITEMS = ['锚点', '签名键', '角色配比', '跨轴钩子', '跨系钩子'];
const FULFIL_SHORT = { 锚点: '锚点', 签名键: '签名', 角色配比: '角色', 跨轴钩子: '跨轴', 跨系钩子: '跨系' };
const STATE_LABEL = { 草案: '草案', 已拍板: '已拍板', 回溯补登: '回溯补登' };

const ROLE_COLOR = {
  core: 'var(--accent)', starter: 'var(--uncommon)', bridge: 'var(--rare)',
  generic: 'var(--dim)', trap: 'var(--warn)', tech: 'var(--epic)', flagship: 'var(--legendary)',
};

// ---------- 小件 ----------

const markOf = (v) => (v.total === 0 ? { cls: 'none', text: '—' }
  : v.hit === v.total ? { cls: 'ok', text: '✓' } : { cls: 'bad', text: '✗' });

function markHtml(v, title = '') {
  const m = markOf(v);
  return `<span class="bp-mark ${m.cls}"${title ? ` title="${escapeHtml(title)}"` : ''}>${m.text}</span>`;
}

function missTitle(v) {
  return v.miss?.length ? v.miss.join('；') : (v.total === 0 ? '显式声明无' : '全部兑现');
}

// 卡位引用：真实卡可点；占位串是设计阶段合法状态，虚线不链空；错名才标红
function cardChip(ref, { cross = false } = {}) {
  if (!ref) return '';
  const pw = ref.pathway && ref.pathway !== undefined
    ? (DB.pathways.find((p) => p.id === ref.pathway)?.name || ref.pathway) : '';
  const tip = cross && pw ? ` title="${escapeHtml(pw)} · ${escapeHtml(ref.name)}"` : '';
  if (ref.id) {
    return `<a class="bp-chip" href="#/card/${encodeURIComponent(ref.id)}"${tip}>${escapeHtml(ref.name)}</a>`;
  }
  if (ref.placeholder) {
    return `<span class="bp-chip todo" title="设计占位：尚未落地为卡${pw ? `（${escapeHtml(pw)}）` : ''}">${escapeHtml(ref.name)}</span>`;
  }
  return `<span class="bp-chip missing" title="卡池中未找到该卡名${pw ? `（${escapeHtml(pw)}）` : ''}">${escapeHtml(ref.name)}</span>`;
}

const chips = (refs, opts) => (refs || []).map((r) => cardChip(r, opts)).join('');

// 角色 chip：色点辅助，文本必现（色弱用户靠文字读）
function roleChip(role, count) {
  const info = ROLE_INFO[role] || { label: role, full: role };
  return `<span class="bp-rolechip" style="--rc:${ROLE_COLOR[role] || 'var(--dim)'}" title="${escapeHtml(info.full)}：${escapeHtml(info.desc || '')}">
    <i class="bp-roledot"></i>${escapeHtml(info.label)}<span class="mono">${escapeHtml(role)}</span>${count != null ? `<b class="num">${count}</b>` : ''}</span>`;
}

function roleBar(mix, total) {
  if (!total) return '<span class="bp-rolebar empty" title="无实际 role 数据"></span>';
  return `<span class="bp-rolebar">${ROLE_ORDER.map((r) => {
    const n = mix?.[r] || 0;
    if (!n) return '';
    return `<i class="bp-rolebar-seg" style="width:${(n / total) * 100}%;background:${ROLE_COLOR[r]}" title="${escapeHtml(ROLE_LABEL[r] || r)} ${n} 张"></i>`;
  }).join('')}</span>`;
}

function anchorHtml(a) {
  if (!a) return '<span class="muted">未声明锚点</span>';
  const kind = termSpan('anchorKind', a.kind);
  let id;
  switch (a.kind) {
    case 'status': id = statusSpan(a.id); break;
    case 'resource': id = termSpan('resource', a.id); break;
    case 'primitive': id = termSpan('primitive', a.id); break;
    case 'element': id = termSpan('element', a.id); break;
    case 'trigger': id = termSpan('triggerEvent', a.id); break;
    case 'dimension': id = termSpan('dim', a.id); break;
    case 'equipment': id = termSpan('equipSlot', a.id); break;
    case 'zone': id = defSpan('zoneDef', a.id); break;
    default: id = `<span class="mono">${escapeHtml(a.id)}</span>`;
  }
  return `<span class="bp-anchor">${kind} ${id}</span>`;
}

const fmtScore = (n) => (n == null ? '—' : Number(n).toFixed(1));

function pathwayName(pid) {
  return DB.pathways.find((p) => p.id === pid)?.name || pid;
}

// ---------- 总览 ----------

function fulfilSegs(p) {
  return `<span class="bp-fulfil-segs">${FULFIL_ITEMS.map((item) => {
    const v = p.fulfillment[item] || { hit: 0, total: 0, miss: [] };
    const m = markOf(v);
    const pct = v.total ? Math.round((v.hit / v.total) * 100) : 0;
    return `<span class="bp-fseg ${m.cls}" title="${escapeHtml(item)}：${v.hit}/${v.total}${v.total === 0 ? '（显式声明无）' : `（${pct}%）`}${v.miss.length ? `｜${escapeHtml(v.miss.join('；'))}` : ''}">
      <span class="bp-fseg-label">${FULFIL_SHORT[item]}</span>
      <span class="bp-fseg-bar"><i style="width:${pct}%"></i></span>
      <span class="bp-fseg-num num">${v.hit}/${v.total}</span>
    </span>`;
  }).join('')}</span>`;
}

const hasGap = (p) => FULFIL_ITEMS.some((item) => {
  const v = p.fulfillment[item];
  return v && v.hit < v.total;
});
const roleBackfilled = (p) => (p.roles || []).some((r) => r.actual > 0);
const cardCount = (p) => (p.axes || []).reduce((s, a) => s + (a.actual?.cards || 0), 0);
const gapCount = (p) => FULFIL_ITEMS.reduce((s, item) => {
  const v = p.fulfillment[item];
  return s + (v ? v.total - v.hit : 0);
}, 0);

function rowNote(p) {
  if (!roleBackfilled(p)) return 'role 未回填';
  if (p.hooks?.crossAxis?.missing || p.hooks?.crossSystem?.missing) return '钩子节缺失';
  return '';
}

function overviewHtml(bp, scores) {
  const map = new Map(bp.pathways.map((p) => [p.id, p]));
  const scoreMap = new Map((scores?.pathways || []).map((p) => [p.id, p]));
  const rows = DB.pathways.map((pw) => ({ pw, p: map.get(pw.id) }));
  const noBp = rows.filter((r) => !r.p).length;
  const gapN = rows.filter((r) => r.p && hasGap(r.p)).length;
  const noRoleN = rows.filter((r) => r.p && !roleBackfilled(r.p)).length;
  return `
    <h1 class="page-title">玩法蓝图 · 设计对账</h1>
    <p class="muted">${rows.length} 途径${noBp ? `（${noBp} 条未建蓝图）` : ''} · 数据由
      <code>blueprint_score.py</code> 生成 ${escapeHtml(bp.generated)} · 口径
      <code>WORKFLOW.md「玩法蓝图」</code>。蓝图分是格②→③ 的工序门槛（≥60），不是排行榜；
      三层对照：<b>声明</b>（rounds md）→ <b>实证</b>（卡池 / score.py）→ <b>兑现</b>（对账）。</p>
    <div class="panel bp-toolbar">
      <div class="bp-filters">
        <button type="button" data-bp-filter="all" class="active">全部 ${rows.length}</button>
        <button type="button" data-bp-filter="gap">有兑现缺口 ${gapN}</button>
        <button type="button" data-bp-filter="norole">角色未回填 ${noRoleN}</button>
      </div>
      <label class="muted small">排序
        <select id="bp-sort">
          <option value="">途径序（manifest）</option>
          <option value="score">设计分 ↑</option>
          <option value="gap">兑现缺口 ↓</option>
        </select>
      </label>
    </div>
    <div class="panel bp-overview"><table class="bp-table">
      <thead><tr><th>途径</th><th>蓝图</th><th>状态</th><th>设计分</th><th>兑现（五类，段内标注）</th><th>卡数</th><th>备注</th></tr></thead>
      <tbody id="bp-tbody"></tbody>
    </table></div>`;
}

function overviewRows(rows, filter, sort, scoreMap) {
  let list = rows.slice();
  if (filter === 'gap') list = list.filter((r) => r.p && hasGap(r.p));
  if (filter === 'norole') list = list.filter((r) => r.p && !roleBackfilled(r.p));
  if (sort === 'score') {
    list.sort((a, b) => {
      const sa = scoreMap.get(a.pw.id)?.total;
      const sb = scoreMap.get(b.pw.id)?.total;
      if (sa == null && sb == null) return 0;
      if (sa == null) return 1;
      if (sb == null) return -1;
      return sa - sb;
    });
  } else if (sort === 'gap') {
    list.sort((a, b) => gapCount(b.p || { fulfillment: {} }) - gapCount(a.p || { fulfillment: {} }));
  }
  return list.map(({ pw, p }) => {
    if (!p) {
      return `<tr class="bp-row-empty"><td><b>${escapeHtml(pw.name)}</b> <span class="muted">${escapeHtml(pw.id)}</span></td>
        <td colspan="6" class="muted">未建蓝图（回溯计划见 WORKFLOW.md「全库回溯计划」）</td></tr>`;
    }
    const s = scoreMap.get(pw.id);
    const note = rowNote(p);
    return `<tr class="bp-row" data-pid="${escapeHtml(p.id)}">
      <td><b>${escapeHtml(p.name)}</b> <span class="muted">${escapeHtml(p.id)}</span>
        <div class="bp-subline muted">蓝图 ${p.score} · ${escapeHtml(STATE_LABEL[p.state] || p.state || '—')} · ${cardCount(p)} 张${note ? ` · ${escapeHtml(note)}` : ''}</div></td>
      <td class="num">${p.score}</td>
      <td class="small">${escapeHtml(STATE_LABEL[p.state] || p.state || '—')}<div class="muted">${escapeHtml(p.date || '')}</div></td>
      <td class="num">${s ? `<a href="#/score/${encodeURIComponent(p.id)}" class="bp-score-link">${s.total.toFixed(1)}</a>` : '<span class="muted">—</span>'}</td>
      <td>${fulfilSegs(p)}</td>
      <td class="num muted">${cardCount(p)}</td>
      <td class="small ${note ? 'warn-text' : 'muted'}">${escapeHtml(note || '—')}</td>
    </tr>`;
  }).join('');
}

// ---------- 单途径页 ----------

function axisCard(pid, axis) {
  const plan = axis.planCards;
  const actual = axis.actual?.cards ?? 0;
  const planCls = plan != null && plan !== actual ? 'warn-text' : '';
  const sigRows = (axis.signatures || []).map((s) => `
    <div class="bp-sig-row">
      <span class="bp-sig-key mono">${escapeHtml(s.key)}</span>
      <span class="bp-sig-stat ${s.ok ? 'muted' : 'warn-text'}">实证 ${s.empirical}${s.ok ? ' ✓' : '（须 ≥2）'}</span>
      <span class="bp-chips">${chips(s.slots)}</span>
    </div>`).join('') || '<div class="muted small">本轴未承诺签名键（2.14 起承诺即正源）。</div>';
  const declaredMix = axis.roleMixDeclared || {};
  const declTotal = Object.values(declaredMix).reduce((a, b) => a + b, 0);
  const actualMix = axis.actual?.roleMix || {};
  const actTotal = Object.values(actualMix).reduce((a, b) => a + b, 0);

  const seg = (label, text, refs) => `<div class="bp-loop-seg">
      <div class="bp-loop-label">${label}</div>
      <div class="bp-loop-text">${escapeHtml(text || '—')}</div>
      ${refs && refs.length ? `<div class="bp-chips">${chips(refs)}</div>` : ''}
    </div>`;

  return `<article class="panel bp-axis" data-axis="${escapeHtml(axis.id)}" id="bp-axis-${escapeHtml(axis.id)}">
    <div class="bp-axis-head">
      <span class="bp-axis-title">${escapeHtml(axis.symbol || '')} ${escapeHtml(axis.name)} <span class="mono">${escapeHtml(axis.id)}</span></span>
      <span class="bp-axis-meta small muted">
        锚点 ${anchorHtml(axis.anchor)}
        <span class="bp-dot">·</span> 计划 <span class="${planCls}">${plan ?? '—'}</span> / 实际 ${actual}
        <span class="bp-dot">·</span> 轴分 <span class="num">${fmtScore(axis.actual?.axisScore)}</span>
        <span class="bp-mark ${axis.actual?.anchorMatch ? 'ok' : 'bad'}" title="蓝图锚点与 axes 实录对账">${axis.actual?.anchorMatch ? '✓' : '✗'}</span>
      </span>
    </div>

    <div class="bp-loop">
      ${seg('产出', axis.loop?.produce, axis.loop?.produceCards)}
      <div class="bp-loop-arrow">→</div>
      ${seg('消费', axis.loop?.consume, axis.loop?.consumeCards)}
      <div class="bp-loop-arrow">→</div>
      ${seg('清除', axis.loop?.clear, [])}
    </div>

    <div class="bp-decision"><b>玩家决策点</b> ${escapeHtml(axis.decision || '—')}</div>

    <div class="bp-axis-foot">
      <div class="bp-sub">
        <div class="bp-sub-title">签名键承诺</div>
        ${sigRows}
      </div>
      <div class="bp-sub">
        <div class="bp-sub-title">角色配比 · 声明 / 实际</div>
        <div class="bp-mixrow"><span class="bp-mixlabel">声明</span>${roleBar(declaredMix, declTotal)}<span class="bp-mixnums">${ROLE_ORDER.filter((r) => declaredMix[r]).map((r) => `${ROLE_INFO[r].label}×${declaredMix[r]}`).join(' ') || '—'}</span></div>
        <div class="bp-mixrow"><span class="bp-mixlabel">实际</span>${roleBar(actualMix, actTotal)}<span class="bp-mixnums">${ROLE_ORDER.filter((r) => actualMix[r]).map((r) => `${ROLE_INFO[r].label}×${actualMix[r]}`).join(' ') || 'role 未回填'}</span></div>
      </div>
    </div>
  </article>`;
}

function crossAxisHtml(pid, p) {
  if (p.hooks?.crossAxis?.missing) {
    return '<div class="panel"><h2>跨轴钩子</h2><p class="warn-text">本节缺失（蓝图 rubric 扣分）。</p></div>';
  }
  if (p.hooks?.crossAxis?.declaredNone) {
    return '<div class="panel"><h2>跨轴钩子</h2><p class="muted">显式声明无：本途径不设跨轴读层钩子（设计本意，非缺口）。</p></div>';
  }
  const rows = p.crossAxis || [];
  if (!rows.length) return '<div class="panel"><h2>跨轴钩子</h2><p class="muted">无声明行。</p></div>';
  const hit = rows.filter((r) => r.ok).length;
  return `<div class="panel"><h2>跨轴钩子 <span class="muted small">${hit}/${rows.length} 兑现</span></h2>
    <div class="bp-table-wrap"><table class="bp-table bp-hook-table">
      <thead><tr><th>卡位</th><th>读轴</th><th>概念</th><th>facet</th><th>用途</th><th>兑现</th></tr></thead>
      <tbody>${rows.map((r) => `<tr class="${r.ok ? '' : 'bp-row-miss'}">
        <td>${chips(r.slots)}</td>
        <td><a href="#/blueprint/${encodeURIComponent(pid)}?axis=${encodeURIComponent(r.axis || '')}">${axisSpan(pid, r.axis)}</a></td>
        <td class="mono">${escapeHtml(r.concept || '')}</td>
        <td class="mono">${escapeHtml(r.facet || '')}</td>
        <td class="small">${escapeHtml(r.purpose || '')}</td>
        <td>${markHtml({ hit: r.ok ? 1 : 0, total: 1 }, r.reason || '已兑现')}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
}

function crossSystemHtml(pid, p) {
  if (p.hooks?.crossSystem?.missing) {
    return '<div class="panel"><h2>跨系钩子</h2><p class="warn-text">本节缺失（蓝图 rubric 扣分）。</p></div>';
  }
  if (p.hooks?.crossSystem?.declaredNone) {
    return '<div class="panel"><h2>跨系钩子</h2><p class="muted">显式声明无：本途径不写跨系枢纽（设计本意，非缺口）。</p></div>';
  }
  const rows = p.crossSystem || [];
  if (!rows.length) return '<div class="panel"><h2>跨系钩子</h2><p class="muted">无声明行。</p></div>';
  const hit = rows.filter((r) => r.ok).length;
  return `<div class="panel"><h2>跨系钩子 <span class="muted small">${hit}/${rows.length} 兑现</span></h2>
    <div class="bp-table-wrap"><table class="bp-table bp-hook-table">
      <thead><tr><th>枢纽状态</th><th>写入卡位</th><th>读取卡位</th><th>participants</th><th>兑现</th></tr></thead>
      <tbody>${rows.map((r) => `<tr class="${r.ok ? '' : 'bp-row-miss'}">
        <td>${statusSpan(r.hub)}<div class="muted small">${r.crossPathway ? 'crossPathway ✓' : '未标 crossPathway'}</div></td>
        <td>${chips(r.writers, { cross: true })}</td>
        <td>${chips(r.readers, { cross: true })}</td>
        <td class="small">${(r.participants || []).map((id) => id === pid
          ? `<span class="muted">${escapeHtml(pathwayName(id))}</span>`
          : `<a href="#/blueprint/${encodeURIComponent(id)}">${escapeHtml(pathwayName(id))}</a>`).join('、') || '—'}</td>
        <td>${markHtml({ hit: r.ok ? 1 : 0, total: 1 }, r.reason || '已兑现')}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
}

function roleSlots(title, refs, foldedAt = 8) {
  if (!refs?.length) return '';
  if (refs.length <= foldedAt) return `<div class="bp-slotline"><span class="bp-slotlabel">${title}</span><span class="bp-chips">${chips(refs)}</span></div>`;
  return `<details class="fold bp-slotfold"><summary>${title}（${refs.length} 张）</summary><span class="bp-chips">${chips(refs)}</span></details>`;
}

function rolesHtml(p) {
  if (!roleBackfilled(p)) {
    return `<div class="panel"><h2>角色配比</h2>
      <p class="muted">该途径 <code>role</code> 尚未回填（蓝图回溯批 C2 试点，当前仅 hunter）。
      声明配比见上方各轴；实际 role 计数为空，不画 0 计数条。</p>
      <div class="bp-rolechips">${ROLE_ORDER.map((r) => roleChip(r, p.roles?.find((x) => x.role === r)?.declared ?? 0)).join('')}</div>
    </div>`;
  }
  const byRole = new Map((p.roles || []).map((r) => [r.role, r]));
  const rows = ROLE_ORDER.map((r) => {
    const x = byRole.get(r) || { declared: 0, actual: 0, declaredSlots: [], actualSlots: [] };
    const ok = x.actual >= x.declared;
    return `<div class="bp-role-row">
      <div class="bp-role-head">${roleChip(r)}</div>
      <div class="bp-role-count"><span class="${ok ? 'muted' : 'warn-text'}">声明 ${x.declared}</span> / 实际 <b class="num">${x.actual}</b></div>
      <div class="bp-role-slots">
        ${roleSlots('声明卡位', x.declaredSlots)}
        ${roleSlots('实际卡位', x.actualSlots)}
      </div>
    </div>`;
  }).join('');
  const f = p.flagship || { declared: 0, actual: 0, slots: [], actualSlots: [] };
  return `<div class="panel"><h2>角色配比 <span class="muted small">口径 SCORING §一·附</span></h2>
    <p class="panel-note muted">声明与实际并排；<code>flagship</code> 是独立 bool，不与六角色混算。
    实际卡位按角色分组，超过 8 张折叠。</p>
    ${rows}
    <div class="bp-role-row bp-flagship-row">
      <div class="bp-role-head">${roleChip('flagship')}</div>
      <div class="bp-role-count"><span class="${f.actual >= f.declared ? 'muted' : 'warn-text'}">声明 ${f.declared}</span> / 实际 <b class="num">${f.actual}</b></div>
      <div class="bp-role-slots">${roleSlots('声明卡位', f.slots)}${roleSlots('实际卡位', f.actualSlots)}</div>
    </div></div>`;
}

function fulfilPanel(p) {
  const rows = FULFIL_ITEMS.map((item) => {
    const v = p.fulfillment[item] || { hit: 0, total: 0, miss: [] };
    const none = v.total === 0;
    const pct = v.total ? Math.round((v.hit / v.total) * 100) : 0;
    return `<div class="bp-fulfil-row">
      <span class="bp-fulfil-name">${escapeHtml(item)}</span>
      <span class="bp-fulfil-bar"><i class="${none ? 'none' : v.hit === v.total ? 'ok' : 'bad'}" style="width:${pct}%"></i></span>
      <span class="num">${v.hit}/${v.total}</span>
      ${markHtml(v, missTitle(v))}
      <span class="bp-fulfil-miss muted small">${none ? '显式声明无' : escapeHtml(v.miss.join('；') || '—')}</span>
    </div>`;
  }).join('');
  const parts = Object.entries(p.scoreParts || {});
  const rubricRows = parts.map(([k, v]) => {
    const max = { 命题: 10, 风格边界: 15, 轴循环: 25, 决策点: 10, 签名键: 15, 角色配比: 15, 钩子: 10 }[k] || 0;
    const cls = v >= max ? 'ok' : v ? 'mid' : 'bad';
    return `<span class="bp-rubric-item"><span class="bp-mark ${cls}">${v >= max ? '✓' : v ? '△' : '✗'}</span>${escapeHtml(k)} <span class="num">${v}</span><span class="muted">/${max}</span></span>`;
  }).join('');
  const deds = (p.deductions || []).map((d) => `<li><span class="badge warn">${escapeHtml(d.dim)}</span> ${escapeHtml(d.why)}</li>`).join('');
  return `<div class="panel"><h2>兑现率（声明 ∩ 卡池）</h2>
    <p class="panel-note muted">五项是主视图；蓝图 rubric 折叠在下方——95–100 压缩带里只有失分项有信息量。
    兑现率进 2.14 的三个轴级维（锚点 / 产层 / 收束）；跨轴 / 跨系 / 角色三节只做诊断，不进 100 分。</p>
    <div class="bp-fulfil">${rows}</div>
    <details class="fold bp-rubric"><summary>蓝图体检 ${p.score}/100 · 七维明细${deds ? ' · 有失分项' : ''}</summary>
      <div class="bp-rubric-grid">${rubricRows}</div>
      ${deds ? `<ul class="deduction-list">${deds}</ul>` : '<p class="muted small">无失分项。</p>'}
      <p class="muted small">蓝图分 ≠ 设计分：前者是格②→③ 工序门槛（≥60），后者见
      <a href="#/score/${encodeURIComponent(p.id)}">设计评分页</a>（100 分制）。</p>
    </details></div>`;
}

function designLogHtml(p) {
  return `<div class="panel"><h2>设计日志</h2>
    <p class="panel-note muted">蓝图章之后的「迭代记录」原文（<code>docs/meta/rounds/${escapeHtml(p.id)}.md</code>），
    首次展开才加载；只读、不参与任何计分。</p>
    <details class="fold bp-log" id="bp-log"><summary>展开迭代记录（懒加载原文）</summary>
      <div class="md bp-log-body" id="bp-log-body"><p class="muted small">展开后加载…</p></div>
    </details></div>`;
}

function pathwayHtml(bp, p) {
  const head = `<div class="bp-head panel" style="--pc:var(--p-${escapeHtml(p.id)})">
    <div class="bp-head-top">
      <h1 class="bp-title">${escapeHtml(p.axes?.[0]?.symbol || '')} ${escapeHtml(p.name)} <span class="mono">${escapeHtml(p.id)}</span></h1>
      <span class="bp-hero-score">蓝图 <b class="num">${p.score}</b><span class="muted">/100</span></span>
    </div>
    <div class="muted small">${escapeHtml(STATE_LABEL[p.state] || p.state || '—')} · ${escapeHtml(p.date || '—')} ·
      数据生成 ${escapeHtml(bp.generated)} · 卡数 ${cardCount(p)} · 蓝图分是工序门槛，不是排行榜</div>
    <div class="bp-actions">
      <a class="bp-btn" href="#/score/${encodeURIComponent(p.id)}">设计评分 →</a>
      <a class="bp-btn" href="#/cards?pathway=${encodeURIComponent(p.id)}">卡片 ${cardCount(p)} 张 →</a>
      <a class="bp-btn" href="#/stats/skills">统计分析 →</a>
    </div>
    <nav class="bp-sec-nav">
      ${[['bp-prop', '命题'], ['bp-style', '风格边界'], ['bp-axes', '轴玩法'], ['bp-hooks', '钩子'], ['bp-roles', '角色配比'], ['bp-fulfil', '兑现'], ['bp-log-sec', '设计日志']].map(([id, label]) =>
        `<button type="button" data-bp-jump="${id}">${label}</button>`).join('')}
    </nav>
  </div>`;

  const prop = `<section id="bp-prop" class="panel bp-hero">
    <h2>命题</h2>
    <p class="bp-statement">${escapeHtml(p.proposition?.statement || '（未填写）')}</p>
    <div class="bp-prop-grid">
      <div><div class="bp-sub-title">可操作变量</div><div>${escapeHtml(p.proposition?.variable || '—')}</div></div>
      <div><div class="bp-sub-title">代价 / 输面</div><div>${escapeHtml(p.proposition?.cost || '—')}</div></div>
    </div>
  </section>`;

  const style = `<section id="bp-style" class="panel bp-style">
    <h2>风格边界</h2>
    <div class="bp-style-grid">
      <div><div class="bp-sub-title">主签名维度</div><div>${escapeHtml(p.style?.signature || '—')}</div></div>
      <div><div class="bp-sub-title">使用的全局通用机制</div>
        <div class="bp-chips">${(p.style?.mechanisms || []).map((m) => `<span class="bp-chip decl">${escapeHtml(m)}</span>`).join('') || '—'}</div></div>
    </div>
    <blockquote class="bp-redline">${escapeHtml(p.style?.redline || '—')}</blockquote>
  </section>`;

  const axes = `<section id="bp-axes" class="stat-group">
    <div class="stat-group-title">轴玩法 · ${p.axes.length} 轴（产出 → 消费 → 清除 + 决策点）</div>
    <div class="bp-axis-grid">${p.axes.map((a) => axisCard(p.id, a)).join('')}</div>
  </section>`;

  const hooks = `<section id="bp-hooks">${crossAxisHtml(p.id, p)}${crossSystemHtml(p.id, p)}</section>`;
  const roles = `<section id="bp-roles">${rolesHtml(p)}</section>`;
  const fulfil = `<section id="bp-fulfil">${fulfilPanel(p)}</section>`;
  const log = `<section id="bp-log-sec">${designLogHtml(p)}</section>`;
  return head + prop + style + axes + hooks + roles + fulfil + log;
}

// ---------- 入口 ----------

export async function renderBlueprint(view, arg, qs = '') {
  let bp;
  try {
    bp = await loadBlueprints();
  } catch (e) {
    view.innerHTML = `<h1 class="page-title">玩法蓝图 · 设计对账</h1>
      <div class="panel"><p class="warn-text">blueprints.json 加载失败：${escapeHtml(e.message)}</p>
      <p class="muted">先跑 <code>python docs/tools/build_analysis.py</code>（或
      <code>python docs/tools/blueprint_score.py</code>）生成站点机读面。</p></div>`;
    return;
  }

  if (arg) {
    const pid = decodeURIComponent(arg);
    const p = (bp.pathways || []).find((x) => x.id === pid);
    if (!p) {
      view.innerHTML = `<div class="panel"><h2>未找到蓝图</h2><p class="mono">${escapeHtml(pid)}</p>
        <p class="muted">该途径可能尚未建蓝图。回溯计划见 WORKFLOW.md「全库回溯计划」。</p>
        <p><a href="#/blueprint">← 返回蓝图对账总览</a></p></div>`;
      return;
    }
    view.innerHTML = pathwayHtml(bp, p);
    wirePathway(view, p, qs);
    // 途径私有状态定义是 deferred 数据（loadDeferred 首屏后才拉）。Deep link 直接落到
    // 本页时，锚点/枢纽的 statusSpan 会先渲染成裸 id（控制台报「状态未定义」）。
    // 就绪后重画一次——只重画仍停在本途径页的视图，别抢路由（同评分页的约定）
    if (!statusesReady()) {
      onStatusesReady(() => {
        if (view.querySelector('.bp-head') && location.hash.split('?')[0] === `#/blueprint/${encodeURIComponent(p.id)}`) {
          renderBlueprint(view, p.id, qs);
        }
      });
    }
    return;
  }

  // 总览：设计分只作一列；失败不影响蓝图表（显示 —）
  let scores = null;
  try { scores = await loadScores(); } catch { /* 设计分列降级为 — */ }
  view.innerHTML = overviewHtml(bp, scores);
  const map = new Map(bp.pathways.map((p) => [p.id, p]));
  const scoreMap = new Map((scores?.pathways || []).map((p) => [p.id, p]));
  const rows = DB.pathways.map((pw) => ({ pw, p: map.get(pw.id) }));
  const tbody = view.querySelector('#bp-tbody');
  const params = new URLSearchParams(qs || '');
  const state = { filter: params.get('filter') || 'all', sort: params.get('sort') || '' };
  if (!['all', 'gap', 'norole'].includes(state.filter)) state.filter = 'all';
  if (!['', 'score', 'gap'].includes(state.sort)) state.sort = '';
  const sortSel = view.querySelector('#bp-sort');
  sortSel.value = state.sort;

  const paint = () => {
    view.querySelectorAll('[data-bp-filter]').forEach((b) => b.classList.toggle('active', b.dataset.bpFilter === state.filter));
    tbody.innerHTML = overviewRows(rows, state.filter, state.sort, scoreMap);
    tbody.querySelectorAll('.bp-row').forEach((tr) => {
      tr.addEventListener('click', () => { location.hash = `#/blueprint/${encodeURIComponent(tr.dataset.pid)}`; });
    });
    tbody.querySelectorAll('.bp-score-link').forEach((a) => a.addEventListener('click', (e) => e.stopPropagation()));
    const q = new URLSearchParams();
    if (state.filter !== 'all') q.set('filter', state.filter);
    if (state.sort) q.set('sort', state.sort);
    const hash = `#/blueprint${q.toString() ? `?${q}` : ''}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  };
  view.querySelectorAll('[data-bp-filter]').forEach((b) => {
    b.addEventListener('click', () => { state.filter = b.dataset.bpFilter; paint(); });
  });
  sortSel.addEventListener('change', () => { state.sort = sortSel.value; paint(); });
  paint();
}

function wirePathway(view, p, qs) {
  // 页内小节导航：不动 location.hash（hash 是路由），直接滚动
  view.querySelectorAll('[data-bp-jump]').forEach((b) => {
    b.addEventListener('click', () => {
      const el = view.querySelector(`#${CSS.escape(b.dataset.bpJump)}`);
      if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  });

  // 设计日志：首次展开才 fetch rounds md；只渲染「迭代记录」之后的部分，避免与上方蓝图章重复
  const log = view.querySelector('#bp-log');
  if (log) {
    let loaded = false;
    log.addEventListener('toggle', async () => {
      if (!log.open || loaded) return;
      loaded = true;
      const body = view.querySelector('#bp-log-body');
      try {
        const md = await loadRoundDoc(p.id);
        const i = md.search(/^##\s+迭代记录/m);
        const text = i >= 0 ? md.slice(i) : md;
        body.innerHTML = renderMarkdown(text, { dir: 'meta/rounds', base: '../docs/', docNames: new Set() });
      } catch (e) {
        body.innerHTML = `<p class="warn-text">迭代记录加载失败：${escapeHtml(e.message)}</p>`;
      }
    });
  }

  // ?axis= 深链：定位到轴卡并短暂高亮（路由已支持 query 串）
  const axisId = new URLSearchParams(qs || '').get('axis');
  if (axisId) {
    const el = view.querySelector(`[data-axis="${CSS.escape(axisId)}"]`);
    if (el) {
      el.scrollIntoView({ block: 'start' });
      el.classList.add('bp-flash');
      setTimeout(() => el.classList.remove('bp-flash'), 2200);
    }
  }
}
