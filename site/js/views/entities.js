// 编目三件套统计：召唤物（units）/ 区域（zones）/ 界域（domains）三个子页
// 口径：各途径 *.skills.json 顶层三池（unitDefs / zoneDefs / domainDefs，Def 编目独立化批
// 2026-10-01 落地），配卡面用法（spawn / domain 原语、filter.unitType 克制承载、
// 卡级 zone / domain 字段）。状态定义面在 status.js，卡面效果类型维度在 stats.js。
//
// 版面约定与 stats.js 完全一致：一个维度一组，组内先全库 bar、再「途径 × 维度」热图，
// 同组两侧列序同源（sortedRows / byKey）；行 = 22 途径（manifest 序、全在，无数据留空行）；
// 每张热图色阶独立（上限取本图最大值），跨图比颜色无意义，要比就比格内数字。
import { DB } from '../data.js';
import { zh, escapeHtml } from '../term.js';
import { walkCardEffects } from '../ast.js';
import { barChart, countBy, sortedRows, heatPanel, wireHeatToggle } from '../charts.js';

// ---- 共用组装件（与 stats.js / status.js 同模式的本地副本：三页体量小，不为一处抽象跨文件 import）----
const barPanel = (title, rows, extraHtml = '') =>
  `<div class="panel"><h2>${title}</h2>${extraHtml}${barChart(rows)}</div>`;

const group = (title, ...panels) => `
  <section class="stat-group">
    <div class="stat-group-title">${escapeHtml(title)}</div>
    ${panels.join('')}
  </section>`;

const bump = (m, row, col) => {
  let r = m.get(row);
  if (!r) { r = new Map(); m.set(row, r); }
  r.set(col, (r.get(col) || 0) + 1);
};
// 行：22 个途径全在（manifest 序），该维度一格都没有的途径留空行——行清单是「途径」而不是
// 「有数据的途径」，少一行相邻热图就对不上号了
const rowsOf = (m) => DB.pathways.map((p) => ({ head: p.name, values: m.get(p.id) || new Map() }));
const colsOf = (m, cat) => sortedRows(m, (k) => zh(cat, k))
  .map((r) => ({ key: r.title, label: r.label, title: r.title }));
const heatOf = (title, m, cols, extra = {}) => heatPanel({
  title, cornerLabel: '途径', scopeLabel: '全库', cols, rows: rowsOf(m), ...extra,
});
// 有序刻度列（hpRatio / duration 这类数值档）：按数值升序，折掉的是大数值端
const scaleCols = (m, fmt = (k) => String(k)) => [...new Set([...m.values()].flatMap((r) => [...r.keys()]))]
  .sort((a, b) => (Number(a) - Number(b)) || String(a).localeCompare(String(b)))
  .map((k) => ({ key: k, label: fmt(k), title: String(k) }));
// 行数据（pathway → Map）摊平成全库计数：有序刻度 bar 与热图同口径、同数据源
const flatRows = (m) => {
  const acc = new Map();
  for (const r of m.values()) for (const [k, v] of r) acc.set(k, (acc.get(k) || 0) + v);
  return acc;
};

// 字段填充：声明面读自 schema（data.js 的 readDeclared），计数规则镜像状态页——
// 空数组 / 空对象不算填；schema 取不到时 declared 为空，声明面自动退成「实际用过的字段」
function fieldFill(defs, declared) {
  const fill = new Map(declared.length ? declared.map((f) => [f, 0]) : []);
  for (const d of defs) {
    for (const [k, v] of Object.entries(d)) {
      if (k === '_pathway' || v == null) continue;
      if (Array.isArray(v) && !v.length) continue;
      if (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length) continue;
      fill.set(k, (fill.get(k) || 0) + 1);
    }
  }
  return fill;
}
const fillPanel = (title, defs, declared) => {
  const fill = fieldFill(defs, declared);
  const unused = [...fill.values()].filter((v) => v === 0).length;
  return `<div class="panel wide-labels"><h2>${title}</h2>
    <p class="panel-note muted">字段清单读自 schema（声明 ${declared.length || fill.size} 个），
    当前有 <b>${unused}</b> 个字段在编目定义里一次都没用到。计数 = 填了该字段的定义数。</p>
    ${barChart(sortedRows(fill))}</div>`;
};

