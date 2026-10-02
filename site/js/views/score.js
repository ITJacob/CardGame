// 设计评分页：总览记分表 + 途径计分卡（评价打分清单 + 用料明细 + 轴级下钻）。
// 分数与失分项来自 docs/tools/score.py 预计算的 scores.json（口径单一来源，见 docs/meta/SCORING.md）
// ——前端不重算分；用料明细（原语/参数/状态九维度）前端从 DB 现算，遍历规则与统计分析页
// 卡面各组、页末「状态定义面」逐字一致（walkCardEffects 同一套），保证各处数字互相能对上。
import { DB, loadScores, statusesReady, onStatusesReady } from '../data.js';
import { escapeHtml, zh, axisSpan } from '../term.js';
import { walkCardEffects } from '../ast.js';
import { barChart, countBy, sortedRows } from '../charts.js';
import { modifierKeys } from './status.js';

const DIMS = ['轴健康度', '跨轴耦合', '跨系联动', '结构健康', '机制落地', '文本完备', '风格签名'];
const DIM_MAX = { 轴健康度: 30, 跨轴耦合: 15, 跨系联动: 15, 结构健康: 10, 机制落地: 10, 文本完备: 10, 风格签名: 10 };
const AXIS_DIMS = ['身份锚定', '产层闭环', '读层闭环', '轴内多样性', '规模均衡', '承接连通'];
const AXIS_DIM_MAX = { 身份锚定: 15, 产层闭环: 20, 读层闭环: 25, 轴内多样性: 15, 规模均衡: 10, 承接连通: 15 };

// 七维迷你条：一个单元格里并排 7 条，hover 显示维度名与分值
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

// ---------- 用料统计（前端现算；口径见文件头注释） ----------

// 卡面统计：原语用量 + 五种参数键分布。condition 谓词口径与 score.py 的
// card_condition_kinds 一致——effects 树里凡带字符串 kind 的节点都算条件/谓词。
function cardStats(pid) {
  const prim = new Map();       // type -> 次数
  const stat = new Map();       // modify_stat 属性
  const elem = new Map();       // damage 元素
  const res = new Map();        // modify_resource 资源
  const anchor = new Map();     // 效果节点 target_override/move 等 anchor
  const cond = new Map();       // condition 谓词 kind
  for (const c of DB.cards) {
    if (c._pathway !== pid) continue;
    walkCardEffects(c, (n, kindOf) => {
      if (kindOf !== 'primitive') return;
      prim.set(n.type, (prim.get(n.type) || 0) + 1);
      if (n.type === 'modify_stat' && n.stat) stat.set(n.stat, (stat.get(n.stat) || 0) + 1);
      if (n.type === 'damage' && n.element) elem.set(n.element, (elem.get(n.element) || 0) + 1);
      if (n.type === 'modify_resource' && n.resource) res.set(n.resource, (res.get(n.resource) || 0) + 1);
      if (typeof n.anchor === 'string') anchor.set(n.anchor, (anchor.get(n.anchor) || 0) + 1);
    });
    // kind 节点散在 effects 树各处（condition / filter / hasStatus 段），walkCardEffects
    // 只回调 primitive/op，谓词要另行递归——口径同 score.py card_condition_kinds
    const walkKind = (n) => {
      if (Array.isArray(n)) { n.forEach(walkKind); return; }
      if (!n || typeof n !== 'object') return;
      if (typeof n.kind === 'string') cond.set(n.kind, (cond.get(n.kind) || 0) + 1);
      for (const v of Object.values(n)) if (v && typeof v === 'object') walkKind(v);
    };
    walkKind(c.effects);
  }
  return { prim, stat, elem, res, anchor, cond };
}

