// 设计评分页：总览记分表 + 途径计分卡 + 轴级下钻。
// 数据来自 docs/tools/score.py 预计算的 scores.json（口径单一来源，见 docs/meta/SCORING.md）——
// 前端不重算分，只展示；改口径改 SCORING.md 重跑脚本，网页自动跟随。
import { DB, loadScores } from '../data.js';
import { escapeHtml, axisSpan } from '../term.js';

const DIMS = ['轴健康度', '跨轴耦合', '跨系联动', '结构健康', '机制落地', '文本完备'];
const AXIS_DIMS = ['身份锚定', '产层闭环', '读层闭环', '轴内多样性', '规模均衡', '承接连通'];
const DIM_MAX = { 轴健康度: 30, 跨轴耦合: 15, 跨系联动: 15, 结构健康: 15, 机制落地: 15, 文本完备: 10 };
const AXIS_DIM_MAX = { 身份锚定: 15, 产层闭环: 20, 读层闭环: 25, 轴内多样性: 15, 规模均衡: 10, 承接连通: 15 };

// 六维迷你条：一个单元格里并排 6 条，hover 显示维度名与分值
function dimBars(dims, maxOf) {
  return `<span class="dim-bars">${DIMS.map((k) => {
    const v = dims[k] || 0;
    const pct = Math.round((v / maxOf(k)) * 100);
    return `<i class="dim-bar" title="${k} ${v}" style="width:${Math.max(pct, v ? 6 : 0)}%"></i>`;
  }).join('')}</span>`;
}

function axisDimBars(dims) {
  return `<span class="dim-bars">${AXIS_DIMS.map((k) => {
    const v = dims[k] || 0;
    const pct = Math.round((v / AXIS_DIM_MAX[k]) * 100);
    return `<i class="dim-bar" style="width:${Math.max(pct, v ? 6 : 0)}%" title="${k} ${v}"></i>`;
  }).join('')}</span>`;
}

const gradeClass = (total) => (total < 40 ? 'g-bad' : total < 55 ? 'g-mid' : 'g-good');

// ---------- 总览记分表 ----------