// spawn 引用形态分类。动态模板（killed_unit / primary_target / holder）不产出具名单位；
// 复活（reviveOf）不产生新单位（G4）；zone / def 键指向区域蓝本，归区域页统计
const DYNAMIC_TEMPLATES = new Set(['killed_unit', 'primary_target', 'holder']);
const spawnKindOf = (n) => {
  if (n.reviveOf) return '复活（不产生新单位）';
  if (n.unitId) return '具名单位引用';
  if (n.template) return DYNAMIC_TEMPLATES.has(n.template) ? '动态模板' : '固定蓝本模板';
  if (n.zone || n.def) return '区域蓝本引用';
  return '其他';
};

// ============================================================ 召唤物 ====
export function renderUnitStats(view) {
  const defs = DB.unitDefs;
  const poolIds = new Set(defs.map((d) => d.id));

  // 卡面两趟遍历：spawn 引用形态 + 具名引用清单（walkCardEffects 一趟）；
  // 按 unitType 分道的承载（ddd《召唤物参数》§四）再补一趟卡级选靶扫描——
  // ① 效果节点 filter.unitType（damage_mul 乘区登记口径）② target.request /
  // secondaryTargets.request 选靶约束 ③ target_unit_type / target_is_summoned 谓词。
  // 实测：① 当前数据零使用（晨曦领域的类型约束写在域 envRulesText 文本里，结构不可统计），
  // 承载实走在 ②③ 两路
  const kindTotal = new Map(), kindByPath = new Map();
  const namedRefs = new Map(), namedRefsByPath = new Map(), outsidePool = new Map();
  const counterTotal = new Map(), counterByPath = new Map();
  let nFilter = 0, nReqFilter = 0, nCond = 0, nSummoned = 0;
  const addCounter = (p, t) => { counterTotal.set(t, (counterTotal.get(t) || 0) + 1); bump(counterByPath, p, t); };
  for (const c of DB.cards) {
    const p = c._pathway;
    walkCardEffects(c, (n) => {
      if (n.type === 'spawn') {
        const kind = spawnKindOf(n);
        kindTotal.set(kind, (kindTotal.get(kind) || 0) + 1);
        bump(kindByPath, p, kind);
        if (n.unitId) {
          namedRefs.set(n.unitId, (namedRefs.get(n.unitId) || 0) + 1);
          bump(namedRefsByPath, p, n.unitId);
          if (!poolIds.has(n.unitId)) outsidePool.set(n.unitId, (outsidePool.get(n.unitId) || 0) + 1);
        }
      }
      const fromFilter = n.filter?.unitType ? [].concat(n.filter.unitType) : [];
      if (fromFilter.length) nFilter++;
      for (const t of fromFilter) addCounter(p, t);
      const cond = n.condition;
      const fromCond = cond && cond.kind === 'target_unit_type'
        ? [].concat(cond.unitType || cond.unitTypes || cond.type || cond.value || []) : [];
      if (fromCond.length) nCond++;
      for (const t of fromCond) addCounter(p, t);
      if (cond && cond.kind === 'target_is_summoned') nSummoned++;
    });
    // ② 选靶约束：target / secondaryTargets 的 request.filter.unitType（数组）
    const reqTypes = [];
    if (c.target?.request?.filter?.unitType) reqTypes.push(...[].concat(c.target.request.filter.unitType));
    for (const st of c.secondaryTargets || []) {
      if (st.request?.filter?.unitType) reqTypes.push(...[].concat(st.request.filter.unitType));
    }
    if (reqTypes.length) nReqFilter++;
    for (const t of reqTypes) addCounter(p, t);
  }

  // unitType / 属性档位 / 技能载荷的编目统计（池内口径，行 = 定义所在途径）
  const byType = new Map(), typeByPath = new Map();
  const ratioByPath = new Map();   // hpRatio/atkRatio 档位（base 内与顶层并集，H1 裁定口径）
  const featTotal = new Map(), featByPath = new Map();
  const nTyped = defs.filter((d) => d.unitType).length;
  const featOf = (d) => {
    const f = [];
    if (d.triggers?.length) f.push('带触发载荷');
    if (d.tags?.length) f.push('带 tags');
    if (d.element) f.push('带元素');
    if (d.base?.reach) f.push(`reach ${zh('reach', d.base.reach)}`);
    if (!f.length) f.push('白板（无声明载荷）');
    return f;
  };
  for (const d of defs) {
    const p = d._pathway;
    if (d.unitType) { byType.set(d.unitType, (byType.get(d.unitType) || 0) + 1); bump(typeByPath, p, d.unitType); }
    // 比率取顶层与 base 的并集，同键顶层优先（冲突以显式者为准的同一裁定）
    for (const key of ['hpRatio', 'atkRatio']) {
      const v = d[key] ?? d.base?.[key];
      if (v != null) bump(ratioByPath, p, `${key === 'hpRatio' ? '生命' : '攻击'} ${v}`);
    }
    for (const f of featOf(d)) { featTotal.set(f, (featTotal.get(f) || 0) + 1); bump(featByPath, p, f); }
  }

  const overview = group('召唤物面 · 总览',
    `<div class="panel"><h2>总览</h2><dl class="kv">
      <dt>具名单位蓝本（unitDefs 池）</dt><dd class="num">${defs.length}</dd>
      <dt>覆盖途径</dt><dd class="num">${new Set(defs.map((d) => d._pathway)).size}</dd>
      <dt>卡面召唤次数（spawn 原语）</dt><dd class="num">${[...kindTotal.values()].reduce((a, b) => a + b, 0)}</dd>
      <dt>具名单位引用（去重）</dt><dd class="num">${namedRefs.size}</dd>
      <dt>池外引用（卡面内联，无 unitDef）</dt><dd class="num">${outsidePool.size} 种 / ${[...outsidePool.values()].reduce((a, b) => a + b, 0)} 次</dd>
      <dt>克制承载</dt><dd class="num">乘区 ${nFilter} · 选靶约束 ${nReqFilter} · 谓词 ${nCond} · target_is_summoned ${nSummoned}</dd>
    </dl>
    <p class="panel-note muted">池只收编「同途径多卡共享」的蓝本（Def 编目独立化批）；单卡单位的属性
    内联在卡面 spawn 段（hpRatio / atkRatio × H1 基线），<b>池外引用是常态而非缺漏</b>。
    具名单位全集（36）与 H1 基线档见 ddd《召唤物参数》。</p></div>`,
    barPanel('spawn 引用形态（卡面，按节点计）', sortedRows(kindTotal)));

  const typeGroup = group('编目面 · unitType',
    barPanel('unitType 分布（unitDefs 池）', sortedRows(byType, (k) => zh('unitType', k)),
      `<p class="panel-note muted">仅 ${nTyped}/${defs.length} 条蓝本登记了 unitType——登记稀疏本身
      是现状的一部分：未登记单位的种类归属见 ddd《召唤物参数》§一归属表。</p>`),
    heatOf('途径 × unitType（蓝本所在途径）', typeByPath, colsOf(byType, 'unitType'), { unit: ' 条' }));

  const ratioGroup = group('数值面 · 属性档位',
    barPanel('hpRatio / atkRatio 档位（池内蓝本，顶层与 base 并集）', sortedRows(flatRows(ratioByPath)),
      `<p class="panel-note muted">比率缺省 = 1.0（按 base 原值出场）；比率是 per-spawn 实例参数，
      池内值只是缺省档（H1 裁定：冲突时以 spawn 段显式值为准）。</p>`),
    heatOf('途径 × 属性档位', ratioByPath,
      scaleCols(ratioByPath), { unit: ' 条', orderNote: '数值最小的 ' }));

  const featGroup = group('技能面 · 蓝本载荷',
    barPanel('蓝本特征分布', sortedRows(featTotal),
      `<p class="panel-note muted">技能模型三模式（ddd《召唤物参数》§三）：蓝本自带 = 池内声明
      triggers/tags 等载荷；模板继承由卡面 spawn 段承载（inheritSkills / template，不占蓝本）；
      白板 = 仅常规攻击行为。登场/消散载荷走 triggers，不算技能组。</p>`),
    // 特征键本身就是中文标签（带 tags / 白板…），不走过 zh 翻译
    heatOf('途径 × 蓝本特征', featByPath, sortedRows(featTotal)
      .map((r) => ({ key: r.title, label: r.label, title: r.title })), { unit: ' 条' }));

  const counterGroup = group('承载分道 · unitType',
    barPanel('按 unitType 分道的承载（卡面，效果节点 + 选靶约束 + 谓词）',
      sortedRows(counterTotal, (k) => zh('unitType', k)),
      `<p class="panel-note muted">三路承载合并计（ddd《召唤物参数》§四）：效果节点 filter.unitType
      乘区 ${nFilter} 处（登记口径，当前数据零使用——晨曦领域的类型约束写在域 envRulesText
      文本里，结构不可统计）、target.request 选靶约束 ${nReqFilter} 张卡、target_unit_type
      条件谓词 ${nCond} 处。filter 不区分敌我（克制 / 加益只由效果方向决定）；
      另有 target_is_summoned 笼统召唤物谓词 ${nSummoned} 处（此图按类型拆，不含它）。</p>`),
    heatOf('途径 × 承载 unitType', counterByPath, colsOf(counterTotal, 'unitType')));

  const fill = fillPanel('unitDef 字段填充', defs, DB.declaredUnitFields);

  view.innerHTML = `<p class="panel-note muted">本页口径 = 各途径 skills.json 顶层 <b>unitDefs 池</b>
    （${defs.length} 条具名蓝本）+ 卡面 spawn 原语引用与克制承载遍历。卡面效果类型维度见「技能」子页，
    状态口径见「状态」子页。</p>
    ${overview}${typeGroup}${ratioGroup}${featGroup}${counterGroup}${fill}`;
  wireHeatToggle(view);
}

