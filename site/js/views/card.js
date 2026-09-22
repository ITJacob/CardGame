// 卡片详情页
import { DB } from '../data.js';
import { termSpan, statusSpan, axisSpan, escapeHtml } from '../term.js';
import { renderEffects } from '../ast.js';

function targetHtml(t) {
  if (!t) return '';
  const req = t.request || {};
  const parts = [
    termSpan('selectionMode', t.selectionMode),
    termSpan('faction', req.faction),
    termSpan('scope', req.scope),
  ];
  if (req.anchor) parts.push(`锚点 ${termSpan('anchor', req.anchor)}`);
  if (req.spread) parts.push(termSpan('spread', req.spread));
  if (t.fallbackSort) parts.push(`自动排序：${termSpan('sortKey', t.fallbackSort)}`);
  if (req.sortKey) parts.push(`排序：${termSpan('sortKey', req.sortKey)}`);
  if (req.consumption || t.consumption) parts.push(`消耗：${termSpan('consumption', req.consumption || t.consumption)}`);
  if (req.filter) parts.push(`<span class="kv-raw">filter=${escapeHtml(JSON.stringify(req.filter))}</span>`);
  return parts.filter(Boolean).join(' × ');
}

function costHtml(c) {
  if (!c.cost) return '';
  const co = c.cost;
  return `⚡能量 ${co.energy} · 冷却 ${co.cooldown} · 吟唱 ${co.castTime ?? 0}`;
}

function triggersHtml(card) {
  const rows = [];
  if (card.hook) rows.push(`<div>被动钩子：${termSpan('triggerEvent', card.hook)}</div>`);
  for (const tr of card.triggers || []) {
    rows.push(`<div>触发：${termSpan('triggerEvent', tr.event)}${tr.effects ? renderEffects(tr.effects) : ''}</div>`);
  }
  return rows.join('');
}

function unitDefsHtml(card) {
  if (!card.unitDefs) return '';
  const defs = Array.isArray(card.unitDefs) ? card.unitDefs : Object.values(card.unitDefs);
  if (!defs.length) return '';
  const rows = defs.map((u) => `<div>
    <span class="mono">${escapeHtml(u.id || '?')}</span> ${escapeHtml(u.name || '')}
    ${u.unitType ? termSpan('unitType', u.unitType) : ''}
    ${u.reach ? termSpan('reach', u.reach) : ''}
    ${u.element ? termSpan('element', u.element) : ''}
    ${u.hpRatio != null ? `<span class="muted">生命×${u.hpRatio}</span>` : ''}
    ${u.atkRatio != null ? `<span class="muted">攻击×${u.atkRatio}</span>` : ''}
    ${(u.tags || []).map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join('')}
  </div>`);
  return `<details class="fold"><summary>单位定义（${defs.length}）</summary>${rows.join('')}</details>`;
}

function durationHtml(d) {
  if (d.duration == null) return null;
  const unit = d.durationUnit ? ` ${termSpan('durationUnit', d.durationUnit, { showKey: false })}` : '';
  return `持续 ${d.duration}${unit}`;
}

function rulePatchHtml(rp) {
  if (!rp) return '';
  const parts = [`规则补丁：${termSpan('rulePatchKind', rp.kind)}`];
  if (rp.side) parts.push(termSpan('side', rp.side));
  if (rp.tag) parts.push(`tag=${escapeHtml(JSON.stringify(rp.tag))}`);
  if (rp.stat) parts.push(`属性 ${termSpan('stat', rp.stat)}`);
  if (rp.effectType) parts.push(`原语 ${termSpan('primitive', rp.effectType)}`);
  if (rp.mul != null) parts.push(`×${rp.mul}`);
  const html = `<div>${parts.join(' · ')}</div>`;
  return rp.note ? html + `<div class="ast-note">${escapeHtml(rp.note)}</div>` : html;
}

