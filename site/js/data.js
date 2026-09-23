// 数据加载：fetch manifest + 全部技能/状态 JSON + 术语词典，统一缓存
const JSON_BASE = '../docs/json/';
const GLOSSARY_URL = '../docs/meta/glossary.json';
const SCHEMA_URL = JSON_BASE + 'schema/skills.schema.json';

export const DB = {
  manifest: null,
  glossary: null,
  pathways: [],        // [{id, name, file, cardCount, ...}]
  cards: [],           // 全部卡，附带 _pathway
  cardById: new Map(),
  axesByPathway: new Map(),   // pathwayId -> {axisId: {name, symbol, ...}}
  statusMap: new Map(),       // statusId -> {id, name, category, note, ...}
  designNotes: new Map(),     // pathwayId -> designNote
  statuses: [],               // 状态定义数组（带 _owner），供状态统计页用
  declaredPrimitives: [],     // schema effect.oneOf 声明的原语 type（27）
  declaredStatusFields: [],   // schema statusDef 声明的字段名（48）
  rarityOrder: [],            // 稀有度档位顺序：低 → 高（普通 → 传说），读自 manifest.rarityMap
  artFormat: '',              // 全局画幅约束（manifest.artFormat），画面 prompt 前缀
  artFrame: null,             // 全局三档边框 prompt（manifest.artFrame：common/uncommon/rare）
};

// 稀有度顺序读自 manifest.rarityMap（CLAUDE.md 里写的「稀有度↔序列唯一机器可读源」），
// 不在前端硬写：stats.js:62、cards.js:54 已经各有一份硬写副本，排序与热图列再加两份就是四处，
// 将来增删档位不会报错，只会悄悄分叉。rarityMap 的值是该档占用的序列区间，按区间**上界**
// 降序排即 普通 → 传说（按值排而不是按 JSON 键序，改键序不会悄悄换掉全站顺序）
const RARITY_FALLBACK = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
function readRarityOrder(manifest) {
  const rm = manifest?.rarityMap;
  if (!rm) return RARITY_FALLBACK;
  const keys = Object.keys(rm).filter((k) => Array.isArray(rm[k]) && rm[k].length);
  if (keys.length < 2) return RARITY_FALLBACK;
  const top = (k) => Math.max(...rm[k].filter((n) => typeof n === 'number'));
  return keys.sort((a, b) => top(b) - top(a));
}

// 从 schema 直读「声明面」而不是在前端硬写常量：27 条原语 / statusDef 字段表一旦改 schema
// 就会变，硬写必然与 schema 漂移——而「声明了多少 / 实际用了多少」正是这两页要展示的东西
function readDeclared(schema) {
  const defs = schema?.$defs || {};
  const ref = (n) => (n?.$ref ? defs[n.$ref.split('/').pop()] : n);
  const prim = [];
  for (const branch of ref(defs.effect)?.oneOf || []) {
    const t = ref(branch)?.properties?.type;
    if (typeof t?.const === 'string') prim.push(t.const);   // 算子分支无 type，自然跳过
  }
  DB.declaredPrimitives = prim;
  DB.declaredStatusFields = Object.keys(ref(defs.statusDef)?.properties || {});
}

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch 失败 ${r.status}: ${url}`);
  return r.json();
}

// common.statuses.json 读不到不算致命：状态统计页降级，悬停在途径 statuses 到达前只剩 id
const fetchJsonSoft = (url) => fetchJson(url).catch(() => null);

// 状态定义唯一权威源：common.statuses.json + 各途径 *.statuses.json。
// 同 id 时先落地者优先——调用方保证 common 先于各途径合并
function mergeStatuses(statusesDoc, ownerPathway) {
  const defs = statusesDoc.statusDefs || [];
  const list = Array.isArray(defs) ? defs : Object.values(defs);
  for (const s of list) {
    if (!s || !s.id) continue;
    if (!DB.statusMap.has(s.id)) {
      const def = { ...s, _owner: ownerPathway };
      DB.statusMap.set(s.id, def);
      DB.statuses.push(def);
    }
  }
}

// 首屏：索引 / 词典 / schema / common 状态定义（11 KB，首屏悬停即完整定义）/ 22 份卡面。
// 途径状态定义（22 份）不在其中，见 loadDeferred()。
export async function loadAll(onProgress) {
  const [manifest, glossary, schema, common] = await Promise.all([
    fetchJson(JSON_BASE + 'manifest.json'),
    fetchJson(GLOSSARY_URL),
    fetchJsonSoft(SCHEMA_URL),
    fetchJsonSoft(JSON_BASE + 'common.statuses.json'),
  ]);
  DB.manifest = manifest;
  DB.glossary = glossary;
  DB.pathways = manifest.pathways;
  DB.rarityOrder = readRarityOrder(manifest);
  DB.artFormat = manifest.artFormat || '';
  DB.artFrame = manifest.artFrame || null;
  // schema 缺失不阻断加载：两个统计页会退回「声明面=实际用过」的降级展示
  if (schema) readDeclared(schema);
  if (common) mergeStatuses(common, 'common');

  onProgress?.(`已加载索引，加载 ${DB.pathways.length} 个途径…`);

  const results = await Promise.all(DB.pathways.map((p) => fetchJson(JSON_BASE + p.file)));
  for (let i = 0; i < DB.pathways.length; i++) {
    const p = DB.pathways[i];
    const skills = results[i];
    DB.axesByPathway.set(p.id, skills.axes || {});
    if (skills.designNote) DB.designNotes.set(p.id, skills.designNote);
    for (const card of skills.cards || []) {
      card._pathway = p.id;
      card._pathwayName = p.name;
      card._artStyle = skills.artStyle || '';   // 途径级出图风格，详情页与 card.art 现拼
      card._frameEpic = skills.artFrameEpic || '';        // 途径级边框 prompt（epic/legendary 两档；
      card._frameLegendary = skills.artFrameLegendary || ''; // 其余三档走 DB.artFrame 全局模板）
      DB.cards.push(card);
      DB.cardById.set(card.id, card);
    }
  }
  onProgress?.(`已加载 ${DB.cards.length} 张卡`);
  return DB;
}

// 途径状态定义与卡片列表、卡面 AST、词典都不相关——只有「状态统计」页和
// 途径私有状态的悬停详情要。common 已随首屏加载，这里只补拉 22 份途径文件，
// 代价是途径私有状态的悬停详情最初一两秒只有 id。
let deferred = null;
let ready = false;
const waiters = [];

// 幂等：首次调用发起 22 个请求，之后复用同一个 promise
// 调用时机在 loadAll 之后（main.js），common 已合并，「先落地者优先」即 common 优先
export function loadDeferred() {
  if (deferred) return deferred;
  deferred = (async () => {
    const docs = await Promise.all(
      DB.pathways.map((p) => fetchJsonSoft(JSON_BASE + p.file.replace('.skills.json', '.statuses.json'))),
    );
    docs.forEach((d, i) => { if (d) mergeStatuses(d, DB.pathways[i].id); });
  })().then(() => {
    ready = true;
    waiters.splice(0).forEach((f) => f());
  });
  return deferred;
}

export const statusesReady = () => ready;

export function onStatusesReady(fn) {
  if (ready) fn();
  else waiters.push(fn);
}