// ============================================================ 区域 =====
export function renderZoneStats(view) {
  const defs = DB.zoneDefs;
  const poolIds = new Set(defs.map((d) => d.id));

  // 卡面 zone 用法：卡级 zone 字段（注册）+ spawn 的 zone / def 键引用（区域蓝本出场）
  let nZoneCards = 0, nZoneSpawn = 0;
  const zoneSpawnIds = new Map();
  for (const c of DB.cards) {
    if (c.zone) nZoneCards++;
    walkCardEffects(c, (n) => {
      if (n.type !== 'spawn') return;
      const id = n.zone || (n.def && poolIds.has(n.def) ? n.def : null);
      if (id) { nZoneSpawn++; zoneSpawnIds.set(id, (zoneSpawnIds.get(id) || 0) + 1); }
    });
  }

  // 池内结构维度
  const byKind = countBy(defs, (d) => d.kind);
  const byAffects = countBy(defs, (d) => d.affects);
  const byTrigger = countBy(defs, (d) => d.trigger);
  const byDurUnit = countBy(defs.filter((d) => d.duration != null), (d) => d.durationUnit || 'tick（缺省）');
  const kindByPath = new Map(), affectsByPath = new Map(), triggerByPath = new Map();
  const durByPath = new Map();
  for (const d of defs) {
    const p = d._pathway;
    if (d.kind) bump(kindByPath, p, d.kind);
    if (d.affects) bump(affectsByPath, p, d.affects);
    if (d.trigger) bump(triggerByPath, p, d.trigger);
    if (d.duration != null) bump(durByPath, p, d.duration);
  }

  // 区域载荷原语：与卡面/状态同一套遍历规则，可直接对照
  const primTotal = new Map(), primByPath = new Map();
  for (const d of defs) {
    walkCardEffects(d, (n, kindOf) => {
      if (kindOf !== 'primitive') return;
      primTotal.set(n.type, (primTotal.get(n.type) || 0) + 1);
      bump(primByPath, d._pathway, n.type);
    });
  }

  const overview = group('区域面 · 总览',
    `<div class="panel"><h2>总览</h2><dl class="kv">
      <dt>区域蓝本（zoneDefs 池）</dt><dd class="num">${defs.length}</dd>
      <dt>覆盖途径</dt><dd class="num">${new Set(defs.map((d) => d._pathway)).size}</dd>
      <dt>卡级 zone 字段（注册）</dt><dd class="num">${nZoneCards} 张</dd>
      <dt>spawn 召唤区域</dt><dd class="num">${nZoneSpawn} 次 / ${zoneSpawnIds.size} 种</dd>
      <dt>区域载荷原语</dt><dd class="num">${[...primTotal.values()].reduce((a, b) => a + b, 0)} 次 / ${primTotal.size} 类</dd>
    </dl>
    <p class="panel-note muted">Zone 是纯坐标效果、不占格，与召唤物（有血量占格）的判别权威在
    ddd《战场参数》§一；与 statusDef 同族但<b>不是</b> statusDef（驱散不作用于 zone 标量）。</p></div>`);

  const kindGroup = group('结构面 · kind',
    barPanel('kind 分布', sortedRows(byKind, (k) => zh('zoneKind', k))),
    heatOf('途径 × kind（蓝本所在途径）', kindByPath, colsOf(byKind, 'zoneKind'), { unit: ' 条' }));

  const faceGroup = group('结构面 · 作用与触发',
    barPanel('affects（作用方）', sortedRows(byAffects, (k) => zh('zoneAffects', k))),
    barPanel('trigger（触发方式）', sortedRows(byTrigger, (k) => zh('zoneTrigger', k)),
      `<p class="panel-note muted">当前全库蓝本都是周期性触发（on_occupy_tick 占据每 tick），
      照实画——attack / summon_skill 是登记的备用值。</p>`),
    heatOf('途径 × 作用方', affectsByPath, colsOf(byAffects, 'zoneAffects'), { unit: ' 条' }));

  const durGroup = group('数值面 · 生命周期',
    barPanel('duration 分布（有序刻度）', sortedRows(flatRows(durByPath), null, { byKey: true }),
      `<p class="panel-note muted">durationUnit 分布：${[...byDurUnit.entries()].map(([k, v]) => `${k} ×${v}`).join('，')}。</p>`),
    heatOf('途径 × duration', durByPath, scaleCols(durByPath, (k) => `${k} tick`), { unit: ' 条', orderNote: '数值最小的 ' }));

  const primGroup = group('载荷面 · 原语',
    barPanel('区域载荷原语用量（zoneDefs 内效果节点）', sortedRows(primTotal, (k) => zh('primitive', k)),
      `<p class="panel-note muted">与卡面族、状态面同一套遍历规则，三族「原语用量」可直接对照。</p>`),
    heatOf('途径 × 载荷原语', primByPath, colsOf(primTotal, 'primitive')));

  const fill = fillPanel('zoneDef 字段填充', defs, DB.declaredZoneFields);

  view.innerHTML = `<p class="panel-note muted">本页口径 = 各途径 skills.json 顶层 <b>zoneDefs 池</b>
    （${defs.length} 条区域蓝本）+ 卡面 zone 字段与 spawn 区域引用。</p>
    ${overview}${kindGroup}${faceGroup}${durGroup}${primGroup}${fill}`;
  wireHeatToggle(view);
}