// 定义内触发与卡片级 trigger 同构，复用 renderEffects
function defTriggersHtml(triggers) {
  if (!triggers?.length) return '';
  return `<div class="ast"><div class="ast-line muted">定义内触发（${triggers.length}）</div>
    ${triggers.map((tr) => `<div class="ast-node"><div class="ast-line"><span class="muted">触发：</span>${termSpan('triggerEvent', tr.event)}</div>${renderEffects(tr.effects)}</div>`).join('')}
  </div>`;
}

function zoneDomainHtml(card) {
  const out = [];
  if (card.zoneDef) {
    const z = card.zoneDef;
    const head = [
      z.kind ? termSpan('zoneKind', z.kind) : '',
      z.trigger ? termSpan('zoneTrigger', z.trigger) : '',
      z.affects ? `作用于${termSpan('zoneAffects', z.affects)}` : '',
      durationHtml(z),
      z.interval != null ? `触发间隔 ${z.interval}` : '',
    ].filter(Boolean);
    out.push(`<details class="fold" open><summary>区域定义 ${escapeHtml(z.id || '')}</summary>
      <div>${head.join(' · ')}</div>
      ${z.modifiers ? `<div class="kv-raw">modifiers=${escapeHtml(JSON.stringify(z.modifiers))}</div>` : ''}
      ${z.effects ? renderEffects(z.effects.map((e) => e.payload || e)) : ''}
      ${z.note ? `<div class="ast-note">${escapeHtml(z.note)}</div>` : ''}
    </details>`);
  }
  if (card.domainDef) {
    const d = card.domainDef;
    const head = [
      d.tier ? termSpan('domainTier', d.tier) : '',
      durationHtml(d),
      d.dispelable === false ? '不可驱散' : (d.dispelable === true ? '可驱散' : ''),
    ].filter(Boolean);
    out.push(`<details class="fold" open><summary>界域定义 ${escapeHtml(d.id || '')}</summary>
      <div>${head.join(' · ')}</div>
      ${(d.rulePatches || []).map(rulePatchHtml).join('')}
      ${defTriggersHtml(d.triggers)}
      ${d.extraRuleNote ? `<div class="ast-note">${escapeHtml(d.extraRuleNote)}</div>` : ''}
      ${d.envRules ? `<div class="kv-raw">envRules=${escapeHtml(JSON.stringify(d.envRules))}</div>` : ''}
      ${d.note ? `<div class="ast-note">${escapeHtml(d.note)}</div>` : ''}
    </details>`);
  }
  return out.join('');
}

function miscHtml(card) {
  const out = [];
  if (card.upgradeLadder) out.push(`<details class="fold"><summary>升级阶梯</summary><pre class="kv-raw">${escapeHtml(JSON.stringify(card.upgradeLadder, null, 1))}</pre></details>`);
  if (card.variants) out.push(`<details class="fold"><summary>变体（${card.variants.length}）</summary><pre class="kv-raw">${escapeHtml(JSON.stringify(card.variants, null, 1))}</pre></details>`);
  if (card.dimHooks?.length) {
    out.push(`<details class="fold" open><summary>维度乘区挂钩（${card.dimHooks.length}）</summary>
      ${card.dimHooks.map((h) => `<div>${termSpan('dim', h.dim)} ${h.comparator} ${h.threshold}
        → ${termSpan('dimTarget', h.target)} ×${h.mul}
        ${(h.filterTags || []).map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join('')}
        ${h.note ? `<div class="ast-note">${escapeHtml(h.note)}</div>` : ''}</div>`).join('')}
    </details>`);
  }
  return out.join('');
}

