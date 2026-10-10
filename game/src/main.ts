import { initRouter } from './ui/router'

const host = document.getElementById('app')
if (!host) throw new Error('缺少 #app 挂载点')

initRouter(host)
