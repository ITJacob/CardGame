# 边框图 prompt 清单

产物，由 `python docs/tools/build_frame_prompts.py` 生成，**勿手改**；改了 JSON 里的边框 prompt 后重跑。

共 47 张：全局三档 + 22 途径 × epic/legendary。每条 = 共用约束 + 主题层，两者逗号拼接。
出图要求：**正方形无缝纹样**（tileable——不是画一个框；prompt 里已显式否定
picture frame / bezel / border，模型一见「框」就会画成装裱画框）、卡游 UI 素材画法
（干净图形、锐利边缘，非照片质感、非 3D 渲染）、纯黑底。
**框体与框宽完全不归出图管**——站点用 CSS 画框（`.cs-bezel`）并把纹样 mask 成四边等宽带，
出图只要做到「纹样铺满、无缝、中心纯黑」即可。成品按标题文件名存本目录。
共用约束（47 条的开头完全相同，由 `manifest.artFrameFormat` 单点维护）：

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark
```

## frame-common.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a minimal running pattern of muted silver-grey, one fine line, plain and unadorned
```

## frame-uncommon.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a restrained running pattern of muted bronze-grey, small notched motifs, a faint filigree
```

## frame-rare.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a fine running pattern of pale gold and steel-grey, delicate flourishes, elegant but understated
```

## frame-sleepless-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, cold silver starlight and a lone watchman's candle flame painted in deep indigo night, intricate repeating filigree ornament
```

## frame-sleepless-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a crescent moon crown spilling silver starlight over a never-sleeping watcher's lantern, deep indigo and pale gold star-map filigree painted with faint lullaby wisps, intricate repeating filigree ornament
```

## frame-arbiter-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, balanced black scales and codex tablets raised in ivory paint with bronze and deep crimson accents, intricate repeating filigree ornament
```

## frame-arbiter-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a monumental judgment scales crested with a laurel-crowned codex, ivory marble painted in soft grey, bronze filigree edged in deep crimson, divine overhead light motif, intricate repeating filigree ornament
```

## frame-thief-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a perched raven and interlocking brass gears drawn in dulled gold paint over soot-black fog, sly gaslight glints, intricate repeating filigree ornament
```

## frame-thief-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a crowned raven clutching a spinning golden coin atop painted clockwork gears and foggy gas-lamp flames, dulled brass and soot-black palette with rich gold paint, intricate repeating filigree ornament
```

## frame-assassin-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, shattered mirror shards edged in black witchfire, crimson thorned vines winding through obsidian-dark ornament, intricate repeating filigree ornament
```

## frame-assassin-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a crown of shattered mirror shards blazing with black witchfire, crimson thorned vines painted in dark gold coiling around obsidian-dark pillars, ruby-red painted inlays, intricate repeating filigree ornament
```

## frame-prisoner-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, heavy rust-brown chains with blood-red moon glow, deep claw gouges scratched into rust-red painted ironwork, intricate repeating filigree ornament
```

## frame-prisoner-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a swollen blood moon, gold-painted chains fused with rust-red iron, monstrous claw marks scratched in dulled gold across blackened iron, intricate repeating filigree ornament
```

## frame-apprentice-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, floating ethereal doorways adrift in deep cobalt cosmic mist, silver star-trails, pale gold accents, intricate repeating filigree ornament
```

## frame-apprentice-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a radiant celestial gateway, luminous doorways of gold pigment adrift in cobalt nebula mist, constellations and silver star-trails woven into gold-painted filigree, intricate repeating filigree ornament
```

## frame-lawyer-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, ink-drawn black-gold legal codex stripes, warped asymmetric deco geometry edged in dulled champagne-gold, a quill pen motif, intricate repeating filigree ornament
```

## frame-lawyer-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, towering black-gold codex pillars lettered with burning legal scripture, warped asymmetric deco geometry crowned by a golden quill nib dripping ink, dulled champagne-gold filigree, intricate repeating filigree ornament
```

## frame-monster-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a coiled ouroboros serpent biting its own tail and tumbling bone dice, interwoven threads of fate spun from mercury-silver pigment, deep violet and dulled silver palette, intricate repeating filigree ornament
```

## frame-monster-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a crowned ouroboros serpent of dulled gold encircling a wheel of fate strung with silver threads, floating mercury-silver dice caught mid-tumble, deep violet and dulled silver palette with gold accents, intricate repeating filigree ornament
```

## frame-seer-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, swirling gray mist and spectral silver threadwork woven with scattered tarot motifs, muted gray-blue palette with antique gold accents, intricate repeating filigree ornament
```

## frame-seer-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, an all-seeing third eye, gray mist condensing into marionette strings and a golden tarot wheel, antique gold and silver-blue palette, intricate repeating filigree ornament with raised glyphs
```

## frame-warrior-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a colossal two-handed greatsword wreathed in first dawn light, battered silver-grey war armor scarred in paint, bronze and dawn-orange palette with fading gold light, intricate repeating filigree ornament
```

## frame-warrior-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a legendary colossal greatsword with a rising sun crest, gold-painted full plate armor bearing heroic battle scars, banners of dawn light in radiant gold paint, bronze and dawn-orange palette, intricate repeating filigree ornament
```

