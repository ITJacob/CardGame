// 解锁与档案：职业解锁 / 卡牌解锁 / 货币 / 战绩。
// 现在走 localStorage（Storage 端口 + LocalStorageAdapter），后续可换 IndexedDB / Firestore。

export interface Profile {
  uuid: string
  username: string
  /** 已解锁职业（pathwayId） */
  unlockedClasses: string[]
  /** 已解锁卡牌 id */
  unlockedCards: string[]
  currency: number
  wins: number
  losses: number
}

export interface ProfileStore {
  load(): Profile | null
  save(p: Profile): void
  clear(): void
}

const STORAGE_KEY = 'cg.profile.v1'

/** 浏览器实现；无 localStorage 时退化为内存（便于测试与 node） */
export function createLocalStorageStore(key: string = STORAGE_KEY): ProfileStore {
  const hasLS = typeof localStorage !== 'undefined'
  let mem: string | null = null
  const read = (): string | null => (hasLS ? localStorage.getItem(key) : mem)
  const write = (v: string): void => {
    if (hasLS) localStorage.setItem(key, v)
    else mem = v
  }
  return {
    load: () => {
      const raw = read()
      if (!raw) return null
      try {
        return JSON.parse(raw) as Profile
      } catch {
        return null
      }
    },
    save: (p) => write(JSON.stringify(p)),
    clear: () => {
      if (hasLS) localStorage.removeItem(key)
      else mem = null
    },
  }
}

export function createMemoryStore(initial?: Profile): ProfileStore {
  let cur: Profile | null = initial ?? null
  return {
    load: () => cur,
    save: (p) => {
      cur = p
    },
    clear: () => {
      cur = null
    },
  }
}

function uuid(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } }
  if (g.crypto?.randomUUID) return g.crypto.randomUUID()
  return `cg-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`
}

/** 新档案默认解锁：一个起始职业 + 其全部卡牌 */
export function newProfile(startingClass = 'sleepless'): Profile {
  return {
    uuid: uuid(),
    username: '旅人',
    unlockedClasses: [startingClass],
    unlockedCards: [],
    currency: 0,
    wins: 0,
    losses: 0,
  }
}

/** 「已解锁卡牌」缺省语义：空数组 = 该职业全部卡可用 */
export function unlockedCardsSet(p: Profile): Set<string> | undefined {
  return p.unlockedCards.length > 0 ? new Set(p.unlockedCards) : undefined
}

export function unlockClass(p: Profile, classId: string): Profile {
  if (p.unlockedClasses.includes(classId)) return p
  return { ...p, unlockedClasses: [...p.unlockedClasses, classId] }
}

export function unlockCard(p: Profile, cardId: string): Profile {
  if (p.unlockedCards.includes(cardId)) return p
  return { ...p, unlockedCards: [...p.unlockedCards, cardId] }
}

// ---------- 卡池可用性与解锁（职业闸 + 卡牌闸） ----------

/** 某职业的全部卡（active + passive） */
export function cardsOfClass(catalog: { classDefs: ReadonlyMap<string, { knownSkills: string[] }> }, classId: string): string[] {
  return catalog.classDefs.get(classId)?.knownSkills ?? []
}

/**
 * 当前可用卡集合。
 * 规则：`unlockedCards` 为空 = 「已解锁职业的全部卡」；非空 = 显式白名单（仍受职业闸限制）。
 * UI 首次改动卡牌时会把它物化成显式列表。
 */
export function availableCardSet(
  p: Profile,
  catalog: { classDefs: ReadonlyMap<string, { knownSkills: string[] }> },
): Set<string> {
  const classCards = p.unlockedClasses.flatMap((c) => cardsOfClass(catalog, c))
  if (p.unlockedCards.length === 0) return new Set(classCards)
  const allowed = new Set(p.unlockedCards)
  return new Set(classCards.filter((id) => allowed.has(id)))
}

export function toggleCardUnlock(
  p: Profile,
  catalog: { classDefs: ReadonlyMap<string, { knownSkills: string[] }> },
  cardId: string,
): Profile {
  const set = availableCardSet(p, catalog)
  if (set.has(cardId)) set.delete(cardId)
  else set.add(cardId)
  return { ...p, unlockedCards: [...set].sort() }
}

export function toggleClassUnlock(
  p: Profile,
  catalog: { classDefs: ReadonlyMap<string, { knownSkills: string[] }> },
  classId: string,
): Profile {
  const has = p.unlockedClasses.includes(classId)
  const explicit = p.unlockedCards.length > 0
  if (has) {
    const set = availableCardSet(p, catalog)
    for (const id of cardsOfClass(catalog, classId)) set.delete(id)
    return {
      ...p,
      unlockedClasses: p.unlockedClasses.filter((c) => c !== classId),
      unlockedCards: explicit ? [...set].sort() : [],
    }
  }
  const classes = [...p.unlockedClasses, classId].sort()
  if (!explicit) return { ...p, unlockedClasses: classes }
  const set = availableCardSet(p, catalog)
  for (const id of cardsOfClass(catalog, classId)) set.add(id)
  return { ...p, unlockedClasses: classes, unlockedCards: [...set].sort() }
}