// 状态九维度：本途径自有状态定义（_owner === pid）的九个统计面，
// 维度清单与统计分析页「状态定义面」的「途径 × 维度」热图逐字对应，仅收为单途径视图
function statusStats(pid) {
  const defs = DB.statuses.filter((s) => s._owner === pid);
  const prim = new Map();
  for (const s of defs) {
    walkCardEffects(s, (n, kindOf) => {
      if (kindOf === 'primitive') prim.set(n.type, (prim.get(n.type) || 0) + 1);
    });
  }
  const fill = new Map(DB.declaredStatusFields.map((f) => [f, 0]));
  for (const s of defs) {
    for (const [k, v] of Object.entries(s)) {
      if (k === '_owner' || v == null) continue;
      if (Array.isArray(v) && !v.length) continue;
      if (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length) continue;
      fill.set(k, (fill.get(k) || 0) + 1);
    }
  }
  return {
    defs,
    count: defs.length,
    cat: countBy(defs.flatMap((s) => [].concat(s.category || [])), (c) => c),
    trigger: countBy(defs.flatMap((s) => s.triggers || []), (t) => t.event),
    duration: countBy(defs.filter((s) => s.duration != null), (s) => s.duration),
    stacks: countBy(defs.filter((s) => s.maxStacks != null), (s) => s.maxStacks),
    charges: countBy(defs.filter((s) => s.charges != null), (s) => s.charges),
    dispel: countBy(defs, (s) => (s.dispelable === false ? '不可驱散' : '可驱散')),
    prim,
    mkeys: countBy(defs.flatMap((s) => modifierKeys(s)), (k) => k),
    fill,
  };
}

// ---------- 总览记分表 ----------

