// 数据加载：fetch manifest + 全部技能/状态 JSON + 术语词典，统一缓存
const JSON_BASE = '../docs/json/';
const GLOSSARY_URL = '../docs/meta/glossary.json';

export const DB = {
  manifest: null,
  glossary: null,
  pathways: [],        // [{id, name, file, cardCount, ...}]
  cards: [],           // 全部卡，附带 _pathway
  cardById: new Map(),
  axesByPathway: new Map(),   // pathwayId -> {axisId: {name, symbol, ...}}
  statusMap: new Map(),       // statusId -> {id, name, category, note, ...}
  designNotes: new Map(),     // pathwayId -> designNote
};

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
    if (!DB.statusMap.has(s.id)) {
      DB.statusMap.set(s.id, { ...s, _owner: ownerPathway });
    }
  }
}

export async function loadAll(onProgress) {
  const [manifest, glossary] = await Promise.all([
    fetchJson(JSON_BASE + 'manifest.json'),
    fetchJson(GLOSSARY_URL),
  ]);
  DB.manifest = manifest;
  DB.glossary = glossary;
  DB.pathways = manifest.pathways;

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
