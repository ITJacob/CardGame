// 首页：把「玩什么」放在第一屏，数据与设计工具退到后面。
// 22 途径命题来自 blueprints.json（声明正源在 rounds/<pid>.md），失败时退 designNote；
// 今日三张代表卡用日期做确定性抽样——同一天所有人看到同一组，跨天自动换。
import { DB, loadBlueprints } from '../data.js';
import { escapeHtml } from '../term.js';

function truncate(s, n) {
  const t = String(s || '').trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function dailyCards(n) {
  const day = Math.floor(Date.now() / 86400000);
  const pool = DB.cards.filter((c) => c.flagship || c.role === 'core');
  const sorted = [...pool].sort((a, b) => hash(`${day}:${a.id}`) - hash(`${day}:${b.id}`));
  const out = [];
  const seen = new Set();
  for (const c of sorted) {
    if (seen.has(c._pathway)) continue;
    seen.add(c._pathway);
    out.push(c);
    if (out.length >= n) break;
  }
  return out;
}

function featuredHtml() {
  const picks = dailyCards(3);
  if (!picks.length) return '';
  const rows = picks.map((c) => `
    <a class="pick-card rarity-${escapeHtml(c.rarity || 'common')}" href="#/card/${encodeURIComponent(c.id)}">
      <span class="pick-kicker">${escapeHtml(c._pathwayName || '')} · ${escapeHtml(c.sequenceName || '')}</span>
      <b>${escapeHtml(c.name)}</b>
      <span class="pick-desc">${escapeHtml(truncate(c.describe, 54))}</span>
    </a>`).join('');
  return `<section class="home-section">
    <div class="home-section-head"><h2>今日三张代表卡</h2><span class="muted">每天换一组 · 点开看完整效果</span></div>
    <div class="pick-row">${rows}</div>
  </section>`;
}

function pathwayTiles() {
  return DB.pathways.map((p) => `
    <a class="pway-tile" href="#/cards?pathway=${encodeURIComponent(p.id)}" data-pid="${escapeHtml(p.id)}" style="--pc: var(--p-${escapeHtml(p.id)})">
      <span class="pway-name">${escapeHtml(p.name)}</span>
      <span class="pway-prop" data-prop>${escapeHtml(truncate(DB.designNotes.get(p.id), 46))}</span>
      <span class="pway-meta">${Object.keys(DB.axesByPathway.get(p.id) || {}).length} 轴 · ${p.cardCount} 卡</span>
    </a>`).join('');
}

async function fillPropositions(view) {
  try {
    const bp = await loadBlueprints();
    if (!view.querySelector('.home-hero')) return;
    const byId = new Map((bp.pathways || []).map((p) => [p.id, p]));
    view.querySelectorAll('[data-pid]').forEach((el) => {
      const p = byId.get(el.dataset.pid);
      const prop = p?.proposition?.statement;
      if (prop) el.querySelector('[data-prop]').textContent = truncate(prop, 46);
    });
  } catch {
    // blueprints.json 缺失：保留 designNote 回退，不打断首页
  }
}

export function renderHome(view) {
  const total = DB.cards.length;
  view.innerHTML = `
  <section class="home-hero">
    <p class="home-eyebrow">诡秘之主 · 进度条回合制卡牌对战</p>
    <h1>没有手牌，只有行动条、技能槽与不断流动的战场。</h1>
    <p class="home-lead">22 条途径、${total} 张技能卡。选一条途径，装配 4 主动 + 4 被动，在 2 路 × 4 格的战场上抢节奏、叠状态、兑现读层。</p>
    <div class="home-cta">
      <a class="home-btn home-btn--primary" href="../">直接开玩 →</a>
      <a class="home-btn" href="#/how">30 秒看懂战斗</a>
      <a class="home-btn" href="#/pathways">选一条途径</a>
    </div>
  </section>

  <section class="home-rules">
    <a class="rule-tile" href="#/how"><b>行动条抢回合</b><span>技能自动积累行动条，满了才有一次机会；能量、冷却、吟唱各算各的。</span></a>
    <a class="rule-tile" href="#/how"><b>4 主动 + 4 被动</b><span>战前整备，被动由触发点驱动；没有抽牌与手牌，拼的是配置与时机。</span></a>
    <a class="rule-tile" href="#/how"><b>2 路 × 4 格</b><span>前线与后排、近战与投掷与法术，决定对撞、反击与拦截。</span></a>
    <a class="rule-tile" href="#/mechanics"><b>产层 → 读层 → 清除</b><span>状态有层数、时长与次数；把资源存进去，再用另一张卡兑现。</span></a>
  </section>

  <section class="home-section">
    <div class="home-section-head"><h2>22 条途径</h2><span class="muted">每条途径一种玩法命题 · 点进卡池看它怎么打</span></div>
    <div class="pway-grid">${pathwayTiles()}</div>
  </section>

  ${featuredHtml()}

  <p class="home-foot muted">本站是技能池资料站；<a href="#/blueprint">蓝图对账</a>、<a href="#/score">设计评分</a>、<a href="#/ddd">领域模型</a>在顶栏「设计台」，给设计与实现用，不影响开玩。</p>`;

  fillPropositions(view);
}
