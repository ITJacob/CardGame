// 状态定义统计（独立一页，与卡面统计分开）
// 口径：docs/json/*.statuses.json 的 statusDefs——含 modifiers 表、triggers[].effects、
// def 级 effects、thresholdTrigger / phases 等任意嵌套（递归用 ast.js 的 walkCardEffects，
// 它与卡面同一套遍历规则，所以两页的「原语用量」可以直接对照）
import { DB, statusesReady, onStatusesReady } from '../data.js';
import { zh } from '../term.js';
import { walkCardEffects } from '../ast.js';
import { barChart, countBy, sortedRows, heatPanel, wireHeatToggle } from '../charts.js';

// modifiers 是**自由词表**（不是封闭枚举）：对象形态 {键: 值}，键由卡面自定。
// 数组形态的元素是 statusModifier，用 kind 作键。note 是附注，不算修饰符本身
function modifierKeys(def) {
  const m = def.modifiers;
  if (!m) return [];
  const keys = Array.isArray(m)
    ? m.map((x) => (typeof x === 'string' ? x : x?.kind))
    : Object.keys(m);
  return keys.filter((k) => k && k !== 'note');
}

export function renderStatuses(view) {
  // 状态定义在首屏之后才拉（见 data.js 的 loadDeferred）。深链直接落到本页时先画加载态，
  // 到位后由 main.js 重跑 route() 重画——不在这里自己重画，免得和路由抢 view
  if (!statusesReady()) {
    view.innerHTML = `<h1 class="page-title">状态统计</h1>
      <div class="panel" id="statuses-loading"><p class="panel-note muted">正在加载 ${DB.pathways.length} 个途径的状态定义…</p></div>`;
    // 等数据的这段时间用户可能已经切走，只在自己那个加载态还在时重画
    onStatusesReady(() => { if (view.querySelector('#statuses-loading')) renderStatuses(view); });
    return;
  }
  const defs = DB.statuses;
  const declared = DB.declaredStatusFields;
  const pathwayName = new Map(DB.pathways.map((p) => [p.id, p.name]));
  // common.statuses.json 的定义不属于任何途径，单列一格
  const ownerLabel = (id) => pathwayName.get(id) || '通用';

  const byCat = countBy(defs.flatMap((s) => [].concat(s.category || [])), (c) => c);
  const byOwner = countBy(defs, (s) => s._owner);
  const triggers = defs.flatMap((s) => s.triggers || []);
  const byTrigger = countBy(triggers, (t) => t.event);

  // 状态面原语（同一套遍历规则，可与卡片页对照）
  const primTotal = new Map();
  const primByCat = new Map();
  for (const s of defs) {
    const cats = [].concat(s.category || []);
    walkCardEffects(s, (n, kindOf) => {
      if (kindOf !== 'primitive') return;
      primTotal.set(n.type, (primTotal.get(n.type) || 0) + 1);
      for (const c of cats) {
        if (!primByCat.has(c)) primByCat.set(c, new Map());
        const m = primByCat.get(c);
        m.set(n.type, (m.get(n.type) || 0) + 1);
      }
    });
  }
  const primCols = [...primTotal.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const primSum = [...primTotal.values()].reduce((a, b) => a + b, 0);

  const mkeyTotal = new Map();
  for (const s of defs) {
    for (const k of modifierKeys(s)) mkeyTotal.set(k, (mkeyTotal.get(k) || 0) + 1);
  }
  const mkeySum = [...mkeyTotal.values()].reduce((a, b) => a + b, 0);
  const mkeyOnce = [...mkeyTotal.values()].filter((v) => v === 1).length;

  // 字段填充：声明面来自 schema（改 schema 自动跟上，前端不硬写）
  const fill = new Map(declared.map((f) => [f, 0]));
  for (const s of defs) {
    for (const [k, v] of Object.entries(s)) {
      if (k === '_owner') continue;
      if (v == null) continue;
      if (Array.isArray(v) && !v.length) continue;
      if (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length) continue;
      fill.set(k, (fill.get(k) || 0) + 1);
    }
  }
  const declaredTotal = declared.length || fill.size;
  const unusedFields = [...fill.entries()].filter(([, v]) => v === 0).length;

  const nDispelable = defs.filter((s) => s.dispelable !== false).length;
  const nModifiers = defs.filter((s) => s.modifiers && Object.keys(s.modifiers).length).length;
  const nEffects = defs.filter((s) => s.effects?.length).length;
  const nCross = defs.filter((s) => s.crossPathway).length;
  const catCount = new Set(defs.flatMap((s) => [].concat(s.category || []))).size;

  const overview = `
    <div class="stat-grid">
      <div class="panel"><h2>总览</h2><dl class="kv">
        <dt>状态定义</dt><dd class="num">${defs.length}</dd>
        <dt>覆盖途径</dt><dd class="num">${new Set(defs.map((s) => s._owner)).size}<span class="muted">（含通用）</span></dd>
        <dt>分类</dt><dd class="num">${catCount}</dd>
        <dt>可驱散 / 不可驱散</dt><dd class="num">${nDispelable} / ${defs.length - nDispelable}</dd>
        <dt>带修饰符</dt><dd class="num">${nModifiers}</dd>
        <dt>带触发器</dt><dd class="num">${defs.filter((s) => s.triggers?.length).length}</dd>
        <dt>带 def 级效果</dt><dd class="num">${nEffects}</dd>
        <dt>跨途径</dt><dd class="num">${nCross}</dd>
        <dt>状态面原语</dt><dd class="num">${primSum} 次 / ${primTotal.size} 类</dd>
      </dl></div>
      <div class="panel"><h2>分类分布</h2>${barChart(sortedRows(byCat, (k) => zh('statusCategory', k)))}</div>
      <div class="panel"><h2>各途径状态数</h2>${barChart(sortedRows(byOwner, ownerLabel))}</div>
    </div>`;

  const triggerPanel = `
    <div class="stat-grid">
      <div class="panel"><h2>触发点分布</h2>
        <p class="panel-note muted">共 ${triggers.length} 条触发器，覆盖 ${byTrigger.size} 个触发点。</p>
        ${barChart(sortedRows(byTrigger, (k) => zh('triggerEvent', k)))}</div>
      <div class="panel"><h2>持续 / 叠层 / 次数</h2>
        <p class="panel-note muted">三张都是有序刻度，按数值升序排（不是按数量）。</p>
        <h3>持续（duration）</h3>${barChart(sortedRows(
          countBy(defs.filter((s) => s.duration != null), (s) => s.duration),
          (k) => `${k} tick`, { byKey: true }))}
        <h3>层数上限（maxStacks）</h3>${barChart(sortedRows(
          countBy(defs.filter((s) => s.maxStacks != null), (s) => s.maxStacks),
          (k) => `${k} 层`, { byKey: true }))}
        <h3>次数（charges）</h3>${barChart(sortedRows(
          countBy(defs.filter((s) => s.charges != null), (s) => s.charges),
          (k) => `${k} 次`, { byKey: true }))}</div>
    </div>`;

  const mkeyPanel = `
    <div class="panel wide-labels"><h2>修饰符键 Top 20</h2>
      <p class="panel-note muted">modifiers 是自由词表而非封闭枚举：共 <b>${mkeyTotal.size}</b> 种键 / ${mkeySum} 处，
      其中 <b>${mkeyOnce}</b> 种只出现 1 次（长尾）。此处只列前 20 种。</p>
      ${barChart(sortedRows(new Map([...mkeyTotal.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20))))}</div>`;

  const primPanel = `
    <div class="panel"><h2>状态面原语用量</h2>
      <p class="panel-note muted">只算 statusDefs 内的效果节点（modifiers 表不算原语）。
      用量 ${primSum} 次 / ${primTotal.size} 类${DB.declaredPrimitives.length ? `；schema 声明 ${DB.declaredPrimitives.length} 条` : ''}。</p>
      ${barChart(sortedRows(primTotal, (k) => zh('primitive', k)))}</div>`;

  const fieldPanel = `
    <div class="panel wide-labels"><h2>statusDef 字段填充</h2>
      <p class="panel-note muted">字段清单读自 schema（声明 ${declaredTotal} 个），当前有 <b>${unusedFields}</b> 个字段在状态定义里一次都没用到。
      计数=填了该字段的状态定义数。</p>
      ${barChart(sortedRows(fill))}</div>`;

  const heat = heatPanel({
    title: '分类 × 原语 用量热图',
    cornerLabel: '分类',
    scopeLabel: '状态面',
    cols: primCols.map((t) => ({ key: t, label: zh('primitive', t), title: t })),
    rows: [...primByCat.entries()]
      .sort((a, b) => [...b[1].values()].reduce((x, y) => x + y, 0) - [...a[1].values()].reduce((x, y) => x + y, 0))
      .map(([c, m]) => ({ head: zh('statusCategory', c), values: m })),
  });

  // ---- 途径 × 维度 热图（9 张，与上方同维度 bar 同口径、同遍历规则）----
  const bump2 = (m, owner, key) => {
    let r = m.get(owner);
    if (!r) { r = new Map(); m.set(owner, r); }
    r.set(key, (r.get(key) || 0) + 1);
  };
  const catByOwner = new Map(), trigByOwner = new Map(), durByOwner = new Map(),
        stackByOwner = new Map(), chargeByOwner = new Map(), dispelByOwner = new Map(),
        primByOwner = new Map(), mkeyByOwner = new Map(), fieldByOwner = new Map();
  for (const s of defs) {
    const o = s._owner;
    for (const c of [].concat(s.category || [])) bump2(catByOwner, o, c);
    for (const t of s.triggers || []) bump2(trigByOwner, o, t.event);
    if (s.duration != null) bump2(durByOwner, o, s.duration);
    if (s.maxStacks != null) bump2(stackByOwner, o, s.maxStacks);
    if (s.charges != null) bump2(chargeByOwner, o, s.charges);
    bump2(dispelByOwner, o, s.dispelable === false ? '不可驱散' : '可驱散');
    for (const k of modifierKeys(s)) bump2(mkeyByOwner, o, k);
    walkCardEffects(s, (n, kindOf) => { if (kindOf === 'primitive') bump2(primByOwner, o, n.type); });
    for (const [k, v] of Object.entries(s)) {
      if (k === '_owner' || v == null) continue;
      if (Array.isArray(v) && !v.length) continue;
      if (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length) continue;
      bump2(fieldByOwner, o, k);
    }
  }
  // 行：22 个途径**全在**（manifest 序，一格都没有的途径留空行）+ 末尾一行「通用」。
  // 行清单是「途径」而不是「有数据的途径」——少一行，相邻热图之间就对不上号了
  const ownerRows = (m) => [
    ...DB.pathways.map((p) => ({ head: p.name, values: m.get(p.id) || new Map() })),
    { head: '通用', values: m.get('common') || new Map() },
  ];
  // 列序 = 折叠优先级：用量型维度按总量降序（默认措辞即此）；持续/叠层/次数是有序刻度，
  // 升序排、折掉的是大数值端，措辞跟着改
  const usageCols = (total, cat, topN) => [...total.entries()].sort((a, b) => b[1] - a[1])
    .slice(0, topN).map(([k]) => ({ key: k, label: cat ? zh(cat, k) : String(k), title: String(k) }));
  const scaleCols = (m, suffix) => [...new Set([...m.values()].flatMap((r) => [...r.keys()]))]
    .sort((a, b) => a - b).map((k) => ({ key: k, label: `${k} ${suffix}`, title: String(k) }));
  const dispelCols = [
    { key: '可驱散', label: '可驱散', title: 'dispelable 未显式关闭' },
    { key: '不可驱散', label: '不可驱散', title: 'dispelable: false' },
  ];
  const heatOf = (title, m, cols, extra = {}) => heatPanel({
    title, cornerLabel: '途径', scopeLabel: '状态面', cols, rows: ownerRows(m), ...extra,
  });

  const heatSection = `
    <div class="stat-group-title">途径 × 维度 热图</div>
    <p class="panel-note muted">行 = ${DB.pathways.length} 个途径 + 末尾「通用」（common.statuses.json），
    口径与上方同维度 bar 一致。分类是复选字段，一行合计可以超过该途径的状态数；
    修饰符键与字段填充是长尾维度，只列 Top 列。</p>
    ${heatOf('途径 × 分类', catByOwner, usageCols(byCat, 'statusCategory'), { unit: ' 次' })}
    ${heatOf('途径 × 触发点', trigByOwner, usageCols(byTrigger, 'triggerEvent'), { unit: ' 条' })}
    ${heatOf('途径 × 持续（duration）', durByOwner, scaleCols(durByOwner, 'tick'), { unit: ' 个', orderNote: '数值最小的 ' })}
    ${heatOf('途径 × 层数上限（maxStacks）', stackByOwner, scaleCols(stackByOwner, '层'), { unit: ' 个', orderNote: '数值最小的 ' })}
    ${heatOf('途径 × 次数（charges）', chargeByOwner, scaleCols(chargeByOwner, '次'), { unit: ' 个', orderNote: '数值最小的 ' })}
    ${heatOf('途径 × 可驱散', dispelByOwner, dispelCols, { unit: ' 个' })}
    ${heatOf('途径 × 原语（状态面）', primByOwner, usageCols(primTotal, 'primitive'))}
    ${heatOf('途径 × 修饰符键 Top 12', mkeyByOwner, usageCols(mkeyTotal, null, 12))}
    ${heatOf('途径 × statusDef 字段填充 Top 15', fieldByOwner, usageCols(fill, null, 15), { unit: ' 个' })}`;

  view.innerHTML = `<h1 class="page-title">状态统计</h1>
    <p class="panel-note muted">口径：docs/json/*.statuses.json 的 ${defs.length} 个状态定义。
    卡面效果见「统计分析」页。页面下方另附「途径 × 维度」热图（9 张）。</p>
    ${overview}${triggerPanel}${primPanel}${mkeyPanel}${heat}${fieldPanel}${heatSection}`;

  wireHeatToggle(view);
}
