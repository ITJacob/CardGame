# 边框图 prompt 清单

产物，由 `python docs/tools/build_frame_prompts.py` 生成，**勿手改**；改了 JSON 里的边框 prompt 后重跑。

共 47 张：全局三档 + 22 途径 × epic/legendary。每条 = 共用约束（黑底框构图模板）+ 主题层，逗号拼接。
**直接出框（非纹样）**：每条 prompt 让 AI 出「一张完整的黑底卡牌边框图」，在豆包 / 即梦 / Midjourney / Stable Diffusion 等平台直接批量出图即可。
- 推荐竖图比例（如 1024x1536）；出图须为**纯黑底、无任何水印 / 签名 / 平台 logo**，中心保持纯黑。
- 框线应**贴近卡边**（margin 小）；若平台默认留白多，出图后裁掉外圈留白再叠。
- 出图后以 `mix-blend-mode: screen` 叠到全出血卡面复用——黑底被 screen 吃透透出卡面、框线提亮叠加，一张框可复用于同档所有卡。
材质分层（数据源已定，平台无需另调）：前三档为非金递进——普通=冷钢银单线 / 精良=青铜绿锈双线+连续角托 / 稀有=暖金双线+小符文；职业 epic/legendary 由各主题层自带金线（传说档金线最适配）。

共用约束（47 条的开头完全相同，由 `manifest.artFrameFormat` 单点维护）：

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo
```

## frame-common.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, cool steel-silver tone, one single fine line, minimal small geometric corner ticks, quiet and understated, no emblems
```

## frame-uncommon.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, dark bronze with subtle green patina tone, two thin lines, small neat continuous geometric bracket corner ornaments that connect to the lines, no emblems
```

## frame-rare.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, warm antique gold tone, two thin lines, small neat rune-like corner accents, no emblems, elegant but restrained
```

## frame-sleepless-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as small watchman lanterns, top emblem a crescent moon, bottom emblem a star-map, cold silver starlight over deep indigo night, lone candle flame accents
```

## frame-sleepless-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as crowned lanterns spilling silver starlight, top emblem a crescent moon crown, bottom emblem a never-sleeping watcher's star-map, deep indigo and pale gold, faint lullaby wisps
```

## frame-arbiter-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as balanced scales, top emblem a codex tablet, bottom emblem a law-gavel, black scales and codex in ivory with bronze and deep crimson accents
```

## frame-arbiter-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as monumental judgment scales, top emblem a laurel-crowned codex, bottom emblem divine light rays, ivory marble in soft grey, bronze filigree edged in deep crimson
```

## frame-thief-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as perched ravens clutching brass gears, top emblem a gas-lamp flame, bottom emblem interlocking gearwork, dulled gold over soot-black fog, sly gaslight glints
```

## frame-thief-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as crowned ravens clutching spinning golden coins, top emblem a gas-lamp crown, bottom emblem clockwork gears, dulled brass and soot-black with rich gold
```

## frame-assassin-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as shattered mirror shards, top emblem black witchfire, bottom emblem crimson thorned vine, obsidian-dark with crimson accents
```

## frame-assassin-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as a crown of shattered mirror shards blazing with black witchfire, top emblem a ruby inlay, bottom emblem coiling crimson thorned vine, dark gold on obsidian pillars
```

## frame-prisoner-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as rust-brown chains, top emblem a blood-red moon, bottom emblem a claw gouge, deep claw scratches in rust-red ironwork
```

## frame-prisoner-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as gold-painted chains fused with rust-red iron, top emblem a swollen blood moon, bottom emblem monstrous claw marks in dulled gold, blackened iron
```

## frame-apprentice-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as floating ethereal doorways, top emblem a celestial gateway, bottom emblem silver star-trails, deep cobalt cosmic mist, pale gold accents
```

## frame-apprentice-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as radiant doorways of gold, top emblem a celestial gateway, bottom emblem constellations, cobalt nebula mist, gold-painted filigree
```

## frame-lawyer-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as ink-drawn legal codex stripes, top emblem a quill pen, bottom emblem warped deco geometry, dulled champagne-gold, asymmetric
```

## frame-lawyer-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as towering black-gold codex pillars, top emblem a golden quill nib dripping ink, bottom emblem burning legal scripture, dulled champagne-gold
```

## frame-monster-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as coiled ouroboros serpents, top emblem tumbling bone dice, bottom emblem a wheel of fate, mercury-silver threads, deep violet and dulled silver
```

## frame-monster-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as crowned ouroboros serpents of dulled gold, top emblem a wheel of fate, bottom emblem silver dice, deep violet and dulled silver with gold accents
```

## frame-seer-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as tarot cards, top emblem an all-seeing third eye, bottom emblem a tarot wheel, gray mist with antique gold, silver threadwork
```

## frame-seer-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as a golden tarot wheel, top emblem an all-seeing third eye, bottom emblem marionette strings, antique gold and silver-blue, raised glyphs
```

