// 卡片浏览页：筛选 + 分页列表
import { DB } from '../data.js';
import { termSpan, axisSpan, escapeHtml } from '../term.js';
import { walkCardEffects } from '../ast.js';

const PAGE_SIZE = 100;

const state = {
  pathway: '', rarity: '', kind: '', sequence: '', axis: '', primitive: '', reach: '',
  sort: '', q: '', page: 1,     // sort 为空＝默认：不排，保持 DB.cards 原序（途径 → 序列）
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

// 稀有度名次：顺序读自 manifest（见 data.js 的 readRarityOrder），不在这里硬写档位
const rarityRank = () => new Map(DB.rarityOrder.map((r, i) => [r, i]));

// 排序。**不改 applyFilters**：那个函数是「纯 filter、保序」的约定，排序单独一层，
// 只有 renderList 需要。filter() 已经返回新数组，就地 sort 不会动到 DB.cards
function sortCards(list) {
  if (!state.sort) return list;                       // 默认：原序，一个字节都不动
  const dir = state.sort === 'rarity-desc' ? -1 : 1;  // 「高→低」＝名次降序
  // 排序键 = 途径 → 稀有度 → 序列（降序）。途径与序列都**显式**进比较器，不靠
  // 「DB.cards 恰好是 途径×序列 9→0」这条隐式前提——数据侧重新生成后它不会报错，只会悄悄换排法。
  // 需求是「每个职业内部按稀有度排」：选中某途径时第一项恒相等，自然退化成纯稀有度排序；
  // 不选途径时也不会把 22 个职业的传说卡糊成一堆。sort 自 ES2019 起稳定，同级保留原序
  const pRank = new Map(DB.pathways.map((p, i) => [p.id, i]));
  const rRank = rarityRank();
  return list.sort((a, b) => (pRank.get(a._pathway) - pRank.get(b._pathway))
    || (dir * (rRank.get(a.rarity) - rRank.get(b.rarity)))
    || (b.sequence - a.sequence));
}

function filterBarHtml() {
  // 第 4 参是首项文案：筛选器是「全部」，排序器是「默认（途径 → 序列）」——
  // 排序没有「全部」这回事，空值表示不排
  const sel = (key, label, options, emptyLabel = '全部') => `
    <label>${label}<select data-f="${key}">
      <option value="">${emptyLabel}</option>
      ${options.map(([v, l]) => `<option value="${escapeHtml(v)}" ${String(state[key]) === String(v) ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}
    </select></label>`;

  const pathwayOpts = DB.pathways.map((p) => [p.id, p.name]);
  const rarityOpts = DB.rarityOrder.map((r) => [r, zh('rarity', r)]);
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
    ${sel('sort', '排序', [['rarity-desc', '稀有度 高→低'], ['rarity-asc', '稀有度 低→高']], '默认（途径 → 序列）')}
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
  const filtered = sortCards(applyFilters());
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
