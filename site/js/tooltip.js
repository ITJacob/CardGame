// 悬停浮层：查询 term.js 的词条 / status.js 的状态详情
// 桌面（有精确指针 + hover）：内容短且没有嵌套术语时跟随光标；否则钉住（.tip-pin），
// 鼠标可移进来滚、也可悬停里面的嵌套术语就地换内容
// 触屏：点击后居中弹出（.tip-center）
import { lookup, lookupStatus, lookupAxis, lookupPathway, lookupDef, axSymHtml, escapeHtml } from './term.js';
import { renderStatusDetail } from './status.js';
import { renderDefDetail } from './defs.js';

// 高度判据与上限：内容高于视口 80% 就转钉住态（内容里含嵌套术语时同样钉住，见下）。
// 0.8 与 css #tooltip.tip-pin 的 max-height: 80vh 是一对——判据若大于上限，
// 就会出现「判定为长、钉住之后却装得下」的错位：钉住了，底下空一段，读者不知道滚什么
const PIN_RATIO = 0.8;
// 从词上离开、到鼠标移进浮层，要跨过浮层外侧那 14px 的空隙。给的宽限够慢手鼠标用，
// 又不至于让「移开就该消失」变得粘滞
const HIDE_DELAY = 160;

// 居中弹窗（.tip-center）开着时锁住背景滚动：弹窗是 position:fixed，页面在它背后照滚的话，
// 关掉之后人已经不在原来那一段了。用 position:fixed + top:-scrollY 这套而不是给 html
// 加 overflow:hidden——后者在 iOS 上锁不住橡皮筋，而且都要在关掉时把滚动位置还回去。
// #topbar 是 sticky，这套锁法下依然粘在视口顶（sticky 的参照还是视口，body 只是被上移）
let lockY = 0;
let locked = false;

function lockScroll() {
  if (locked) return;
  locked = true;
  lockY = window.scrollY;
  // 滚动条一没收，桌面端内容会横向抖一下；按差值补一条右内边距（全局 border-box，补得进去）
  const sbw = innerWidth - document.documentElement.clientWidth;
  document.body.classList.add('tip-lock');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lockY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
}

function unlockScroll() {
  if (!locked) return;
  locked = false;
  document.body.classList.remove('tip-lock');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.paddingRight = '';
  if (lockY) window.scrollTo(0, lockY);
}

function fillTip(tip, el) {
  const cat = el.dataset.cat;
  const key = el.dataset.key;
  let t;
  let detail = '';
  if (cat === 'status') { t = lookupStatus(key); detail = renderStatusDetail(key); }
  // 编目 def 三池：池里的权威定义（卡级 zone/domain 只是引用 + 展示副本）
  else if (cat === 'unitDef' || cat === 'zoneDef' || cat === 'domainDef') { t = lookupDef(cat, key); detail = renderDefDetail(cat, key); }
  else if (cat === 'axis') { const [pid, aid] = key.split('/'); t = lookupAxis(pid, aid); }
  else if (cat === 'pathway') t = lookupPathway(key);
  else t = lookup(cat, key);
  // 判据是 cat 而不是「t 上有没有 symbol」：后者的成立与否取决于词典里恰好没人写
  // symbol 这个键，哪天有人写了，浮层就会只剩一个符号、中文名整条消失
  const zhHtml = cat === 'axis' ? `${axSymHtml(t.symbol)}${escapeHtml(t.name)}` : escapeHtml(t.zh);
  tip.innerHTML = `
      <div class="tt-cat">${escapeHtml(t.catLabel || '')}${t.missing ? ' · <span style="color:var(--warn)">未收录</span>' : ''}</div>
      <div class="tt-key">${escapeHtml(t.key)}</div>
      <div class="tt-zh">${zhHtml}</div>
      ${t.brief ? `<div>${escapeHtml(t.brief)}</div>` : ''}
      ${detail}
      ${t.detail ? `<div class="tt-detail">${escapeHtml(t.detail)}</div>` : ''}
      ${t.source ? `<div class="tt-src">出处：${escapeHtml(t.source)}</div>` : ''}`;
}

