// 轴符号的可见性判定：这个 emoji 铺在近黑底上够不够亮？
//
// 为什么要有这个模块：卡面水印（列表卡 opacity .16，详情页 .18 的 emoji）、badge 里的
// 轴符号、悬停浮层的轴标题，铺的都是近黑底。本身不发光的深色 emoji（🕳️ 污秽 0.04、
// 🐾 兽群 0.05、🎩 戏法 0.07、🌑 暗夜 0.12）铺在近黑卡面（#1d2026，相对亮度 ≈0.014）
// 上就是一块暗斑，读者看不见——这正是「不眠者的暗夜轴图标不出现在背景里」的成因。
// 早先的修法是一刀切给**全部** 88 个符号加 brightness(0) invert(1)，代价是把每个
// emoji 都拍成单色剪影：🕸️ 的网眼、⛓️ 的链环、🎩 的帽带全塌成实心块，颜色也全丢
// ——修好了 12 个，弄坏了 88 个。
//
// 所以现在只对「确实暗到看不见」的那些加 .ax-lift（CSS 里 invert + hue-rotate：
// 提亮但保留相对明暗与大致色相，比压成纯白多留一层细节）。剩下约 86% 保持 emoji 原样。
//
// **为什么是现算而不是写死一张深色符号清单**：
//   ① 符号会换——2026-09 这批 emoji 刚整体换过一次，写死的清单当场作废；
//   ② 同一个码位在不同平台渲染出的深浅不同（Segoe UI Emoji / Apple Color Emoji /
//      Noto Color Emoji 各画各的），静态清单只能代表写它的人那台机器。现算量的是
//      **读者这台机器上正在渲染的那一版字形**，本来就该按机器判。
// 代价只有首次遇到某符号时的一次 64×64 canvas 绘制，结果按符号缓存，全库最多 88 次。

// 提亮门槛：字形不透明像素的平均相对亮度（0=纯黑，1=纯白）低于它就算「暗到看不见」。
// 实测 88 个符号是 0.041 → 0.727 的**连续分布**，没有天然分界，这条线是人为定的：
// 0.15 落在 🎵 颂歌(0.149) 与 🌀 扭曲规则(0.154) 之间，取到 12 个。调它会直接改变
// 「哪些符号看起来是原色、哪些被提亮」，两侧相邻的两个符号观感会明显不同
const LIFT_BELOW = 0.15;

// 测不准时一律**不改动**（返回 false）：水印是装饰，退回 emoji 原样最多是某个符号
// 偏暗，比因为一次 getImageData 失败给整页符号套错滤镜要好
const cache = new Map();

function measure(symbol) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d', { willReadFrequently: true });
  if (!x) return null;
  // 字号取 48 是为了让字形在 64×64 里铺满：太小会把抗锯齿的边缘像素也算进平均，
  // 而那些像素是半透明的，会把亮度拉向背景
  x.font = '48px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(symbol, 32, 34);
  let sr = 0, sg = 0, sb = 0, n = 0;
  let data;
  try {
    data = x.getImageData(0, 0, 64, 64).data;
  } catch {
    return null;              // 某些环境下 canvas 被策略禁用
  }
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] / 255 < 0.5) continue;   // 只算不透明像素：半透明边缘属于字形轮廓之外
    sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; n++;
  }
  if (!n) return null;        // 画布上什么都没画出来（字体缺失 / 该码位没有字形）
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  // WCAG 的相对亮度公式（sRGB 线性化后按人眼敏感度加权）。直接拿通道平均值是不行的：
  // 人眼对绿色远比对蓝色敏感，纯蓝 (0,0,255) 的均值 85 看着「中等亮」，实际亮度只有 0.07
  return 0.2126 * lin(sr / n) + 0.7152 * lin(sg / n) + 0.0722 * lin(sb / n);
}

// 该符号是否需要提亮。空符号、量不出来、或测出来不够暗，都返回 false
export function axisNeedsLift(symbol) {
  if (!symbol) return false;
  if (cache.has(symbol)) return cache.get(symbol);
  let lum = null;
  try {
    lum = measure(symbol);
  } catch {
    lum = null;
  }
  const lift = lum !== null && lum < LIFT_BELOW;
  cache.set(symbol, lift);
  return lift;
}
