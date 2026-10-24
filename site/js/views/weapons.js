// 武器统计（#/stats/weapons）：kind=weapon 的卡面专项。
// 武器卡目前全库仅 4 张、集中在战士，按「途径 × 维度」铺 22 行热图有 21 行空行，
// 因此本页只给全库分布 + 逐卡清单；等武器铺开到多途径后再考虑加热图。
import { DB } from '../data.js';
import { zh, escapeHtml } from '../term.js';
import { ROLE_LABEL } from '../roles.js';
import { walkCardEffects } from '../ast.js';
import { barChart, countBy, sortedRows } from '../charts.js';

const barPanel = (title, rows, note = '') =>
  `<div class="panel"><h2>${title}</h2>${note ? `<p class="panel-note muted">${note}</p>` : ''}${barChart(rows)}</div>`;

const group = (title, ...panels) => `
  <section class="stat-group">
    <div class="stat-group-title">${escapeHtml(title)}</div>
    ${panels.join('')}
  </section>`;

const numRows = (m, fmt) => sortedRows(m, fmt, { byKey: true });

export function renderWeaponStats(view) {
  const cards = DB.cards.filter((c) => c.kind === 'weapon');
  if (!cards.length) {
    view.innerHTML = `<div class="panel"><p class="panel-note muted">当前卡池没有 kind=weapon 的武器卡。</p></div>`;
    return;
  }

  const paths = new Set(cards.map((c) => c._pathway));
  const attacks = cards.map((c) => c.weapon?.attack).filter((n) => typeof n === 'number');
  const dura = cards.map((c) => c.weapon?.durability).filter((n) => typeof n === 'number');
  const avg = (xs) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '—');
  const withMods = cards.filter((c) => Object.keys(c.weapon?.modifiers || {}).length).length;
  const withTriggers = cards.filter((c) => (c.weapon?.triggers || []).length).length;
  const withEffects = cards.filter((c) => (c.effects || []).length).length;

  // 基础值 / 卡位与标签
  const byAttack = countBy(attacks, (n) => n);
  const byDura = countBy(dura, (n) => n);
  const bySlot = countBy(cards, (c) => c.weapon?.slot || 'weapon');
  const tagCount = countBy(cards.flatMap((c) => c.weapon?.tags || []), (t) => t);
  const modKeys = countBy(cards.flatMap((c) => Object.keys(c.weapon?.modifiers || {})), (k) => k);
  const modTypes = countBy(
    cards.flatMap((c) => Object.values(c.weapon?.modifiers || {})
      .flatMap((m) => [].concat(m?.filter?.unitType || []))),
    (t) => t,
  );

  // 触发器 / 效果原语。卡面 effects 与武器触发器分开统计，避免把装备期效果混进触发载荷
  const triggerEvents = countBy(cards.flatMap((c) => c.weapon?.triggers || []), (t) => t.event);
  const triggerPrims = new Map();
  const cardPrims = new Map();
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const c of cards) {
    walkCardEffects({ effects: c.effects || [] }, (n, kindOf) => {
      if (kindOf === 'primitive') bump(cardPrims, n.type);
    });
    for (const t of c.weapon?.triggers || []) {
      walkCardEffects({ effects: t.effects || [] }, (n, kindOf) => {
        if (kindOf === 'primitive') bump(triggerPrims, n.type);
      });
    }
  }

  // 费用与选靶
  const byEnergy = new Map(), byCooldown = new Map(), byCast = new Map();
  const byReach = new Map(), bySel = new Map(), byFaction = new Map(), byScope = new Map();
  const bumpRow = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const c of cards) {
    if (c.cost?.energy != null) bumpRow(byEnergy, c.cost.energy);
    if (c.cost?.cooldown != null) bumpRow(byCooldown, c.cost.cooldown);
    if (c.cost?.castTime != null) bumpRow(byCast, c.cost.castTime);
    if (c.reach) bumpRow(byReach, c.reach);
    const rq = c.target?.request;
    if (c.target?.selectionMode) bumpRow(bySel, c.target.selectionMode);
    if (rq?.faction) bumpRow(byFaction, rq.faction);
    if (rq) bumpRow(byScope, rq.scope || 'whole_lane');
  }

  // 逐卡清单：武器页的主角。四列数值（攻击 / 耐久 / 费用）与标签、改修、触发器并排
  const tableRows = cards.map((c) => {
    const p = DB.pathways.find((x) => x.id === c._pathway);
    const w = c.weapon || {};
    const tags = (w.tags || []).map((t) => `<span class="mono">${escapeHtml(t)}</span>`).join(' ');
    const mods = Object.entries(w.modifiers || {})
      .map(([k, m]) => `${escapeHtml(zh('modifierKey', k))}${m?.value != null ? ` ${m.value > 0 ? '+' : ''}${m.value}` : ''}`)
      .join('、') || '—';
    const trigs = (w.triggers || []).map((t) => zh('triggerEvent', t.event)).join('、') || '—';
    const cost = c.cost
      ? `${c.cost.energy ?? '—'} 能 / ${c.cost.cooldown ?? '—'}t / ${c.cost.castTime ? `${c.cost.castTime}t` : '瞬发'}`
      : '—';
    return `<tr>
      <td><a href="#/card/${encodeURIComponent(c.id)}">${escapeHtml(c.name)}</a>
        <div class="muted small">${escapeHtml(c.id)}</div></td>
      <td>${escapeHtml(p?.name || c._pathway)} · ${escapeHtml(c.sequenceName || '')}<div class="muted small">序列 ${c.sequence}</div></td>
      <td>${escapeHtml(zh('rarity', c.rarity))}</td>
      <td>${escapeHtml(ROLE_LABEL[c.role] || c.role || '—')}</td>
      <td class="num">${w.attack ?? '—'}</td>
      <td class="num">${w.durability ?? '—'}</td>
      <td>${tags || '—'}</td>
      <td class="small">${mods}</td>
      <td class="small">${trigs}</td>
      <td class="small">${escapeHtml(cost)}</td>
    </tr>`;
  }).join('');

  const overview = group('概览',
    `<div class="panel"><h2>武器卡概览</h2><dl class="kv">
      <dt>武器卡</dt><dd class="num">${cards.length}</dd>
      <dt>覆盖途径</dt><dd class="num">${paths.size} / ${DB.pathways.length}</dd>
      <dt>平均攻击</dt><dd class="num">${avg(attacks)}</dd>
      <dt>平均耐久</dt><dd class="num">${avg(dura)}</dd>
      <dt>带改修</dt><dd class="num">${withMods} 张</dd>
      <dt>带触发器</dt><dd class="num">${withTriggers} 张</dd>
      <dt>带卡面效果</dt><dd class="num">${withEffects} 张</dd>
    </dl></div>`,
    `<div class="panel"><h2>武器清单</h2>
      <p class="panel-note muted">一行一把武器：攻击 / 耐久是普攻结算的基础值，改修与触发器在装备期生效。
      卡名点进卡详情。</p>
      <div class="bp-table-wrap"><table class="score-table wp-table">
        <thead><tr><th>武器</th><th>途径 · 序列</th><th>稀有度</th><th>角色</th><th>攻击</th><th>耐久</th><th>标签</th><th>改修</th><th>触发器</th><th>费用</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table></div></div>`);

  const base = group('基础值',
    barPanel('攻击力分布', numRows(byAttack, (k) => `${k} 攻击`)),
    barPanel('耐久分布', numRows(byDura, (k) => `${k} 耐久`)));

  const tags = group('卡位与标签',
    barPanel('装备槽分布', sortedRows(bySlot, (k) => zh('equipSlot', k))),
    barPanel('武器标签分布', sortedRows(tagCount, (k) => k),
      '武器标签是自由词表（sword / rapier / greatsword 等），供武器交互与词条匹配消费。'),
    barPanel('改修键分布', sortedRows(modKeys, (k) => zh('modifierKey', k))),
    barPanel('改修目标类型分布', sortedRows(modTypes, (k) => zh('unitType', k))),
  );

  const triggers = group('触发器与效果',
    barPanel('触发事件分布', sortedRows(triggerEvents, (k) => zh('triggerEvent', k))),
    barPanel('触发载荷原语', sortedRows(triggerPrims, (k) => zh('primitive', k))),
    barPanel('卡面效果原语', sortedRows(cardPrims, (k) => zh('primitive', k)),
      '只算卡面 effects（打出 / 装备时结算），不含武器触发器载荷。'),
  );

  const costs = group('费用与选靶',
    barPanel('能量费用分布', numRows(byEnergy, (k) => `${k} 能`)),
    barPanel('冷却分布', numRows(byCooldown, (k) => `${k} tick`)),
    barPanel('吟唱分布', numRows(byCast, (k) => (k ? `${k} tick` : '瞬发（0）'))),
    barPanel('攻击距离', sortedRows(byReach, (k) => zh('reach', k))),
    barPanel('选靶方式', sortedRows(bySel, (k) => zh('selectionMode', k))),
    barPanel('目标阵营', sortedRows(byFaction, (k) => zh('faction', k))),
    barPanel('几何范围', sortedRows(byScope, (k) => zh('scope', k)),
      '未显式写 scope 的请求按 schema 缺省 whole_lane 计入。'),
  );

  view.innerHTML = `<p class="panel-note muted">口径：只统计 <code>kind=weapon</code> 的卡。
    武器是「打出即装备」的主动槽卡：卡级 cost / reach / target 决定打出与选靶，
    <code>weapon</code> 载荷决定普攻基础值与装备期触发器。当前武器集中在战士，
    暂不画「途径 × 维度」热图——22 行里 21 行为空，读不出分布。</p>
    ${overview}${base}${tags}${triggers}${costs}`;
}
