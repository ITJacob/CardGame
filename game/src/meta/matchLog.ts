// 对局记录与本地战绩榜。现在走 localStorage，后续可换 Firestore（同 MatchStore 端口）。

export interface MatchRecord {
  id: string
  /** epoch ms */
  at: number
  seed: number
  outcome: 'side_a' | 'side_b' | 'draw' | 'aborted'
  win: boolean
  ticks: number
  unitsLostOwn: number
  unitsLostEnemy: number
  damageDealtOwn: number
  damageDealtEnemy: number
  heroes: { name: string; classId: string; constitutionId: string }[]
}

export interface MatchStore {
  all(): MatchRecord[]
  append(r: MatchRecord): void
  clear(): void
}

const KEY = 'cg.matches.v1'
const CAP = 200

export function createLocalStorageMatchStore(key: string = KEY): MatchStore {
  const hasLS = typeof localStorage !== 'undefined'
  let mem: string | null = null
  const read = (): string | null => (hasLS ? localStorage.getItem(key) : mem)
  const write = (v: string): void => {
    if (hasLS) localStorage.setItem(key, v)
    else mem = v
  }
  const parse = (): MatchRecord[] => {
    const raw = read()
    if (!raw) return []
    try {
      const v = JSON.parse(raw) as unknown
      return Array.isArray(v) ? (v as MatchRecord[]) : []
    } catch {
      return []
    }
  }
  return {
    all: () => parse(),
    append: (r) => {
      const list = [r, ...parse()].slice(0, CAP)
      write(JSON.stringify(list))
    },
    clear: () => write('[]'),
  }
}

export function createMemoryMatchStore(initial: MatchRecord[] = []): MatchStore {
  let list: MatchRecord[] = [...initial]
  return {
    all: () => [...list],
    append: (r) => {
      list = [r, ...list].slice(0, CAP)
    },
    clear: () => {
      list = []
    },
  }
}

/**
 * 榜序：胜场优先 → 我方阵亡少者优先 → 用时（tick）少者优先 → 时间新者优先。
 * 刻意不合成单一「分数」——原始战绩更可解释。
 */
export function sortRecords(records: readonly MatchRecord[]): MatchRecord[] {
  return [...records].sort((a, b) => {
    const wa = isWin(a)
    const wb = isWin(b)
    if (wa !== wb) return wa ? -1 : 1
    if (a.unitsLostOwn !== b.unitsLostOwn) return a.unitsLostOwn - b.unitsLostOwn
    if (a.ticks !== b.ticks) return a.ticks - b.ticks
    return b.at - a.at
  })
}

export interface RecordSummary {
  matches: number
  wins: number
  losses: number
  draws: number
  winRate: number
}

function isWin(r: MatchRecord): boolean {
  return r.outcome === 'side_a'
}

export function summarize(records: readonly MatchRecord[]): RecordSummary {
  const wins = records.filter(isWin).length
  const draws = records.filter((r) => r.outcome === 'draw' || r.outcome === 'aborted').length
  const losses = records.length - wins - draws
  return {
    matches: records.length,
    wins,
    losses,
    draws,
    winRate: records.length > 0 ? wins / records.length : 0,
  }
}