// ============================================================ 界域 =====
export function renderDomainStats(view) {
  const defs = DB.domainDefs;
  const poolIds = new Set(defs.map((d) => d.id));

  // 卡面界域用法：domain 原语（op 分布）+ 卡级 domain 字段（引用池 def + 展示副本）
  const opTotal = new Map(), opByPath = new Map();
  const fieldByPath = new Map();
  let nFieldCards = 0, nFieldRef = 0;
  for (const c of DB.cards) {
    if (c.domain) {
      nFieldCards++;
      bump(fieldByPath, c._pathway, '卡级 domain 字段');
      if (c.domain.def && poolIds.has(c.domain.def)) nFieldRef++;
    }
    walkCardEffects(c, (n) => {
      if (n.type !== 'domain') return;
      const op = n.op || '?';
      opTotal.set(op, (opTotal.get(op) || 0) + 1);
      bump(opByPath, c._pathway, op);
    });
  }

  // 池内结构维度
  const byTier = countBy(defs, (d) => d.tier);
  const byDispel = countBy(defs, (d) => (d.dispelable === false ? '不可驱散' : '可驱散'));
  const byDurUnit = countBy(defs.filter((d) => d.duration != null), (d) => d.durationUnit || 'tick（缺省）');
  const tierByPath = new Map(), dispelByPath = new Map(), durByPath = new Map(), rpkByPath = new Map();
  const byRpk = new Map(), byTrigger = new Map(), trigByPath = new Map();
  const primTotal = new Map(), primByPath = new Map();
  for (const d of defs) {
    const p = d._pathway;
    if (d.tier) bump(tierByPath, p, d.tier);
    bump(dispelByPath, p, d.dispelable === false ? '不可驱散' : '可驱散');
    if (d.duration != null) bump(durByPath, p, d.duration);
    for (const rp of d.rulePatches || []) {
      const k = rp.kind || '?';
      byRpk.set(k, (byRpk.get(k) || 0) + 1);
      bump(rpkByPath, p, k);
    }
    for (const t of d.triggers || []) {
      if (!t.event) continue;
      byTrigger.set(t.event, (byTrigger.get(t.event) || 0) + 1);
      bump(trigByPath, p, t.event);
    }
    walkCardEffects(d, (n, kindOf) => {
      if (kindOf !== 'primitive') return;
      primTotal.set(n.type, (primTotal.get(n.type) || 0) + 1);
      bump(primByPath, p, n.type);
    });
  }

  const overview = group('界域面 · 总览',
    `<div class="panel"><h2>总览</h2><dl class="kv">
      <dt>界域蓝本（domainDefs 池）</dt><dd class="num">${defs.length}</dd>
      <dt>覆盖途径</dt><dd class="num">${new Set(defs.map((d) => d._pathway)).size}</dd>
      <dt>卡面 domain 原语</dt><dd class="num">${[...opTotal.values()].reduce((a, b) => a + b, 0)} 次</dd>
      <dt>卡级 domain 字段</dt><dd class="num">${nFieldCards} 张<span class="muted">（引用池 def ${nFieldRef} 张）</span></dd>
      <dt>rulePatches 规则补丁</dt><dd class="num">${[...byRpk.values()].reduce((a, b) => a + b, 0)} 条 / ${byRpk.size} 类</dd>
      <dt>域内触发器</dt><dd class="num">${[...byTrigger.values()].reduce((a, b) => a + b, 0)} 条</dd>
    </dl>
    <p class="panel-note muted">卡级 <b>domain 字段是「引用池 def + 展示副本」</b>（envRulesText /
    rulePatches 为卡面呈现复制），权威定义在 domainDefs 池——两出同名时以池为准，本页池口径与
    卡面用法分行统计。</p></div>`,
    barPanel('卡面 domain 原语 op 分布', sortedRows(opTotal, (k) => zh('domainOp', k)),
      `<p class="panel-note muted">overlay = 叠加层界域（第 10 原语）；swap / hero 为高层操作。</p>`),
    heatOf('途径 × domain op（卡面）', opByPath, colsOf(opTotal, 'domainOp')));

  const tierGroup = group('结构面 · tier',
    barPanel('tier 分布（蓝本）', sortedRows(byTier, (k) => zh('domainTier', k))),
    heatOf('途径 × tier（蓝本所在途径）', tierByPath, colsOf(byTier, 'domainTier'), { unit: ' 条' }),
    barPanel('各途径卡级 domain 字段卡数', DB.pathways
      .map((p) => ({ label: p.name, title: p.id, value: fieldByPath.get(p.id)?.get('卡级 domain 字段') || 0 }))
      .filter((r) => r.value).sort((a, b) => b.value - a.value),
      `<p class="panel-note muted">卡级 domain 字段 = 引用池 def + 展示副本（总览有计数），此处只看途径分布。</p>`));

  const durGroup = group('数值面 · 生命周期',
    barPanel('duration 分布（有序刻度）', sortedRows(flatRows(durByPath), null, { byKey: true }),
      `<p class="panel-note muted">可驱散 ${byDispel.get('可驱散') || 0} / 不可驱散 ${byDispel.get('不可驱散') || 0}；
      durationUnit 分布：${[...byDurUnit.entries()].map(([k, v]) => `${zh('durationUnit', k)} ×${v}`).join('，')}。</p>`),
    heatOf('途径 × duration', durByPath, scaleCols(durByPath, (k) => `${k}`), { unit: ' 条', orderNote: '数值最小的 ' }),
    heatOf('途径 × 可驱散', dispelByPath,
      [{ key: '可驱散', label: '可驱散', title: 'dispelable 未显式关闭' }, { key: '不可驱散', label: '不可驱散', title: 'dispelable: false' }],
      { unit: ' 条' }));

  const rpkGroup = group('规则面 · rulePatches',
    barPanel('rulePatches kind 分布', sortedRows(byRpk, (k) => zh('rulePatchKind', k)),
      `<p class="panel-note muted">规则改写走声明式补丁（初批 kind 见 ddd《源质维度与跨系枢纽》），
      不写新原语；交互类规则由卡面 Sequence 的 dispel / mount_status 承载，不入 DomainDef。</p>`),
    heatOf('途径 × rulePatches kind', rpkByPath, colsOf(byRpk, 'rulePatchKind'), { unit: ' 条' }));

  const trigGroup = group('载荷面 · 域内触发器与原语',
    barPanel('域内触发点分布', sortedRows(byTrigger, (k) => zh('triggerEvent', k))),
    heatOf('途径 × 域内触发点', trigByPath, colsOf(byTrigger, 'triggerEvent'), { unit: ' 条' }),
    barPanel('域内载荷原语用量（蓝本 triggers 内效果节点）', sortedRows(primTotal, (k) => zh('primitive', k))),
    heatOf('途径 × 域内载荷原语', primByPath, colsOf(primTotal, 'primitive')));

  const fill = fillPanel('domainDef 字段填充', defs, DB.declaredDomainFields);

  view.innerHTML = `<p class="panel-note muted">本页口径 = 各途径 skills.json 顶层 <b>domainDefs 池</b>
    （${defs.length} 条界域蓝本）+ 卡面 domain 原语与卡级 domain 字段。界域 = 战场级规则改写包
    （声明式补丁 + 战场级触发器），三件套压制栈（base / hero / overlay）见 ddd 共享内核。</p>
    ${overview}${tierGroup}${durGroup}${rpkGroup}${trigGroup}${fill}`;
  wireHeatToggle(view);
}
