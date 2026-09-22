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
  // 前置字符排除 & 和 #：escapeHtml 产生的 &amp;/&lt;/&#39; 里会留下 amp/lt/39 这样的词。
  // 尾部排除连字符：`skill-design_v0.3`、`enemy-self` 这类是文件名或连写词，
  // 切开一半去查词条会命中 `skill`（禁止主动技能）这种风马牛不相及的同形词
  return text.replace(/(^|[^&#\w])([A-Za-z_][A-Za-z0-9_]*(?:[.:][A-Za-z0-9_*]+)*)(?!-)/g, (m, pre, w) => {
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

// ── 字段 / 概念速查抽取（领域模型页的数据面） ─────────────────────────
// 把一篇设计文档拆成一条条可检索的条目，而不是把整篇正文铺在页面上（见
// site/README.md 的「领域模型页」）。条目只有两个来源，都不猜语法：
//
//   ① 表格行——首列是「名字」的表才算字段表。首列是序号或纯数值的表（标定梯度、
//      时相表、分布表、占位盘点）是**数据**不是字段，收进来只会用噪声淹没字段，
//      它们留给每篇末尾的「原文」。
//   ② 小节标题——标题里带 ASCII 标识符的（`## 二、TargetSpec（目标规格）`、
//      `### Coordinate（坐标）`）是一个概念；`## 一、职责定位` 这类纯中文小节是
//      散文，本身不收，但其中的表格照收。
//
// 表头原样当字段标签（取值 / 归属 / 说明 / 语义…）：文档已经写明了这一列是什么，
// 不在这里重新解释。正文写不下的长说明由页面折叠，本文只负责拆。
//
// 收不了的都记进 skipped（引用块里的表也算），由页面在页脚列成「抽取情况」：
// 抽取规则是前端硬编码的，文档侧不可能知道，漏抽一旦静默就没人会发现。

// 首列是「名字」的列头。首列命中其一即认作字段表；找不到就整张跳过。
// 新写了一类字段表而没被收录时，把它的首列列头加到这里——页脚的「抽取情况」会把
// 跳过的表连表头一起列出来，漏掉的字段表在那里一眼可见，不必逐篇翻原文。
//
// 判据是「这一列装的是不是可以被查的名字」：装名字的收（行名会被当条目的名字），
// 装数值 / 长句 / 序号的收不了（`| 序列 | 9 | 8 |…` 的梯度表、`| 范围 | 一致性 |…`
// 的边界表——收了会得到一堆叫「9」「一次结算步骤内的全部变更」的条目）。
const NAME_COLS = new Set([
  '字段', '谓词', '组合子', '键', '原语', '算子', '参数', '维度', '概念', '编号',
  '值对象', '上下文', '事件', '母版', '状态', '层', '系', '阶段', '节点', '规则',
  '来源', 'type', 'op', 'kind', 'Def',
  // 以下按上面的判据补的：触发点取值域（13 条）、五大枢纽状态、界域六范式、
  // Placement / 溯源账本的 API 清单、三件套的角色、卡型到消费节点的分流
  '触发点', '枢纽状态', '范式', '操作', '角色', '模式', 'tier',
]);

// `## 三、Placement：唯一占位出口` —— 序号只在文档内排序，速查里没有意义
const H2_NUM = /^[〇一二三四五六七八九十]+、\s*/;

const stripMd = (s) => String(s).replace(/[`*]/g, '').trim();

// 供搜索匹配的可见文本：抹掉标记，留下人眼能看到的字
const plainOf = (s) => String(s)
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/[`*]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

// 「Coordinate（坐标）」/「提线木偶 puppet_string」/「`faction`」→ { name, zh }
function splitName(title) {
  let t = stripMd(title);
  let zh = '';
  // 括号里是中文名才当中文名用；`（11 类）`、`（C-5）`、`（A22）` 是附注，`（a, b）`
  // 是函数签名——都留在名字里。判据：中文名必须含至少一个非 ASCII 字符
  const m = t.match(/^(.*?)\s*[（(]([^（()）]*)[)）]$/);
  if (m && !/\d/.test(m[2]) && /[^\x00-\x7f]/.test(m[2])) { t = m[1].trim(); zh = m[2].trim(); }
  // 中文在前、标识符在后（枢纽状态表里成片是这种写法）：拆开，ASCII 当 key、中文当名
  if (!zh) {
    const a = t.match(/^([^\x00-\x7f][^\x00-\x7f\s]*)\s+([A-Za-z][\w.:]*)$/);
    if (a) { zh = a[1]; t = a[2]; }
  }
  return { name: t || stripMd(title), zh };
}

// opts 同 renderMarkdown（dir/docNames/base），条目里的链接要按所在文档的目录归一。
// 返回 { intro, entries }：intro 是每篇唯一的那句导语（「最多给一个领域的介绍」）。
export function parseRef(md, opts = {}) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const entries = [];
  const skipped = [];   // 略过的表格，供页面报「抽取情况」
  let intro = '';
  let h2 = '';
  let h3 = '';
  let nH2 = 0;          // 见过几个小节
  let pending = null;   // 正在累积正文的条目（小节标题开的头）
  let i = 0;

  const concept = (title) => {
    const { name, zh } = splitName(title);
    // fromHeading：条目即小节标题本身（正文是它的说明），渲染时折成分组导语，
    // 不再以小节名下的一条同名条目重复出现
    const e = { name, zh, fields: [], paras: [], sec: { h2, h3 }, fromHeading: true };
    entries.push(e);
    return e;
  };

  while (i < lines.length) {
    const s = lines[i].trim();
    if (!s) { i++; continue; }

    const h = s.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const lv = h[1].length;
      pending = null;
      if (lv === 1) { h2 = ''; h3 = ''; }
      else if (lv === 2) {
        h2 = stripMd(h[2]).replace(H2_NUM, '');
        h3 = '';
        nH2++;
        if (/[A-Za-z]/.test(h2)) pending = concept(h2);
      } else {
        h3 = stripMd(h[2]);
        pending = concept(h3);
      }
      i++;
      continue;
    }

    // 围栏代码与引用块跳过：前者是示例，后者多是裁决过程与出处，速查里不站位置
    if (s.startsWith('```')) {
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) i++;
      i++;
      continue;
    }
    if (s.startsWith('>')) {
      // 引用块整体不收（多是裁决过程、出处、旧名对照），但它里面的表也要进「抽取情况」：
      // 不记就等于速查里没有、对账里也没有——静默漏抽最坏的一种
      let quoted = null;
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const inner = lines[i].trim().replace(/^>\s?/, '');
        if (inner.startsWith('|')) {
          if (!quoted) {
            quoted = inner;
            skipped.push({ line: i + 1, sec: h3 || h2, quote: true,
              head: splitRow(quoted).map(stripMd).join(' | ') });
          }
        } else quoted = null;
        i++;
      }
      continue;
    }

    if (s.startsWith('|')) {
      const start = i;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++]);
      const head = splitRow(rows[0]);
      let k = head.findIndex((c) => NAME_COLS.has(stripMd(c)));
      // 名字列只认第一列，或紧跟在行号列（`#`）之后的第二列。再往后说明这张表的
      // 名字列不在开头（`| # | 问题 | 状态 |` 的「状态」是值不是名），整张跳过
      if (k > 1 || (k === 1 && !/^#|序号/.test(stripMd(head[0])))) k = -1;
      if (k < 0) {
        // 跳过的表记下来上报：跳的是数据表还是「首列名没进 NAME_COLS 的字段表」，
        // 页面上分不出来，人一眼能分出来。静默跳过是这套抽取唯一会悄悄丢内容的地方
        skipped.push({ line: start + 1, sec: h3 || h2, head: head.map(stripMd).join(' | ') });
        continue;
      }
      pending = null;                   // 表格自成条目区，不再并进上面那个概念的说明
      for (const r of rows.slice(1)) {
        if (isTableSep(r)) continue;
        const cells = splitRow(r);
        if (!stripMd(cells[k] || '')) continue;
        const { name, zh } = splitName(cells[k]);
        const fields = [];
        // k 之前的列（`#` 这类行号）只是排版，不随条目走
        for (let c = k + 1; c < head.length; c++) {
          if (!stripMd(cells[c] || '')) continue;
          fields.push({ label: stripMd(head[c]), md: cells[c] });
        }
        entries.push({ name, zh, fields, paras: [], sec: { h2, h3 } });
      }
      continue;
    }

    if (isListStart(s)) {
      i++;
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!t) { if (isListStart((lines[i + 1] || '').trim())) { i++; continue; } break; }
        if (isBlockStart(t) && !isListStart(t)) break;
        i++;
      }
      continue;
    }

    const buf = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t || isBlockStart(t)) break;
      buf.push(t);
      i++;
    }
    if (!buf.length) { i++; continue; }
    const text = joinLines(buf);
    if (pending) pending.paras.push(text);   // 小节标题下的正文 = 该概念的说明
    // 导语只认篇首或第一个小节里那一句（「本文件收容…」「…负责…」）。放开了取，
    // 后面某一节里孤零零的一句「理由：…」会被当成整篇的导语
    else if (!intro && nH2 <= 1) intro = text;
  }

  // 只剩标题、正文全在表格里的概念（`### Channel 与 Cooldown`）对速查没有价值：
  // 它的内容已经作为表格条目在了，留一条空壳只会占位
  const kept = entries.filter((e) => e.fields.length || e.paras.length);
  entries.length = 0;
  entries.push(...kept);

  for (const e of entries) {
    // 表格单元格是「数据位」，通用档枚举（all / self / none）也照关联；
    // 散文（导语、概念说明）不进通用档，正文里的同形英文单词点成术语只会误导
    e.nameHtml = inline(e.name, opts, true);
    e.zhHtml = e.zh ? inline(e.zh, opts, true) : '';
    e.isCode = /^[\x00-\x7f]+$/.test(e.name);
    for (const f of e.fields) {
      f.html = inline(f.md, opts, true);
      f.text = plainOf(f.md);
    }
    const desc = e.paras.join(' ');
    e.descHtml = desc ? inline(desc, opts, false) : '';
    e.descText = plainOf(desc);
    e.search = plainOf([e.name, e.zh, ...e.fields.map((f) => `${f.label} ${f.text}`), e.descText].join(' ')).toLowerCase();
    delete e.paras;
  }
  return { intro: intro ? inline(intro, opts, false) : '', entries, skipped };
}
