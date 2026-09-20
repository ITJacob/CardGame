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
};

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

function mergeStatuses(statusesDoc, ownerPathway) {
  const defs = statusesDoc.statusDefs || [];
  const list = Array.isArray(defs) ? defs : Object.values(defs);
  for (const s of list) {
    if (!s || !s.id) continue;
    // 占位项判定：manifest.statusIds 的中→英兜底只带 id/name，真实定义必有 category
    //（schema 里 category 是 statusDef 的 required 字段）。这里必须让真实定义盖掉兜底项，
    // 否则 burn/poison/regen 这 18 个「既在 manifest 里又有定义」的状态会永远只剩一个名字，
    // 悬停详情看不到持续/层数/可驱散，也看不到 effects/triggers
    const prev = DB.statusMap.get(s.id);
    if (!prev || !prev.category) {
      const def = { ...s, _owner: ownerPathway };
      DB.statusMap.set(s.id, def);
      DB.statuses.push(def);       // 只收真实定义，不含 manifest 兜底占位项
    }
  }
}

export async function loadAll(onProgress) {
  const [manifest, glossary, schema] = await Promise.all([
    fetchJson(JSON_BASE + 'manifest.json'),
    fetchJson(GLOSSARY_URL),
    fetchJson(SCHEMA_URL).catch(() => null),
  ]);
  DB.manifest = manifest;
  DB.glossary = glossary;
  DB.pathways = manifest.pathways;
  // schema 缺失不阻断加载：两个统计页会退回「声明面=实际用过」的降级展示
  if (schema) readDeclared(schema);

  onProgress?.(`已加载索引，加载 ${DB.pathways.length} 个途径…`);

  // manifest.statusIds 是 中→英，反转为 英→中 兜底（statuses 文件优先）
  for (const [zh, en] of Object.entries(manifest.statusIds || {})) {
    if (!DB.statusMap.has(en)) DB.statusMap.set(en, { id: en, name: zh });
  }

  const results = await Promise.all(DB.pathways.map(async (p) => {
    const skills = await fetchJson(JSON_BASE + p.file);
    const statusFile = p.file.replace('.skills.json', '.statuses.json');
    const statuses = await fetchJson(JSON_BASE + statusFile).catch(() => null);
    return { p, skills, statuses };
  }));
  const common = await fetchJson(JSON_BASE + 'common.statuses.json').catch(() => null);
  if (common) mergeStatuses(common, 'common');

  for (const { p, skills, statuses } of results) {
    if (statuses) mergeStatuses(statuses, p.id);
    DB.axesByPathway.set(p.id, skills.axes || {});
    if (skills.designNote) DB.designNotes.set(p.id, skills.designNote);
    for (const card of skills.cards || []) {
      card._pathway = p.id;
      card._pathwayName = p.name;
      DB.cards.push(card);
      DB.cardById.set(card.id, card);
    }
  }
  onProgress?.(`已加载 ${DB.cards.length} 张卡`);
  return DB;
}
