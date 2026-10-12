// 样式按「游戏自有 → ui-kit → 桥接」三层顺序引入，顺序有意义：
// kit 自带一份 :root 默认 token 供它的独立预览页使用，桥接层再把 --cg-* 改指游戏变量，
// 所以桥接必须排在 kit 之后。三者都是静态 import，Vite 会按此序合成产物里的 CSS 顺序。
import './ui/styles/app.css'
import '../../ui-kit/ui-kit.css'
import './ui/styles/kit-bridge.css'
// 秘仪阵是游戏侧装饰层，排在桥接层之后（它不改任何 --cg-*，只是最后引入以便压过 kit 的同名单类规则）
import './ui/styles/arcane-bg.css'

import { mountSprite } from './ui/components/icons'
import { initArcaneField } from './ui/effects/arcane-bg'
import { initRouter } from './ui/router'

mountSprite() // ui-kit 的 <symbol> 精灵，全局只挂一次（<use href="#cg-…"> 靠它解析）
initArcaneField() // 只写两个 body 状态：静态档(af-low) 与 隐藏暂停(is-af-paused)

const host = document.getElementById('app')
if (!host) throw new Error('缺少 #app 挂载点')

initRouter(host)
