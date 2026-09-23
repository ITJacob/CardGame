# 边框图 prompt 清单

产物，由 `python docs/tools/build_frame_prompts.py` 生成，**勿手改**；改了 JSON 里的边框 prompt 后重跑。

共 47 张：全局三档 + 22 途径 × epic/legendary。每条 = 共用约束 + 材质层，两者逗号拼接。
出图要求：3:4 竖版、手绘媒介（油画笔触与哑光颜料，非写实金属、非 3D 渲染）、纹样填满外围 1/3、
纯黑底、中心留黑。**框宽不用管**——站点用 CSS mask 裁成固定宽度（`--frame-band`），
出图只需保证纹样够宽。成品按标题文件名存本目录。
共用约束（47 条的开头完全相同，由 `manifest.artFrameFormat` 单点维护）：

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark
```

## frame-common.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a plain narrow band of muted silver-grey pigment, one fine hand-inked inner line, minimal and clean
```

## frame-uncommon.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a band of muted bronze-grey pigment with notched corners, a faint painted filigree, restrained ornament
```

## frame-rare.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a band of pale gold and steel-grey pigment with hand-painted corner flourishes, a fine painted filigree, elegant but understated
```

## frame-sleepless-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, cold silver starlight and a lone watchman's candle flame painted in deep indigo night, an intricate hand-painted filigree border
```

## frame-sleepless-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a crescent moon crown spilling silver starlight over a never-sleeping watcher's lantern, deep indigo and pale gold star-map filigree painted with faint lullaby wisps, an intricate hand-painted filigree border
```

## frame-arbiter-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, balanced black scales and codex tablets raised in ivory paint with bronze and deep crimson accents, an intricate hand-painted filigree border
```

## frame-arbiter-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a monumental judgment scales crested with a laurel-crowned codex, ivory marble painted in soft grey, bronze filigree edged in deep crimson, divine overhead light motif, an intricate hand-painted filigree border
```

## frame-thief-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a perched raven and interlocking brass gears drawn in dulled gold paint over soot-black fog, sly gaslight glints, an intricate hand-painted filigree border
```

## frame-thief-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a crowned raven clutching a spinning golden coin atop painted clockwork gears and foggy gas-lamp flames, dulled brass and soot-black palette with rich gold paint, an intricate hand-painted filigree border
```

## frame-assassin-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, shattered mirror shards edged in black witchfire, crimson thorned vines winding through obsidian-dark ornament, an intricate hand-painted filigree border
```

## frame-assassin-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a crown of shattered mirror shards blazing with black witchfire, crimson thorned vines painted in dark gold coiling around obsidian-dark pillars, ruby-red painted inlays, an intricate hand-painted filigree border
```

## frame-prisoner-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, heavy rust-brown chains with blood-red moon glow, deep claw gouges scratched into rust-red painted ironwork, an intricate hand-painted filigree border
```

## frame-prisoner-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a swollen blood moon crowning the top, gold-painted chains fused with rust-red iron, monstrous claw marks scratched in dulled gold across blackened iron, an intricate hand-painted filigree border
```

## frame-apprentice-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, floating ethereal doorways adrift in deep cobalt cosmic mist, silver star-trails spiraling along the edge, pale gold accents, an intricate hand-painted filigree border
```

## frame-apprentice-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a radiant celestial gateway crowning the top, luminous doorways of gold pigment adrift in cobalt nebula mist, constellations and silver star-trails woven into gold-painted filigree, an intricate hand-painted filigree border
```

## frame-lawyer-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, ink-drawn black-gold legal codex stripes, warped asymmetric deco geometry edged in dulled champagne-gold, a quill pen motif at the crown, an intricate hand-painted filigree border
```

## frame-lawyer-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, towering black-gold codex pillars lettered with burning legal scripture, warped asymmetric deco geometry crowned by a golden quill nib dripping ink, dulled champagne-gold filigree, an intricate hand-painted filigree border
```

## frame-monster-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a coiled ouroboros serpent biting its own tail and tumbling bone dice, interwoven threads of fate spun from mercury-silver pigment, deep violet and dulled silver palette, an intricate hand-painted filigree border
```

## frame-monster-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a crowned ouroboros serpent of dulled gold encircling a wheel of fate strung with silver threads, floating mercury-silver dice caught mid-tumble, deep violet and dulled silver palette with gold accents, an intricate hand-painted filigree border
```

## frame-seer-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, swirling gray mist and spectral silver threadwork woven with scattered tarot motifs, muted gray-blue palette with antique gold accents, an intricate hand-painted filigree border
```

## frame-seer-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, an all-seeing third eye crowned at the apex, gray mist condensing into marionette strings and a golden tarot wheel, antique gold and silver-blue palette, an intricate hand-painted filigree border with raised painted glyphs
```

## frame-warrior-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a colossal two-handed greatsword wreathed in first dawn light, battered silver-grey war armor scarred in paint, bronze and dawn-orange palette with fading gold light, an intricate hand-painted filigree border
```

## frame-warrior-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a legendary colossal greatsword crowned with a rising sun crest, gold-painted full plate armor bearing heroic battle scars, banners of dawn light in radiant gold paint, bronze and dawn-orange palette, an intricate hand-painted filigree border
```

