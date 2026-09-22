// 卡片浏览页：筛选 + 分页列表
import { DB } from '../data.js';
import { termSpan, axisSpan, escapeHtml } from '../term.js';
import { walkCardEffects } from '../ast.js';

const PAGE_SIZE = 100;

const state = {
  pathway: '', rarity: '', kind: '', sequence: '', axis: '', primitive: '', reach: '', q: '', page: 1,
};

let primitivesInUse = null;

function collectPrimitives() {
  if (primitivesInUse) return primitivesInUse;
  const set = new Set();
  for (const c of DB.cards) walkCardEffects(c, (n) => { if (n.type) set.add(n.type); });
  primitivesInUse = [...set].sort();
  return primitivesInUse;
}

function cardPrimitives(card) {
  const set = new Set();
  walkCardEffects(card, (n) => { if (n.type) set.add(n.type); });
  return set;
}

function applyFilters() {
  const q = state.q.trim().toLowerCase();
  return DB.cards.filter((c) => {
    if (state.pathway && c._pathway !== state.pathway) return false;
    if (state.rarity && c.rarity !== state.rarity) return false;
    if (state.kind && c.kind !== state.kind) return false;
    if (state.sequence !== '' && String(c.sequence) !== state.sequence) return false;
    if (state.axis && c.axis !== state.axis) return false;
    if (state.reach && c.reach !== state.reach) return false;
    if (state.primitive && !cardPrimitives(c).has(state.primitive)) return false;
    if (q) {
      const hay = `${c.name} ${c.describe || ''} ${c.id} ${c.sequenceName || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function filterBarHtml() {
  const sel = (key, label, options) => `
    <label>${label}<select data-f="${key}">
      <option value="">全部</option>
      ${options.map(([v, l]) => `<option value="${escapeHtml(v)}" ${String(state[key]) === String(v) ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}
    </select></label>`;

  const pathwayOpts = DB.pathways.map((p) => [p.id, p.name]);
  const rarityOpts = ['common', 'uncommon', 'rare', 'epic', 'legendary'].map((r) => [r, zh('rarity', r)]);
  const kindOpts = [['active', '主动'], ['passive', '被动']];
  const seqOpts = [...Array(10)].map((_, i) => [String(9 - i), `序列 ${9 - i}`]);
  const reachOpts = [['none', '无距离'], ['melee', '近战'], ['ranged', '远程']];
  const primOpts = collectPrimitives().map((p) => [p, zh('primitive', p)]);

  let axisSel = '';
  if (state.pathway) {
    const axes = DB.axesByPathway.get(state.pathway) || {};
    const axisOpts = Object.entries(axes).map(([id, a]) => [id, `${a.symbol || ''}${a.name}`]);
    axisSel = sel('axis', '构筑轴', axisOpts);
  }

  return `<div class="panel filters">
    ${sel('pathway', '途径', pathwayOpts)}
    ${axisSel}
    ${sel('rarity', '稀有度', rarityOpts)}
    ${sel('kind', '类型', kindOpts)}
    ${sel('sequence', '序列', seqOpts)}
    ${sel('primitive', '原语', primOpts)}
    ${sel('reach', '距离', reachOpts)}
    <label>搜索<input type="search" data-f="q" value="${escapeHtml(state.q)}" placeholder="卡名/描述/ID"></label>
    <span class="muted" id="filter-count"></span>
  </div>`;
}

// 词典里的中文名（不渲染 span，纯文本用于下拉）
function zh(cat, key) {
  const t = DB.glossary?.categories?.[cat]?.terms?.[key];
  return t ? t.zh : key;
}

function cardItemHtml(c) {
  const cost = c.kind === 'active' && c.cost
    ? `<span class="badge">⚡${c.cost.energy}${c.cost.cooldown ? ` CD${c.cost.cooldown}` : ''}${c.cost.castTime ? ` 吟唱${c.cost.castTime}` : ''}</span>` : '';
  const hook = c.kind === 'passive' && c.hook
    ? `<span class="badge">${termSpan('triggerEvent', c.hook)}</span>` : '';
  const axSym = (DB.axesByPathway.get(c._pathway) || {})[c.axis]?.symbol || '';
  return `<div class="card-item card-face r-${c.rarity}" data-id="${escapeHtml(c.id)}" data-ax="${escapeHtml(axSym)}" style="--pc:var(--p-${c._pathway})">
    <div class="ci-head">
      <span class="ci-name">${escapeHtml(c.name)}</span>
      <span class="ci-seq">序列${c.sequence} · ${escapeHtml(c.sequenceName || '')}</span>
    </div>
    <div class="ci-desc">${escapeHtml(c.describe || '')}</div>
    <div class="badges">
      <span class="badge rarity-${c.rarity}">${zh('rarity', c.rarity)}</span>
      <span class="badge kind-${c.kind}">${c.kind === 'active' ? '主动' : '被动'}</span>
      <span class="badge pw">${escapeHtml(c._pathwayName)}</span>
      <span class="badge">${axisSpan(c._pathway, c.axis)}</span>
      ${c.flagship ? '<span class="badge flagship">旗舰</span>' : ''}
      ${cost}${hook}
      ${c.frameworkFlags?.length ? '<span class="badge warn">有缺口</span>' : ''}
    </div>
  </div>`;
}

export function renderCards(view) {
  view.innerHTML = `<h1 class="page-title">卡片浏览</h1>${filterBarHtml()}
    <div id="card-list"></div><div class="pager" id="pager"></div>`;

  view.querySelectorAll('[data-f]').forEach((el) => {
    el.addEventListener('change', () => {
      const key = el.dataset.f;
      state[key] = el.value;
      state.page = 1;
      if (key === 'pathway') state.axis = '';
      renderCards(view); // 重渲染以联动轴下拉
    });
    if (el.type === 'search') {
      el.addEventListener('input', () => {
        state.q = el.value;
        state.page = 1;
        renderList(view);
      });
    }
  });
  renderList(view);
}

function renderList(view) {
  const filtered = applyFilters();
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  view.querySelector('#filter-count').textContent = `共 ${filtered.length} 张`;
  view.querySelector('#card-list').innerHTML = `<div class="card-list">${slice.map(cardItemHtml).join('')}</div>`;
  view.querySelectorAll('.card-item').forEach((el) => {
    el.addEventListener('click', () => { location.hash = `#/card/${encodeURIComponent(el.dataset.id)}`; });
  });

  const pager = view.querySelector('#pager');
  if (pages <= 1) { pager.innerHTML = ''; return; }
  pager.innerHTML = `
    <button data-pg="prev" ${state.page <= 1 ? 'disabled' : ''}>上一页</button>
    <span class="muted">${state.page} / ${pages}</span>
    <button data-pg="next" ${state.page >= pages ? 'disabled' : ''}>下一页</button>`;
  pager.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      state.page += b.dataset.pg === 'next' ? 1 : -1;
      renderList(view);
      window.scrollTo(0, 0);
    });
  });
}