## frame-warrior-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as greatsword blades, top emblem a rising sun, bottom emblem battle-scarred armor, battered silver-grey, bronze and dawn-orange
```

## frame-warrior-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as a colossal greatsword with a rising sun crest, top emblem a radiant sun disk, bottom emblem heroic banners, gold-painted full plate, bronze and dawn-orange
```

## frame-corpse_collector-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as pale jade soul lanterns, top emblem an underworld river, bottom emblem skeletal hands, pallid jade and bone-white, cold spirit mist
```

## frame-corpse_collector-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as monumental pallid jade lanterns, top emblem a funerary crest, bottom emblem rivers of the underworld, bone-white with muted gold, spirit wisps
```

## frame-chanter-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as radiant sun halos, top emblem choir runes, bottom emblem a white dove feather, radiant white-gold and amber
```

## frame-chanter-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as a majestic sun disk, top emblem an altar of golden choir runes, bottom emblem dove wings, descending divine light, radiant white-gold and amber
```

## frame-sailor-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as cresting waves, top emblem an anchor, bottom emblem electric-gold lightning, wind-torn spray, braided rope, deep sea-green with salt-white
```

## frame-sailor-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as a colossal crowned wave, top emblem a storm lightning crown, bottom emblem rope-and-chain lifelines, deep sea-green with salt-white flecks
```

## frame-hunter-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as fletched arrow shafts, top emblem a great beast skull, bottom emblem a campfire, ember-orange flames, beast-track and wild vine
```

## frame-hunter-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as a gold-painted longbow, top emblem a great beast skull, bottom emblem a blazing bonfire, deep forest-green vines with ember-gold beast-eye gems
```

## frame-supplicant-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as guttering altar candles, top emblem an altar crown, bottom emblem crimson flesh tendrils, abyssal runes in bone-white, dripping wax
```

## frame-supplicant-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as a blood-red altar crown of gold candle spires, top emblem a dark god's silhouette, bottom emblem obsidian tentacles, abyssal sigils in deep crimson
```

## frame-pryer-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as lidless spectral watching eyes, top emblem a glowing rune circle, bottom emblem a keyhole, cold starlight violet, ink-black brush texture
```

## frame-pryer-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as a radiant gold all-seeing eye, top emblem constellations of runes, bottom emblem silver star-thread, violet-black ink washes with spectral glow
```

## frame-criminal-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as charred iron bars, top emblem a crown of smoldering embers, bottom emblem urban smoke haze, scorched umber with bruised violet, ember-orange glints
```

## frame-criminal-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as poured gold fused with charred iron bars, top emblem a crown of smoldering embers, bottom emblem bruised violet smoke, ember-orange gold filigree
```

## frame-planter-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as tangled ivy vines, top emblem a pale moon crescent, bottom emblem wheat sheaves, deep green and loam-brown, moon-silver
```

## frame-planter-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as a full lunar phase wheel, top emblem gold wheat sheaves, bottom emblem creeping vines, deep green and loam-brown with moonlit glow
```

## frame-apothecary-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as antique apothecary bottles, top emblem a blood-red moon, bottom emblem curling dried herbs, deep crimson and herbal green with candlelight glints
```

## frame-apothecary-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as gold-painted apothecary bottles in crimson glass, top emblem a radiant blood moon finial, bottom emblem golden herbs, candlelit gold over deep green
```

## frame-spectator-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as draped theater curtains, top emblem a watchful eye, bottom emblem fine dragon scales, teal and ivory with rose-gold haze
```

## frame-spectator-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as gold-painted theater curtains, top emblem a third-eye crown, bottom emblem dream veils, teal and ivory with rose-gold haze
```

## frame-savant-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as brass gearwork, top emblem a blueprint star chart, bottom emblem steam pistons, slate-blue schematics, muted paint
```

## frame-savant-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as a crowned golden astrolabe of brass gears, top emblem luminous blueprint charts, bottom emblem emblems of invention, muted paint, law sigils
```

## frame-reader-epic.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as floating illuminated manuscript pages, top emblem an all-seeing eye, bottom emblem a star chart, quill linework in gold-leaf, candlelit library
```

## frame-reader-legendary.png

```
a complete ornamental border frame for a vertical trading card, solid pure black background, ornamental lines tracing the full rectangle edge with minimal margin close to the edge, small restrained corner ornaments that connect fluidly to the border lines (no detached fragments), all ornament strictly confined to a narrow band along the edges with no ornament spreading inward, the entire central area empty pure black, classical occultist mystic filigree in the Victorian tarot and Lord of the Mysteries style, hand-painted oil-painting brushstrokes with subtle metallic sheen, slightly uneven hand-drawn lines, dark luxury mood, no characters, no scenery, no text, no watermark, no signature, no logo, four corner ornaments as a towering library spire, top emblem an all-seeing eye, bottom emblem levitating tomes, a quill of prophecy in royal blue and gold-leaf
```

