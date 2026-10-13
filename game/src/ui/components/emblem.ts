// 职业徽标：塔罗大阿尔卡纳徽记 + 九大源质色系。
// 徽记映射权威源：assets/frames/TAROT_SYMBOLS.md（罗塞尔「亵渎之牌」体系，一途径一大阿尔卡纳）；
// 源质分族权威源：docs/诡秘之主资料库/九大源质总览.md。
// 色系一族一色相，族内各途径用明度/饱和度错位（同族相邻职业要肉眼可分）。
// 徽记图形全在 ui-kit.svg 的 cg-sigil-*，颜色由这里的 inline color 走 currentColor。
import { icon } from './icons'

interface Emblem {
  sigil: string
  color: string
}

/** 22 途径 → (塔罗徽记, 源质族色)。注释格式：族色｜塔罗牌 */
const EMBLEMS: Record<string, Emblem> = {
  // 源堡 · 诡秘灰紫
  seer: { sigil: 'cg-sigil-fool', color: '#a99ad0' }, // 愚者
  apprentice: { sigil: 'cg-sigil-magician', color: '#8d82bf' }, // 魔术师
  thief: { sigil: 'cg-sigil-lovers', color: '#c0b0de' }, // 恋人
  // 混沌海 · 全知白金
  spectator: { sigil: 'cg-sigil-justice', color: '#e6dab2' }, // 正义
  chanter: { sigil: 'cg-sigil-sun', color: '#f2e7c6' }, // 太阳
  reader: { sigil: 'cg-sigil-tower', color: '#d8ca9c' }, // 塔
  sailor: { sigil: 'cg-sigil-hierophant', color: '#e0d0a6' }, // 教皇
  supplicant: { sigil: 'cg-sigil-hanged', color: '#cec092' }, // 倒吊人
  // 永暗之河 · 冷钢蓝
  sleepless: { sigil: 'cg-sigil-star', color: '#8fb0d8' }, // 星星
  corpse_collector: { sigil: 'cg-sigil-death', color: '#7a9cc8' }, // 死神
  warrior: { sigil: 'cg-sigil-strength', color: '#a5c2e2' }, // 力量
  // 灾祸之城 · 绯红
  hunter: { sigil: 'cg-sigil-chariot', color: '#d87a6a' }, // 战车
  assassin: { sigil: 'cg-sigil-empress', color: '#c45f5a' }, // 女皇
  // 知识荒野 · 青碧
  savant: { sigil: 'cg-sigil-priestess', color: '#6ec0ae' }, // 女祭司
  pryer: { sigil: 'cg-sigil-hermit', color: '#8cd2ba' }, // 隐者
  // 光之钥 · 紫罗兰
  monster: { sigil: 'cg-sigil-wheel', color: '#b47fda' }, // 命运之轮
  // 母巢 · 苔绿
  apothecary: { sigil: 'cg-sigil-moon', color: '#a8c47a' }, // 月亮
  planter: { sigil: 'cg-sigil-world', color: '#8ab26a' }, // 世界
  // 失序之国 · 琥珀
  arbiter: { sigil: 'cg-sigil-judgement', color: '#d8a860' }, // 审判
  lawyer: { sigil: 'cg-sigil-emperor', color: '#c89248' }, // 皇帝
  // 暗影世界 · 品红
  prisoner: { sigil: 'cg-sigil-temperance', color: '#c86a9a' }, // 节制
  criminal: { sigil: 'cg-sigil-devil', color: '#b2556f' }, // 恶魔
}

/** 职业徽标（尺寸随 font-size、颜色吃源质族色）。未知职业返回空串，调用方照常渲染文字 */
export function emblemHtml(classId: string, cls = ''): string {
  const e = EMBLEMS[classId]
  if (!e) return ''
  return icon(e.sigil, `emblem${cls ? ` ${cls}` : ''}`).replace('<svg ', `<svg style="color:${e.color}" `)
}
