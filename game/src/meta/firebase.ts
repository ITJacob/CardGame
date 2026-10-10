// Firebase 接入（P7 在线匹配）。配置为公开信息，硬编码无碍——安全边界在 Firestore 规则。
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged, type Auth, type User } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCH9p-Zk7aF8kFFkusMDO0zdyQUvgHmvYw',
  authDomain: 'card-game-e313c.firebaseapp.com',
  projectId: 'card-game-e313c',
  storageBucket: 'card-game-e313c.firebasestorage.app',
  messagingSenderId: '729672923130',
  appId: '1:729672923130:web:5b5797de7d9e9338ac5643',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth: Auth = getAuth(firebaseApp)
export const db: Firestore = getFirestore(firebaseApp)

let signIn: Promise<User> | null = null

/** 确保已匿名登录并返回 uid；同一会话内多次调用复用同一次登录。 */
export function ensureUid(): Promise<string> {
  const cur = auth.currentUser
  if (cur) return Promise.resolve(cur.uid)
  signIn ??= signInAnonymously(auth)
    .then((cred) => cred.user)
    .catch((err) => {
      signIn = null
      throw err
    })
  return signIn.then((u) => u.uid)
}

/** 订阅登录态变化（未登录时 user 为 null），返回取消订阅函数。 */
export function onUidChange(cb: (uid: string | null) => void): () => void {
  return onAuthStateChanged(auth, (u) => cb(u?.uid ?? null))
}