export function renderCardDetail(view, id) {
  const c = DB.cardById.get(id);
  if (!c) {
    view.innerHTML = `<div class="panel"><h2>未找到卡片</h2><p class="mono">${escapeHtml(id)}</p>
      <p><a href="#/cards">← 返回列表</a></p></div>`;
    return;
  }
  const g = (cat, key) => termSpan(cat, key);
  const cn = DB.glossary?.categories?.rarity?.terms?.[c.rarity]?.zh || c.rarity;
  const axSym = (DB.axesByPathway.get(c._pathway) || {})[c.axis]?.symbol || '';

  view.innerHTML = `
  <div class="panel card-face r-${c.rarity}" data-ax="${escapeHtml(axSym)}" style="--pc:var(--p-${c._pathway})">
    <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
      <h2 style="margin:0">${escapeHtml(c.name)}</h2>
      <span class="muted">序列${c.sequence} · ${escapeHtml(c.sequenceName || '')}</span>
      <span class="badge rarity-${c.rarity}">${cn}</span>
      <span class="badge kind-${c.kind}">${c.kind === 'active' ? '主动' : '被动'}</span>
      ${c.flagship ? '<span class="badge flagship">旗舰</span>' : ''}
      <span style="margin-left:auto"><a href="#/cards">← 返回列表</a></span>
    </div>
    <div class="muted" style="margin-top:2px"><span class="mono">${escapeHtml(c.id)}</span></div>
    <div class="badges" style="margin-top:6px">
      <span class="badge pw">${escapeHtml(c._pathwayName)}</span>
      <span class="badge">轴：${axisSpan(c._pathway, c.axis)}</span>
      ${(c.tags || []).map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join('')}
      ${c.gender && c.gender !== 'any' ? `<span class="badge">${g('gender', c.gender)}限定</span>` : ''}
      ${(c.sharedAcross || []).map((p) => `<span class="badge">共享→${escapeHtml(DB.pathways.find((x) => x.id === p)?.name || p)}</span>`).join('')}
    </div>
  </div>

  <div class="panel">
    <h2>卡面描述（玩家可读正典）</h2>
    <div>${escapeHtml(c.describe || '（无）')}</div>
    ${c.flavor ? `<div class="flavor" style="margin-top:6px">${escapeHtml(c.flavor)}</div>` : ''}
    ${c.lore ? `<div class="muted" style="margin-top:4px;font-size:12px">${escapeHtml(c.lore)}</div>` : ''}
  </div>

  <div class="panel">
    <h2>施放与选靶</h2>
    <dl class="kv">
      ${c.kind === 'active' ? `<dt>消耗</dt><dd>${costHtml(c)}</dd>
      <dt>距离</dt><dd>${g('reach', c.reach)}</dd>
      <dt>目标</dt><dd>${targetHtml(c.target)}</dd>` : `<dt>触发</dt><dd>${triggersHtml(c)}</dd>`}
      ${(c.secondaryTargets || []).map((t, i) => `<dt>附属选靶${i + 1}</dt><dd>${targetHtml(t)}</dd>`).join('')}
    </dl>
    ${c.kind === 'active' && (c.triggers?.length) ? triggersHtml(c) : ''}
  </div>

  <div class="panel">
    <h2>效果结构（AST）</h2>
    ${renderEffects(c.effects)}
  </div>

  ${(unitDefsHtml(c) || zoneDomainHtml(c) || miscHtml(c)) ? `<div class="panel"><h2>附加定义</h2>${unitDefsHtml(c)}${zoneDomainHtml(c)}${miscHtml(c)}</div>` : ''}

  ${c.frameworkFlags?.length ? `<div class="panel"><h2 class="warn-text">框架缺口</h2>
    ${c.frameworkFlags.map((f) => `<div class="warn-text">⚠ ${escapeHtml(typeof f === 'string' ? f : JSON.stringify(f))}</div>`).join('')}</div>` : ''}
  ${c.conversionNotes ? `<div class="panel"><h2>转换备注</h2>
    ${[].concat(c.conversionNotes).map((n) => `<div class="muted">${escapeHtml(n)}</div>`).join('')}</div>` : ''}
  `;
}
