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

// 画面 prompt = 全局画幅（manifest.artFormat）+ 途径 artStyle + 卡级 art 三件套，展示时现拼——
// 换风格只改途径顶层一处，不动卡
function artPrompt(c) {
  const a = c.art;
  if (!a) return '';
  return [DB.artFormat, c._artStyle, a.subject, ...(a.elements || []), a.mood].filter(Boolean).join(', ');
}

// 框体 = 一张 AI 出的「黑底金线卡牌框」PNG，站点用 mix-blend-mode:screen 叠到全出血卡面
// 之上复用（黑底被 screen 吃透、金线提亮叠加）。出图侧刻意只出「框」、不含卡面内容，
// 且为纯黑底、无水印；格式约束在 artFrameFormat，主题层取 artFrame*，展示时现拼
// （与画面 prompt 三段拼装对称）。screen 混合要求框图层与卡面同处一层叠上下文，故
// .cs-artwrap 设 isolation:isolate，且 .cs-orn 落在 .cs-art / .cs-vignette 之后绘制。
function frameFor(c) {
  if (c.rarity === 'epic' && c._frameEpic) return { file: `frame-${c._pathway}-epic`, prompt: c._frameEpic };
  if (c.rarity === 'legendary' && c._frameLegendary) return { file: `frame-${c._pathway}-legendary`, prompt: c._frameLegendary };
  const p = DB.artFrame?.[c.rarity];
  // 前三档为自包含完整 prompt（见 PROMPTS_REFERENCE.md），不套 artFrameFormat
  return p ? { file: `frame-${c.rarity}`, prompt: p, selfContained: true } : null;
}

function artHtml(c) {
  const prompt = artPrompt(c);
  if (!prompt) return '';
  const f = frameFor(c);
  const fprompt = f ? (f.selfContained ? f.prompt : [DB.artFrameFormat, f.prompt].filter(Boolean).join(', ')) : '';
  return `<section class="cs-sec">
    <h2>AI 出图 <button type="button" class="cs-copy" data-prompt="${escapeHtml(prompt)}">复制画面 prompt</button>${f ? ` <button type="button" class="cs-copy" data-prompt="${escapeHtml(fprompt)}">复制边框 prompt</button>` : ''}</h2>
    <div class="cs-artwrap">
      <img class="cs-art" src="assets/cards/${escapeHtml(c.id)}.png" alt="${escapeHtml(c.name)}" loading="lazy" onerror="this.style.display='none'">
      <div class="cs-vignette"></div>
      ${f ? `<img class="cs-orn" src="assets/frames/${f.file}.png" alt="" loading="lazy" onerror="this.remove()">` : ''}
    </div>
    <div class="cs-prompt">${escapeHtml(prompt)}</div>
  </section>`;
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
  <div class="card-stage" style="--pc:var(--p-${c._pathway})">
    <a class="cs-back" href="#/cards">← 返回列表</a>
    <div class="card-sheet r-${c.rarity}" data-ax="${escapeHtml(axSym)}">
      <header class="cs-head">
        <div class="cs-title-row">
          <h1 class="cs-name">${escapeHtml(c.name)}</h1>
          ${c.flagship ? '<span class="badge flagship">旗舰</span>' : ''}
        </div>
        <div class="cs-sub">序列${c.sequence} · ${escapeHtml(c.sequenceName || '')} · <span class="mono">${escapeHtml(c.id)}</span></div>
        <div class="badges">
          <span class="badge rarity-${c.rarity}">${cn}</span>
          <span class="badge kind-${c.kind}">${c.kind === 'active' ? '主动' : '被动'}</span>
          <span class="badge pw">${escapeHtml(c._pathwayName)}</span>
          <span class="badge">轴：${axisSpan(c._pathway, c.axis)}</span>
          ${(c.tags || []).map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join('')}
          ${c.gender && c.gender !== 'any' ? `<span class="badge">${g('gender', c.gender)}限定</span>` : ''}
          ${(c.sharedAcross || []).map((p) => `<span class="badge">共享→${escapeHtml(DB.pathways.find((x) => x.id === p)?.name || p)}</span>`).join('')}
        </div>
        ${c.kind === 'active' && c.cost ? `<div class="cs-cost">${costHtml(c)}</div>` : ''}
      </header>

      <section class="cs-sec cs-desc">
        <div>${escapeHtml(c.describe || '（无）')}</div>
        ${c.flavor ? `<div class="flavor">${escapeHtml(c.flavor)}</div>` : ''}
        ${c.lore ? `<div class="muted cs-lore">${escapeHtml(c.lore)}</div>` : ''}
      </section>

      <section class="cs-sec">
        <h2>施放与选靶</h2>
        <dl class="kv">
          ${c.kind === 'active' ? `<dt>消耗</dt><dd>${costHtml(c)}</dd>
          <dt>距离</dt><dd>${g('reach', c.reach)}</dd>
          <dt>目标</dt><dd>${targetHtml(c.target)}</dd>` : `<dt>触发</dt><dd>${triggersHtml(c)}</dd>`}
          ${(c.secondaryTargets || []).map((t, i) => `<dt>附属选靶${i + 1}</dt><dd>${targetHtml(t)}</dd>`).join('')}
        </dl>
        ${c.kind === 'active' && (c.triggers?.length) ? triggersHtml(c) : ''}
      </section>

      <section class="cs-sec">
        <h2>效果结构</h2>
        ${renderEffects(c.effects)}
      </section>

      ${artHtml(c)}

      ${(unitDefsHtml(c) || zoneDomainHtml(c) || miscHtml(c)) ? `<section class="cs-sec"><h2>附加定义</h2>${unitDefsHtml(c)}${zoneDomainHtml(c)}${miscHtml(c)}</section>` : ''}

      ${c.frameworkFlags?.length ? `<section class="cs-sec"><h2 class="warn-text">框架缺口</h2>
        ${c.frameworkFlags.map((f) => `<div class="warn-text">⚠ ${escapeHtml(typeof f === 'string' ? f : JSON.stringify(f))}</div>`).join('')}</section>` : ''}
      ${c.conversionNotes ? `<section class="cs-sec"><h2>转换备注</h2>
        ${[].concat(c.conversionNotes).map((n) => `<div class="muted">${escapeHtml(n)}</div>`).join('')}</section>` : ''}
    </div>
  </div>
  `;

  // 复制 prompt：站点首个剪贴板交互。clipboard API 要安全上下文（localhost/https 均满足），
  // 失败时退回选中整段文本让用户手动 Ctrl+C。画面/边框两个按钮共用同一逻辑
  view.querySelectorAll('.cs-copy').forEach((copyBtn) => {
    const label = copyBtn.textContent;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.prompt);
        copyBtn.textContent = '已复制 ✓';
      } catch {
        const el = view.querySelector('.cs-prompt');
        if (el) window.getSelection().selectAllChildren(el);
        copyBtn.textContent = '已选中，Ctrl+C';
      }
      setTimeout(() => { copyBtn.textContent = label; }, 1500);
    });
  });
}
