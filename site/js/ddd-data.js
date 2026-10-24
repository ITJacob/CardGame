// 领域模型文档的加载与解析（ddd 页与全站搜索共用，避免两处解析规则漂移）。
// 文档清单读 README 的「文档导航」；每篇按 `##` 拆分小节，概述取 `> **概述**：`，
// 其余正文留给「详解」。缓存只在内存里，SW 的 network-first 决定刷新后的新鲜度。
import { parseToc } from './md.js';

export const BASE = '../docs/ddd/';
const README = 'README.md';
export const OVERVIEW = '总览';

const dirOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
const nameOf = (p) => p.replace(/^.*\//, '').replace(/\.md$/, '');
const shortLabel = (s) => s.replace(/（[^）]*）\s*$/, '').trim();

let CACHE = null;

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

/** 按 `##` 拆小节；每个 `##` 后的 `> **概述**：…` 即为该节概述，其余为详解正文。 */
export function parseSections(md) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const intro = [];
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const h = /^##\s+(.+)$/.exec(line);
    if (h) {
      if (cur) sections.push(cur);
      cur = { heading: h[1].trim(), ov: '', body: [] };
      continue;
    }
    if (!cur) { intro.push(line); continue; }
    const ov = /^>\s*\*\*概述\*\*[：:]\s*(.*)$/.exec(line);
    if (ov && !cur.ov) { cur.ov = ov[1].trim(); continue; }
    cur.body.push(line);
  }
  if (cur) sections.push(cur);
  return {
    intro: intro.join('\n').trim(),
    sections: sections.map((s) => ({
      heading: s.heading,
      ov: s.ov,
      body: s.body.join('\n').trim(),
    })),
  };
}

async function load() {
  if (CACHE) return CACHE;
  const readme = await fetchText(BASE + README);
  const groups = parseToc(readme);
  const docs = new Map();
  docs.set(OVERVIEW, { label: OVERVIEW, group: '', path: README, dir: '', md: readme });
  for (const g of groups) {
    for (const it of g.items) {
      const name = nameOf(it.path);
      if (docs.has(name)) continue;
      docs.set(name, {
        label: shortLabel(it.label), group: g.title,
        path: it.path, dir: dirOf(it.path), md: null,
      });
    }
  }
  await Promise.all([...docs.values()]
    .filter((d) => d.md === null)
    .map(async (d) => {
      try {
        d.md = await fetchText(BASE + d.path);
      } catch (err) {
        d.md = '';
        d.error = err.message;
      }
    }));

  for (const d of docs.values()) {
    if (d.error) { d.intro = ''; d.sections = []; continue; }
    const parsed = parseSections(d.md);
    d.intro = parsed.intro;
    d.sections = parsed.sections;
  }
  const total = [...docs.values()].reduce((n, d) => n + d.sections.length, 0);
  CACHE = { docs, order: [...docs.keys()], total };
  return CACHE;
}

export function loadDdd() {
  return load();
}
