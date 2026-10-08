// 卡片浏览页：筛选 + 分页列表
import { DB, hookEvents } from '../data.js';
import { termSpan, axisSpan, escapeHtml } from '../term.js';
import { walkCardEffects } from '../ast.js';
import { artCandidates } from './card.js';

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

// 卡面背景图存在性探测。数据侧没有「有图」字段，图片只存在于 assets/cards/，
// 路径按 cardId 现拼（复用详情页那套 artCandidates，见 views/card.js）。
// 走 HEAD 而非 GET：卡面是 2.7MB 级大图（全出血 PNG），只为问一句「在不在」就把正文
// 拖下来不值当，HEAD 只有响应头。sw.js 的 fetch 只拦 GET（sw.js:43），HEAD 直连网络、
// 不进 SWR 缓存，所以本地往 assets/cards/ 丢一张新图、刷新就在列表里出现标记，
// 不会被缓存里的旧 404 挡住。
// 缓存的是 **promise** 而非解析结果：renderList 在搜索框每次按键都会重跑，缓存结果能
// 挡住重复探测，缓存 promise 则连「同一轮内并发探同一张卡」也只发一轮请求。
const artProbe = new Map();

function probeArt(card) {
  let p = artProbe.get(card.id);
  if (!p) {
    p = (async () => {
      for (const url of artCandidates(card)) {
        try {
          if ((await fetch(url, { method: 'HEAD' })).ok) return true;
        } catch { /* 网络异常按「无图」处理，不让列表挂掉 */ }
      }
      return false;
    })();
    artProbe.set(card.id, p);
  }
  return p;
}

function cardItemHtml(c) {
  const cost = c.kind === 'active' && c.cost
    ? `<span class="badge">⚡${c.cost.energy}${c.cost.cooldown ? ` 冷却 ${c.cost.cooldown} tick` : ''}${c.cost.castTime ? ` 吟唱${c.cost.castTime}` : ''}</span>` : '';
  const hookEvs = c.kind === 'passive' ? hookEvents(c) : [];
  const hook = hookEvs.length
    ? hookEvs.map((e) => `<span class="badge">${termSpan('triggerEvent', e)}</span>`).join('') : '';
  const axSym = (DB.axesByPathway.get(c._pathway) || {})[c.axis]?.symbol || '';
  return `<div class="card-item card-face r-${c.rarity} k-${c.kind}" data-id="${escapeHtml(c.id)}" data-ax="${escapeHtml(axSym)}" style="--pc:var(--p-${c._pathway})">
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
      <span class="badge art" hidden>有图</span>
      ${c.flagship ? '<span class="badge flagship">旗舰</span>' : ''}
      ${cost}${hook}
      ${c.frameworkFlags?.some((f) => f && f.landed !== true) ? '<span class="badge warn">有缺口</span>' : ''}
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
    // 只在当前页 slice 上探测，不预探全库。renderList 整块重写 #card-list 的 innerHTML，
    // 翻页/搜索会把这里的元素摘掉，用 isConnected 挡掉对已废弃节点的回填
    const c = DB.cardById.get(el.dataset.id);
    if (!c) return;
    probeArt(c).then((has) => {
      if (has && el.isConnected) el.querySelector('.badge.art').hidden = false;
    });
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
