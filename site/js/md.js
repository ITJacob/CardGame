// 极简 Markdown → HTML：只覆盖 docs/ddd/*.md 实际用到的语法
// （标题 / 围栏代码 / 表格 / 引用块（可嵌套表格）/ 有序无序列表（可嵌套）/ 粗体 /
//   行内代码 / 链接 / 分隔线）。零依赖；认不出的行按段落输出，不猜语法。
//
// 术语关联：正文里的英文枚举 token（on_tick、empty_ally_slot、resist:fire…）在词典里有词条时
// 渲染成「中文 + 英文小字」的 .term，沿用全站的悬停浮层，并额外带 #/glossary 跳转链接。
// 关联规则见 LINK_SPECIFIC / LINK_GENERIC 的注释——宁少勿多，误点比漏点更伤阅读。
import { DB } from './data.js';
import { escapeHtml, lookup } from './term.js';

// ① 专有档：取值本身是领域专有写法（on_tick / empty_ally_slot / push_back / hp_asc），
//    在正文、表格、代码里出现都可安全关联。
const LINK_SPECIFIC = [
  'primitive', 'operator', 'triggerEvent', 'effectTarget', 'conditionKind',
  'statusCategory', 'actionLock', 'zoneKind', 'zoneTrigger', 'zoneAffects',
  'moveOp', 'sortKey', 'spawnPosition', 'reviveOf', 'dispelTarget', 'dispelMode',
  'domainOp', 'domainTier', 'translocateOp', 'consumption', 'laneRef', 'anchor',
  'spread', 'filter', 'ruleSlotField', 'ruleSlotMode', 'rulePatchKind', 'dim',
  'dimTarget', 'stackMode', 'stackPolicy', 'countMode', 'statMode', 'resourceMode',
  'healMode', 'shuffleMode', 'transferMode', 'transferDirection', 'split',
  'damagePierce', 'rounding', 'revealScope', 'onExpire', 'actionPolicy',
  'targetabilityDirection', 'modifyDamageScope', 'sourceRef', 'skillSelector',
  'targetSpecOverride', 'durationUnit', 'element', 'stat', 'resource', 'unitType',
];

// ② 通用档：取值是 all / self / none / manual 这类通用英文词。只在「一眼是枚举」的位置
//    （行内代码、表格单元格）关联——正文里的同形英文单词点成术语只会误导。
const LINK_GENERIC = ['scope', 'faction', 'side', 'cmp', 'selectionMode', 'cardKind', 'reach'];

const SPECIFIC = new Set(LINK_SPECIFIC);

let IDX = null;

function indexPath() {
  if (IDX) return IDX;
  const cats = DB.glossary?.categories || {};
  const exact = Object.create(null);
  const prefixes = [];
  // 专有档在前：同一个 key 撞多个类别时以专有档为准（如 none 同属 element/scope/faction）
  for (const cat of [...LINK_SPECIFIC, ...LINK_GENERIC]) {
    const g = cats[cat];
    if (!g) continue;
    for (const k of Object.keys(g.terms || {})) if (!(k in exact)) exact[k] = cat;
    for (const p of g.patterns || []) {
      if (p.match?.endsWith('*')) prefixes.push([p.match.slice(0, -1), cat]);
    }
  }
  IDX = {
    exact,
    byPrefix: (w) => {
      for (const [p, c] of prefixes) if (w.startsWith(p)) return c;
      return null;
    },
  };
  return IDX;
}

// 术语 token → 「中文 + 英文小字」的可跳转 span（.term 供 tooltip.js 的浮层复用）
function termLink(cat, key) {
  const t = lookup(cat, key);
  const tk = t.zh !== key ? `<span class="tk">${escapeHtml(key)}</span>` : '';
  const href = `#/glossary?cat=${encodeURIComponent(cat)}&q=${encodeURIComponent(key)}`;
  return `<a class="term md-tok" href="${href}" data-cat="${escapeHtml(cat)}" data-key="${escapeHtml(key)}">${escapeHtml(t.zh)}${tk}</a>`;
}