function overviewHtml(scores) {
  const rows = scores.pathways.map((p, i) => `
    <tr data-pid="${escapeHtml(p.id)}" class="score-row">
      <td class="num">${i + 1}</td>
      <td><b>${escapeHtml(p.name)}</b> <span class="muted">${escapeHtml(p.id)}</span></td>
      <td class="num total ${gradeClass(p.total)}">${p.total.toFixed(1)}</td>
      <td>${dimBars(p.dims, (k) => DIM_MAX[k])}</td>
      <td class="num ${p.minAxis < 40 ? 'warn-text' : ''}">${p.minAxis.toFixed(0)}</td>
      <td class="num muted">${p.cards}</td>
    </tr>`).join('');
  return `
    <h1 class="page-title">设计评分</h1>
    <p class="muted">口径：<code>docs/meta/SCORING.md</code>（闭环优先）· 数据 <code>score.py</code> 预计算 ${escapeHtml(scores.generated)} · 前端不重算。
    升序 = 重设计优先级。点击行进途径计分卡。</p>
    <div class="panel"><table class="score-table">
      <thead><tr><th>#</th><th>途径</th><th>总分</th><th>六维（轴健康/跨轴/跨系/结构/落地/文本）</th><th>最低轴</th><th>卡数</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

// ---------- 途径计分卡 ----------

function pathwayHtml(scores, pid) {
  const p = scores.pathways.find((x) => x.id === pid);
  if (!p) return `<h1 class="page-title">未找到途径 ${escapeHtml(pid)}</h1>`;
  const dimRows = DIMS.map((k) => ({ label: k, value: p.dims[k] || 0, max: DIM_MAX[k] }));
  const deductions = p.deductions.length
    ? `<div class="panel"><h2>途径失分项（改这里涨分）</h2><ul class="deduction-list">
        ${p.deductions.map((d) => `<li><span class="badge warn">${escapeHtml(d.dim)}</span> ${escapeHtml(d.why)} <span class="muted">${escapeHtml(d.ref)}</span></li>`).join('')}</ul></div>`
    : '';
  const axisRows = p.axes.map((a) => `
    <tr data-axis="${escapeHtml(a.id)}" class="axis-row">
      <td>${axisSpan(pid, a.id)}</td>
      <td class="num total ${gradeClass(a.total)}">${a.total.toFixed(1)}</td>
      <td>${axisDimBars(a.dims)}</td>
      <td class="muted small">${a.enablersVerified.length ? '产 ' + a.enablersVerified.length : '<span class="warn-text">产 0</span>'} ·
          ${a.payoffsLanded.length ? '读 ' + a.payoffsLanded.length : (a.vacuumAccepted ? '<span class="muted">真空✓</span>' : '<span class="warn-text">读 0</span>')}</td>
    </tr>
    <tr class="axis-detail" data-axis="${escapeHtml(a.id)}" hidden><td colspan="4">${axisDetailHtml(pid, a)}</td></tr>`).join('');
  return `
    <h1 class="page-title">${escapeHtml(p.name)} 计分卡 · <span class="total ${gradeClass(p.total)}">${p.total.toFixed(1)}</span></h1>
    <p class="muted"><a href="#/score">← 返回总览</a> ｜ 全库排行第 ${scores.pathways.indexOf(p) + 1} / ${scores.pathways.length} ｜ 轴均 ${p.dims['轴健康度'].toFixed(1)} 分维</p>
    <div class="panel"><h2>六维得分</h2>
      <table class="dim-table">${dimRows.map((r) => `
        <tr><td>${r.label}</td><td class="num">${r.value.toFixed(1)}</td>
        <td><span class="dim-bars single"><i class="dim-bar" style="width:${Math.round((r.value / r.max) * 100)}%"></i></span></td>
        <td class="muted">/ ${r.max}</td></tr>`).join('')}</table></div>
    ${deductions}
    <div class="panel"><h2>构筑轴（点击行展开下钻）</h2>
      <table class="score-table"><thead><tr><th>轴</th><th>总分</th><th>六维（身份/产层/读层/多样/规模/连通）</th><th>产读</th></tr></thead>
      <tbody>${axisRows}</tbody></table></div>`;
}

function cardLink(pid, name) {
  const card = DB.cards.find((c) => c._pathway === pid && c.name === name);
  return card
    ? `<a href="#/card/${encodeURIComponent(card.id)}">${escapeHtml(name)}</a>`
    : escapeHtml(name);
}

function axisDetailHtml(pid, a) {
  const ded = a.deductions.length
    ? `<ul class="deduction-list">${a.deductions.map((d) => `<li><span class="badge warn">${escapeHtml(d.dim)}</span> ${escapeHtml(d.why)}</li>`).join('')}</ul>`
    : '<p class="muted">无失分项。</p>';
  return `<div class="axis-detail-inner">
    <p>实证 enabler：${a.enablersVerified.map((n) => cardLink(pid, n)).join('、') || '—'}</p>
    <p>实证 payoff（卡面读层）：${a.payoffsLanded.map((n) => cardLink(pid, n)).join('、') || '—'}</p>
    <p>notes 级 payoff（卡面未落读层）：${a.payoffsNotes.map((n) => cardLink(pid, n)).join('、') || '—'}</p>
    <p class="muted">读层方式：${a.patterns.join(' / ') || '—'} ｜ 轴卡数 ${a.cards}${a.vacuumAccepted ? ' ｜ 真空轴已甄别接受' : ''}</p>
    ${ded}</div>`;
}

// ---------- 入口 ----------

export async function renderScore(view, arg) {
  let scores;
  try {
    scores = await loadScores();
  } catch (e) {
    view.innerHTML = `<h1 class="page-title">设计评分</h1><div class="panel"><p class="warn-text">scores.json 加载失败：${escapeHtml(e.message)}</p>
      <p class="muted">先跑 <code>python3 docs/tools/score.py</code> 生成。</p></div>`;
    return;
  }
  if (arg) {
    view.innerHTML = pathwayHtml(scores, decodeURIComponent(arg));
    view.querySelectorAll('.axis-row').forEach((tr) => {
      tr.addEventListener('click', () => {
        const det = view.querySelector(`.axis-detail[data-axis="${CSS.escape(tr.dataset.axis)}"]`);
        if (det) det.hidden = !det.hidden;
      });
    });
  } else {
    view.innerHTML = overviewHtml(scores);
    view.querySelectorAll('.score-row').forEach((tr) => {
      tr.addEventListener('click', () => { location.hash = `#/score/${tr.dataset.pid}`; });
    });
  }
}