export function initTooltip() {
  const tip = document.getElementById('tooltip');

  let pinned = false; // 钉住态：不跟随光标、就地钉住、鼠标可进入（长内容或含嵌套术语）
  let hideTimer = 0;

  const cancelHide = () => { if (hideTimer) { clearTimeout(hideTimer); hideTimer = 0; } };
  // tip-center 必须在这收掉：showTipSticky 加上它，之前没人摘——它带 translate(-50%,-50%)
  // 与固定宽度，留在元素上会让之后每次悬停浮层都偏移半个自己
  const hide = () => {
    cancelHide();
    tip.hidden = true;
    pinned = false;
    tip.classList.remove('tip-pin', 'tip-center');
    unlockScroll(); // 唯一的出口都在这里，居中弹窗的锁也只在这里还回去
  };
  const scheduleHide = () => { cancelHide(); hideTimer = setTimeout(hide, HIDE_DELAY); };
  // 关掉一切态：点外部、ESC、换路由三处共用（钉住弹窗与悬停浮层都收）
  const closeAll = () => { tip.classList.remove('tip-sticky'); hide(); };

  // 钉住态（tip-sticky，如出图 prompt 弹窗）：不随 hover 显隐，点外部、ESC 或换路由才关。
  // 复制按钮在自己的 click 里 stopPropagation，这里的冒泡监听收不到「打开」那次点击
  document.addEventListener('click', (e) => {
    if (tip.classList.contains('tip-sticky') && !tip.contains(e.target)) closeAll();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
  // 路由重渲染视图后，浮层会带着旧内容留在屏上
  window.addEventListener('hashchange', closeAll);

  // 触屏分支。用 hover/pointer 能力检测而非 'ontouchstart'（触屏笔记本会误判）
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('click', (e) => {
      const el = e.target.closest?.('.term');
      if (!el) {
        // 点浮层内的非术语区域（如长备注）不关闭，否则没法滚动阅读
        if (!tip.contains(e.target)) closeAll();
        return;
      }
      // 带词典深链的术语（领域模型页的 token）放行：触屏没有「悬停」，拦下点击等于废掉跳转，
      // 而词典条目比浮层更全，跳过去本来就是更好的落点
      if (el.classList.contains('md-tok')) { hide(); return; } // 走 hide 而不是直接 hidden：锁也要还回去
      // 捕获阶段拦下：卡片列表的 .card-item 也绑了 click 跳转详情
      e.preventDefault();
      e.stopPropagation();
      fillTip(tip, el);
      tip.classList.add('tip-center');
      tip.hidden = false;
      lockScroll();
    }, true);
    return;
  }

  // 摆在 (x,y) 外侧：优先右下，装不下翻到左上，最后夹进视口
  function placeAt(x, y) {
    const pad = 14;
    const m = 8;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    let left = x + pad;
    let top = y + pad;
    if (left + w > innerWidth - m) left = x - w - pad;
    if (top + h > innerHeight - m) top = y - h - pad;
    tip.style.left = Math.max(m, left) + 'px';
    tip.style.top = Math.max(m, top) + 'px';
  }

  // 浮层内换过内容（嵌套术语）之后重新夹一次：高度变了，原来贴边的位置可能已经出界
  function reclamp() {
    const m = 8;
    const r = tip.getBoundingClientRect();
    tip.style.left = Math.min(Math.max(m, r.left), Math.max(m, innerWidth - r.width - m)) + 'px';
    tip.style.top = Math.min(Math.max(m, r.top), Math.max(m, innerHeight - r.height - m)) + 'px';
  }

  document.addEventListener('mouseover', (e) => {
    if (tip.classList.contains('tip-sticky')) return;
    // 指针在浮层里（只有钉住态进得来）：只续命，不再跟随。浮层内的术语就地换内容
    if (tip.contains(e.target)) {
      cancelHide();
      const inner = e.target.closest?.('.term');
      if (inner) { fillTip(tip, inner); reclamp(); }
      return;
    }
    const el = e.target.closest?.('.term');
    if (!el) return;
    cancelHide();
    fillTip(tip, el);
    tip.hidden = false;
    // 量在钉住之前：overflow:hidden 的元素 scrollHeight 仍是完整内容高
    const over = tip.scrollHeight > Math.round(innerHeight * PIN_RATIO) + 4;
    // 内容里有嵌套术语（状态详情里的分类 / 原语 / 谓词）时也必须钉住：跟随态是
    // pointer-events:none，鼠标根本进不来，那些词有没有下划线都一样点不到
    pinned = over || tip.querySelector('.term') !== null;
    tip.classList.toggle('tip-pin', pinned);
    if (pinned) tip.scrollTop = 0; // 同一个元素复用，上一份内容的滚动位置要清掉
    placeAt(e.clientX, e.clientY);
  });

  document.addEventListener('mousemove', (e) => {
    if (tip.hidden || pinned || tip.classList.contains('tip-sticky')) return;
    placeAt(e.clientX, e.clientY);
  });

  // 从词上离开：跟随态立即关；钉住态留一点时间给鼠标跨过空隙移进来
  document.addEventListener('mouseout', (e) => {
    if (tip.classList.contains('tip-sticky')) return;
    const term = e.target.closest?.('.term');
    if (!term) return;
    const to = e.relatedTarget;
    if (to && (term.contains(to) || tip.contains(to))) return; // 词内挪动 / 正移向浮层
    if (pinned) scheduleHide();
    else hide();
  });

  // 从浮层里出来：回词上或去别的词都由上面那条 mouseover 接管
  tip.addEventListener('mouseout', (e) => {
    if (!pinned) return;
    const to = e.relatedTarget;
    if (to && tip.contains(to)) return;
    scheduleHide();
  });
}

// 钉住式弹窗（复用 #tooltip 的 tip-center 居中样式）：复制 prompt 这类「点了才给看」的内容。
// 与 hover 浮层互斥——sticky 期间 hover 处理器全部短路，直到点外部/ESC/换路由关闭
export function showTipSticky(html) {
  const tip = document.getElementById('tooltip');
  tip.classList.remove('tip-pin'); // 悬停浮层残留的滚动条不该带到居中弹窗上
  tip.innerHTML = html;
  tip.scrollTop = 0;
  tip.classList.add('tip-center', 'tip-sticky');
  tip.hidden = false;
  lockScroll();
}
