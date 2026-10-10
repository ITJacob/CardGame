// 档案单例（战绩与设置页共用同一份 localStorage 端口）
import { createLocalStorageStore, newProfile, type Profile } from '../meta/progression'

const store = createLocalStorageStore()

export function loadProfile(): Profile {
  const existing = store.load()
  if (existing) return existing
  const fresh = newProfile('sleepless')
  store.save(fresh)
  return fresh
}

export function saveProfile(p: Profile): void {
  store.save(p)
}

export function resetProfile(): Profile {
  const fresh = newProfile('sleepless')
  store.save(fresh)
  return fresh
}