## frame-corpse_collector-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a pale jade soul lantern glowing cold over drifting spirit mist, skeletal hands reaching from a dark underworld river, pallid jade and bone-white palette, an intricate hand-painted filigree border
```

## frame-corpse_collector-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a monumental pallid jade lantern of the dead crowned with a bone-white funerary crest, rivers of the underworld winding through gold-painted grave filigree, legions of spirit wisps rising in cold lantern glow, pallid jade and bone-white palette with muted gold accents, an intricate hand-painted filigree border
```

## frame-chanter-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a radiant sun halo ringed with glowing choir runes, drifting white dove feathers and shafts of incense light, radiant white-gold and amber palette, an intricate hand-painted filigree border
```

## frame-chanter-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a majestic radiant sun disk crowned above an altar of golden choir runes, white dove wings spread in gold-painted filigree, descending shafts of divine choir light, radiant white-gold and amber palette with ornate painted gold ornament, an intricate hand-painted filigree border
```

## frame-sailor-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, towering cresting waves wrapped in wind-torn spray, crackling electric-gold lightning tendrils, braided ship rope and heavy anchor chain motifs, an intricate hand-painted filigree border
```

## frame-sailor-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a colossal crowned wave swallowing the sea horizon, storm-split electric-gold lightning crown, gold-painted rope-and-chain lifelines fused into pure gold filigree, deep sea-green pigment with salt-white flecks, an intricate hand-painted filigree border
```

## frame-hunter-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, ember-orange campfire flames licking the edges, fletched arrow shafts and feather motifs entwined with beast-track and wild vine ornament, an intricate hand-painted filigree border
```

## frame-hunter-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a blazing golden bonfire crowned by a great beast skull, a gold-painted longbow and fanned trophy feathers rising to a crown apex, deep forest-green painted vines studded with ember-gold beast-eye gems, an intricate hand-painted filigree border
```

## frame-supplicant-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a ring of guttering altar candles with dripping wax, writhing crimson flesh tendrils and abyssal runes painted in bone-white relief, an intricate hand-painted filigree border
```

## frame-supplicant-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a blood-red altar crown of gold-painted candle spires, obsidian-black tentacles sheathed in bone-white paint, abyssal sigils blazing in deep crimson pigment, a dark god's watching silhouette fused into the crown apex, an intricate hand-painted filigree border
```

## frame-pryer-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, lidless spectral watching eyes set into the corners, glowing arcane rune circles and keyhole motifs drawn in cold starlight violet, ink-black brush texture, an intricate hand-painted filigree border
```

## frame-pryer-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a radiant gold-painted all-seeing eye blazing at the crown apex, constellations of gold-painted runes orbiting silver star-thread, violet-black ink washes with spectral glow bleeding through gold filigree, an intricate hand-painted filigree border
```

## frame-criminal-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, charred iron bars wrapped in drifting embers and ash, scorched umber filigree with bruised violet undertones and ember-orange glints, urban smoke haze, an intricate hand-painted filigree border
```

## frame-criminal-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, poured gold pigment fused with charred iron bars, a crown of smoldering embers burning at the apex, bruised violet smoke curling through ember-orange gold-painted filigree, charred umber ornament, an intricate hand-painted filigree border
```

## frame-planter-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, tangled ivy vines and wheat sheaves intertwined along the edges, pale moon-silver crescents over deep green and loam-brown tones, an intricate hand-painted filigree border
```

## frame-planter-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a full lunar phase wheel crowning the apex in silver-gold pigment, gold-painted wheat sheaves and creeping vines woven through the edge, deep green and loam-brown pigment with moonlit glow, an intricate hand-painted filigree border
```

## frame-apothecary-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, antique apothecary bottles and curling dried herbs climbing the sides, a looming blood-red moon motif, deep crimson and herbal green palette with warm candlelight glints, an intricate hand-painted filigree border
```

## frame-apothecary-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, gold-painted antique apothecary bottles in crimson glass, crowned by a radiant blood moon finial at the apex, golden herbs and alchemical ornaments woven into the edge, candlelit gold over deep green and crimson, an intricate hand-painted filigree border
```

## frame-spectator-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, heavy draped theater curtains parting at the sides, a single watchful eye motif above, teal and ivory tones with faint rose-gold haze and fine painted grain, an intricate hand-painted filigree border
```

## frame-spectator-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, gold-painted theater curtains drawn back beneath a radiant third-eye crown at the apex, fine gold-painted dragon scales lining the inner edge, translucent dream veils drifting through teal and ivory with rose-gold haze, an intricate hand-painted filigree border
```

## frame-savant-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, brass-toned gearwork and steam pistons in muted paint, blueprint grid lines, slate-blue engineering schematics, an intricate hand-painted filigree border
```

## frame-savant-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a crowned golden astrolabe of interlocking brass-toned gears, luminous blueprint star charts, steam forge accents in muted paint, anointed apex of invention and law, an intricate hand-painted filigree border
```

## frame-reader-epic.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, floating illuminated manuscript pages, a candlelit library tower, quill and star chart motifs in gold-leaf linework, an intricate hand-painted filigree border
```

## frame-reader-legendary.webp

```
vertical 3:4 hand-painted ornamental card border, oil-painted illustration with visible brushstrokes and flat opaque pigment, canvas grain, no metallic sheen, no brushed metal texture, no photorealism, no 3D render, the painted ornament fills the outer third of the image on all four sides and leaves a clean rectangular opening in the center, solid pure black background, no text, no watermark, a towering radiant library spire crowned with an all-seeing eye, swirling levitating tomes and celestial star charts, a quill of prophecy with royal blue and gold-leaf illumination, pinnacle of omniscient foresight, an intricate hand-painted filigree border
```

