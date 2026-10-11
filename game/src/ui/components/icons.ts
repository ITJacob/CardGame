// ui-kit 的矢量精灵（<symbol> 集合）。整套图标只有 ui-kit/ui-kit.svg 一份，这里以 ?raw 读进来
// 原样注入 <body>——不是拷贝，改 ui-kit.svg 下次构建就跟着变。用 ?raw 而不是运行时 fetch：
// 挂在 <use href="#cg-…"> 上的外部文件引用 Chrome 不认，精灵必须跟文档同源。
import sprite from '../../../../ui-kit/ui-kit.svg?raw'

const SPRITE_ID = 'cg-sprite'

/** 幂等：router 每次换视图都整体重写 #app，精灵挂在外面的 body 上，挂一次就够 */
export function mountSprite(): void {
  if (document.getElementById(SPRITE_ID)) return
  const wrap = document.createElement('div')
  wrap.id = SPRITE_ID
  wrap.setAttribute('aria-hidden', 'true')
  wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
  wrap.innerHTML = sprite
  // 精灵里那条 <style> 的选择器挂在 .cg-sprite 上，根 svg 得带上这个类才生效
  wrap.querySelector('svg')?.classList.add('cg-sprite')
  document.body.prepend(wrap)
}

/** 图标（尺寸/颜色随 font-size 与 color 走，见 ui-kit.css 的 .cg-ico） */
export function icon(id: string, cls = ''): string {
  return `<svg class="cg-ico${cls ? ` ${cls}` : ''}" aria-hidden="true"><use href="#${id}"/></svg>`
}