## frame-corpse_collector-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a pale jade soul lantern glowing cold over drifting spirit mist, skeletal hands reaching from a dark underworld river, pallid jade and bone-white palette, intricate repeating filigree ornament
```

## frame-corpse_collector-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a monumental pallid jade lantern of the dead with a bone-white funerary crest, rivers of the underworld winding through gold-painted grave filigree, legions of spirit wisps rising in cold lantern glow, pallid jade and bone-white palette with muted gold accents, intricate repeating filigree ornament
```

## frame-chanter-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a radiant sun halo ringed with glowing choir runes, drifting white dove feathers and shafts of incense light, radiant white-gold and amber palette, intricate repeating filigree ornament
```

## frame-chanter-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a majestic radiant sun disk above an altar of golden choir runes, white dove wings spread in gold-painted filigree, descending shafts of divine choir light, radiant white-gold and amber palette with ornate painted gold ornament, intricate repeating filigree ornament
```

## frame-sailor-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, towering cresting waves wrapped in wind-torn spray, crackling electric-gold lightning tendrils, braided ship rope and heavy anchor chain motifs, intricate repeating filigree ornament
```

## frame-sailor-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a colossal crowned wave swallowing the sea horizon, storm-split electric-gold lightning crown, gold-painted rope-and-chain lifelines, deep sea-green pigment with salt-white flecks, intricate repeating filigree ornament
```

## frame-hunter-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, ember-orange campfire flames, fletched arrow shafts and feather motifs entwined with beast-track and wild vine ornament, intricate repeating filigree ornament
```

## frame-hunter-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a blazing golden bonfire with a great beast skull, a gold-painted longbow and fanned trophy feathers, deep forest-green painted vines studded with ember-gold beast-eye gems, intricate repeating filigree ornament
```

## frame-supplicant-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a ring of guttering altar candles with dripping wax, writhing crimson flesh tendrils and abyssal runes painted in bone-white relief, intricate repeating filigree ornament
```

## frame-supplicant-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a blood-red altar crown of gold-painted candle spires, obsidian-black tentacles sheathed in bone-white paint, abyssal sigils blazing in deep crimson pigment, a dark god's watching silhouette, intricate repeating filigree ornament
```

## frame-pryer-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, lidless spectral watching eyes, glowing arcane rune circles and keyhole motifs drawn in cold starlight violet, ink-black brush texture, intricate repeating filigree ornament
```

## frame-pryer-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a radiant gold-painted all-seeing eye, constellations of gold-painted runes orbiting silver star-thread, violet-black ink washes with spectral glow bleeding through gold filigree, intricate repeating filigree ornament
```

## frame-criminal-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, charred iron bars wrapped in drifting embers and ash, scorched umber filigree with bruised violet undertones and ember-orange glints, urban smoke haze, intricate repeating filigree ornament
```

## frame-criminal-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, poured gold pigment fused with charred iron bars, a crown of smoldering embers, bruised violet smoke curling through ember-orange gold-painted filigree, charred umber ornament, intricate repeating filigree ornament
```

## frame-planter-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, tangled ivy vines and wheat sheaves intertwined, pale moon-silver crescents over deep green and loam-brown tones, intricate repeating filigree ornament
```

## frame-planter-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a full lunar phase wheel in silver-gold pigment, gold-painted wheat sheaves and creeping vines woven together, deep green and loam-brown pigment with moonlit glow, intricate repeating filigree ornament
```

## frame-apothecary-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, antique apothecary bottles and curling dried herbs, a looming blood-red moon motif, deep crimson and herbal green palette with warm candlelight glints, intricate repeating filigree ornament
```

## frame-apothecary-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, gold-painted antique apothecary bottles in crimson glass, a radiant blood moon finial, golden herbs and alchemical ornaments woven together, candlelit gold over deep green and crimson, intricate repeating filigree ornament
```

## frame-spectator-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, heavy draped theater curtains, a single watchful eye motif above, teal and ivory tones with faint rose-gold haze and fine painted grain, intricate repeating filigree ornament
```

## frame-spectator-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, gold-painted theater curtains, a radiant third-eye crown, fine gold-painted dragon scales, translucent dream veils drifting through teal and ivory with rose-gold haze, intricate repeating filigree ornament
```

## frame-savant-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, brass-toned gearwork and steam pistons in muted paint, blueprint grid lines, slate-blue engineering schematics, intricate repeating filigree ornament
```

## frame-savant-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a crowned golden astrolabe of interlocking brass-toned gears, luminous blueprint star charts, steam forge accents in muted paint, emblems of invention and law, intricate repeating filigree ornament
```

## frame-reader-epic.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, floating illuminated manuscript pages, a candlelit library tower, quill and star chart motifs in gold-leaf linework, intricate repeating filigree ornament
```

## frame-reader-legendary.webp

```
square seamless ornament texture, flat 2D game UI asset, stylized hand-painted filigree with clean graphic shapes and crisp edges, no photographic texture, no 3D render, no picture frame, no bezel, no border, tileable repeating pattern, solid pure black background, no text, no watermark, a towering radiant library spire with an all-seeing eye, swirling levitating tomes and celestial star charts, a quill of prophecy with royal blue and gold-leaf illumination, intricate repeating filigree ornament
```