function overviewHtml(scores) {
  const primCover = new Map();   // pid -> 用掉的原语种类数
  for (const c of DB.cards) {
    if (!primCover.has(c._pathway)) primCover.set(c._pathway, new Set());
  }
  for (const c of DB.cards) {
    walkCardEffects(c, (n, kindOf) => {
      if (kindOf === 'primitive') primCover.get(c._pathway)?.add(n.type);
    });
  }
  const ownStatus = countBy(DB.statuses, (s) => s._owner);
  const total = DB.declaredPrimitives.length || 27;
  const rows = scores.pathways.map((p, i) => `
    <tr data-pid="${escapeHtml(p.id)}" class="score-row">
      <td class="num">${i + 1}</td>
      <td><b>${escapeHtml(p.name)}</b> <span class="muted">${escapeHtml(p.id)}</span></td>
      <td class="num total ${gradeClass(p.total)}">${p.total.toFixed(1)}</td>
      <td class="col-dimbars">${dimBars(p.dims, (k) => DIM_MAX[k])}</td>
      <td class="num ${p.minAxis < 40 ? 'warn-text' : ''}">${p.minAxis.toFixed(0)}</td>
      <td class="num muted">${p.cards}</td>
      <td class="num muted" title="卡面用过的效果原语种类 / schema 声明的 ${total} 种">${primCover.get(p.id)?.size || 0}<span class="muted">/${total}</span></td>
      <td class="num muted" title="_owner 为本途径的状态定义数（不含通用）">${ownStatus.get(p.id) || 0}</td>
    </tr>`).join('');
  return `
    <h1 class="page-title">设计评分</h1>
    <p class="muted">口径：<code>docs/meta/SCORING.md</code>（闭环优先）· 数据 <code>score.py</code> 预计算 ${escapeHtml(scores.generated)} · 前端不重算。
    升序 = 重设计优先级。点击行进途径计分卡（评价打分清单 + 用料明细）。</p>
    <div class="panel"><table class="score-table">
      <thead><tr><th>#</th><th>途径</th><th>总分</th><th class="col-dimbars">七维（轴健康/跨轴/跨系/结构/落地/文本/风格）</th><th>最低轴</th><th>卡数</th><th>原语覆盖</th><th>自有状态</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

// ---------- 途径计分卡 ----------

// 评价打分清单：七维度逐行——徽章（✓ 满分 / △ 部分 / ✗ 有失分）+ 得分条 + 失分条目
// （每条 why + 修改意见 fix）。失分条用 <details> 原生折叠：零 JS、键盘可达、手机端无命中问题。
function checklistHtml(p) {
  const rows = DIMS.map((k) => {
    const v = p.dims[k] || 0;
    const max = DIM_MAX[k];
    const deds = p.deductions.filter((d) => d.dim === k);
    const badge = deds.length ? '✗' : (v >= max - 0.05 ? '✓' : '△');
    const cls = deds.length ? 'bad' : (v >= max - 0.05 ? 'ok' : 'mid');
    const pct = Math.round((v / max) * 100);
    const fix = deds.length
      ? `<details class="chk-fix"><summary>${deds.length} 条失分 · 点开看问题与修改意见</summary>
          <ul class="deduction-list">${deds.map((d) => `
            <li><span class="badge warn">${escapeHtml(d.dim)}</span> ${escapeHtml(d.why)}
              <span class="muted">${escapeHtml(d.ref)}</span>
              <div class="fix-line">→ ${escapeHtml(d.fix)}</div></li>`).join('')}</ul></details>`
      : (v >= max - 0.05 ? '<div class="chk-okline muted">达标，无失分项。</div>'
                         : '<div class="chk-okline muted">部分得分（归一维），无具体失分条目。</div>');
    // 风格签名维：附签名键用量明细（键表口径见 docs/meta/途径设计身份.md §一）
    const sigDetail = (k === '风格签名' && p.sigHits)
      ? `<div class="chk-okline muted">签名键用量（≥2 卡=落地）：
          ${Object.entries(p.sigHits).map(([kk, vv]) => `${escapeHtml(kk)} ×${vv}`).join('；')}
          ｜对他途径指纹均距 ${p.styleDist != null ? p.styleDist.toFixed(3) : '—'}</div>`
      : '';
    return `<div class="chk-item"><div class="chk-row">
      <span class="chk-badge ${cls}">${badge}</span>
      <span class="chk-name">${k}</span>
      <span class="chk-bar"><span class="dim-bars single"><i class="dim-bar" style="width:${Math.max(pct, v ? 6 : 0)}%"></i></span></span>
      <span class="chk-score num">${v.toFixed(1)} <span class="muted">/ ${max}</span></span>
    </div>${fix}${sigDetail}</div>`;
  }).join('');
  return `<div class="panel"><h2>评价打分清单</h2>
    <p class="panel-note muted">✓ 满分 ｜ △ 部分得分 ｜ ✗ 有失分（点开看修改意见）。修改意见均为本途径内可执行动作。</p>
    ${rows}</div>`;
}

// 用料明细：卡面原语 / 参数分散度 / 状态九维度，三 panel 一组
function materialHtml(pid) {
  const cs = cardStats(pid);
  const primSum = [...cs.prim.values()].reduce((a, b) => a + b, 0);
  const total = DB.declaredPrimitives.length || 27;
  const used = cs.prim.size;
  const unused = DB.declaredPrimitives.filter((t) => !cs.prim.has(t));

  // 参数分散度：五种参数键的分布；长尾 = 全部参数值里只出现 1 次的种类数
  const dims = [
    ['modify_stat 属性', cs.stat, 'stat'],
    ['damage 元素', cs.elem, 'element'],
    ['modify_resource 资源', cs.res, 'resource'],
    ['target anchor 锚点', cs.anchor, 'anchor'],
    ['condition 谓词', cs.cond, null],
  ];
  const longTail = dims.reduce((n, [, m]) => n + [...m.values()].filter((v) => v === 1).length, 0);
  const kindSum = dims.reduce((n, [, m]) => n + m.size, 0);
  const paramHtml = dims.map(([title, m, cat]) => `
    <h3>${title} <span class="muted">（${m.size} 种）</span></h3>
    ${m.size ? barChart(sortedRows(m, cat ? (k) => zh(cat, k) : (k) => zh('conditionKind', k)))
             : '<p class="muted small">未使用。</p>'}`).join('');

  const ss = statusStats(pid);
  const nine = [
    ['分类', ss.cat, (k) => zh('statusCategory', k), null],
    ['触发点', ss.trigger, (k) => zh('triggerEvent', k), null],
    ['持续（duration）', ss.duration, (k) => `${k} tick`, 'byKey'],
    ['层数上限（maxStacks）', ss.stacks, (k) => `${k} 层`, 'byKey'],
    ['次数（charges）', ss.charges, (k) => `${k} 次`, 'byKey'],
    ['可驱散', ss.dispel, (k) => k, null],
    ['状态面原语', ss.prim, (k) => zh('primitive', k), null],
    ['修饰符键', ss.mkeys, (k) => zh('modifierKey', k), null],
    ['字段填充', ss.fill, (k) => k, null],
  ].map(([title, m, labelFn, byKey]) => `
    <div class="nine-cell">
      <h3>${title} <span class="muted">（${[...m.values()].reduce((a, b) => a + b, 0)}）</span></h3>
      ${[...m.values()].some((v) => v > 0)
        ? barChart(sortedRows(m, labelFn, { byKey: !!byKey }).filter((r) => r.value > 0))
        : '<p class="muted small">自有状态未涉及。</p>'}
    </div>`).join('');

  return `
    <div class="stat-group-title">用料明细（本途径实际用了什么料）</div>
    <div class="panel"><h2>卡面效果原语</h2>
      <p class="panel-note muted">共 ${primSum} 处 / 覆盖 <b>${used}</b>/${total} 种原语。
      ${unused.length ? `未用：${unused.map((t) => zh('primitive', t)).join('、')}——重设计补卡时可从这里挑新机制。` : '27 种全覆盖。'}</p>
      ${barChart(sortedRows(cs.prim, (k) => zh('primitive', k)))}</div>
    <div class="panel"><h2>参数分散度</h2>
      <p class="panel-note muted">参数值共 <b>${kindSum}</b> 种，其中只出现 1 次的长尾 <b>${longTail}</b> 种。
      分布越散，卡面表达越丰富；一家独大说明该轴载荷集中。</p>
      ${paramHtml}</div>
    <div class="panel wide-labels"><h2>状态（九维度）· 自有 ${ss.count} 个状态定义</h2>
      <p class="panel-note muted">九个维度与统计分析页「状态定义面」的「途径 × 维度」热图同口径，此处收为本途径视图
      （通用 common 状态不计入「自有」，其被卡面引用的情况隐含在原语/参数分布里）。</p>
      <div class="nine-grid">${nine}</div></div>`;
}

function pathwayHtml(scores, pid) {
  const p = scores.pathways.find((x) => x.id === pid);
  if (!p) return `<h1 class="page-title">未找到途径 ${escapeHtml(pid)}</h1>`;
  const axisRows = p.axes.map((a) => `
    <tr data-axis="${escapeHtml(a.id)}" class="axis-row">
      <td>${axisSpan(pid, a.id)}</td>
      <td class="num total ${gradeClass(a.total)}">${a.total.toFixed(1)}</td>
      <td class="col-dimbars">${axisDimBars(a.dims)}</td>
      <td class="muted small">${a.enablersVerified.length ? '产 ' + a.enablersVerified.length : '<span class="warn-text">产 0</span>'} ·
          ${a.payoffsLanded.length ? '读 ' + a.payoffsLanded.length : (a.vacuumAccepted ? '<span class="muted">真空✓</span>' : '<span class="warn-text">读 0</span>')}</td>
    </tr>
    <tr class="axis-detail" data-axis="${escapeHtml(a.id)}" hidden><td colspan="4">${axisDetailHtml(pid, a)}</td></tr>`).join('');
  return `
    <h1 class="page-title">${escapeHtml(p.name)} 计分卡 · <span class="total ${gradeClass(p.total)}">${p.total.toFixed(1)}</span></h1>
    <p class="muted"><a href="#/score">← 返回总览</a> <span class="muted small">｜ 重设计优先级序 ${scores.pathways.indexOf(p) + 1} / ${scores.pathways.length}</span></p>
    ${checklistHtml(p)}
    ${materialHtml(pid)}
    <div class="panel"><h2>构筑轴（点击行展开下钻）</h2>
      <table class="score-table"><thead><tr><th>轴</th><th>总分</th><th class="col-dimbars">六维（身份/产层/读层/多样/规模/连通）</th><th>产读</th></tr></thead>
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
    ? `<ul class="deduction-list">${a.deductions.map((d) => `
        <li><span class="badge warn">${escapeHtml(d.dim)}</span> ${escapeHtml(d.why)}
          <div class="fix-line">→ ${escapeHtml(d.fix)}</div></li>`).join('')}</ul>`
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
  // 用料明细要读状态定义（loadDeferred 首屏后才拉）。深链直接落到本页时先画加载态，
  // 到位后由 onStatusesReady 重画——口径照统计分析页「状态定义面」，不自己重画抢路由
  if (!statusesReady()) {
    view.innerHTML = `<h1 class="page-title">设计评分</h1>
      <div class="panel score-loading"><p class="panel-note muted">正在加载状态定义…</p></div>`;
    onStatusesReady(() => { if (view.querySelector('.score-loading')) renderScore(view, arg); });
    return;
  }
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