// inEnum：处于行内代码 / 表格单元格等「一眼是取值」的位置，通用档也关联
function token(text, opts, inEnum) {
  const idx = indexPath();
  // 前置字符排除 & 和 #：escapeHtml 产生的 &amp;/&lt;/&#39; 里会留下 amp/lt/39 这样的词
  return text.replace(/(^|[^&#\w])([A-Za-z_][A-Za-z0-9_]*(?:[.:][A-Za-z0-9_*]+)*)/g, (m, pre, w) => {
    const cat = idx.exact[w] || idx.byPrefix(w);
    if (!cat) return m;
    if (!inEnum) {
      if (!SPECIFIC.has(cat)) return m;            // 通用档不进正文
      if (w.length < 4 && !/[_:.]/.test(w)) return m;   // dim / ice 这类短词正文不点
    }
    return pre + termLink(cat, w);
  });
}

// 相对路径归一：dir 是当前文档在 docs/ddd/ 下的目录。
// 归一到 ddd 之外时保留开头的 ..（README 有一处指回 docs/meta/），
// 直接 pop 会把 ../meta/x.md 吃成 meta/x.md，链接就此指向不存在的路径
function resolvePath(dir, rel) {
  const out = [];
  for (const p of (dir ? dir.split('/') : []).concat(rel.split('/'))) {
    if (!p || p === '.') continue;
    if (p === '..' && out.length && out[out.length - 1] !== '..') out.pop();
    else out.push(p);
  }
  return out.join('/');
}

function mdLink(text, url, opts) {
  const label = inline(text, opts, false);
  if (/^https?:/i.test(url)) {
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${label}</a>`;
  }
  const m = url.match(/^([^#?]*?)\.md(#.*)?$/);
  if (m) {
    const target = resolvePath(opts.dir || '', m[1]);
    const name = target.replace(/^.*\//, '');
    // 目录内的文档跳本页对应章节；落在 ddd 之外的（如 ../meta/GENERATION_BRIEF.md）
    // 只能给原始文件链接——同源 .md 浏览器会直接显示纯文本
    if (opts.docNames?.has(name)) {
      return `<a class="doc-jump" href="#/ddd/${encodeURIComponent(name)}">${label}</a>`;
    }
    // 扩展名由 m[1] 的正则吃掉，拼回 href 时要补上
    return `<a href="${escapeHtml(opts.base + target + '.md' + (m[2] || ''))}" target="_blank" rel="noopener">${label}</a>`;
  }
  return `<a href="${escapeHtml(url)}">${label}</a>`;
}

// 段内换行合并：两侧都是中文时直接相接（中文没有词间空格），否则补一个空格
function joinLines(buf) {
  let out = buf[0] || '';
  for (let i = 1; i < buf.length; i++) {
    const a = out.slice(-1);
    const b = buf[i][0] || '';
    const cjk = /[一-鿿，。、；：）】」！？]/.test(a) && /[一-鿿（【「]/.test(b);
    out += (cjk ? '' : ' ') + buf[i];
  }
  return out;
}

function inline(text, opts, inEnum) {
  const store = [];
  const stash = (html) => `\u0000${store.push(html) - 1}\u0000`;
  let s = escapeHtml(text);
  // 链接必须先于行内代码处理：标签本身常写作 [`x.md`](x.md)，若先把反引号换成占位符，
  // 标签就只剩一个占位符——mdLink 拿它去递归 inline 时会当成「本层的第 0 项」去查
  // 一个新的空 store，解析成空串，链接静默变成没有文字的锚点
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => stash(mdLink(t, u, opts)));
  s = s.replace(/`([^`]+)`/g, (m, c) => stash(`<code>${token(c, opts, true)}</code>`));
  s = s.replace(/\*\*([^*]+)\*\*/g, (m, t) => stash(`<strong>${token(t, opts, inEnum)}</strong>`));
  s = token(s, opts, inEnum);
  // 占位回填可能带出嵌套占位（如粗体内的行内代码），多跑几轮直到干净
  for (let k = 0; k < 4 && s.indexOf('\u0000') >= 0; k++) {
    s = s.replace(/\u0000(\d+)\u0000/g, (m, i) => store[+i] ?? '');
  }
  return s;
}

const isTableSep = (s) => /^\|[\s:|-]+\|$/.test(s.trim());

// 码段内的竖线按字面处理（`|occupied(L)| ≤ |L.slots|`）。GFM 要求这种位置写成 \|，
// 但设计文档是手写的，码段里出现竖线的意图没有歧义；按普通字符切会把整行切成两倍单元格，
// 码段被撕成两半、页面上留下孤零零的反引号
function splitRow(s) {
  const t = s.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let cur = '';
  let tick = false;
  for (const c of t) {
    if (c === '`') { tick = !tick; cur += c; continue; }
    if (c === '|' && !tick) { cells.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  cells.push(cur.trim());
  return cells;
}

function table(rows, opts) {
  const head = splitRow(rows[0]);
  const body = rows.slice(1).filter((r) => !isTableSep(r)).map(splitRow);
  const th = head.map((c) => `<th>${inline(c, opts, true)}</th>`).join('');
  const tb = body.map((r) => `<tr>${r.map((c) => `<td>${inline(c, opts, true)}</td>`).join('')}</tr>`).join('');
  // 表格外包一层横向滚动容器：5 列表在窄屏放不下，直接溢出会把整页顶宽
  return `<div class="md-table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>`;
}

// 按缩进把列表项挂成树——设计文档里「- 主项 / ␣␣- 子项」是层级语义，拍平会读错
function buildList(items) {
  const root = { indent: -1, children: [] };
  const stack = [root];
  for (const it of items) {
    while (stack.length > 1 && it.indent <= stack[stack.length - 1].indent) stack.pop();
    const node = { indent: it.indent, ordered: it.ordered, text: it.text, children: [] };
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }
  return root;
}

function renderList(node, opts) {
  const tag = node.ordered ? 'ol' : 'ul';
  const inner = node.children.map((c) => {
    const sub = c.children.length ? renderList({ ...c, ordered: c.children[0].ordered }, opts) : '';
    return `<li>${inline(c.text, opts, false)}${sub}</li>`;
  }).join('');
  return `<${tag}>${inner}</${tag}>`;
}

function isListStart(s) {
  return /^([-*+]|\d+\.)\s+/.test(s);
}

function isBlockStart(s) {
  return !s || s.startsWith('|') || s.startsWith('>') || s.startsWith('```')
    || /^#{1,4}\s/.test(s) || isListStart(s) || /^(-{3,}|\*{3,}|_{3,})$/.test(s);
}

export function renderMarkdown(md, opts = {}) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    const s = ln.trim();
    if (!s) { i++; continue; }

    if (s.startsWith('```')) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++]);
      i++;
      out.push(`<pre>${escapeHtml(buf.join('\n'))}</pre>`);
      continue;
    }

    const h = ln.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lv = Math.min(h[1].length + 1, 6);   // 文档自身的 # 标题让位给面板标题，降一级
      out.push(`<h${lv}>${inline(h[2], opts, false)}</h${lv}>`);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(s)) { out.push('<hr>'); i++; continue; }

    if (s.startsWith('>')) {
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) buf.push(lines[i++].replace(/^\s*>\s?/, ''));
      out.push(`<blockquote>${renderMarkdown(buf.join('\n'), opts)}</blockquote>`);
      continue;
    }

    if (s.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++]);
      out.push(table(rows, opts));
      continue;
    }

    if (isListStart(s)) {
      const items = [];
      while (i < lines.length) {
        const cur = lines[i];
        const cs = cur.trim();
        if (!cs) {
          // 空行之后仍是列表项则算同一张列表（项内分段），否则列表结束
          if (isListStart((lines[i + 1] || '').trim())) { i++; continue; }
          break;
        }
        const m = cs.match(/^([-*+]|\d+\.)\s+(.*)$/);
        if (m) {
          items.push({ indent: cur.length - cur.trimStart().length, ordered: /\d/.test(m[1]), text: m[2] });
          i++;
          continue;
        }
        if (items.length) {           // 续行（折行的长条目）并进上一项
          items[items.length - 1].text = joinLines([items[items.length - 1].text, cs]);
          i++;
          continue;
        }
        break;
      }
      out.push(renderList(buildList(items), opts));
      continue;
    }

    const buf = [];
    while (i < lines.length && !isBlockStart(lines[i].trim())) buf.push(lines[i++].trim());
    out.push(`<p>${inline(joinLines(buf), opts, false)}</p>`);
  }
  return out.join('\n');
}

// 读 docs/ddd/README.md 的「文档导航」小节，得到 {分组 → [{label, path}]}。
// 文档清单从 README 现读而不是前端硬写：README 是这套文档的入口与索引，加一篇新文档
// 只需在 README 里加一行，本页自动跟上。
export function parseToc(md) {
  const groups = [];
  let cur = null;
  for (const line of String(md).replace(/\r\n?/g, '\n').split('\n')) {
    const h = line.match(/^###\s+(.*)$/);
    if (h) { cur = { title: h[1].trim(), items: [] }; groups.push(cur); continue; }
    const li = line.match(/^-\s+\[([^\]]+)\]\(([^)]+)\)/);
    if (li && cur) cur.items.push({ label: li[1].trim(), path: li[2].trim() });
  }
  return groups.filter((g) => g.items.length);
}
