// 样式按「游戏自有 → ui-kit → 桥接」三层顺序引入，顺序有意义：
// kit 自带一份 :root 默认 token 供它的独立预览页使用，桥接层再把 --cg-* 改指游戏变量，
// 所以桥接必须排在 kit 之后。三者都是静态 import，Vite 会按此序合成产物里的 CSS 顺序。
import './ui/styles/app.css'
import '../../ui-kit/ui-kit.css'
import './ui/styles/kit-bridge.css'

import { mountSprite } from './ui/components/icons'
import { initRouter } from './ui/router'

mountSprite() // ui-kit 的 <symbol> 精灵，全局只挂一次（<use href="#cg-…"> 靠它解析）

const host = document.getElementById('app')
if (!host) throw new Error('缺少 #app 挂载点')

initRouter(host)
