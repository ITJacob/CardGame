// P7 在线匹配（meta 层）。firebaseChannel 不在此桶导出——
// 它 import 会立即初始化 Firebase SDK，纯逻辑单测不该被牵连（UI 直接按文件引）。
export * from './types'
export * from './channel'
export * from './memoryChannel'
export * from './runner'
export * from './buildOnlineSetup'
