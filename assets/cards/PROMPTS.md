# 技能卡画面 prompt 清单

产物，由 `python tools/build_card_prompts.py` 生成，**勿手改**；改了 JSON 里的美术字段后重跑。

共 832 张（22 途径）。每条 = `manifest.artFormat`（全局画幅）+ 途径 `artStyle` + 卡级 `art.subject/elements/mood`，
逗号拼接为**自包含完整 prompt**，复制到出图平台即可；拼装口径与 site 卡详情页「复制画面 prompt」一致。
出图后命名 `<cardId>.png` 放进 `source/cards/`，跑 `python tools/build_art_variants.py` 出三档派生。

全局画幅约束（每条 prompt 的开头完全相同，由 `manifest.artFormat` 单点维护）：

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts
```

# 途径：不眠者（sleepless，34 卡）

## skill_sleepless_s9_sleepless_body.png

不眠之躯 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a watchman resting upright in a moonlit chair, eyes half-open, moonlit windowsill, shallow doze, cold candle stub, restless, watchful
```

## skill_sleepless_s9_night_vision.png

夜视 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a night watchman's eyes glinting silver in pitch black, dark silhouettes, glinting pupils, fading stealthy shadow, alert, piercing
```

## skill_sleepless_s9_deepening_night.png

夜色渐浓 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, shadows thickening and climbing up a lone standing figure, layered twilight, climbing shadow tendrils, dimming horizon, deepening, quiet
```

## skill_sleepless_s8_midnight_prowess.png

午夜武艺 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a fighter shadow-boxing under a single street lamp at midnight, midnight street lamp, bare fists, climbing wall, disciplined, fluid
```

## skill_sleepless_s8_dazing_verse.png

午夜诗篇·恍惚 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a poet reciting under moonlight while a listener's thoughts scatter, half-open book of verse, drifting thought wisps, slack grip, drowsy, disjointed
```

## skill_sleepless_s8_lullaby.png

安眠谣 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a hummed lullaby settling over a resting companion, gentle musical haze, eased breathing, dimming candle, soothing, tender
```

## skill_sleepless_s8_dread_verse.png

惊惧诗 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a whispered verse in the dark, a trembling hand on a weapon, shadowed lips, trembling sword grip, contracted pupils, chilling, tense
```

## skill_sleepless_s7_dream_pull.png

入梦 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a figure pulling a struggling enemy down into a dream, melting floor of stars, outstretched grasping hand, spiraling dream haze, inescapable, eerie
```

## skill_sleepless_s7_dream_shaping.png

塑梦 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, hands reshaping a dreamscape while hidden whispers leak out, malleable dream scenery, floating secret sigils, gnawing shadow shapes, manipulative, surreal
```

## skill_sleepless_s7_dream_walker.png

梦境行者 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a walker stepping through an endless corridor of sleeping faces, corridor of sleepers, weightless stride, doors of starlight, weightless, uncanny
```

## skill_sleepless_s6_forced_dream.png

强制入梦 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, drowsiness spreading over a whole field of standing figures, drooping soldiers, heavy-lidded eyes, descending dusk blanket, overwhelming, heavy
```

## skill_sleepless_s6_requiem.png

安魂 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a solemn chant calming a restless spirit into stillness, fading ghostly glow, softened clenched fists, dimming ember eyes, solemn, merciful
```

## skill_sleepless_s6_spirit_eye.png

通灵之眼 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a seer's eyes revealing spirits hidden in plain air, translucent wandering spirits, clearly outlined forms, pale piercing gaze, revelatory, calm
```

## skill_sleepless_s5_spirit_fang.png

灵之牙 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a small spectral beast-spirit trailing pale cold light as it streaks across a dark battlefield toward a recoiling enemy, motion-blur streak of cold light, enemy silhouette thrown backward, scattered glowing motes, fierce, sudden
```

## skill_sleepless_s5_split_mind.png

一心多用 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a figure with strands of will each tethered to a spirit, split will threads, orbiting spirit wisps, steady half-lidded eyes, divided, controlled
```

## skill_sleepless_s5_spirit_swarm.png

灵群 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a swarm of thin glowing spirit-forms sweeping over a dark battlefield like a wave of pale embers, many cold-light wisps, enemies bracing against the swarm, drifting pale motes, swarming, restless
```

## skill_sleepless_s4_nightwatch_nature.png

守夜人体质 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a night watchman growing sharper as full darkness falls, fully fallen night, straightened posture, brightened eyes, awakened, honed
```

## skill_sleepless_s4_night_realm.png

黑夜领域 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, pure darkness flooding outward from a watchman's feet, expanding black tide, blunted blades in shadow, sharpened spirit claws, dominant, suffocating
```

## skill_sleepless_s4_hair_snare.png

发丝缠绕 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, long hair silently coiling around a struggling enemy's limbs, spreading hair strands, bound flailing limbs, tightening coils, constricting, silent
```

## skill_sleepless_s4_misfortune.png

厄运 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a small patch of night clinging to a staggering enemy, clinging dark patch, sinking heavy steps, waiting overhead blow, ominous, looming
```

## skill_sleepless_s3_dark_sword.png

黑暗之剑 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a bone-white longsword emerging from living darkness, bone-white blade, light-swallowing black, dissolving wound edge, soulless, absolute
```

## skill_sleepless_s3_fear_aura.png

恐惧灵光 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, an invisible aura making weak figures freeze and look away, repelled onlookers, stilled heartbeat, unseen pressure wave, crushing, wordless
```

## skill_sleepless_s3_nightmare_world.png

梦魇世界 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a dream-world city dissolving as sleepers walk inside, melting dream city, sleepwalking figures, thickening dream haze, suffocating, inescapable
```

## skill_sleepless_s2_concealment.png

隐秘化 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, an ally fading out of sight, senses passing through empty air, dissolving outline, unfocused searching gaze, standing yet absent, vanished, intangible
```

## skill_sleepless_s2_hidden_land.png

隐秘之地 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, an enemy sealed inside a hidden corner beyond the world, sealed isolated corner, unreachable gap, fading presence, severed, absolute
```

## skill_sleepless_s2_unveiling.png

掀幕 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a hand lifting a dark curtain to expose what hides beneath, lifting black veil, exposed hidden figures, harsh revealing glare, exposing, merciless
```

## skill_sleepless_s2_traceless_shadow.png

无迹之影 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a struck figure dissolving back into the dark without a trace, dissolving silhouette, empty footprint space, re-forming shadow, elusive, untouchable
```

## skill_sleepless_s1_calamity.png

厄难 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, misfortune and disaster stalking every enemy in the dark, stalking shadow omens, stumbling backpedaling foes, cold starless sky, doomed, inevitable
```

## skill_sleepless_s1_dark_vassal.png

黑暗仆人·不灭 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a fallen servant rising again out of the night, re-forming body from darkness, returning silhouette, unextinguished night, undying, relentless
```

## skill_sleepless_s1_spirit_commander.png

灵之统帅 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, a commander raising a hand as spirits bow their heads, bowing spirit host, raised commanding hand, turning hollow eyes, commanding, absolute
```

## skill_sleepless_s0_eternal_slumber.png

永眠·消融 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, an enemy sinking into an endless dreamless sleep, bottomless dream waters, dissolving dark edge, unwakeable stillness, final, boundless
```

## skill_sleepless_s0_secrecy_authority.png

隐秘权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, every trace vanishing wherever a figure and its spirits pass, erased footprints, veiled spirit retinue, swallowed silhouettes, untouchable, hidden
```

## skill_sleepless_s0_fear_authority.png

恐惧权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, trembling prey whose fear feeds the predator's next blow, trembling kneeling foes, fear drawn as smoke, feeding shadow blade, feeding, predatory
```

## skill_sleepless_s0_spirit_authority.png

灵体灵性权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era nocturne oil painting, deep indigo and cold silver starlight palette, lone vigil composition bathed in low-key moonlight, hushed grainy texture, anatomically correct human figures with exactly two arms and two hands, no extra or deformed limbs, all spirits kneeling beneath an unassailable will, kneeling spirit legion, unshakable stance, bowed spectral heads, sovereign, untouchable
```

# 途径：仲裁人（arbiter，40 卡）

## skill_arbiter_s9_convincing_authority.png

信服与权威 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a robed arbiter standing motionless while armed foes falter and lower their blades, weighted black scales, gavel on a dais, blades drooping mid-swing, austere, commanding, cold
```

## skill_arbiter_s9_submit.png

屈服 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a single cold glance from an arbiter turning an enemy's blade aside mid-swing, deflected blade, piercing gaze, empty air beside the arbiter, stifling, dominant, tense
```

## skill_arbiter_s9_martial_arts.png

格斗术 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, an arbiter landing a precise straight punch that staggers a towering brute, clenched fist, staggered brute, cracked floor tiles, brutal, decisive, kinetic
```

## skill_arbiter_s8_photographic_memory.png

过目不忘 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a constable's desk covered with suspect portraits, each face pinned and catalogued, pinned portraits, stacked case files, brass magnifying lens, meticulous, cold, watchful
```

## skill_arbiter_s8_jurisdiction.png

辖区 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, an arbiter at the center of a district where streets and lampposts stand at attention, empty city block, glowing ward boundary, bowing lampposts, sovereign, oppressive, still
```

## skill_arbiter_s8_anomaly_sense.png

察觉异常 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, an arbiter pausing in a quiet street, catching a rotten scent no one else smells, shifting shadows, half-hidden doorway, flared nostrils, alert, uncanny, predatory
```

## skill_arbiter_s7_mind_pierce.png

精神刺穿 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a needle of pale light piercing straight through armor into a glowing soul, luminous needle, pierced spectral figure, cracked helm, invasive, merciless, clinical
```

## skill_arbiter_s7_whip_of_pain.png

痛苦之鞭 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a barbed whip striking a spirit body, unmarked flesh writhing in agony, coiled whip, writhing spirit, spilled confession cards, cruel, raw, suffocating
```

## skill_arbiter_s7_demolition.png

爆破 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a satchel charge tumbling into a crowd and bursting into a blinding fireball, satchel charge, fireball bloom, flying debris, violent, chaotic, deafening
```

## skill_arbiter_s7_weapon_mastery.png

精通武器 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, an arbiter surrounded by arranged weapons: blade, pistol, powder charges, bare fists, crossed blades, flintlock pistol, powder keg, lethal, practiced, poised
```

## skill_arbiter_s6_decree.png

立规 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a judge declaring a rule aloud while golden letters of law hang in the air, floating golden edict text, judge's podium, silenced defendant, irrevocable, solemn, crushing
```

## skill_arbiter_s6_forbid.png

禁止 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, two spoken words sealing an enemy's throat as invisible fingers close around it, silenced foe, straining throat, frozen words in midair, absolute, airless, domineering
```

## skill_arbiter_s6_imprison.png

囚禁 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, invisible bars closing around a trapped figure mid-leap in empty space, faint cage bars, lunging figure, sealed floor circle, inescapable, cold, suffocating
```

## skill_arbiter_s6_lashing.png

鞭打 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a judge's whip drawing red lines across a kneeling offender's back, judge's whip, kneeling offender, fresh lash marks, punitive, harsh, ritualistic
```

## skill_arbiter_s6_authority_shift.png

权威质变 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a judge's robe darkening to crimson as an expanding ring of authority ripples outward, crimson robe hem, expanding ring of light, widening courtroom, ascendant, heavy, radiant
```

## skill_arbiter_s5_castigation.png

惩戒 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, an arbiter pressing an invisible glowing brand onto a foe's forehead, glowing forehead mark, outstretched hand, recoiling foe, inexorable, sacred, ominous
```

## skill_arbiter_s5_punitive_pursuit.png

禁制追击 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a second sealing mark layered on a foe while a hovering sword waits to strike, layered seal marks, hovering blade, marked foe, inevitable, predatory, patient
```

## skill_arbiter_s5_full_moon.png

满月 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a radiant full moon rising over a battlefield, pinning every hidden shadow to the ground, full moon disk, exposed shadows, silver-lit battlefield, luminous, exposing, serene dread
```

## skill_arbiter_s4_edict_reality_rise.png

律令·神秘减弱，现实增强 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, spoken law thickening the ground underfoot while enemy magic dissolves like smoke, solidifying earth, dissolving spell smoke, proclamation text, grounding, austere, final
```

## skill_arbiter_s4_deprivation.png

剥夺 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a judge's open hand stripping away glowing borrowed blessings from a shrinking figure, drifting light shards, stripped figure, open palm, stripping, hollow, absolute
```

## skill_arbiter_s4_exile.png

放逐 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a lone figure erased from the ranks, standing apart behind a glassy veil, glass veil, isolated figure, blurred squad behind, lonely, cut-off, unreal
```

## skill_arbiter_s4_execution.png

处决 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a headsman's blade already falling as a crimson life-thread snaps, falling blade, snapping red thread, kneeling convict, terminal, swift, merciless
```

## skill_arbiter_s4_intimidation.png

震慑 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, an arbiter merely lifting an eye while the whole enemy line stumbles half a beat, lifted gaze, stumbling warriors, halted charge, suffocating, regal, paralyzing
```

## skill_arbiter_s3_judgment_sword.png

审判之剑 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a drawn blade that is a verdict itself, its edge glowing with signed sentences, verdict-inscribed blade, rot marks on foe, glowing seals, condemning, burning, righteous
```

## skill_arbiter_s3_chaos_sense.png

混乱感应 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a hunter's gaze locking onto the most frenzied figure amid swirling red mist, red mist trails, frenzied target, hunter's eyes, bloodthirsty, focused, feral
```

## skill_arbiter_s3_battlefield_split.png

分割战场 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, an invisible dividing line bisecting the battlefield into two unreachable halves, searing boundary line, split battlefield, reaching hands, severing, absolute, echoless
```

## skill_arbiter_s3_blink_step.png

近瞬移 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a fighter dissolving from a blade's path and reappearing in a safe corner, fading afterimage, whiffed blade, distant safe corner, nimble, uncanny, breathless
```

## skill_arbiter_s2_equalize.png

五五开 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a huge warrior sinking and a small one rising until both stand on one line, tilting balance beam, sinking giant, rising underdog, leveling, eerie, impartial
```

## skill_arbiter_s2_balanced_split.png

均衡分割 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, two champions mirrored across a split field, equal in size and strength, mirrored champions, dividing line, matched auras, balanced, tense, fated
```

## skill_arbiter_s2_imbalance_sense.png

失衡感应 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a battlefield vista where one towering figure stands unnaturally higher than all, elevated figure, distant battlefield, measuring gaze, discerning, cold, looming
```

## skill_arbiter_s1_order_domain.png

秩序领域 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a lawgiver inscribing glowing statutes across the entire battlefield dome, floating statute tablets, domed field, bowed combatants, sovereign, absolute, radiant
```

## skill_arbiter_s1_abolition.png

废止 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a hand erasing one line of glowing law, the letters crumbling to dust, erased glowing clause, crumbling letters, reaching hand, void, transgressive, precarious
```

## skill_arbiter_s1_quell_anomaly.png

中止奇异 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, order falling like white light, dissolving grotesque mutations and twisted blessings, dissolving aberrations, white light shafts, restoring forms, purifying, stern, cleansing
```

## skill_arbiter_s0_judgment.png

审判 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a supreme judge delivering the final sentence as the world's will gathers behind, robed colossus of law, converging light rays, condemned sinner, apocalyptic, righteous, final
```

## skill_arbiter_s0_bedrock_rules.png

底层规则 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a hand rewriting a single glowing line etched deep in bedrock beneath the world, glowing bedrock inscription, rewriting hand, split crowd of exempted and damned, foundational, irrevocable, grave
```

## skill_arbiter_s0_forced_balance.png

强制平衡 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a giant hand pressing down a cosmic scale, leveling every warrior's stance, cosmic balance scale, giant hand, leveled warriors, inescapable, cosmic, suffocating
```

## skill_arbiter_s5_rank_jurisdiction.png

位格管辖 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a high-seated arbiter on a dais far beyond the reach of those below, raised dais, distant reaching figures, arbiter's throne, aloof, ordained, immovable
```

## skill_arbiter_s2_rank_sanction.png

位格制裁 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, the same written verdict striking one foe lightly and another like a hammer, verdict scroll, feather-weight blow, hammer-weight blow, measured, unequal, implacable
```

## skill_arbiter_s1_demean.png

贬谪 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, a name being crossed out and moved one rank down on a glowing roster, glowing roster scroll, descending name, struck-out line, belittling, cold, administrative
```

## skill_arbiter_s0_rank_decree.png

位格律令 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, neoclassical allegorical mural painting, ivory and gilded bronze palette with deep crimson accents, rigidly symmetrical compositions, overhead divine judgment light, frescoed marble and bas-relief texture, every word of a high arbiter falling like carved stone tablets onto the battlefield, falling stone tablets, speaking colossus, cracked ground, ponderous, supreme, world-shaking
```

# 途径：偷盗者（thief，37 卡）

## skill_thief_s9_steal.png

窃取 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a gloved hand lifting a fat coin purse from an unaware merchant's coat, fog-dimmed alley, silently cut purse strings, sly, light-fingered
```

## skill_thief_s9_nimble_hands.png

敏捷之手 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, ten impossibly nimble fingers dancing a coin across knuckles, spinning gold coin, blurred hand motion, deft, effortless
```

## skill_thief_s9_keen_eye.png

卓越观察 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a thief's single magnified eye scanning passersby for hidden valuables, glinting monocle, bulging hidden pockets, appraising, sharp
```

## skill_thief_s8_misdirect.png

思维误导 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a flickering afterimage of a thief left where the enemy strikes empty air, phantom double, blade cutting mist, uncanny, mischievous
```

## skill_thief_s8_mind_jam.png

精神干扰 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a befuddled warrior clutching his head as jangling silver threads ring his skull, ringing thread loops, slowed halting step, dizzying, discordant
```

## skill_thief_s8_micro_read.png

微表情 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a duelist leaning half an inch aside as a fist grazes his coat, twitching shoulder tell, passing fist, calm, perceptive
```

## skill_thief_s8_silver_tongue.png

魅力口才 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a smiling con artist whispering honeyed lies that linger as golden letters, curling golden script, charmed leaning listeners, smooth, beguiling
```

## skill_thief_s7_disillusion.png

解析幻象 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, an illusionary veil unraveling into threads, exposing what hides behind, dissolving glamor weave, revealed hidden figure, revealing, cold
```

## skill_thief_s7_locator.png

找出方位 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a scholar tracing glowing coordinates across a dark map that points through walls, spectral compass needle, map lines piercing stone walls, calculating, sure
```

## skill_thief_s7_spirit_intuition.png

灵性直觉 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a thief's shadow flinching an instant before the ambush springs, tightening shadow, half-seen sprung trap, tense, prescient
```

## skill_thief_s6_fire_theft.png

盗火 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, an open palm stealing a living flame from another's clenched fist, cupped stolen fire, empty gripping hand, bold, covetous
```

## skill_thief_s6_remote_snatch.png

隔空取物 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a heavy money bag yanked through the air across a smoky battlefield, levitating satchel, outstretched beckoning fingers, impudent, effortless
```

## skill_thief_s6_plant_evidence.png

栽赃 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a smirking thief slipping a glowing trinket into a stranger's pocket, smoldering trinket, unsuspecting deep pocket, mischievous, sinister
```

## skill_thief_s6_mind_resist.png

精神污染抗性 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a serene thief behind cracked glass while dark whispers slide off harmlessly, sliding dark tendrils, unshaken steady gaze, serene, hardened
```

## skill_thief_s5_steal_memory.png

窃取记忆 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a hollow-eyed man losing his own reflection from a mirror, dissolving portraits, drifting memory motes, haunting, hollow
```

## skill_thief_s5_steal_thought.png

偷走想法 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a dazed man reaching for a thought already snatched away as smoke, dissolving thought-wisp, vacant staring eyes, vacant, eerie
```

## skill_thief_s5_divine_disguise.png

伪装·盗天机 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a thief cloaked in a stolen divine silhouette gliding past kneeling believers, radiant borrowed halo, gaze sliding past, sacrilegious, sly
```

## skill_thief_s5_dream_eater.png

食梦者 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a thief savoring the last shimmering dream of a fallen foe, dissolving dream-ribbon, faint contented smile, voracious, dreamlike
```

## skill_thief_s4_parasitize.png

寄生 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a shadowy figure coiled inside a host's silhouette, strings on its limbs, nested second shadow, marionette strings, creeping, possessive
```

## skill_thief_s4_steal_distance.png

窃取距离 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a bewildered soldier striding yet never closing the gap across a stretched road, elastic stretched street, unreachable far opponent, disorienting, absurd
```

## skill_thief_s4_precise_steal.png

精准窃取 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a thief's hook lifting the single brightest thread from a target's chest, glowing ability-thread, watchful paused stance, patient, exact
```

## skill_thief_s4_borrow_body.png

借宿 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a wounded thief folded into a comrade's shadow, safe behind another's flesh, nested sheltering shadow, raised guarding shield, furtive, sheltered
```

## skill_thief_s3_deceive_rule.png

欺诈规则 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a blade passing straight through armor that believes it is elsewhere, ghost-transparent armor, unbothered smiling thief, surreal, smug
```

## skill_thief_s3_triple_steal.png

三连窃取 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a thief yanking three glowing strands from a foe in one motion, strand of strength, glow of coin, wisps of luck, greedy, triumphant
```

## skill_thief_s3_master_of_deceit.png

欺瞒导师 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a grinning mentor weaving a lie no eye can pierce, crystallizing falsehood, blindfolded scales of judgment, imperious, inscrutable
```

## skill_thief_s2_graft_fate.png

嫁接命运 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, two entwined threads of fate swapped mid-loom by a weaver's quick needle, crossed golden threads, deft silver needle, fateful, imperious
```

## skill_thief_s2_steal_identity.png

窃取身份 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a thief donning another's face like a paper mask while the true owner fades, peeling face-mask, dissolving fading original, unsettling, predatory
```

## skill_thief_s2_fate_gap.png

命运缝隙 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a thief slipping sideways through a crack splitting a written fate-scroll, cracked fate parchment, narrow sideways gap, sly, liminal
```

## skill_thief_s1_steal_time.png

窃取时间 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a thief shearing off a glowing ribbon of hours with a pair of silver shears, silver shears, ribbon of light-hours, thieving, ephemeral
```

## skill_thief_s1_aging.png

衰老 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a soldier's hair whitening and shoulders bending in a single breath, spilling hourglass sand, whitening hair, merciless, withering
```

## skill_thief_s1_steal_anchor.png

窃取锚 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a thief hoisting a huge spectral anchor torn from a rooted foe, uprooted glowing anchor, suddenly lightening steps, triumphant, unmoored
```

## skill_thief_s1_stone_clock.png

石制壁钟 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, an ancient stone clock-tower phantom looming behind a thief, pendulum swinging back, weathered stone pendulum, reversed hour-marks, ponderous, ancient
```

## skill_thief_s1_doppel_replace.png

分身替换 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a dying thief dissolving while a faraway double wakes with his face, unraveling dissolving body, shuddering waking double, uncanny, fated
```

## skill_thief_s1_clock_tower_domain.png

壁钟之域 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a whole battlefield sealed inside the gear-work belly of a colossal clock, vast interlocking brass gears, suspended drifting seconds, overwhelming, inevitable
```

## skill_thief_s0_confuse_doppel.png

混淆分身 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, three identical thieves grinning in a fog, each daring you to choose, mirrored identical trio, drifting obscuring fog, maddening, playful
```

## skill_thief_s0_error.png

错误 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a foe's killing blow landing on a hollow mirage that shatters, cracking false image, untouched smiling thief, paradoxical, mocking
```

## skill_thief_s0_steal_authority.png

窃取权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim victorian noir pen-and-ink illustration, foggy alley palette of tarnished brass and soot-black, sly raking gaslight, fine crosshatch texture, a thief signing his name over a glowing ledger of another's stolen domain, luminous registry book, overwritten name-seal, usurping, grandiose
```

# 途径：刺客（assassin，39 卡）

## skill_assassin_s9_featherlight.png

羽毛般轻盈 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a lithe assassin gliding backward on weightless steps, drifting white feathers, trailing shadow, light footwork blur, agile, elusive
```

## skill_assassin_s9_eagle_sight.png

鹰的视力 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a hunter whose hawk-pupil eyes pierce through darkness and mirrors, golden hawk pupils, darkness peeling open, figure hiding inside a mirror, piercing, predatory
```

## skill_assassin_s9_shadow_hide.png

阴影躲藏 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, an assassin dissolving into a pool of living shadow, curling black shadow, half-faded silhouette, drawn dagger, silent, lethal
```

## skill_assassin_s9_burst_strike.png

力量爆发于一击 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a cloaked figure driving a dagger into an unsuspecting foe's back, arched back blow, tattered shadow cloak, burst of force, explosive, brutal
```

## skill_assassin_s8_charm.png

魅惑 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a bewitching smile turning an enemy's blade toward its own ally, mesmerizing smile, turned blade, hazy rose mist, seductive, sinister
```

## skill_assassin_s8_mislead.png

误导 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a whispered word sending an enemy's slash into empty darkness, drifting whisper, slashing empty shadow, confused warrior, deceptive, mocking
```

## skill_assassin_s8_inflame_conflict.png

激化矛盾 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a murmured word igniting blood-red rage between two allies, red sparks between warriors, bared teeth, torn banner, volatile, venomous
```

## skill_assassin_s8_persuasion.png

说服 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a soft-spoken figure whose words settle over a nodding foe, honeyed words like ribbons, heavy-lidded eyes, relaxed shoulders, soothing, insidious
```

## skill_assassin_s7_invisible.png

隐形 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, an assassin fading from the air leaving only a dagger's gleam, dissolving outline, lone floating dagger, faint air ripple, ghostly, menacing
```

## skill_assassin_s7_black_flame.png

黑焰 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a black flame burning cold on an outstretched palm, pitch-black fire, spiraling ash, charred curse marks, eerie, consuming
```

## skill_assassin_s7_frost.png

冰霜 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, white frost crawling from fingertips over a victim's limbs, creeping ice crystals, blue-white mist, stiffening hand, cold, creeping
```

## skill_assassin_s7_mirror_divination.png

魔镜占卜 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a witch reading answers in an ornate hand mirror, ornate hand mirror, rippling silver surface, half-seen whispering words, arcane, watchful
```

## skill_assassin_s7_witch_form.png

女巫之形 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, an ageless androgyne witch of unearthly beauty, flowing genderless figure, bewitching eyes, dark halo, mesmerizing, uncanny
```

## skill_assassin_s7_mirror_substitute.png

镜子替身 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a shattering mirror taking the killing blow in the witch's place, bursting mirror shards, breaking reflection, splintering curse marks, desperate, glimmering
```

## skill_assassin_s6_bliss_touch.png

欢愉之触 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a fingertip brush flooding a warrior with drowsy euphoria, languid smile, drooping weapon, soft rose haze, drowsy, decadent
```

## skill_assassin_s6_silk_web.png

无形蛛丝 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, invisible silk threads coiling tighter around a struggling enemy, glinting taut threads, tangled ankle, tightening spiral, clinging, suffocating
```

## skill_assassin_s6_frost_armor.png

冰霜护甲 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a sparkling layer of frost sheathing a warrior's pauldron, ice-crusted shoulder guard, pale mist, glittering rime, crisp, guarded
```

## skill_assassin_s5_disease.png

疾病 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a silent sickness blooming beneath a victim's skin, spreading dark veins, feverish flush, blooming rot marks, insidious, rotting
```

## skill_assassin_s5_repeated_charm.png

反复魅惑 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a thrice-charmed victim gazing up in hopeless devotion, layered heart-shaped haze, adoring eyes, sinking will, obsessive, tender-dread
```

## skill_assassin_s5_mirror_maze.png

镜像迷宫 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, an enemy slashing at endless reflections of the same assassin, corridor of mirrors, identical reflections, shattering glass, disorienting, inescapable
```

## skill_assassin_s5_hair_blades.png

发刃 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, whipping steel-like strands of hair piercing through a foe, razor hair needles, bursting strands, spraying sparks, fierce, precise
```

## skill_assassin_s4_plague.png

瘟疫 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, an invisible miasma spreading over an entire battlefield, green-black miasma clouds, falling banners, toppling ranks, suffocating, sweeping
```

## skill_assassin_s4_mirror_step.png

投影传送 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a witch stepping out of one mirror as her reflection stays behind, pair of facing mirrors, emerging figure, lingering reflection, uncanny, fluid
```

## skill_assassin_s4_untransferable_curse.png

不可转移的诅咒 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a dark curse rooting deep into a foe's shadow, black root-like curse, pinned shadow, snapping paper charms, inescapable, binding
```

## skill_assassin_s3_mirror_self.png

镜中人 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a dead witch opening her eyes inside another mirror, wall of mirrors, waking reflection, spilled shards, eerie, immortal
```

## skill_assassin_s3_eternal_youth.png

青春永驻 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, an ageless beauty whose wounds close of their own accord, closing gash, unwrinkled face, reversing blood drops, serene, eerie
```

## skill_assassin_s3_petrification.png

石化 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a stone curse climbing from fingertips up a victim's arm, spreading stone texture, cracking statue flesh, stone dust, cold, final
```

## skill_assassin_s3_mirror_prison.png

镜中囚禁 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a foe dragged halfway into a rippling mirror surface, grasping mirror hands, half-submerged victim, rippling silver, claustrophobic, surreal
```

## skill_assassin_s2_disaster.png

灾难 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a battlefield swallowed by blizzard and collapsing rooftops, crushing snowfall, collapsing beams, splitting earth, crushing, doom-laden
```

## skill_assassin_s2_doom_curse.png

命运诅咒 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a crack cut into a glowing thread of fate above a victim's head, severed fate thread, crack of darkness, shadow double striking, ominous, relentless
```

## skill_assassin_s2_collapse.png

崩解 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a foe's gathered auras shattering all at once like glass, bursting light shards, collapsing glow, hollowed warrior, implosive, hollow
```

## skill_assassin_s1_apocalypse.png

末日 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a whole battlefield settling old scores in one final reckoning, darkened sky, clashing silhouettes, falling fate threads, terminal, majestic
```

## skill_assassin_s1_charm_authority.png

魅力权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, one dazzling smile silencing an entire battlefield, hushed armies, soft crimson glow, eased smiles, dazzling, commanding
```

## skill_assassin_s0_chaos_vortex.png

混沌漩涡 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a vortex unwriting a foe's blessings into blank nothing, spiraling grey vortex, dissolving light, blank scroll, annihilating, formless
```

## skill_assassin_s0_mirror_world.png

镜中世界 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, an entire battlefield folded into a vast mirror world, colossal mirror plane, army reflections, inverted sky, surreal, absolute
```

## skill_assassin_s0_primal_stillness.png

原初·静止 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, a falling corpse freezing every nearby figure mid-motion, halted silhouettes, warriors stopped mid-stride, drifting time dust, frozen, merciless
```

## skill_assassin_s6_form_shadow.png

影形态 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, an assassin flattening into a two-dimensional shadow, stretching black silhouette, thinning body, floor-bound darkness, sleek, lurking
```

## skill_assassin_s2_form_mist.png

雾形态 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, an assassin loosening into drifting grey mist, dissolving figure, grey fog tendrils, empty clothes, formless, elusive
```

## skill_assassin_s1_form_blood.png

血形态 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era European gothic dark fantasy illustration, crimson and obsidian palette, mirror-shard compositions with witchfire backlight, sleek glossy textures, an assassin flowing like living blood across the ground, liquid crimson form, rippling puddle body, rising droplets, vital, predatory
```

# 途径：囚犯（prisoner，36 卡）

## skill_prisoner_s9_sturdy_body.png

体魄强化 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a scarred prisoner flexing hardened muscles in a dim stone cell, iron bars, shackled wrists, cold stone walls, hardened, defiant
```

## skill_prisoner_s9_keen_senses.png

知觉敏锐 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a prisoner turning his head at a faint sound in the dark, flickering torchlight, glinting hidden blade, taut coiled posture, alert, predatory
```

## skill_prisoner_s9_improvised_weapon.png

随手物品 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a prisoner hurling a heavy chain at a shadowy foe, swinging iron chain, splintered stool, flying debris, brutal, resourceful
```

## skill_prisoner_s9_criminal_tricks.png

犯罪技巧 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a prisoner tripping an enemy from behind in a dark alley, hooked foot, thrown dust, moonlit cobblestones, sly, vicious
```

## skill_prisoner_s8_desire_burst.png

爆发欲望 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a prisoner roaring as red-hot frenzy floods his veins, bulging veins, torn shackles, wild bloodshot eyes, frenzied, unhinged
```

## skill_prisoner_s8_unhinged_resistance.png

疯癫抗性 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a grinning madman laughing off an unseen psychic blow, cracked wide grin, swirling phantom whispers, tilted head, manic, deranged
```

## skill_prisoner_s7_werewolf_form.png

狼人化 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a hulking werewolf with dripping black fangs under a blood moon, swollen blood moon, matted bristling fur, self-closing wounds, savage, cursed
```

## skill_prisoner_s7_darkness_terror.png

黑暗恐惧 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a battlefield plunged into blackness as the last torch dies, snuffed-out torch, creeping shadows, frozen terrified silhouettes, suffocating, dread-filled
```

## skill_prisoner_s7_toxic_puppet.png

毒性傀儡 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a poisoned victim jerked upright on glowing venom strings, glistening venom threads, purple-swollen veins, limp dangling arms, sinister, controlling
```

## skill_prisoner_s7_anti_scry.png

初步反占卜 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a scrying crystal clouded over by swirling black fur, fogged crystal ball, drifting black tufts, snapped ritual chalk circle, elusive, obscured
```

## skill_prisoner_s6_iron_body.png

钢铁之躯 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a bare-chested fighter with bullets flattened against his skin, flattened lead slugs, scarred torso, dim forge light, unyielding, grim
```

## skill_prisoner_s6_grasp_of_dead_cold.png

死寒之握 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a frostbitten hand clamping down on rotting flesh, creeping black frost, necrotic skin, steaming cold, deathly, cold
```

## skill_prisoner_s6_raise_corpse.png

唤醒死尸 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a twitching corpse clawing its way out of cracked earth, grasping dead hand, cracked soil, pale grave-candle glow, macabre, restless
```

## skill_prisoner_s6_corpse_handler.png

操纵活尸 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a gaunt necromancer tending a row of obedient zombies, slack-jawed corpses, guiding hand gestures, grave dirt, methodical, morbid
```

## skill_prisoner_s5_spirit_form.png

灵体化 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a body dissolving into gray mist at the edge of a mirror, half-melted silhouette, rippling antique mirror, trailing vapor, ethereal, vengeful
```

## skill_prisoner_s5_wraith_body.png

幽影之躯 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a body flickering apart into shadow as a blade passes through, scattering shadow fragments, passing sword blade, dim torch, ghostly, uncanny
```

## skill_prisoner_s5_wraith_grudge.png

怨灵之缠 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a clinging shadow wrapping tighter around a victim's back, tightening dark tendrils, hunched victim, seeping black mist, oppressive, spiteful
```

## skill_prisoner_s5_wraith_possession.png

怨魂附身 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a wraith wrenching a victim's body like a marionette, bone-twisting grip, glowing hostile eyes, puppeteer wraith, violating, eerie
```

## skill_prisoner_s5_wraith_shriek.png

怨魂尖啸 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a gaping wraith unleashing a soundless scream, distorted open maw, shattering sound rings, recoiling enemies, piercing, terrifying
```

## skill_prisoner_s4_curse_source.png

诅咒之源 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a craftsman carving an exact wooden effigy of his enemy, carved voodoo doll, small carving knife, thread linking two wounds, ritualistic, sinister
```

## skill_prisoner_s4_possess_objects.png

操纵物品 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, broken blades and shattered chairs lurching upright, quivering rusty blades, splintered furniture, faint ghostly threads, uncanny, menacing
```

## skill_prisoner_s4_performance.png

演出 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a grinning puppeteer raising an actor's chin like a doll, marionette strings, posed stage figure, single spotlight, theatrical, eerie
```

## skill_prisoner_s5_spirit_shroud_domain.png

灵界潜域 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, an entire battlefield sinking halfway into the spirit realm, dissolving misty ground, ghostly banners, biting black vapor, otherworldly, oppressive
```

## skill_prisoner_s3_silent_vigil.png

长久沉默 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a mute figure sitting motionless inside a sealed stone cell, sealed iron door, burned-down candle, sewn-lips emblem, silent, brooding
```

## skill_prisoner_s3_object_possession.png

附身物体 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a spectral hand reaching out from inside an old wardrobe, cracked wardrobe door, grasping ghostly hand, cold breath fog, lurking, malicious
```

## skill_prisoner_s3_transmute_curse.png

变形诅咒 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, an armored knight dropping to all fours and snarling like a beast, armor-clad crawling figure, feral glowing eyes, torn cloak, degrading, horrific
```

## skill_prisoner_s3_curse_no_backlash.png

无反噬之咒 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a wooden effigy with its connecting red thread cleanly cut, severed red thread, carved doll, unmarked hand, precise, cold
```

## skill_prisoner_s2_curse_authority.png

诅咒权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a dark bolt flying straight through a spectral barrier, piercing black bolt, dissolving shield wall, shadowed caster, merciless, absolute
```

## skill_prisoner_s2_eye_of_abomination.png

邪物之眼 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a huge monstrous eye opening where a face should be, unblinking alien pupil, warping silhouettes, veins of darkness, wrong, horrifying
```

## skill_prisoner_s2_abomination.png

邪物 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, ancient black ichor seeping from cracks in a prisoner's chest, oozing dark ichor, fissured skin, crawling shadows, corrupting, ancient
```

## skill_prisoner_s1_erosion_curse.png

侵蚀诅咒 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a victim frozen mid-scream inside a cage of its own body, statue-still body, trapped flickering soul light, iron-bone cage, claustrophobic, hopeless
```

## skill_prisoner_s1_conversion.png

转化 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, an enemy's silhouette rising again on the caster's side, reknitting bones, reversed battlefield shadow, obedient nod, violating, inevitable
```

## skill_prisoner_s0_king_of_aberrations.png

异类之王 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a crowned figure surrounded by bowing inhuman horrors, kneeling aberrations, rusted iron crown, feral reverent eyes, dominant, alien
```

## skill_prisoner_s0_the_bound.png

被缚者 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a figure embracing his chains as they fuse into his flesh, chains merging with skin, iron collar, calm dark eyes, resigned, unbreakable
```

## skill_prisoner_s0_item_authority.png

物品权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, weapons and relics across a battlefield trembling toward one raised hand, levitating swords and tools, commanding open palm, snapping banners, commanding, overwhelming
```

## skill_prisoner_s0_all_curses.png

万咒加身 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grimdark Victorian-era horror oil painting, rust-brown and blood-red palette, low-key lighting beneath a swollen blood moon, coarse scarred impasto texture, a lone figure crushed under layered chains, claws and poison, stacked chain coils, black curse glyphs, dripping venom, doomed, crushing
```

# 途径：学徒（apprentice，34 卡）

## skill_apprentice_s9_gate_open.png

开门 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a palm pressed to a wall, a glowing blue door blooming in the stone, glowing blue doorframe, wind rippling through the gap, fading footprint trail, mysterious, fluid
```

## skill_apprentice_s9_ritual_gate.png

仪式·门 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a ritual circle on the ground, a doorway of light slowly opening ahead, chalk-like ritual circle, doorway of pale light, rising count of mist wisps, patient, arcane
```

## skill_apprentice_s8_flash_trick.png

戏法·闪光 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a burst of blinding light erupting before a reeling monster, explosion of white light, ringing shockwave lines, a blade swinging into empty air, dazzling, chaotic
```

## skill_apprentice_s8_tri_element.png

戏法·三元素 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a mage flicking sparks of fire, frost, and lightning from his fingertips, tiny flame, sheen of white frost, crackling spark, playful, crackling
```

## skill_apprentice_s8_trip_push.png

戏法·摔倒术 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, an enemy stumbling as a sudden gust of wind shoves it backward, tangled feet, swirling wind trails, skidding dust, whimsical, forceful
```

## skill_apprentice_s8_escape_act.png

逃脱戏法 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a cornered mage dissolving into smoke and reappearing far behind, bursting smoke puff, empty spot of dust, distant reappearing silhouette, elusive, nimble
```

## skill_apprentice_s7_danger_sense.png

危险预感 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a stargazer turning aside as an unseen blade grazes past his shoulder, glinting blade mid-air, rippling star chart behind, cold breath mist, tense, prescient
```

## skill_apprentice_s7_divination_jam.png

干扰占卜 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a scrying mirror clouding over above a confused enemy, clouded crystal ball, scattered star runes, spilling motes of light, disorienting, murky
```

## skill_apprentice_s7_astrology.png

星相学 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a star chart pinning an enemy in place with threads of starlight, hanging star chart, glowing coordinate threads, pinned shadow silhouette, precise, fated
```

## skill_apprentice_s6_inscription.png

记录 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, glowing rubbings of incoming strikes etching into spectral tablets, spectral rubbing tablets, streaking afterimages of blows, rising tally glyphs, meticulous, eerie
```

## skill_apprentice_s6_reenact_strike.png

重现 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a mage hurling back a mirrored copy of the foe own strike, mirrored afterimage fist, unfolding spectral rubbing, rebounding shockwave, retributive, uncanny
```

## skill_apprentice_s5_traveler_gate.png

旅行家之门 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a door opening at an ally feet, depositing them safely at the far end, doorframe rising from the floor, swirling threshold light, shielding haze around the ally, swift, benevolent
```

## skill_apprentice_s5_blink.png

闪现 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a duelist flickering around a foe, landing three near-simultaneous strikes, overlapping afterimages, short blade arcs, trailing blue wisps, blistering, erratic
```

## skill_apprentice_s5_invisible_hand.png

无形之手 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, an unseen grip seizing an enemy by the collar and dragging it forward, collar tugged taut, faint hand-shaped shimmer, gouged floor lines, sudden, domineering
```

## skill_apprentice_s5_semi_divine_record.png

半神记录 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, spectral tablets orbiting the recorder, each glowing with borrowed spells, orbiting spectral tablets, woven light-script, echoes of allies blows, ascendant, watchful
```

## skill_apprentice_s4_secrecy.png

守秘 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a figure folding himself into a shimmering fold of the spirit world, folding curtain of mist, fading silhouette, unreachable golden glyphs, aloof, veiled
```

## skill_apprentice_s4_hidden_space.png

空间隐藏 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, an ally outline dissolving as space bends and splits around them, bent light curtain, cracked spatial seams, fading ally outline, elusive, distorted
```

## skill_apprentice_s4_phantom_door.png

幻化 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a mage body turning into a translucent door that swallows attacks, translucent door-body, attacks vanishing through the frame, cold blue doorway glow, phantasmal, serene
```

## skill_apprentice_s4_exile.png

放逐 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, an enemy swallowed by a widening rift of swirling time and space, widening space rift, spiraling starlit turbulence, clawing silhouette pulled in, ravenous, cold
```

## skill_apprentice_s3_space_rift.png

撕裂空间 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a pair of hands tearing open a jagged rift that bites into the foe, jagged hanging rift, bleeding starlight edges, torn ground beneath, violent, gaping
```

## skill_apprentice_s3_merge_space.png

融入空间 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, an attacker half-faded into the air, striking from an impossible angle, semi-transparent body, impossible-angle strike trail, rippling entry point, surreal, lethal
```

## skill_apprentice_s3_breach_gate.png

破障之门 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a lone door standing before a fortress wall, its wards peeling away, lone blue door, cracking barrier wards, falling shield shards, inexorable, quiet
```

## skill_apprentice_s3_starry_roam.png

漫游星空 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a wanderer drifting among stars, one foot still trailing in the astral, drifting star field, tethered astral trail, early-arriving afterimage, weightless, serene
```

## skill_apprentice_s2_dimension_view.png

维度之视 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a towering foe shrinking into a tiny piece on a glowing chessboard, shrinking giant silhouette, glowing high-dimension chessboard, giant observing eye above, overwhelming, detached
```

## skill_apprentice_s2_reappear.png

再现 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a recorded figure stepping down off a page of glowing script to fight, unfolding page of light-script, stepping-out silhouette, paper-thin shield wall, nostalgic, uncanny
```

## skill_apprentice_s2_sigil_self.png

自我符号 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a body collapsing into a single floating sigil, reforming across the field, glowing personal sigil, collapsing body-ribbons, distant reforming outline, abstract, transient
```

## skill_apprentice_s2_reenactment_descent.png

再现·降临 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, an old battlefield descending from an open book over the present field, descending spectral battlefield, giant open book overhead, looping road of light, sweeping, haunting
```

## skill_apprentice_s1_locate.png

定位 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a key of starlight fixing every enemy in glowing coordinate threads, starlight key, web of coordinate threads, rooted enemy shadows, absolute, clarifying
```

## skill_apprentice_s1_time_maze.png

时空迷宫 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, endless corridors folding into one corner, time flowing backward overhead, looping corridor corner, reversed clock-glow, marching lost silhouettes, bewildering, endless
```

## skill_apprentice_s1_space_shatter.png

空间破碎 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, gravity flipping as the ground collapses beneath the enemy line, upward-falling debris, collapsing ground plane, bent light streaks, crushing, vertiginous
```

## skill_apprentice_s1_seal.png

封印 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, a huge door closing and locking, swallowing an enemy into stillness, massive closing door, hanging lock of light, frozen time motes, final, hushed
```

## skill_apprentice_s0_door_shut.png

门之概念 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, every doorway around a foe slamming shut in unison, ring of slamming doors, snuffed candle-glow paths, sealed ground seams, absolute, suffocating
```

## skill_apprentice_s0_space_cage.png

空间牢笼 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, six invisible walls closing in around a trapped shrinking figure, faint hexagonal walls, compressing space shimmer, pinned struggling silhouette, inescapable, claustrophobic
```

## skill_apprentice_s0_ubiquity.png

无处不在 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, ethereal Victorian-era star-faring fantasy illustration, deep cobalt and silver palette with pale gold accents, floating doorways adrift in cosmic mist, luminous rim lighting, smooth luminous gradients, one mage standing everywhere at once, starlit echoes crowding the field, scattered identical silhouettes, starlit echo trails, astral double at the edge, omnipresent, unreal
```

# 途径：律师（lawyer，46 卡）

## skill_lawyer_s9_sophistry.png

诡辩 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a grinning lawyer turning a lunging blade aside with a whisper, swerving dagger mid-air, curled smoke from his lips, sly, glib
```

## skill_lawyer_s9_weakness_exploit.png

薄弱处 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a gloved finger prying open a half-healed wound on a warrior's side, gaping old scar, glinting knife tip, cold, precise
```

## skill_lawyer_s9_chink_finding.png

寻隙 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a besuited lawyer sliding a slim stiletto into the crack of a stone wall, hairline crack in stone, thin blade, patient, opportunistic
```

## skill_lawyer_s9_glib_tongue.png

滔滔不绝 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a silver-tongued lawyer lecturing an open wound that refuses to close, floating speech ribbons, gaping wound, persuasive, insidious
```

## skill_lawyer_s8_force_resolution.png

力量解决 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer in shirtsleeves smashing a law book down like a hammer, shattered bench, swinging fist, brutal, blunt
```

## skill_lawyer_s8_barbaric_body.png

野蛮体魄 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a burly lawyer flexing as veins of iron ink crawl across his skin, inked iron veins, torn waistcoat, savage, boastful
```

## skill_lawyer_s8_savage_charge.png

蛮横冲撞 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a massive lawyer shoulder-charging through a rank of soldiers, flying helmets, cracked floor tiles, unstoppable, bullish
```

## skill_lawyer_s7_bribe_weaken.png

贿赂·削弱 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer pressing a fat envelope into a warrior's sagging hand, stuffed envelope, drooping sword arm, greasy, corrupt
```

## skill_lawyer_s7_bribe_charm.png

贿赂·魅惑 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer fanning banknotes under a soldier's glittering eyes, fan of banknotes, blurred bickering figures, seductive, venal
```

## skill_lawyer_s7_bribe_arrogance.png

贿赂·狂妄 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer crowning a hulking brute with laurel while it puffs its chest, withered laurel wreath, puffed chest, open guard stance, mocking, decadent
```

## skill_lawyer_s7_bribe_connected.png

贿赂·关联 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a golden thread tied from a fighter's wrist back to the lawyer's pocket, taut golden thread, coins trickling into pocket, parasitic, insidious
```

## skill_lawyer_s6_distortion.png

扭曲 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer twisting a spoken word in mid-air like a wrung cloth, bent word-shaped ribbon, confused clawing hands, perverse, mocking
```

## skill_lawyer_s6_corruption.png

腐蚀 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, black tar welling from a soldier's heart as he turns on his own ranks, boiling black tar, friendly blades crossing, venomous, corrosive
```

## skill_lawyer_s6_corruption_kickback.png

腐化回扣 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, coins raining from a collapsing body into the lawyer's open palm, spilling coins, crumpled silhouette, avaricious, predatory
```

## skill_lawyer_s5_chaos.png

混乱 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer scattering shimmering dust over a milling battlefield, glittering dust cloud, blades striking empty air, chaotic, dizzying
```

## skill_lawyer_s5_shared_burden.png

对半承担 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a single cleaving blow splitting evenly across two bodies, bifurcated wound glow, two linked shadows, clinical, impartial
```

## skill_lawyer_s5_untouchable.png

难落身 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a knife wandering lost through shifting maze-lines around the lawyer, labyrinthine haze, wobbling knife, disorienting, untouchable
```

## skill_lawyer_s4_exploit.png

利用 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer tightening invisible cords already knotted around a giant, tightening cord shadows, printed old scar-lines, tightening, predatory
```

## skill_lawyer_s4_amplify.png

放大 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer's ordinary punch blooming into an executioner's shadow, blooming dark halo, giant shadow fist, inflated, fatal
```

## skill_lawyer_s4_endow.png

赠予 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer handing a beggar-knight a burning brand that drinks his blood, guttering flame brand, trickling red rivulets, generous, vampiric
```

## skill_lawyer_s4_rule_monopoly.png

独享规则 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a golden scale tilting steeply toward a smirking lawyer in judge's robes, lopsided golden scale, heavy leaning beam, smug, absolute
```

## skill_lawyer_s4_distorted_order.png

扭曲秩序 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer smiling as all arrows on a signpost spin and point wrong, spinning signpost arrows, crowd scratching heads, absurd, sinister
```

## skill_lawyer_s3_authority_press.png

上位者·威严 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a towering lawyer in black robes pressing lesser figures to their knees, crushing invisible weight, kneeling silhouettes, dread, commanding
```

## skill_lawyer_s3_stratum.png

阶层 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer on an invisible upper stair as arrows fall short below, floating staircase shadow, harmless arrows below, aloof, absolute
```

## skill_lawyer_s3_frantic_surge.png

狂乱 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, black-red mania pouring from a lawyer's chest into a soldier's skull, surging ink torrent, fractured expression, unhinged, feverish
```

## skill_lawyer_s3_frantic_adaptation.png

狂乱适应 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, broken chains reforging themselves as muscle around the lawyer's arms, chain-ink tendrils, strained sleeves, feral, thriving
```

## skill_lawyer_s2_entropy.png

熵 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a crackle of decayed gold crawling down a line of soldiers, corroding gold veins, contagion trail, decaying, contagious
```

## skill_lawyer_s2_moon_step.png

踏月 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer mid-leap from a courtroom floor onto a vast blood-red moon, giant crimson moon, leaping silhouette over floor tiles, impossible, defiant
```

## skill_lawyer_s1_defined_substitute.png

定义·替身 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer stamping a wax seal onto a bound figure's chest, glowing red seal, torn parchment mask, arbitrary, cruel
```

## skill_lawyer_s1_redefine.png

重定义 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer erasing one word on a page and inking a new one over flesh, crossed-out word, fresh ink overwriting skin, casual, absolute
```

## skill_lawyer_s0_autocrat.png

独裁者 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a four-armed tyrant in a black suit holding scales, quill, gavel and crown, merged regalia, single fused scepter, total, suffocating
```

## skill_lawyer_s0_nine_tombs.png

九座陵寝 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer opening his eyes inside a mausoleum, eight more tombs looming behind, nine black tomb doors, rekindling candle, patient, deathless
```

## skill_lawyer_s0_order_collapse.png

秩序崩坏 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer feeding pages of law into a grinding mill, silencing the court, shredded legal pages, stilled raised hands, cataclysmic, silent
```

## skill_lawyer_s8_plead.png

陈词 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer rising to address the court, one gloved hand pressed to his heart, rising from bench, tilted judge's bench, measured, theatrical
```

## skill_lawyer_s7_pleader_eye.png

讼师之眼 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a monocled lawyer's eye magnifying a glowing crack in a duelist's guard, brass monocle glint, highlighted flaw, sharp, knowing
```

## skill_lawyer_s6_cite_statute.png

法条援引 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer unrolling a glowing statute scroll that pins a foe in place, unfurling golden scroll, pinned silhouette, authoritative, final
```

## skill_lawyer_s5_glib_tongue2.png

巧言令色 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer leaning in close, honeyed words dripping gold between smiles, dripping gold syllables, too-wide smile, oily, hypnotic
```

## skill_lawyer_s4_courtroom_rebut.png

当庭辩驳 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer's shout catching a descending gavel mid-air, frozen gavel, shockwave of sound, combative, electric
```

## skill_lawyer_s3_statute_body.png

律令加身 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, burning legal script winding around the lawyer like a living sash, living golden script, seared waistcoat, sovereign, scorching
```

## skill_lawyer_s6_seize.png

强夺 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer's bare hand ripping a relic from a stunned knight's grasp, torn-away relic glow, snapping straps, blunt, rapacious
```

## skill_lawyer_s5_violent_verdict.png

暴力裁决 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer's fist crashing down where a judge's gavel should have fallen, splintered bench, knuckle-first impact, impatient, brutal
```

## skill_lawyer_s2_crush.png

碾压 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, an immense black weight descending onto figures too small to flee, descending monolith shadow, flattened ground cracks, implacable, heavy
```

## skill_lawyer_s1_regicide_fist.png

弑序铁拳 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer's clenched fist wreathed in shredded chains of law-script, torn script chains, cracked knuckle-plates, defiant, overwhelming
```

## skill_lawyer_s5_buy_off.png

收买 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer dangling a coin on a string before a row of greedy eyes, swinging gold coin, row of glittering eyes, cynical, tempting
```

## skill_lawyer_s3_heavy_bribe.png

重贿 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a lawyer shoveling an avalanche of gold onto a kneeling client's lap, spilling coin avalanche, bent back under weight, obscene, gleeful
```

## skill_lawyer_s1_universal_bribe.png

万贿归一 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, deco-noir bribery lithograph, jet black and tarnished champagne-gold palette, warped asymmetric geometry, ink-engraved texture over smoky decadence, a calm lawyer at center while debt-strings tie every fighter to his ledger, web of debt-strings, glowing ledger book, all-owning, calm
```

# 途径：怪物（monster，35 卡）

## skill_monster_s9_inspiration_sense.png

灵感超高 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a wild-eyed youth cupping his ear toward invisible whispers, shadows with hidden eyes, faint spectral murmurs, cracked mirror, uncanny, alert
```

## skill_monster_s9_danger_sense.png

危险预感 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a figure twisting aside as a blade grazes past his shoulder, glinting blade mid-swing, hair standing on end, cold sweat, tense, instinctive
```

## skill_monster_s9_future_sight.png

未来画面 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a youth staring at a translucent vision of a battle yet to come, ghostly future scene, flickering afterimage, swirling mist, dreamlike, foreboding
```

## skill_monster_s8_precise_shot.png

精准射击 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a marksman firing a pistol with unwavering steady aim, smoking muzzle, single falling feather, cold steady eyes, precise, cold
```

## skill_monster_s8_machine_mind.png

恐怖计算 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a man with clockwork gears turning behind his glassy eyes, rotating brass gears, faint glowing calculations, mechanical iris, rigid, calculating
```

## skill_monster_s8_enhanced_physique.png

素质增强 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a fighter's body hardening like tempered steel, corded muscle, metallic sheen on skin, ground cracking underfoot, powerful, disciplined
```

## skill_monster_s8_anti_divination.png

反占卜 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a figure whose silhouette dissolves into thick gray fog, veiled star chart, scrying eye clouded over, unreadable shadow, elusive, secretive
```

## skill_monster_s7_lucky_streak.png

幸运者 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a grinning rogue catching a gold coin falling from the sky, shower of lucky coins, rolling dice, four-leaf clover, lighthearted, charmed
```

## skill_monster_s7_fate_tide.png

命运潮汐 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, luck pooling around a gambler like rising and ebbing tides, tide of glowing coins, waxing and waning moon, spiraling water, rhythmic, fickle
```

## skill_monster_s7_windfall.png

意外之财 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, coins spilling from an open purse into laughing hands, overflowing gold coins, glowing jackpot, falling star sparks, bountiful, gleeful
```

## skill_monster_s6_cause_calamity.png

引发灾祸 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a black cat shadow crossing beneath an enemy's feet as beams crack, cracking wooden beam, spilled salt, dark cat silhouette, ominous, merciless
```

## skill_monster_s6_calamity_foresight.png

预见灾祸 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a figure braced under an umbrella as disaster rains back on the attacker, shattered glass shards, lightning strike, readied stance, prepared, defiant
```

## skill_monster_s6_mind_storm.png

精神风暴 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a storm of swirling thoughts ripping through a warrior's mind, swirling thought fragments, a blade slicing empty air, cracked mental barrier, chaotic, dizzying
```

## skill_monster_s5_winner.png

赢家 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a gambler pushing a mountain of chips into the pot with a grin, towering chip stack, spinning roulette wheel, deflected shadow blade, reckless, triumphant
```

## skill_monster_s5_fate_sight.png

超强预感 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a seer draping a shimmering veil of foresight over his allies, translucent protective veil, multiple foreseen paths, watchful third eye, guarding, omniscient
```

## skill_monster_s5_give_misfortune.png

给予厄运 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a figure handing a black wilted flower to an unsuspecting foe, wilted black flower, clinging dark miasma, tar-like smear, sly, baleful
```

## skill_monster_s4_absolute_inspiration.png

绝对灵感 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a caster with blazing eyes as visions pour from him like a fountain, gushing luminous visions, glowing cracks of weakness, cascading sparks, fervent, piercing
```

## skill_monster_s4_doom_field.png

厄运领域 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a patch of battlefield rotting under a dome of sickly green miasma, sickly green miasma, rusting weapons, blackened ground, suffocating, cursed
```

## skill_monster_s4_misfortune_curse.png

厄运诅咒 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a curse spoken aloud coiling black smoke around a victim, coiling black smoke, flame biting its own caster, twisting shadow, vengeful, oppressive
```

## skill_monster_s4_blessing_gift.png

赐福 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a benefactor pressing a glowing blessing onto a comrade's shoulder, warm golden handprint, rising lucky sparks, soft halo, benevolent, radiant
```

## skill_monster_s4_mercury_body.png

水银之躯 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a humanoid figure liquefying into flowing silver mercury, rippling mercury surface, blades passing through liquid body, mirror-like splashes, fluid, untouchable
```

## skill_monster_s3_fate_chaos.png

混乱 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, tangled severed threads of fate spilling from a broken spindle, tangled glowing threads, knotted spindle, a blade turned toward its ally, deranged, unstable
```

## skill_monster_s3_fate_warden.png

命运看守者 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a warden reeling in a glowing thread from a web of tangled fates, vast web of fate lines, hooked silver thread, glinting prize at the end, patient, covetous
```

## skill_monster_s3_mind_baptism.png

精神洗礼 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a serene hand laid on a brow, black madness washing away like ink, black ink dissolving in water, calming white light, tranquil cleansed face, purifying, serene
```

## skill_monster_s2_fortune_words.png

福祸之言 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a prophet's words splitting into light and shadow over the battlefield, forked tongue of light, descending dark miasma, rising golden sparks, oracular, solemn
```

## skill_monster_s2_prophecy.png

预言术 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a prophet pointing at a translucent vision of the enemy's next move, ghostly replay of the future, pointing finger, advancing comrade's silhouette, certain, declarative
```

## skill_monster_s2_fate_revelation.png

命运启示 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a squad striding half a step ahead of their own shadows, leading shadows, unrolled scroll of fate, first light of dawn, assured, prophetic
```

## skill_monster_s2_mercury_form.png

水银之躯·完整 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a towering serpentine figure of pure liquid mercury rearing up, mirrored serpent scales, rippling liquid body, attacks sliding off its surface, alien, untouchable
```

## skill_monster_s1_fate_loop.png

命运循环 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a runner sprinting endlessly along a looping ribbon of glowing road, closed loop of road, trailing afterimages, hourglass sand flowing upward, maddening, inescapable
```

## skill_monster_s1_reboot_cycle.png

重启循环 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a silver serpent coiling back into a glowing embryonic egg, glowing egg of rebirth, shedding black tainted skin, coiled serpent fetus, cyclical, cleansing
```

## skill_monster_s1_reboot.png

重启 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a colossal reset lever pulled as the world fades back to blank, colossal lever, fading dissolving memories, blank white void, absolute, hollow
```

## skill_monster_s1_preserve.png

保存 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, an archivist copying a glowing thread of fate into a crystal vial, crystal vial holding a fate-thread, spare rolled-up destiny, shelf of labeled bottled fates, meticulous, secretive
```

## skill_monster_s1_choice_branch.png

选择 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, countless branching rivers of light, a hand selecting one stream, branching luminous tributaries, a guiding hand, fading rejected branches, decisive, infinite
```

## skill_monster_s0_wheel_of_fate.png

命运之轮 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, a colossal wheel of fortune turning above a turning-point battlefield, spinning wheel of fortune, swapped streams of light and shadow, balanced scales of luck, monumental, fateful
```

## skill_monster_s0_probability_authority.png

概率权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era symbolist painting, deep violet and tarnished silver palette, spiraling composition of interwoven serpentine threads, cold dreamlike haze with liquid mercury sheen, towering spectral dice tumbling above a stumbling giant, huge translucent dice, cracked floor tiles, flashing probability runes, arbitrary, implacable
```

# 途径：占卜家（seer，39 卡）

## skill_seer_s9_clairvoyance.png

灵视 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a hooded seer opening a silver third eye on his forehead, gray mist parting, floating spectral eye, watchful, piercing
```

## skill_seer_s9_divination.png

占卜 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a fortune-teller scattering tarot cards over a velvet table, swinging crystal pendulum, faint star charts, quiet, expectant
```

## skill_seer_s9_astrology.png

占星术 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, an astrologer tracing constellations on a brass armillary sphere, rotating star map, orbiting glyphs, calculated, fateful
```

## skill_seer_s8_flying_card.png

飞牌 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a gloved hand flicking a single card that spins like a blade, card trail slicing air, candlelit study, swift, sharp
```

## skill_seer_s8_premonition.png

直觉预感 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a seer flinching from a dagger made of smoke before it strikes, shimmering premonition halo, blurred future silhouette, tense, forewarned
```

## skill_seer_s8_perfect_poise.png

完美协调 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a masked dancer balancing perfectly on a taut wire in a storm, motionless figure amid flying debris, wind lines, serene, unshakable
```

## skill_seer_s7_air_bullet.png

空气弹 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a gentleman snapping his fingers, a compressed air bullet bursting forth, rippling shockwave ring, top hat and tailcoat, crisp, sudden
```

## skill_seer_s7_fire_leap.png

火焰跳跃 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a figure leaping between scattered fireballs, vanishing mid-flame, leaping fire portals, scorched cobblestones, agile, blazing
```

## skill_seer_s7_paper_substitute.png

纸人替身 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a paper cutout doll shattering in place of a struck gentleman, scattering paper shards, red string seal, uncanny, narrow escape
```

## skill_seer_s7_wound_transfer.png

伤害转移 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a mage sliding a bleeding gash off his chest like a decal, floating wound patch, dark thread stitches, eerie, detached
```

## skill_seer_s7_hallucination.png

制造幻觉 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a swordsman slashing at a shimmering phantom that is not there, doubled vision ghosts, warped air, deceptive, dizzy
```

## skill_seer_s7_illusion_domain.png

幻境 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a street melting into flowing, overlapping dreamlike scenery, liquid architecture, mirror fragments in fog, surreal, enveloping
```

## skill_seer_s6_disguise.png

变形 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a faceless man kneading his own features into another person, blank wax-like face, two overlapping silhouettes, unsettling, sly
```

## skill_seer_s6_keen_observe.png

细微观察 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a detective studying an enemy through a monocle, time slowing, magnified motion trails, notation glyphs, patient, analytical
```

## skill_seer_s6_power_refine.png

能力精进 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a faceless figure conducting flames with conductor-like precision, obedient flame ribbons, featureless mask, refined, controlled
```

## skill_seer_s5_marionette.png

秘偶 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, an enemy soldier turned marionette, lunging at his own ally, glowing spirit threads from above, puppeteer silhouette in mist, sinister, puppeted
```

## skill_seer_s5_spirit_thread.png

灵体之线 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, countless translucent threads revealed crisscrossing a dark street, luminous thread web, hidden figures exposed, revealing, omniscient
```

## skill_seer_s4_marionette_immortal.png

秘偶不死 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a killing blow striking a puppet while its master stands untouched, splintering wooden proxy, unbroken thread link, defiant, deathless
```

## skill_seer_s4_marionette_swap.png

秘偶换位 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a man and a wooden puppet trading places in a blink, afterimage swap, snapping thread, sudden, trickster
```

## skill_seer_s4_filth_transfer.png

秽物转移 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a mage peeling black rot off his body and slapping it onto an enemy, peeling curse film, spreading dark blotches, vile, vindictive
```

## skill_seer_s4_beast_form.png

兽形 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a gentleman twisting and reshaping into a gray wolf, warping bones, shedding coat and hat, feral, transforming
```

## skill_seer_s3_borrow_power.png

借取力量 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a man shaking hands with his own younger self through a time rift, sepia-toned past self, crackling rift, nostalgic, empowering
```

## skill_seer_s3_historical_echo.png

历史影像 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a translucent historical figure stepping out of a foggy time gap, sepia phantom warrior, torn curtain of years, solemn, conjured
```

## skill_seer_s3_paper_limb.png

纸人部位 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, an enemy arm secretly replaced by a white paper limb, folded paper arm, loose threads at the shoulder, sneaky, fragile
```

## skill_seer_s2_spirit_worm.png

灵之虫 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, four translucent spirit worms coiled asleep inside a human chest, glowing worm silhouettes, one worm shattering, parasitic, sacrificial
```

## skill_seer_s2_wish.png

愿望 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a robed figure granting a glowing wish orb to a companion, then whispering another to himself, two golden orbs, praying hands, wondrous, binding
```

## skill_seer_s2_fate_interference.png

命运干扰 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, hands plucking two fate strings, pulling one forward and one back, golden thread harp, time ripples, meddling, fated
```

## skill_seer_s1_regeneration.png

再生 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a puppeteer stitching loose spirit threads from a fallen body into a new marionette, rising wooden puppet, thread spool of souls, macabre, industrious
```

## skill_seer_s1_mystery_realm.png

诡秘之境 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a corner of the battlefield folding into a hidden mist-shrouded sanctum, gray fog dome, distorted silhouettes inside, secluded, divine
```

## skill_seer_s1_restructure.png

重组 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a hand rewriting a glowing rune of blessing into a cursed sigil, inverting rune, light turning to shadow, subversive, precise
```

## skill_seer_s0_miracle.png

奇迹 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a fallen companion rising again within a pillar of golden light, descending radiance, mending wounds, miraculous, triumphant
```

## skill_seer_s0_fooling.png

愚弄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, an attacker striking an illusion while his own shadow wounds him back, splitting false images, reversed shadow, mocking, topsy-turvy
```

## skill_seer_s0_lord_of_spirits.png

灵界掌控者 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a crowned figure enthroned in gray mist, countless spirit threads in his palm, thread crown, kneeling puppet court, majestic, dreadful
```

## skill_seer_s0_fate_anchor.png

命运锚点 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a man nailing his own fate line to the ground with a golden spike, pinned glowing thread, immovable stance, absolute, anchored
```

## skill_seer_s5_spirit_banish.png

灵界放逐 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, an enemy dissolving into gray mist, half-gone from the world, fading translucent body, spirit realm doorway, distant, exiled
```

## skill_seer_s2_spirit_shelter.png

灵界庇护 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a wounded ally drawn into a serene gray-mist refuge, mist cocoon, wounds fading, sheltering, still
```

## skill_seer_s3_spirit_retreat.png

遁入灵界 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a man stepping backward into a fog door as a blade passes through empty air, closing mist portal, whiffed strike, evasive, cool
```

## skill_seer_s1_puppet_displace.png

秘偶置换 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, an enemy hurled into a chaotic gray rift between worlds, turbulent space currents, marionette strings trailing, violent, displaced
```

## skill_seer_s4_secrecy_resonance.png

隐秘共鸣 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, dark victorian occult oil painting, muted gray-blue palette with antique gold accents, tarot card composition, candlelit haze, thick brushstrokes, a figure waving away countless prying eyes like sliding beads of water, deflected gazes, gray secrecy veil, slippery, unseen
```

# 途径：战士（warrior，33 卡）

## skill_warrior_s9_martial_combo.png

格斗术·连击 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a scarred brawler driving two chained punches into a single crack, calloused fists, splintered training post, dust kicked up, kinetic, relentless
```

## skill_warrior_s9_strong_physique.png

强健体魄 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a broad-shouldered fighter stretching sinewy muscle at dawn, rope-veined arms, morning mist, worn leather straps, vigorous, grounded
```

## skill_warrior_s9_arms_mastery.png

兵械通晓 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a warrior weighing a well-worn blade across both palms, racked polearms and axes, oil-stained whetstone, patched gambeson, practiced, calm
```

## skill_warrior_s8_iron_body.png

铁躯 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a pugilist whose skin turns to dull iron as rain slides off, beading rainwater, dull metallic sheen on skin, stoic stance, unyielding, stoic
```

## skill_warrior_s8_close_grapple.png

近身缠斗 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a grappler locking a hulking foe in a crushing clinch, intertwined limbs, pressed-in armor, strained enemy blade, suffocating, tense
```

## skill_warrior_s8_force_deflect.png

卸力 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a fighter brushing aside a writhing force and raising a thin silver ward, deflected shadowy tendril, thin silver light-shield, flowing redirecting hands, fluid, guarded
```

## skill_warrior_s7_weapon_grandmaster.png

武器大师 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a master sweeping through a dozen weapons in one seamless arc, spinning sword into axe, floating weapon silhouettes, precise footwork, effortless, lethal
```

## skill_warrior_s7_weapon_tamer.png

驭器 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a warrior calmly gripping a cursed blade that stops struggling, black resentment curling off steel, steadied trembling edge, firm gauntleted hand, dominant, quiet
```

## skill_warrior_s7_armor_crusher.png

破甲重击 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a heavy overhead blow shattering a breastplate into flying shards, raised great maul, bursting armor fragments, shockwave of dust, crushing, explosive
```

## skill_warrior_s6_dawn_blade.png

晨曦之剑 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a knight condensing sunrise light into a two-handed greatsword, golden light gathering in palm, massive glowing blade, first rays over battlefield, radiant, resolute
```

## skill_warrior_s6_dawn_armor.png

黎明铠甲 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a warrior forged anew in close-fitting armor of living dawnlight, molten gold seams, purifying flames along the plates, dark taint burning away, sacred, steadfast
```

## skill_warrior_s6_dawn_domain.png

晨曦领域 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a knight expanding a dome of morning light that withers lurking shades, expanding golden dome, shattering illusions like glass, recoiling shadow creatures, purifying, majestic
```

## skill_warrior_s6_storm_of_light.png

光之风暴 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a standing knight wrapped in a razor hurricane of invisible light, thousands of thin light streaks, deep cuts blooming on foes, rising luminous gale, scouring, blinding
```

## skill_warrior_s5_guardian_stance.png

守护状态 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a guardian plunging a greatsword into the earth behind an invisible wall, sword buried hilt-deep, shimmering translucent barrier, shielded comrades behind, protective, immovable
```

## skill_warrior_s5_unmoved_heart.png

无幻之心 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a steadfast knight gazing through swirling illusions unfooled, mirror-like phantom fragments, steady unblinking eyes, undisturbed silhouette, lucid, unshaken
```

## skill_warrior_s5_unstoppable.png

无坚不摧 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a single cleaving arc cutting through armor and warding force alike, edge parting glowing ward, splitting dark carapace, single unstoppable swing, decisive, overwhelming
```

## skill_warrior_s4_conceal.png

隐蔽 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a demon-hunter dissolving into the seam between light and dust, half-transparent figure, drifting motes in a sunbeam, folded blade at the ready, elusive, patient
```

## skill_warrior_s4_hunter_eye.png

猎魔之眼 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a hunter's silver-lit eye revealing a monster's weak points, glowing silver iris, outlined vulnerable spots, corruption glowing faintly, penetrating, cold
```

## skill_warrior_s4_hunter_concoction.png

猎魔药剂 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a demon-hunter anointing a blade from a small vial of silvered oil, glowing concoction vial, smeared sacred ointment, chalk sigil on a door, prepared, ritualistic
```

## skill_warrior_s4_gale_charge.png

疾风奔袭 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a hunter sprinting like a hurricane slamming into the enemy line, streaking motion blur, upturned dust trail, comrades rushing behind, ferocious, swift
```

## skill_warrior_s3_silver_full_armor.png

银色全身盔甲 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a silver knight in gleaming full plate shrugging off dragon claws, mirror-bright full plate, fading white scratch on pauldron, towering dragon talons, unbreakable, luminous
```

## skill_warrior_s3_quicksilver.png

水银化 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a warrior flowing as liquid silver across the ground then rising, rippling mercury pool, reforming human silhouette, reflective silver surface, unnerving, fluid
```

## skill_warrior_s3_silver_rapier.png

银白细剑 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a fencer flashing behind the foe as a silver bloom bursts within, slender shining rapier, afterimage of a blink, silver bloom erupting from shadow, precise, lethal
```

## skill_warrior_s3_hide_in_light.png

借光隐藏 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, an empty gleam of light where a silver knight stands unseen, silhouette-shaped absence, unfaded dawn light, unnoticed blade half-drawn, ghostly, serene
```

## skill_warrior_s2_cage.png

牢笼 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, walls of solid light closing into a prison around a roaring monster, converging light walls, pounding fists of the trapped beast, sealing radiant bars, inescapable, solemn
```

## skill_warrior_s2_twilight_greatsword.png

黄昏巨剑 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a colossal greatsword of dusk color falling in a purifying cleave, amber-violet twilight blade, purifying radiance along the edge, age-withered ground below, cataclysmic, sacred
```

## skill_warrior_s2_waning_dusk.png

迟暮 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a knight pressing a fragment of dusk into a gasping enemy's chest, dark amber glow entering the body, withering straining foe, slowing drooping limbs, inexorable, eerie
```

## skill_warrior_s2_twilight_rebirth.png

黄昏重生 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, an old warrior dissolving into dusk mist at the spirit realm's threshold, evaporating aged silhouette, path of fading light, reforming figure beyond the veil, transcendent, somber
```

## skill_warrior_s1_mandate.png

代行 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a herald of a god standing still as borrowed radiance pours in, descending column of light, outstretched receiving hand, distant colossal shadow, suffused, awe-struck
```

## skill_warrior_s1_divine_punishment.png

神罚 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a raised hand pressing down a verdict of crushing vertical light, palm open to the sky, hammering column of radiance, eroded darkened victims below, judging, crushing
```

## skill_warrior_s0_all_things_collapse.png

黄昏·万物崩解 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a twilight giant's presence rotting armor bone and even the ground, crumbling armor fragments, disintegrating skeletal hand, collapsing dark earth, entropic, desolate
```

## skill_warrior_s0_battle_authority.png

战斗权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a towering veteran giant flexing fists of immense measured power, colossal armored frame, measured veteran stance, battlefield spread below, dominant, seasoned
```

## skill_warrior_s0_holy_glory.png

神圣·荣耀即晨曦即黄昏 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, heroic 19th-century European romantic oil painting, bronze and dawn-orange palette with fading gold light, monumental low-angle compositions, battered steel texture and dust haze, a giant's fallen foes dissolving into light raining on comrades, bodies turning to golden light, light streaming onto allies, crimson-to-gold horizon, redemptive, triumphant
```

# 途径：收尸人（corpse_collector，42 卡）

## skill_corpse_collector_s9_corpse_nature.png

尸体特质 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a pale corpse-like figure standing motionless among wandering ghosts, corpse-like pallor, frost breath, indifferent drifting spirits, cold, still
```

## skill_corpse_collector_s9_natural_sight.png

天然灵视 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a gravedigger's eyes glowing as hidden spirits become visible, translucent ghosts, revealed silhouettes, watchful, uncanny
```

## skill_corpse_collector_s9_decay_breath.png

腐息 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a figure exhaling a visible cloud of corpse-fog, greenish miasma, withered grass, fetid, creeping
```

## skill_corpse_collector_s8_gravedigger_body.png

掘墓人体魄 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a broad-shouldered gravedigger resting on his worn shovel, worn shovel, grave soil, calloused hands, sturdy, weathered
```

## skill_corpse_collector_s8_death_eye.png

死亡之眼 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a soul hovering half an inch above a body gazing down, half-detached spirit, spectral sightlines, exposed weaknesses, piercing, spectral
```

## skill_corpse_collector_s8_spirit_whisper.png

灵之耳语 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a ghost leaning close to whisper into a listener ear, translucent whisperer, curling cold breath, secretive, hushed
```

## skill_corpse_collector_s7_seance.png

通灵 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a summoned wraith rising from a candlelit chalk circle, chalk ritual circle, candle flames, answering spirit, summoning, reverent
```

## skill_corpse_collector_s7_kin_of_spirits.png

灵之同类 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a lone figure walking calmly through a crowd of harmless ghosts, relaxed spirits, familiar pale figure, calm, belonging
```

## skill_corpse_collector_s7_death_rite.png

亡灵仪式 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, the dead inside a chalk circle lifting their heads in unison, ritual sigils, raised heads of the dead, guttering candles, ritualistic, eerie
```

## skill_corpse_collector_s6_raise_skeleton.png

唤起骷髅 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, scattered bones assembling into a standing skeleton, self-joining bones, grave dirt, waiting posture, macabre, obedient
```

## skill_corpse_collector_s6_raise_zombie.png

唤起活尸 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a rotting corpse clawing out of cracked earth, split soil, decayed reaching hands, shambling silhouette, gruesome, relentless
```

## skill_corpse_collector_s6_word_of_dead.png

亡者之语 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a single whispered word clawing at a victim bones, visible sound ripple, skeletal resonance, invasive, chilling
```

## skill_corpse_collector_s6_drive_dead.png

驱使亡者 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a raised hand commanding a spirit to turn on its kin, commanding gesture, turning ghost, frozen companions, dominating, cold
```

## skill_corpse_collector_s6_raise_dead.png

唤起亡者 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a hand pressed on a fresh corpse as it rises again, cooling corpse, standing dead, switched allegiance, abrupt, unnatural
```

## skill_corpse_collector_s5_death_envoy.png

死神使者 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a weeping figure whose cry drains the life from a victim, falling teardrops, frostbitten veins, leaking lifelight, mournful, draining
```

## skill_corpse_collector_s5_underworld.png

小型冥界 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, an inner void within a body holding trapped souls, translucent body outline, caged wisps, barred darkness, claustrophobic, hollow
```

## skill_corpse_collector_s5_underworld_release.png

冥界放出 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a figure opening their chest as stored souls pour out, pouring spirit stream, released ghostly faces, open gate of darkness, torrential, released
```

## skill_corpse_collector_s4_underworld_gate.png

冥界之门 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a door-shaped rift in the air leaking the underworld, cracked doorway, seeping gray mist, heavy shadows, oppressive, looming
```

## skill_corpse_collector_s4_flesh_undying.png

不死者 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a dead man rising from his own grave with blank eyes, open grave, forgotten tools, empty stare, blank, cyclical
```

## skill_corpse_collector_s4_flesh_immortal.png

肉体不灭 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a gashed body that refuses to fall, deep closing wound, unbending stance, indomitable, eerie
```

## skill_corpse_collector_s5_undead_haste_drive.png

亡灵驱使 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a skeleton lunging forward ahead of living soldiers, outracing skeleton, dust trail, urgent, macabre
```

## skill_corpse_collector_s3_ferry_gaze.png

摆渡·对视 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a ferryman's eyes meeting a victim's gaze across the dark, locking gaze, frozen victim, shadowed boatman, fatal, silent
```

## skill_corpse_collector_s3_left_hand.png

左手触碰 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a pale left hand resting on a doomed shoulder, deathly palm mark, sinking shadow, inevitable, dread
```

## skill_corpse_collector_s3_right_hand.png

右手触碰 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a pale right hand lifting the shadow off a saved victim, receding dark mark, steadying grip, merciful, quiet
```

## skill_corpse_collector_s3_ferryman_body.png

摆渡人之躯 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a weathered ferryman standing at the shore of a dead river, worn cloak, still black water, distant far shore, timeless, impervious
```

## skill_corpse_collector_s2_true_death.png

完全的死亡 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a raised hand drawing a boundary where all life ends, ink-black borderline, withered ground inside, absolute, silent
```

## skill_corpse_collector_s2_undead_king.png

亡者之王 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a small inner underworld swelling into an army of the dead, expanding dark circle, massed skeleton ranks, regal, overwhelming
```

## skill_corpse_collector_s2_pale_kingdom.png

死亡之国 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, the land underfoot bleaching into pale death, draining color, falling figures, rising dead, desolate, inevitable
```

## skill_corpse_collector_s1_death_sentence.png

死亡宣告 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a pointed finger condemning a trembling victim, accusing fingertip, dimming victim silhouette, final, calm
```

## skill_corpse_collector_s1_pale_world.png

苍白世界 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a spread palm draining all color from the world, bleaching landscape, fading banners, vast, hollow
```

## skill_corpse_collector_s1_spirit_master.png

灵之主宰 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, an outstretched palm holding kneeling spirits, kneeling ghostly figures, dominating hand, absolute, sovereign
```

## skill_corpse_collector_s1_soul_capture.png

灵魂掌控 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a soul pulled from a fallen body joining the collector, extracted spirit, abandoned corpse, turning allegiance, predatory, smooth
```

## skill_corpse_collector_s0_death_authority.png

死亡权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a spoken word extinguishing the flames of a life, snuffing life-flames, fading emblems, total, quiet
```

## skill_corpse_collector_s0_journeys_end.png

一切的归宿 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a silent figure drawing all paths toward one final point, converging roads, settling dust, welcoming darkness, final, serene
```

## skill_corpse_collector_s0_undead_authority.png

亡灵权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, every fallen body rising to join an endless column, endless undead column, mustering dead, relentless, orderly
```

## skill_corpse_collector_s9_sight_awaken.png

灵视觉醒 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, newly opened eyes beholding a queue of spirits, spectral queue, freshly opened eyes, awakening, uncanny
```

## skill_corpse_collector_s7_ghost_see.png

幽冥窥视 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a ghostly eye peering through layers of disguise, piercing spectral eye, peeling camouflage, penetrating, cold
```

## skill_corpse_collector_s6_spirit_touch.png

通灵之触 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, cold fingertips brushing pale whispering mist, reaching fingers, curling spirit mist, intimate, chilling
```

## skill_corpse_collector_s5_dead_whisper.png

亡者低语 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a skull leaning close to an ear whispering a warning, leaning skull, curling spectral breath, urgent, spectral
```

## skill_corpse_collector_s4_spirit_lookout.png

灵界瞭望 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a watcher gazing down on a battlefield from the spirit realm, high vantage, translucent battlefield, glowing targets, omniscient, detached
```

## skill_corpse_collector_s3_death_omen.png

死兆预感 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a figure sensing the familiar smell of approaching death, drifting black motes, knowing glance, resigned, certain
```

## skill_corpse_collector_s2_end_eye.png

终末之眼 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, somber Victorian-era gothic underworld illustration, pallid jade and bone-white palette, misty low-angle compositions lit by cold lantern glow, drifting spirit wisps, aged parchment grain texture, a single burning eye seeing through every disguise, blazing terminal eye, shredding veils, merciless, revealing
```

# 途径：歌颂者（chanter，41 卡）

## skill_chanter_s9_chant.png

歌颂 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a chanter singing as golden notes flow into a companion's chest, golden musical notes, uplifted faces, glowing hymn scroll, uplifting, warm
```

## skill_chanter_s9_battle_hymn.png

勇气赞歌 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a warrior straightening his back as a bright hymn rings out, rising golden notes, steadied blade, rousing, bright
```

## skill_chanter_s9_spirit_recovery.png

灵性恢复 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a chanter breathing in light as holy radiance refills his spirit, swirling holy light, closed eyes, renewed inner glow, serene, renewing
```

## skill_chanter_s8_daylight.png

白昼 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a ring of white daylight spreading across dark ground, shadows fleeing, circle of daylight, fleeing shadows, revelatory, calm
```

## skill_chanter_s8_sunshine.png

日照 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a beam of fierce sunlight burning unclean creatures below, blazing sunbeam, scorching light, writhing shadows, searing, righteous
```

## skill_chanter_s8_blessing.png

祝福 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a chanter laying a glowing palm on a companion's shoulder, wounds closing, warm palm glow, closing wounds, gentle light, gentle, comforting
```

## skill_chanter_s9_tone_of_obedience.png

服从之音 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a singer's voice coiling around an enemy like an unbreakable command, coiling golden voice, slowing blade, coercive, solemn
```

## skill_chanter_s7_summon_holy_light.png

召唤圣光 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a chanter raising his palm as a pillar of holy light descends, descending light pillar, raised palm, majestic, blazing
```

## skill_chanter_s7_holy_water.png

制造圣水 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, holy water pouring from a small vial, stitching a companion's wounds shut, crystal vial, glowing water threads, closing wounds, tender, cleansing
```

## skill_chanter_s7_purifying_slash.png

净化之斩 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a blade of condensed holy light slicing through an enemy's dark blessings, glowing light blade, peeling dark shroud, decisive, radiant
```

## skill_chanter_s7_sacred_flame.png

光明之火 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a silver-white flame clinging to a foe, burning away corruption, silver-white flame, dissolving corruption, pure, relentless
```

## skill_chanter_s7_sun_aura.png

太阳光环 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a chanter wreathed in a ring of solar radiance shielding his allies, solar halo ring, protected companions, protective, warm
```

## skill_chanter_s7_fearless.png

免疫恐惧 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, an unshaken chanter standing firm as shadows and plague recoil, receding shadows, steady stance, fearless, steadfast
```

## skill_chanter_s6_notarize.png

公证 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a notary raising a glowing seal over truth and falsehood, radiant official seal, scales of judgment, authoritative, impartial
```

## skill_chanter_s7_holy_oath.png

神圣誓约 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, two figures bound by glowing covenant runes drawn between them, glowing oath runes, linked figures, binding, grave
```

## skill_chanter_s5_divine_light.png

神圣之光 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a blazing column of light descending from heaven, vaporizing a foe, descending light column, evaporating enemy, apocalyptic, pure
```

## skill_chanter_s5_purifying_nimbus.png

净化光环 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a ring of golden radiance expanding outward from the caster, expanding golden ring, splitting gentle and sharp light, sweeping, holy
```

## skill_chanter_s5_foe_of_filth.png

邪秽克星 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a priest whose piercing light exposes lurking filth and undead, piercing holy light, exposed undead shadows, hunting, righteous
```

## skill_chanter_s4_zone_no_darkness.png

无暗之域 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a domain of pure light before the caster where no shadow survives, shadowless light domain, erased shadows, absolute, serene
```

## skill_chanter_s4_spear_of_light.png

无暗之枪 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a spear of pure light hurled forward, stripping an enemy's blessings, light spear, peeling dark auras, piercing, triumphant
```

## skill_chanter_s4_pure_white_ray.png

纯白射线 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a thin ray of pure white light piercing straight through a formation, threadlike white ray, pierced ranks, precise, incandescent
```

## skill_chanter_s4_sacred_armor.png

神圣盔甲 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, an invisible suit of sacred armor glowing over the caster's body, translucent golden armor, raised fists, unyielding, blessed
```

## skill_chanter_s4_sun_oath.png

太阳誓约 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a solar covenant burning any who raise their blades against it, ring of sun-fire runes, burning blades, judging, searing
```

## skill_chanter_s3_justice_code.png

正义准则 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a chanter inscribing a glowing code of justice across the battlefield, glowing law inscription, battlefield panorama, solemn, commanding
```

## skill_chanter_s3_judgment.png

正义审判 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a judge's gavel of light falling as a foe's power is stripped away, verdict light gavel, dissolving dark strength, final, righteous
```

## skill_chanter_s3_justice_aura.png

正义光环 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, an invisible halo of law strengthening the orderly and dulling the defiant, invisible ring of law, empowered allies, ordering, impartial
```

## skill_chanter_s2_photonic_form.png

化光 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a body scattering into light then reassembling untouched, dissolving light motes, reassembling figure, ethereal, untouchable
```

## skill_chanter_s2_sun_herald.png

太阳使者 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a caster transformed into a miniature sun hanging over the battlefield, miniature sun, purifying heat rays, overwhelming, purifying
```

## skill_chanter_s2_light_authority.png

光之权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a radiant figure wielding the scepter of all light, scepter of light, commanding radiance, sovereign, blazing
```

## skill_chanter_s1_holy_nation.png

神圣之国 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a phantom nation of light-walled cities rising behind the caster, city of light walls, burning fields outside, sublime, terrible
```

## skill_chanter_s1_pure_white_light.png

纯白之光 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, pure white light erasing a foe and turning it into cleansing water, tidal white light, dissolving form, absolute, cleansing
```

## skill_chanter_s1_zeal.png

信仰之仆 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, fervent believers bathed in burning faith, wounds ignored, burning halo of faith, fervent crowd, fervent, ecstatic
```

## skill_chanter_s0_divine_authority.png

神圣权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a divine radiance sweeping away all discordant things before it, sweeping divine light, dissolving corruption, supreme, purging
```

## skill_chanter_s0_light_immortal.png

光之不朽 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, shattered light gathering itself back into an immortal form, reforming light shards, undying figure, eternal, invincible
```

## skill_chanter_s0_order_authority.png

秩序权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, an unchanging golden order radiating from the caster's own law, golden order mandala, unbreakable covenant seal, absolute, self-assured
```

## skill_chanter_s8_holy_blessing.png

圣咏赐福 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a gentle hymn blessing companions with soft holy light, soft hymn glow, comforted companions, soothing, devout
```

## skill_chanter_s6_valiant_hymn.png

英勇颂歌 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a war anthem sounding like a charge horn over the field, horn-shaped golden notes, charging banners, valiant, stirring
```

## skill_chanter_s5_endless_hymn.png

不息赞歌 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a chanter endlessly singing a requiem tune, unbroken stream of notes, endless hymn, endless, mournful
```

## skill_chanter_s4_purify_chant.png

净化圣咏 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a purifying chant driving filth back with rings of holy verse, rings of holy verse, retreating corruption, repelling, pure
```

## skill_chanter_s3_light_blessing.png

光之赞礼 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a figure standing within eternal light, unafraid of shadows, pillar of standing light, recoiling shadows, confident, blessed
```

## skill_chanter_s2_finale_hymn.png

终焉颂歌 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, luminous baroque religious altarpiece, radiant white-gold and amber palette, descending shafts of choir light with low horizon composition, gilt halos and drifting incense glow, a final hymn sounding as an enemy's life ends in light, last golden note, dissolving enemy, final, transcendent
```

# 途径：水手（sailor，42 卡）

## skill_sailor_s9_great_strength.png

卓越力量 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a weathered sailor hauling a thick mooring rope on a rolling deck, straining rope, coiled hawser, sea-worn calloused hands, tireless, iron-willed
```

## skill_sailor_s9_scale_veil.png

幻鳞 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a sailor whose skin shimmers with slick translucent scales that no hand can grip, slipping grasp, iridescent scale sheen, slippery, elusive
```

## skill_sailor_s9_aquatic_agility.png

水中灵活 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a sailor sliding underwater like a sea creature, leaving only a fading water-shadow, parting waves, dissolving water shadow, fluid, swift
```

## skill_sailor_s8_rage_burst.png

愤怒爆发 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a brawler's chest glowing with banked inner fire as he endures blow after blow, smoldering ember glow, clenched fists, bruised torso, seething, relentless
```

## skill_sailor_s8_rage_swipe.png

暴怒挥击 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a furious sailor swinging one heavy fist in a wild brutal arc, blurred fist arc, spitting sparks of rage, ferocious, heated
```

## skill_sailor_s8_rage_strike.png

暴怒一击 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a sailor pouring all his pent-up fury into one devastating downward blow, coiled muscles, shockwave at impact, explosive, cathartic
```

## skill_sailor_s7_navigator_intuition.png

天文地理直觉 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a navigator reading glowing currents and wind-lines above a tattered sea chart, swinging compass needle, swirling current lines, torn chart, attuned, prescient
```

## skill_sailor_s7_ocean_blessing.png

海洋眷顾 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a sailor standing chest-deep in friendly waves that cradle and strengthen him, embracing green waves, warm seawater glow, favored, steadfast
```

## skill_sailor_s6_gale.png

狂风 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a howling gale slamming into an enemy line and staggering soldiers backward, bent flagpoles, flying debris, visible wind shear, forceful, overwhelming
```

## skill_sailor_s6_wind_blade.png

风刃 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a thin crescent of compressed air slicing across the battlefield, silver air-arc, parted dust trail, precise, cold
```

## skill_sailor_s6_hurricane_coil.png

飓风盘绕 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a cyclone coiling around a struggling foe, pinning it helpless in midair, spiraling wind column, spinning debris, levitating victim, suffocating, dominant
```

## skill_sailor_s6_accel_glide.png

加速与滑翔 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a sailor skimming across the ground on wind currents, gliding away from closing foes, wind-lit wake, leaning glide posture, fleet, untouchable
```

## skill_sailor_s6_deep_dive.png

深潜 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a sailor plunging deep into dark blue water, vanishing from every enemy's sight, fading silhouette, rising bubbles, dim abyssal light, hidden, patient
```

## skill_sailor_s5_lightning_arrow.png

雷电之矢 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a javelin of pure lightning streaking straight through an enemy, forked electric shaft, scorched line of air, piercing, incandescent
```

## skill_sailor_s5_thunder_strike.png

雷击 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a bolt of lightning striking down and crawling over a paralyzed foe, jagged white bolt, convulsing silhouette, judging, searing
```

## skill_sailor_s5_ocean_song.png

海洋之歌 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a sailor singing, his throat ringing with rolling thunder over dark waves, visible sound ripples, stirred sea surface, resonant, primordial
```

## skill_sailor_s5_water_veil.png

水幕 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a flowing curtain of water rising before the crew, catching the first volley, translucent water wall, arrested projectiles, shielding, flowing
```

## skill_sailor_s4_blade_legion.png

风刃军团 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, hundreds of wind blades arrayed behind the sailor, raining down as one, ranked silver arcs, slashing rain of air, inescapable, stormlike
```

## skill_sailor_s4_tsunami.png

海啸 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a towering wall of water rolling across the field, swallowing the enemy line, looming green wave crest, tossed soldiers, apocalyptic, devouring
```

## skill_sailor_s4_chain_lightning.png

连环闪电 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a living arc of lightning biting one target after another across scorched ground, leaping electric serpent, scorched hop trail, hunting, electric
```

## skill_sailor_s4_tornado.png

龙卷风 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a tornado ripping up from the ground and hurling a foe to the far end of the field, dust-dark funnel, flailing silhouettes, violent, uprooting
```

## skill_sailor_s4_true_flight.png

真正飞行 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a sailor rising free of the earth, the battlefield falling away beneath him, outstretched arms, distant battlefield below, liberated, transcendent
```

## skill_sailor_s4_don_armor.png

披甲 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a high priest of disaster clad in armor condensed from living storm, crackling storm plate, crown of static, ominous, armored
```

## skill_sailor_s3_sea_kingdom.png

海王领域 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, the surrounding sea obeying one master while enemy soldiers wade against its waves, crowned water currents, struggling waders, sovereign, oppressive
```

## skill_sailor_s3_sea_beast_call.png

海兽呼唤 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a colossal sea beast breaching the waves to answer its caller's command, bursting water crest, massive finned silhouette, beckoning arm, primordial, answered
```

## skill_sailor_s3_lightning_storm.png

闪电风暴 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a field crackling with hundreds of serpentine lightning bolts under a black sky, dense electric web, flickering storm clouds, chaotic, stifling
```

## skill_sailor_s3_annihilation_drop.png

毁灭水滴 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a single drop of infinitely compressed seawater drifting down through every barrier, glistening perfect droplet, pierced shields, deceptive, inevitable
```

## skill_sailor_s3_sonic_boom.png

音爆 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, one spoken syllable detonating the air and stunning the enemy line deaf, visible shock ring, recoiling soldiers, deafening, arresting
```

## skill_sailor_s2_rage_origin.png

愤怒之源 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a living embodiment of rage whose body burns brighter with every strike endured, twin inner flames, molten skin glow, incandescent, wrathful
```

## skill_sailor_s2_dread_voice.png

恐惧之音 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a sailor uttering one syllable that fills every living face with bone-deep terror, trembling hands, averted eyes, cold sweat, dread-laden, paralyzing
```

## skill_sailor_s2_calamity_descent.png

天灾降临 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a calamity herald descending amid lightning, blizzard and crushing tidal waves, split storm sky, shattered ice spires, rising surge, apocalyptic, chosen
```

## skill_sailor_s1_divine_punishment.png

天罚 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a pillar of divine punishment falling from the clouds to shatter wards and body alike, descending light column, splintering ward glyphs, implacable, sacred
```

## skill_sailor_s1_light_incarnate.png

光之化身 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a sailor transformed into a being of pure light, blades and bolts passing through him, radiant translucent body, streaking afterimages, blinding, unbound
```

## skill_sailor_s1_storm_hell.png

风暴地狱 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, an entire storm-hell transplanted onto the battlefield, lightning serpents tearing endlessly, endless lightning serpents, screaming wind vortices, eternal, ravaging
```

## skill_sailor_s0_tyrant_mandate.png

暴君权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a supreme tyrant looming over kneeling enemies, fury blazing in his eyes, bowed enemy ranks, crown of storm fire, domineering, wrathful
```

## skill_sailor_s0_matter_transmute.png

物质转化 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, enemy armor warping into blades that twist back toward its own wearer, buckling metal plates, reversed blade edges, unnerving, ironic
```

## skill_sailor_s9_rage_roar.png

怒涛咆哮 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, huge waves carrying the sailor's rage smashing an enemy ship to splinters, cresting furious waves, snapping mast, splintered hull, crushing, vengeful
```

## skill_sailor_s7_raging_sea.png

怒海翻腾 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, waves hammering the deck in rhythm with the sailor's rising fury, pounding whitecaps, balled fists, swelling, brooding
```

## skill_sailor_s6_blood_surge.png

血潮怒涌 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a sailor's every slash trailing scalding blood-red mist, crimson vapor arcs, glowing cut lines, feral, burning
```

## skill_sailor_s5_wrath_body.png

盛怒之躯 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a sailor's body brimming with fury like an overfilled vessel about to burst, cracking skin glow, trembling frame, volcanic, brimful
```

## skill_sailor_s4_wrath_smash.png

怒意重击 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, one devastating blow bending solid steel like wet rope, buckled steel plate, sunken impact crater, unyielding, crushing
```

## skill_sailor_s3_tyrant_edict.png

暴君裁决 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, sweeping romantic seascape oil painting, deep sea-green and slate palette crackling with electric-gold lightning, towering wave composition with wind-torn spray, thick salt-sprayed impasto, a tyrant gazing down from on high, everything beneath him reduced to wrath's targets, high aerial vantage, tiny figures below, glowing judgmental eye, contemptuous, final
```

# 途径：猎人（hunter，43 卡）

## skill_hunter_s9_hunter_sense.png

猎人的感官 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a tracker kneeling to read faint glowing footprints in dark forest moss, glowing footprint trail, drifting scent wisps, heartbeat ripples in air, alert, predatory
```

## skill_hunter_s9_structural_eye.png

结构要点 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a hunter's cold gaze tracing glowing seams across an enemy's armor, cracked armor plates, glowing weak-point lines, drawn bow silhouette, analytical, cold
```

## skill_hunter_s9_wild_survival.png

野外生存 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a rugged hunter in a bear-pelt cloak standing firm in deep wilderness, ember campfire, dense forest clearing, pelt cloak and weathered gear, rugged, enduring
```

## skill_hunter_s9_pounce.png

扑杀 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a hunter pouncing like a beast onto its startled prey, explosive motion blur, bared blade, kicked-up leaves, explosive, savage
```

## skill_hunter_s8_provoke.png

挑衅 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a smirking hunter taunting an enraged brute into a reckless charge, mocking gesture, red-faced charging enemy, abandoned battle formation, mocking, reckless
```

## skill_hunter_s8_humiliation.png

羞辱 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a hunter laughing off a grazing blow while his foe's guard cracks wider, grazing strike spark, widening armor crack, sneering grin, contemptuous, provoking
```

## skill_hunter_s7_fire_crow.png

火鸦术 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a crow of living flame bursting from a caster's outstretched palm, winged fire, scattering embers, scorched feather trails, fierce, incendiary
```

## skill_hunter_s7_white_lance.png

炽白之枪 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a blinding white-hot spear of compressed fire piercing heavy plate armor, white flame core, molten armor rim, light streak, piercing, overwhelming
```

## skill_hunter_s7_wall_of_fire.png

燃烧之墙 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a towering wall of fire splitting the battlefield cleanly in two, raging flame curtain, hesitant soldiers, scorched dividing line, dominating, searing
```

## skill_hunter_s7_delayed_blast.png

延时爆炸 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a smoldering fire seed buried at an oblivious enemy's feet, glowing ground crack, wisps of smoke, unknowing target, patient, ominous
```

## skill_hunter_s7_flame_armament.png

火焰附魔 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, flames crawling up a hunter's blade and spreading beneath his skin, flaming saber, ember-veined arms, heat shimmer, blazing, defiant
```

## skill_hunter_s7_fuel_fire.png

注火 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a hunter stoking a burning blaze with fresh wood at every strike, stoked flames, armful of fuel, growing inferno, relentless, feeding
```

## skill_hunter_s6_deceived.png

误导 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, an enemy blade slicing through the hunter's dissolving afterimage, fading phantom, steel cutting empty air, sly grin at the edge, deceptive, elusive
```

## skill_hunter_s6_incited.png

煽动 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a whispered word turning one soldier's blade toward his own comrade, cupped whisper, suspicious glare, weapon leveled at ally, insidious, divisive
```

## skill_hunter_s6_flame_saber.png

火焰马刀 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a saber of sculpted flame hooking an enemy off balance, curved flame blade, dragged stumbling foe, glowing arc trail, brutal, flashy
```

## skill_hunter_s5_weak_point.png

弱点侦察 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a hunter's mystical sight laying bare every seam, scar and stagnant spirit, glowing exposed weak points, peeled ward layers, focused third-eye gaze, piercing, clinical
```

## skill_hunter_s5_harvest.png

收割 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a sickle-blade drawing a glowing thread of life from an open wound, red lifeline flowing to wielder, marked weak point, curved harvesting blade, predatory, hungry
```

## skill_hunter_s5_precision.png

精准 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a single unerring arrow flying past every shield to its chosen mark, true arrow line, discarded dropped shields, fixed glowing target point, inevitable, focused
```

## skill_hunter_s4_steel_body.png

钢铁化 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a warrior's skin hardening into cold iron-gray plates mid-battle, metallic sheen spreading over skin, anvil-spark impacts, clenched iron fist, unyielding, stolid
```

## skill_hunter_s4_flame_form.png

火焰化 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a body dissolving and re-forming as a towering human-shaped flame, fire silhouette, punch passing through and igniting, swirling ember mantle, ethereal, burning
```

## skill_hunter_s4_remote_bombard.png

远程轰炸 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, fireballs raining from the sky onto a distant battlefield, descending meteor fireballs, impact plume columns, scattering tiny soldiers, overwhelming, distant
```

## skill_hunter_s4_massing.png

集众·铁血 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a knight anchoring a glowing web that links every ally on the field, luminous connection threads, shared vision glimmer, knight's planted banner stance, unified, steadfast
```

## skill_hunter_s4_iron_courage.png

钢铁勇气 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a knight unmoved as dark tendrils of fear shatter against him, shattering fear tendrils, unbroken war banner, unflinching forward gaze, fearless, resolute
```

## skill_hunter_s3_borrow_ability.png

借用能力 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a commander drawing a glowing stream of strength out of a comrade, flowing light tether, outstretched taking hand, brightening core in chest, covetous, commanding
```

## skill_hunter_s3_war_cry.png

战吼 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a warlord's roar visibly swelling the morale of the whole battle line, sound-wave shockwave, raised fists along the line, surging lifted banners, rousing, thunderous
```

## skill_hunter_s3_war_mist.png

战争迷雾 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, thick gray war fog swallowing an enemy formation whole, rolling fog banks, wavering lost silhouettes, concealed friendly line, oppressive, secretive
```

## skill_hunter_s3_sacrifice_prayer.png

献祭祈求 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, an offering pushed forward as a vast spectral war-god eye opens above, sacrificial blaze, enormous watching eye, outflung pleading arms, grim, reverent
```

## skill_hunter_s3_mind_link.png

心灵沟通 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, silent understanding passing eyelessly between allied soldiers, linked glowing thought-lines, shared highlighted target, nodding allies in sync, silent, synchronized
```

## skill_hunter_s2_extreme_weather.png

操纵天气 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a stormcaller bending churning storm clouds low over the field, lightning-laced cloud mass, whipping snow and sand, wind-bowed trees, cataclysmic, majestic
```

## skill_hunter_s2_purple_flame.png

紫色火焰 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, an unnatural violet flame blooming from a hunter's open palm, purple fire core, darkened surroundings, ember halo, eerie, transcendent
```

## skill_hunter_s2_sharing_unlimited.png

无限制分享 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a glowing boon splitting into fragments that fly to every ally, splitting light fragments, receiving outstretched hands, shared radiance, generous, amplifying
```

## skill_hunter_s1_conquer.png

征服 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a conqueror's single word dropping an enemy to its knees, kneeling broken foe, bowed unwilling head, commanding outstretched hand, absolute, dominating
```

## skill_hunter_s1_dolls_to_soldiers.png

以偶为兵 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, broken traps and battlefield debris rising upright as crude soldiers, animated junk-and-iron soldiers, sprung bear traps, clenched wooden fists, uncanny, mobilizing
```

## skill_hunter_s1_spear_of_ruin.png

毁灭之矛 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a thrown spear trailing a foretold fate toward a marked weak point, fate-written spear, glowing marked weakness, terminal point of light, terminal, inexorable
```

## skill_hunter_s1_massing_ascend.png

集众质变 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, many silhouettes breathing in unison behind their war leader, synchronized stances, converging blade glints, rising red aura, transcendent, united
```

## skill_hunter_s0_war_mandate.png

战争权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a red priest whose mere presence ignites war frenzy in all who face him, rolling crimson aura waves, soldiers blind with rage, soaring war banner, frenzied, sovereign
```

## skill_hunter_s0_ruin_mandate.png

毁灭权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, everything not yet dead unraveling into nothingness at a gesture, dissolving figures, void-like erasure edge, drifting ash motes, annihilating, absolute
```

## skill_hunter_s9_seed_doubt.png

暗布疑云 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a single whispered sentence curling doubt wisps through a listener's mind, curling gray doubt wisps, clouding eyes, forking shadow paths, subtle, unsettling
```

## skill_hunter_s7_schemer.png

阴谋家 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a hidden schemer grinning from deep shadow, half-lit sly face, faint scheme-strings, concealed dagger glint, scheming, hidden
```

## skill_hunter_s5_divide.png

离间之计 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, former comrades turning their blades on one another, crossed weapons between allies, widening rift, knowing smile in the dark, treacherous, divisive
```

## skill_hunter_s4_lay_trap.png

陷阱布置 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a hunter crouching to set a steel snare beneath forest undergrowth, concealed bear trap, camouflage of leaves, patient careful hands, patient, deadly
```

## skill_hunter_s3_shadow_planner.png

暗影策划 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a war plan unfolding across a shadow-draped map table, darkened campaign map, silhouetted moving tokens, disembodied planner's hand, calculating, concealed
```

## skill_hunter_s2_final_intrigue.png

终局阴谋 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grizzled 19th-century European dark-fantasy wilderness hunt illustration, ember-orange and deep forest-green palette, dynamic diagonal composition with raking firelight, rough weathered textures, a closing net of shadow threads tightening around a doomed mark, converging scheme threads, struck faltering target, final dagger arc, decisive, terminal
```

# 途径：秘祈人（supplicant，33 卡）

## skill_supplicant_s9_inspiration.png

灵感 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a robed supplicant turning toward a writhing darkness in the air, twitching fingers, spreading black tendrils, guttering candle, premonitory, uneasy
```

## skill_supplicant_s9_sacrifice_rite.png

祭祀仪式 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant cutting his own palm over a blood-smeared stone altar, blood dripping onto carvings, ring of black candles, devout, excruciating
```

## skill_supplicant_s8_listen.png

倾听 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant pressing his ear to a crack leaking whispers, black spiral sound-wisps, thinning candle flames, obsessive, fraying
```

## skill_supplicant_s8_whisper.png

耳语 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant exhaling a black whisper into a soldier's ear, unfocusing eyes, drifting black breath, insidious, numbing
```

## skill_supplicant_s8_twisted_power.png

扭曲之力 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a grinning supplicant wrapped in black veins of madness, cracked porcelain mask, writhing shadow veins, feral, gleeful
```

## skill_supplicant_s7_shadow_dwell.png

藏入阴影 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant sinking waist-deep into his own shadow, living darkness pooling, fading footprints, furtive, silent
```

## skill_supplicant_s7_summon_shadow.png

召唤阴影 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant dragging a clawed shadow creature out of darkness, grasping inhuman hand, torn shadow membrane, summoning, ominous
```

## skill_supplicant_s7_shadow_curse.png

阴影诅咒 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a black shroud of shadow clinging to a rotting victim, dissolving flesh, dripping blackness, corrupting, suffocating
```

## skill_supplicant_s7_shadow_mastery.png

操纵阴影 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant gliding on a rising wave of shadow, coiled shadow shield, trailing umbra, commanding, fluid
```

## skill_supplicant_s6_flesh_heal.png

血肉治愈 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant's palm sealing a gaping wound with regrowing flesh, knitting flesh threads, pulsing red glow, morbid, tender
```

## skill_supplicant_s6_flesh_cloak.png

血肉披风 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant draped in a cloak of writhing living flesh, twitching red tendrils, glistening muscle, repulsive, protective
```

## skill_supplicant_s6_flesh_bomb.png

血肉炸弹 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant stuffing a pulsing chunk of flesh into a wound, swollen glowing meat, crackling veins, calculated, gruesome
```

## skill_supplicant_s6_liquefy_parasite.png

液化寄生 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant melting into a red pool sliding toward an ear, liquefying body, creeping blood pool, viscous, invasive
```

## skill_supplicant_s6_flesh_servant.png

血肉仆役 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a torn lump of flesh sprouting limbs on the floor, growing arms and legs, dripping red mass, abominable, loyal
```

## skill_supplicant_s6_flesh_replenish.png

补充血肉 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant absorbing red tendrils from a fallen corpse, reaching flesh threads, dissolving carcass, ravenous, cyclical
```

## skill_supplicant_s5_graze_soul.png

放牧灵魂 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant swallowing a screaming translucent soul whole, thrashing ghostly figure, bulging throat, predatory, rapturous
```

## skill_supplicant_s5_soul_paddock.png

灵魂牧场 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, souls grazing like cattle inside a vast ribcage pasture, tethered spirit herds, rib-fence bones, pastoral, macabre
```

## skill_supplicant_s5_drive_soul.png

驱使灵魂 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a chained soul hurling itself from a supplicant's chest, snapping black chains, hateful spectral face, vengeful, unleashed
```

## skill_supplicant_s5_shadow_bind.png

掌控阴影 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, thick black shadows coiling around a crushed victim, constricting shadow coils, flattened silhouette, crushing, inescapable
```

## skill_supplicant_s4_black_armor.png

黑甲 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant swelling inside jagged living black armor, swallowing armor plates, spiked pauldrons, immovable, looming
```

## skill_supplicant_s4_soul_flesh_blade.png

灵肉之刃 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a colossal black blade splitting flesh and soul together, cracking soul fragments, festering wound glow, severing, absolute
```

## skill_supplicant_s4_fallen_shadow.png

堕落之影 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, risen shadows twisting into screaming faces above enemies, warped face-shaped shadows, spreading rot, swarming, decaying
```

## skill_supplicant_s3_three_headed.png

三首形态 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a three-headed supplicant looming with cracked necks, torn neck flesh, three staring faces, monstrous, unified
```

## skill_supplicant_s3_shadow_double.png

阴影替身术 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant's shadow split in half by a falling blade, bisected shadow, retreating real form, deceptive, evasive
```

## skill_supplicant_s3_flesh_immortal.png

血肉不灭 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a body regrowing from a single pulsing red cell, budding flesh, reassembling silhouette, tenacious, cyclical
```

## skill_supplicant_s2_word_spirit.png

秽语·言灵 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, spoken words turning into knives piercing the speaker, blade-shaped black syllables, self-inflicted wounds, ironic, fatal
```

## skill_supplicant_s2_curse.png

秽语·诅咒 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, filthy syllables crawling over blackening wounded skin, crawling dark glyphs, blackening flesh, corrupting, insidious
```

## skill_supplicant_s1_dark_sea.png

黑暗海洋 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, an ocean of liquid darkness flooding a battlefield, drowning enemies, supplicant seeing clearly beneath, drowning, surreal
```

## skill_supplicant_s1_wasting.png

秽语·流逝 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, enemies' bodies fading translucent as madness blooms in their eyes, dissolving limbs, burning mad eyes, draining, feverish
```

## skill_supplicant_s1_shadow_sovereign.png

阴影统治者 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant seated on a throne of kneeling shadows, bowing shadow figures, crowned silhouette, domineering, abyssal
```

## skill_supplicant_s1_fallen_kin.png

堕落眷属 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, twenty-two twisted soul-figures massing behind their releaser, huddled spectral horde, black tide of bodies, swarming, overwhelming
```

## skill_supplicant_s0_abomination.png

异变 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a monster assembling itself from corpses' stitched flesh, grafted body parts, reaching dead hands, abhorrent, assembling
```

## skill_supplicant_s0_scapegoat.png

替罪 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, visceral Victorian-era eldritch ritual painting, deep crimson and bone-white palette, altar-centered candlelight composition, wet organic texture, a supplicant hanging upon a wooden frame in another's place, transferred bleeding wounds, empty noose behind, sacrificial, solemn
```

# 途径：窥秘人（pryer，38 卡）

## skill_pryer_s9_scrying_eye.png

窥秘之眼 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a scholar's luminous eye revealing three overlapping auras around a hidden figure, layered spectral auras, gazing third eye, faint rune circles, piercing, secretive
```

## skill_pryer_s9_rapid_ritual.png

快速仪式 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a mage rushing through ritual gestures as chant glyphs stream from his lips, burning ritual chalk, floating incantation glyphs, urgent, fluid
```

## skill_pryer_s9_astro_divination.png

占星术 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a robed astrologer tracing a star map to quicken an ally's stride, rotating star chart, silver constellation threads, fateful, guiding
```

## skill_pryer_s9_arcane_knowledge.png

神秘知识 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a scholar pulling luminous threads of knowledge from towering ancient tomes, floating open books, glowing script ribbons, studious, reverent
```

## skill_pryer_s8_adaptive_martial_arts.png

格斗术·因敌施技 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a scholar-fighter shifting stance mid-strike, reading his opponent's form, mirrored stance shadows, ink motion trails, adaptive, sharp
```

## skill_pryer_s8_scholar_physique.png

学者体魄 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a lean scholar rolling up his sleeves to reveal a wiry scarred frame, stacked training manuals, chalk-dusted knuckles, quiet, resilient
```

## skill_pryer_s7_illumination.png

照明术 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a burst of white light erupting from an open palm, exposing hidden marks, blinding palm flare, dark sigils surfacing, revealing, stark
```

## skill_pryer_s7_lightning_bolt.png

闪电术 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a forked lightning arc leaping from outstretched fingertips, crackling electric tendrils, singed air glow, sudden, violent
```

## skill_pryer_s7_gust_of_wind.png

造风术 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a sweeping arm summoning a spiraling gust that hurls an enemy backward, swirling wind ribbons, scattering debris, forceful, sweeping
```

## skill_pryer_s7_forceful_hand.png

力场之手 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a translucent giant hand dragging a struggling foe across broken ground, spectral grasping fingers, furrowed earth trail, dominating, crushing
```

## skill_pryer_s7_scattered_materials.png

洒材料 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a handful of glowing powders, sulfur ice and silver dust, scattered midair, amber sulfur grains, silver powder cloud, unpredictable, volatile
```

## skill_pryer_s7_spell_analysis.png

法术解析 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, an enemy's spell rune fracturing into readable symbols suspended midair, splitting spell glyph, dissected symbol chain, analytical, cold
```

## skill_pryer_s6_scroll_frost.png

卷轴·冰冻 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a frost-rimed scroll crumbling to ash, condensing an invisible ice wall, burning scroll edges, crystallizing ice lattice, patient, frigid
```

## skill_pryer_s6_scroll_paralyze.png

卷轴·麻痹 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, an unrolling paralyze scroll snapping lightning-script chains shut, crackling script chains, pinned silhouette, merciless, precise
```

## skill_pryer_s5_pillar_of_stars.png

星之巨柱 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a colossal pillar of starlight slamming down from the void onto a foe, descending light column, crushed shadow figure, crushing, astral
```

## skill_pryer_s5_stellar_traversal.png

星海穿梭 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a mage dissolving into drifting stardust, retreating beyond the battle line, scattering star motes, half-dissolved silhouette, ephemeral, elusive
```

## skill_pryer_s5_star_bridge.png

星桥 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a shimmering bridge of starlight arcing between two distant battle lines, arc of starlight, crossing silhouette, guiding, serene
```

## skill_pryer_s5_starlight_cage.png

星光囚笼 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a lattice cage of woven starlight sealing a struggling enemy inside, interlocking light bars, muffled darkness within, inescapable, silent
```

## skill_pryer_s5_ego_constellation.png

本我星象 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a personal constellation burning above a mage's head, flaring at his near death, crown of linked stars, pulsing stellar threads, intimate, fated
```

## skill_pryer_s4_mystery_reenactment.png

神秘再现 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, forbidden knowledge igniting into a never-before-seen spell over open palms, burning script fragments, nascent spell fire, transgressive, brilliant
```

## skill_pryer_s4_matchstick_girl.png

卖火柴的小女孩 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a tiny match flame conjuring a warm phantom room and a lost grandmother's ghost, guttering match, translucent hearth vision, wistful, deceiving
```

## skill_pryer_s4_cinderella.png

灰姑娘 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a glittering gown and carriage unraveling back into rags and a rotting pumpkin, reversing transformation shimmer, midnight bell tower, cruel, fairy-tale
```

## skill_pryer_s4_lance_of_longinus.png

朗基努斯之枪 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, an ancient bloodied relic spear piercing through divine auras toward a foe, ornate relic lance, parting halo of light, unholy, inevitable
```

## skill_pryer_s4_hidden_knowledge.png

隐秘知识 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a scholar clutching a glowing forbidden page, watched by multiplying eyes in the dark, radiant secret page, multiplying watcher eyes, dangerous, coveted
```

## skill_pryer_s5_astral_field.png

星象领域 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a vast star map unfolding overhead, showering the field with guiding starlight, overarching celestial chart, falling star motes, majestic, oppressive
```

## skill_pryer_s3_prophecy.png

预言 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a prophet placing a companion's foot on the one correct path among branching shadows, branching fate paths, pointing hand of light, certain, solemn
```

## skill_pryer_s3_doomsday_prophecy.png

末日预言 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, spoken words crystallizing into three tolling shadow bells above cowering foes, dark bell phantoms, deepening wound glow, terminal, inexorable
```

## skill_pryer_s3_scrying_authority.png

窥秘权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a majestic burning eye piercing through veils, unwrapping wards around hidden truths, sovereign blazing eye, dissolving ward veils, absolute, unveiling
```

## skill_pryer_s2_informatization.png

信息化 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a mage's body scattering into flowing luminous characters mid-battle, streaming data glyphs, half-dissolved human form, uncanny, fluid
```

## skill_pryer_s2_knowledge_infusion.png

灌输知识 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, glowing contradictory script pouring from a striking hand into an enemy's skull, tangled luminous text, cracking mind vessel, invasive, maddening
```

## skill_pryer_s2_knowledge_strike.png

知识攻击 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a crystallized paradox smashing into an enemy's mind like a hurled slab, jagged paradox crystal, shattering thought fragments, jarring, corrosive
```

## skill_pryer_s2_deletion.png

删除 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, two glowing lines of blessing being erased from reality by a sweeping finger, fading protective glyphs, dissolving light strokes, erasing, cold
```

## skill_pryer_s2_modification.png

修改 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a holy blessing rune warping midair as one word of its meaning is rewritten, twisting luminous rune, quill of dark light, subversive, precise
```

## skill_pryer_s1_edification.png

教化权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a teacher-lord distributing glowing knowledge among companions while hoarding one dark shard, drifting knowledge motes, hidden obsidian fragment, generous, covetous
```

## skill_pryer_s1_false_information.png

虚假信息·灵体之线 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a luminous lie crawling along invisible spirit threads from one mind to the next, gossamer thread network, pulsing false glyph, insidious, spreading
```

## skill_pryer_s0_concealment_authority.png

隐匿权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a mage half-dissolved into gray mist at the edge of a wild knowledge wasteland, veiling gray fog, watchful shadow profile, elusive, guarded
```

## skill_pryer_s0_numeric_symbolism.png

数字象征·零与一 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, an open palm weighing a radiant numeral one against a devouring black zero, glowing glyph one, black vortex zero, primordial, balancing
```

## skill_pryer_s0_backup.png

备份 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era arcane scholar ink-and-gouache illustration, deep violet and ink-black palette with spectral rune glow, keyhole view of watching eyes in darkness, cold starlight chiaroscuro, grainy parchment etching texture, a translucent duplicate of a mage stored inside a hidden crystalline memory vault, mirrored spectral copy, sealed crystal archive, secure, eerie
```

# 途径：罪犯（criminal，40 卡）

## skill_criminal_s9_strong_body.png

强壮身体 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a scarred street bruiser flexing corded muscle under a torn shirt, dim alley lantern, knuckle wraps, menacing, hardened
```

## skill_criminal_s9_keen_intuition.png

敏锐直觉 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a wary criminal turning his head at a glint of steel in the dark, drawn knife half-hidden, flickering lamplight, alert, suspicious
```

## skill_criminal_s9_crime_abilities.png

犯罪能力 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a gloved hand raising a poisoned dagger behind an unsuspecting victim, vial of dark liquid, coiled garrote wire, sneering, predatory
```

## skill_criminal_s9_weapon_mastery.png

武器上手 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a grinning rogue spinning a knife around his finger, scattered blades and cudgel, wanted posters peeling, cocky, casual
```

## skill_criminal_s8_lost_conscience.png

失去良知 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a hollow-eyed man staring blankly as embers drift past his face, cracked porcelain mask, stained mirror shards, numb, soulless
```

## skill_criminal_s8_slow.png

迟缓 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a pale hand pinning a struggling shadow to the cobblestones, lengthening shadow, sinking gray haze, suffocating, uncanny
```

## skill_criminal_s8_demon_spells.png

恶魔类法术 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, an outstretched palm wreathed in writhing black flame, toxic green fire, whispering curse glyphs, treacherous, volatile
```

## skill_criminal_s7_demon_rite.png

恶魔仪式 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a blood-drawn pentagram glowing on cracked stone floor, slashed bleeding palm, spilling wax candles, ritualistic, forbidden
```

## skill_criminal_s7_abyss_summon.png

深渊召唤 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a smoking fissure in the ground with horned claws gripping the rim, sulfur-yellow smoke, glowing demonic sigil, ominous, erupting
```

## skill_criminal_s7_divination_jam.png

干扰占卜与通灵 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a fortune-teller's crystal ball filling with churning black murk, tangled spirit threads, cracked scrying mirror, obscuring, hostile
```

## skill_criminal_s6_demonize.png

恶魔化 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a hulking three-meter demon tearing free of its human silhouette, curved ram horns, torn leathery wings, sulfur fumes, monstrous, eruptive
```

## skill_criminal_s6_malice_sense.png

恶意感知 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a horned demon twisting to catch a blade mid-swing by its edge, sparks of clashing steel, glowing predatory eyes, anticipatory, savage
```

## skill_criminal_s6_magma_sword.png

岩浆之剑 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a blade dissolving into dripping molten lava held aloft, falling molten droplets, scorched gauntlet, searing, brutal
```

## skill_criminal_s6_sulfur_orb.png

硫磺火球 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a fist hurling a crackling ball of burning sulfur, splashing flame shrapnel, sickly yellow sparks, reeking, explosive
```

## skill_criminal_s6_abyssalize.png

深渊化 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a street square sinking into viscid living darkness, bubbling black tar, drowning lantern posts, devouring, depthless
```

## skill_criminal_s6_foul_words.png

污秽之语 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a demon's jaw unhinging as cursed syllables tear the air into ripples, distorting sound waves, black speech glyphs, corrupting, blasphemous
```

## skill_criminal_s5_desire_control.png

掌控欲望 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a shadowy puppeteer plucking an invisible string inside a victim's chest, glowing ember thread, trembling heart-shaped glow, seductive, invasive
```

## skill_criminal_s5_desire_blast.png

欲望爆炸 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a silhouette swelling with inner fire before bursting from within, cracks of inner light, scattered ember shards, unstable, detonating
```

## skill_criminal_s5_mind_shock.png

精神冲击 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a horned demon lowering its black-flame burning horns to charge, wreathing dark fire, splintering cobblestones, headlong, searing
```

## skill_criminal_s5_desire_avatar.png

欲望化身 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a figure collapsing into a creeping pool of glistening black liquid, oil-slick ripples, drowning reflections, slick, inescapable
```

## skill_criminal_s4_mental_duelist.png

精神交锋 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, two silhouettes facing off inside a chessboard of floating thoughts, glowing mind shards, cracked mental barriers, calculating, cold
```

## skill_criminal_s4_hallucinate.png

迷幻 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a victim swinging wildly at phantom attackers in empty air, wavering double vision, drifting opal haze, disorienting, deceptive
```

## skill_criminal_s4_acid_marsh.png

强酸沼泽 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, booted feet sinking into a bubbling neon-green acid bog, dissolving armor plates, rising acid bubbles, corrosive, fetid
```

## skill_criminal_s4_hellfire.png

地狱之火 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a palm pressed to the ground as black-red flames erupt in a ring, inverted fire tongues, cracked scorched earth, scorching, damning
```

## skill_criminal_s4_corrosive_fog.png

腐蚀毒雾 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a sleeve pouring a rolling yellow-green fog that swallows the battlefield, sickly vapor waves, wilting banners, choking, toxic
```

## skill_criminal_s3_whispers.png

呓语 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a gaunt figure mumbling as writhing words crawl off its tongue, living glyph swarm, torn throat scar, maddening, infectious
```

## skill_criminal_s3_pollution_authority.png

污染权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a crowned horror holding a leaking vial of swirling corruption, dark tendril spills, stained scepter, dominating, tainted
```

## skill_criminal_s3_distant_voice.png

远距离传声 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a whispered word flying like a black dart across a war-torn field, sound-wave ripples, clutching victim silhouette, lethal, remote
```

## skill_criminal_s2_blood_master.png

鲜血主宰 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a blood-red armored count clenching a fist as crimson streams obey, levitating blood droplets, pale noble visage, imperious, sanguine
```

## skill_criminal_s2_malice_avatar.png

恶意化身 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a shattered devil reforming from black smoke inside a victim's chest, reassembling ember particles, glowing ribcage cracks, indomitable, haunting
```

## skill_criminal_s2_body_authority.png

身体权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a sovereign figure wrapped in unbreakable crimson sinew armor, corded vein-like filigree, resolute stance, unyielding, absolute
```

## skill_criminal_s1_filth_king.png

污秽之王 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a rot-crowned monarch enthroned amid heaps of refuse and filth, dripping ooze scepter, swarming vermin court, decrepit, commanding
```

## skill_criminal_s1_erosion.png

侵蚀者 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a withered hand pressed against a fortress wall crumbling to dust, creeping rust veins, falling mortar streams, inexorable, patient
```

## skill_criminal_s1_abyss_fire.png

深渊之火 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a crowned maw exhaling a torrent of black devouring flame, ink-dark fire tongue, flaking corroded crown, annihilating, profane
```

## skill_criminal_s0_abyss_is_me.png

深渊即我 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a titanic shadow whose body is the abyss itself, eyes burning far below, endless vertical depth, distant ember eyes, boundless, existential
```

## skill_criminal_s0_fallen.png

堕落 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a gentle hand on a knight's shoulder as black cracks spread through his armor, creeping corruption veins, drooping blade, corrupting, sorrowful
```

## skill_criminal_s0_abyss_curse.png

深渊之咒 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a floating word of pure darkness draining color from everything around, fading battlefield hues, withering standards, desiccating, terminal
```

## skill_criminal_s4_flame_confluence.png

双焰交汇 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, black abyssal flame fusing with a witch's dark fire over a writhing victim, two-tone flame convergence, ember-flecked shadow, profane, combustive
```

## skill_criminal_s5_lust_resonance.png

恶欲共鸣 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a puppeteer's strings tightening around a greed-corrupted soul, embers flowing back to robed allies, ember thread circuit, robed figure catching sparks, covetous, resonant
```

## skill_criminal_s1_blight_erode.png

荒芜侵蚀·改 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, grim Victorian-era underworld expressionist oil painting, charred umber and bruised violet palette with ember-orange glints, oppressive low-angle urban framing, choking smoke and drifting ash texture, a blighted waste gnawing outward from corrupted soil into a radiant fertile field, cracked blight front, wilting golden wheat, parasitic, ruinous
```

# 途径：耕种者（planter，34 卡）

## skill_planter_s9_strength.png

力气 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a farmer's calloused fist clenched around an old hoe handle, weathered work-worn hands, tilled dark soil, earthy, resolute
```

## skill_planter_s9_weather_omen.png

预测天气 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a farmer squinting up at heavy gathering clouds, dark rolling cloud bank, scattering flock of birds, watchful, ominous
```

## skill_planter_s9_cultivated_seed.png

分辨种子 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a plump seed pressed gently into a comrade's bandaged wound, cupped earth-stained palm, tiny green shoot uncurling, tender, hopeful
```

## skill_planter_s8_heal.png

治疗 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a healer whose glowing eyes trace illness inside a patient, small surgical knife, faint luminous marks of disease, calm, precise
```

## skill_planter_s8_surgery.png

外科手术 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a surgeon's blade making one clean precise cut, steel scalpel, single opened wound, cold, exact
```

## skill_planter_s8_soul_stitch.png

缝合灵魂 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, coarse straw thread stitching shut a cracked translucent soul, ghostly fissured figure, golden wheat thread, wooden needle, rustic, tender
```

## skill_planter_s8_give_life.png

给予生命 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a warm breath flowing into a companion's chest where roots take hold, green roots beneath skin, soft exhaled mist, gentle, vital
```

## skill_planter_s7_catalyze_seed.png

催化种子 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a handful of seeds erupting into grasping vines around an enemy's legs, exploding green vines, cool shade under the tangle, fierce, flourishing
```

## skill_planter_s7_vermin_swarm.png

驱使虫豸 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a black swarm of beetles and worms flooding out of soil cracks, seething insect mass, split cracked earth, creeping, hungry
```

## skill_planter_s7_rain_or_shine.png

祈雨祈晴 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a priest raising both arms toward a sky split between rain and sun, curtain of rain on one side, breaking sunlight on the other, open field, devout, dramatic
```

## skill_planter_s7_growth_spread.png

繁衍生长 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, small creatures bursting with unnatural vigor on rich farmland, lush overgrown field, fat healthy beasts, abundant, thriving
```

## skill_planter_s6_bio_insight.png

生物洞悉 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a scholar's piercing stare peeling back a beast's hide, snarling cornered beast, exposed soft underbelly, analytical, cold
```

## skill_planter_s6_hybrid_spawn.png

杂交造物 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a newly born two-beast hybrid stumbling to its feet, mismatched animal limbs, freshly split cocoon, uncanny, raw
```

## skill_planter_s6_venomous.png

剧毒体质 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, dark veins glowing with venom beneath placid skin, green-black bloodstream, calm half-closed eyes, quiet, toxic
```

## skill_planter_s5_bear_form.png

化身巨熊 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a human body swelling with fur and claws into a huge bear, tearing old clothes, massive brown paws, savage, unstoppable
```

## skill_planter_s5_subterranean.png

地底潜行 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a figure sinking silently into soft earth like a planted seed, upturned soil mound, faint underground trail, stealthy, patient
```

## skill_planter_s5_mire.png

沼泽 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, enemies sinking step by step into bubbling gray mire, bursting swamp bubbles, clinging mud hands, suffocating, slow
```

## skill_planter_s5_nature_abhorrence.png

自然憎恶 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, vines, insects and wind all converging hungrily on one lone figure, twisting thorned vines, crawling insect swarm, hostile, relentless
```

## skill_planter_s5_oak_child.png

橡树之子 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, an acorn pressed into soil where a child's face opens its eyes in bark, splitting oak bark, huge fallen acorn, wondrous, eerie
```

## skill_planter_s4_life_alchemy.png

生命炼成 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a chalk array circle where a clay golem rises from dirt and blood, glowing ritual circle, lumpy clay humanoid, solemn, unnatural
```

## skill_planter_s4_healing_touch.png

触碰痊愈 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a glowing hand laid on a wound that closes under warm light, closing torn flesh, curses dissolving as black smoke, merciful, serene
```

## skill_planter_s4_vitality_field.png

生命充盈 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, lush grass and flowers blooming in every footprint across a field, bright wildflowers, springing green blades, buoyant, flourishing
```

## skill_planter_s3_wraith_transform.png

恶灵化 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a black wispy wraith rising from a fallen body to serve the soil, dissolving corpse shadow, spectral smoky limbs, grim, obedient
```

## skill_planter_s3_drain_life.png

剥夺生命 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a hand on a shoulder as green life-light drains into the soil, wilting victim, dark earth drinking the glow, implacable, chilling
```

## skill_planter_s3_return_to_earth.png

回归大地 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, skeletal undead crumbling and sinking back into waiting earth, collapsing bones, soft opened grave soil, inevitable, quiet
```

## skill_planter_s2_blight.png

荒芜 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a green field draining to gray dust as living things wither, wilting crops, cracked drying ground, desolate, relentless
```

## skill_planter_s2_earth_authority.png

大地权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a matriarch standing barefoot on a vast breathing earth expanse, spreading roots underfoot, twin signs of harvest and rot, majestic, primordial
```

## skill_planter_s2_doll_making.png

人偶制造 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a rough clay doll shedding crumbs as it takes its first step, unfinished earthen face, falling clay crumbs, playful, uncanny
```

## skill_planter_s2_wither_bloom_cycle.png

枯荣循环 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, withered stalks falling as new green shoots break the same soil, gray dead stalks, fresh green sprouts, cyclical, calm
```

## skill_planter_s1_nature_child.png

自然之子 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a figure dissolving into a mountainside and reemerging from soil, body half-fused with rock and stream, distant misty peak, wild, free
```

## skill_planter_s1_create_world.png

创造世界 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a small self-contained world of trees and insects held in cupped hands, miniature forest in palms, swirling boundary mist, wondrous, sheltering
```

## skill_planter_s0_mother_nest.png

万物母巢 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a vast mother figure cradling all creatures that return to her, woven root mantle, circle of beasts great and small, primordial, merciful
```

## skill_planter_s0_last_return.png

最后回归之地 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, fallen warriors rising from tilled soil while enemies sink into it, upturned grave earth, climbing resurrected hands, solemn, fated
```

## skill_planter_s0_nature_authority.png

自然权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, lush 19th-century European countryside dark-fantasy pastoral illustration, deep green and loam-brown palette with pale moon-silver accents, wide overgrown field composition, moonlit glow, tangled organic detail, a colossal figure whose body is forest, river and stone, tree-covered shoulders, rivers running down stone limbs, immense, untouchable
```

# 途径：药师（apothecary，40 卡）

## skill_apothecary_s9_brew.png

药剂调配 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, an apothecary grinding herbs and pouring a steaming potion, mortar and pestle, amber glass vial, crushed herbs, warm, soothing
```

## skill_apothecary_s9_herbal_dressing.png

草药敷贴 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, fresh living moss pressed onto an open wound, twitching green leaves, glowing sap, bandaged forearm, gentle, restorative
```

## skill_apothecary_s9_toxin_resist.png

毒素抗性 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, an herbalist calmly tasting a poisonous black berry, dark berries, wilted toxic flowers, steady hand, stoic, wary
```

## skill_apothecary_s9_health_sight.png

健康灵视 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a healer whose glowing eyes reveal sickness as dark stains, visible dark miasma, glowing gaze, faint body outline, perceptive, clinical
```

## skill_apothecary_s8_beast_whistle.png

驯兽哨 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a tamer raising a bone whistle as a wolf emerges from pines, carved bone whistle, loyal gray wolf, misty forest edge, wild, loyal
```

## skill_apothecary_s8_beast_sense.png

动物感官 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a ranger and a hawk sharing one unbroken gaze, golden hawk, shared eye glint, wind-brushed grass, attuned, primal
```

## skill_apothecary_s7_vampire_body.png

血族体质 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a pale noble with centuries-old poise flexing clawed fingers, crimson vest, pale skin, cathedral shadows, composed, ancient
```

## skill_apothecary_s7_vampire_charm.png

血族魅力 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a mesmerizing beauty catching an attacker's gaze mid-swing, dilated entranced eyes, half-raised sword, veiled moonlight, hypnotic, cold
```

## skill_apothecary_s7_corrosive_claw.png

腐蚀之爪 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a blackened claw raking through armor that crumbles to rust, rusted armor flakes, acidic dark talons, corroded steel, corrosive, vicious
```

## skill_apothecary_s7_abyss_shackle.png

深渊枷锁 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, chains of living darkness coiling around a struggling archer, black abyssal chains, dragging shadows, frantic bow, suffocating, grim
```

## skill_apothecary_s7_dark_wings.png

黑暗之翼 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, vast wings of pure darkness unfurling behind a retreating figure, feathered void wings, drifting black feathers, moonless sky, ominous, graceful
```

## skill_apothecary_s7_blood_servant.png

血仆转化 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a bitten soldier rising with glassy eyes toward former comrades, fresh neck wound, dulled gaze, turned blade, betrayed, eerie
```

## skill_apothecary_s6_invisibility_potion.png

隐身药剂 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a shattered silver vial dissolving its drinker into mist, spilled silver liquid, fading silhouette, swirling vapor, elusive, quiet
```

## skill_apothecary_s6_scentless.png

无味香水 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a figure dabbing clear balm as grime slides off untouched skin, crystal balm jar, beading filth, bare neck, clean, detached
```

## skill_apothecary_s6_prepared_draught.png

预服药水 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a battle-mage downing three glowing potions before dawn, three corked vials, steam rising from skin, first light, eager, blazing
```

## skill_apothecary_s6_spirit_material.png

灵性材料辨识 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a scholar's hand hovering over a corpse seeking lingering spirit-light, faint soul-light wisp, anatomical glow, measuring fingers, clinical, reverent
```

## skill_apothecary_s5_full_moon.png

满月 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a colossal full moon rising and bathing a battlefield in silver, oversized silver moon, pouring moonlight, closing wounds, serene, radiant
```

## skill_apothecary_s5_blink.png

闪现 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a duelist vanishing in one moonbeam to reappear behind a foe, twin moonlit silhouettes, crossed blades, scattered moonlight, swift, uncanny
```

## skill_apothecary_s5_moonlight_form.png

月光化 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a body scattering into thousands of crimson scales in moonlight, drifting red scales, silver moonbeam, reassembling silhouette, ethereal, fragile
```

## skill_apothecary_s5_crimson_vitality.png

深红体质 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a warrior's wounds sealing themselves as blood pulses visibly, rapidly closing gash, throbbing veins, heartbeat glow, frenzied, vital
```

## skill_apothecary_s4_moon_paper.png

月亮纸人 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a paper effigy bursting apart under a blade, scraps flying, cut paper doll, silver paper crescent, stinging confetti, trickster, sudden
```

## skill_apothecary_s4_dark_gaze.png

黑暗凝视 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a sorcerer's eye reflected inside an enemy's widening pupil, mirrored dark iris, dominated stare, shadow tendrils, domineering, invasive
```

## skill_apothecary_s4_bat_swarm.png

蝙蝠分解 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a man dissolving into a shrieking swarm of red-eyed bats, countless bats, scattered cloak tatters, glowing red eyes, chaotic, ravenous
```

## skill_apothecary_s3_summon_gate.png

召唤之门 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, torn air revealing a vast claw reaching through a glowing rift, jagged rift of light, giant spectral claw, spilling fog, awe, dread
```

## skill_apothecary_s3_spirit_pact.png

灵界契印 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, summoned spirits bearing an identical glowing sigil on their brows, shared crimson sigil, kneeling spirit forms, returning light wisps, solemn, bonded
```

## skill_apothecary_s2_creation.png

创生 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, one palm mending a dying friend while the other drains an enemy's years, glowing healing hand, withering graying foe, flowing lifelight, divine, merciless
```

## skill_apothecary_s2_self_mend.png

自我治愈 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a wounded figure knitting flesh back together with bare will, self-closing wounds, unneeded potions on ground, steady breath, resilient, calm
```

## skill_apothecary_s2_pure_land.png

净土净化 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, scorched earth blooming with green shoots beneath a raised hand, fresh sprouts, receding black corruption, cleansing light, renewing, pure
```

## skill_apothecary_s1_beauty_shock.png

美之震撼 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a breathtakingly beautiful face halting every warrior mid-strike, frozen swords, transfixed gazes, radiant unveiled face, stunning, absolute
```

## skill_apothecary_s1_beauty_summon.png

美神召唤 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, an irresistible voice calling beasts and shadows toward its source, sound-wave halos, drawn silhouettes, doorway of light, compelling, serene
```

## skill_apothecary_s0_life_authority.png

生命之权 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a luminous thread of life pulled from a foe into a friend, glowing lifeline, fading enemy, revived companion, sovereign, inevitable
```

## skill_apothecary_s0_moon_cycle.png

月相·轮转 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a single figure morphing under five rotating moon phases, five moon icons, shifting silhouettes, cycling glow, cyclical, mutable
```

## skill_apothecary_s0_spirit_root.png

灵性根源 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, an endless well of spirit-light with countless streams flowing outward, bottomless luminous spring, branching light streams, shielded summoned forms, primordial, abundant
```

## skill_apothecary_s0_blood_moon_rising.png

血月当空 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a crimson moon ascending as the land below bleeds red, huge blood moon, red-soaked fields, restless creatures, savage, ecstatic
```

## skill_apothecary_s9_beast_call.png

兽群呼唤 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a horn call answered by shapes moving through the treeline, curved war horn, stirring forest shadows, glowing beast eyes, rallying, wild
```

## skill_apothecary_s7_wild_instinct.png

野性直觉 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a hunter freezing mid-step, nostrils flared at hidden danger, raised hackles, testing breeze, lurking shadow, tense, alert
```

## skill_apothecary_s6_pack_maul.png

群兽撕咬 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a pack of beasts surging forward as one snapping tide, leaping fangs, kicked-up dust, coordinated lunge, ferocious, unified
```

## skill_apothecary_s5_beast_rush.png

兽群奔袭 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, a warrior charging ahead of a thundering beast wave, trampling hooves, billowing dust cloud, leading banner, unstoppable, fierce
```

## skill_apothecary_s4_frenzy_rush.png

狂兽突袭 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, maddened beasts bursting from dark woods at full sprint, snapping jaws, splintered underbrush, moonlit eyes, berserk, hunting
```

## skill_apothecary_s2_beast_tide.png

万兽奔腾 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, Victorian-era rustic alchemical oil painting, herbal green and deep crimson palette, blood moon looming over a cluttered workbench, warm candlelit glow, thick glossy impasto texture, an endless stampede of beasts shaking the very earth, horizon of beasts, trembling ground, rising dust wall, overwhelming, seismic
```

# 途径：观众（spectator，36 卡）

## skill_spectator_s9_subtle_observe.png

观众·细微观察 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a spectator in a dark theater box studying a stranger's blinking face, half-lit face, opera box railing, annotated gestures, watchful, clinical
```

## skill_spectator_s9_exceptional_mind.png

出众精神 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a poised figure standing calm at the center of a swirling storm of whispers, swirling whispers, unmoving silhouette, composed, unshaken
```

## skill_spectator_s9_indirect_influence.png

间接影响 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a shadowed hand quickening a dancer's stride from behind the curtain, puppet strings, parted stage curtain, dancer silhouette, subtle, covert
```

## skill_spectator_s8_mind_read.png

读心 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a mind reader peeling open a glowing book of someone's inner thoughts, glowing pages, floating whisper-words, open book, intrusive, knowing
```

## skill_spectator_s8_aura_sight.png

气场感知 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a figure perceiving hidden foes as dim translucent silhouettes, layered colored auras, see-through hidden figure, penetrating, lucid
```

## skill_spectator_s7_dread.png

震慑 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a single cold glance pinning a charging warrior mid-swing, frozen warrior, icicle gaze lines, chilling, oppressive
```

## skill_spectator_s7_madness.png

狂乱 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a figure touching a tangled knot of emotions that bursts into shards, tangled threads, bursting emotion shards, volatile, frenzied
```

## skill_spectator_s7_psych_suggestion.png

心理暗示 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a soft whisper curling like smoke into a soldier's drooping blade, smoke-like whisper, dulling blade, insidious, quiet
```

## skill_spectator_s7_console.png

安抚 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, gentle hands laying heavy dark stones out of a grieving ally's heart, dark stones, warm light within chest, soothing, tender
```

## skill_spectator_s6_combat_hypnosis.png

战斗催眠 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a lowered voice sinking a charging knight slowly to his knees, drowsy knight, descending tone waves, drowsy, commanding
```

## skill_spectator_s6_psych_invisibility.png

心理学隐身 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a figure in plain sight as every gaze slides past him, blurred passing gazes, clear untouched figure, elusive, eerie
```

## skill_spectator_s6_suggestion_qualitative.png

心理暗示·质变 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, an intruder stepping into a glowing mind to rewrite its ledger of enemies, glowing ledger, rewritten names, invasive, absolute
```

## skill_spectator_s6_dragon_scale.png

龙鳞 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, fine dragon scales rippling up beneath human skin, iridescent scales, straining sleeve, latent, draconic
```

## skill_spectator_s5_guide.png

引导 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a dream walker coaxing secrets out of a sleeper's murmurs, sleeping figure, drifting spoken words, guiding hand, coaxing, intimate
```

## skill_spectator_s5_dream_edit.png

修改 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a figure quietly repainting small pieces of someone's recurring dream, patchwork dream canvas, night sky window, patient, uncanny
```

## skill_spectator_s5_dream_shift.png

梦境穿梭 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a body dissolving into mist slipping through a door of someone else's dream, dissolving mist, dream doorway, fluid, unreal
```

## skill_spectator_s4_manipulate.png

操纵 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a hand dipping into a dark ocean of whispering connected minds, black sea of faces, lifted glowing thought, profound, dominating
```

## skill_spectator_s4_virtual_persona.png

虚拟人格 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a ring of thirteen chairs each holding a different version of one self, thirteen chairs, varied seated silhouettes, one standing figure, fractured, guarded
```

## skill_spectator_s4_mind_drain.png

心智剥夺 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a hollow-eyed figure as its thoughts are lifted out like paper, emptying head, drifting pages, hollow, bleak
```

## skill_spectator_s4_mind_storm.png

心灵风暴 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a psychic tempest of towering waves crashing over clutched heads, towering mind waves, battlefield of sufferers, overwhelming, violent
```

## skill_spectator_s4_mind_plague.png

精神瘟疫 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a whispering infection blooming from one figure into the next, spore-like words, chained silhouettes, contagious, creeping
```

## skill_spectator_s4_dragon_form.png

龙化 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a human back arching as scales and wings burst through cloth, ripping clothes, unfolding wings, transformative, fierce
```

## skill_spectator_s3_weave_dream.png

编织梦境 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a dream weaver knitting a sleeping enemy into a silken cocoon, glowing dream threads, cocooned sleeper, enchanting, inescapable
```

## skill_spectator_s3_identity_split.png

身份分离 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a figure peeling a living double off himself like a torn shadow, peeled double, torn edge of self, uncanny, divided
```

## skill_spectator_s3_plague_storm.png

瘟疫风暴 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a storm raining burning thoughts across the whole field, ember word-storm, scorched ground, catastrophic, spreading
```

## skill_spectator_s3_shared_dream.png

集体梦境 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, an entire battlefield draped under one vast shared dream veil, giant dream dome, slow-motion enemies, mended allies, surreal, enveloping
```

## skill_spectator_s2_dream_maze.png

梦境迷宫 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a runner circling endless identical corridors that shift behind him, looping corridors, shifting walls, disorienting, inescapable
```

## skill_spectator_s2_suggestion_authority.png

心理暗示·权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, an ally straightening as golden certainty floods his body, rising golden aura, lifted chin, triumphant, assured
```

## skill_spectator_s2_insight_authority.png

洞察权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a seer watching a foe's past and fears unroll like film strips, unrolling film, exposed beating heart, omniscient, piercing
```

## skill_spectator_s2_true_dragon.png

巨龙 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a true dragon unfurling its wings where a human once stood, massive wingspan, molten eyes, majestic, overwhelming
```

## skill_spectator_s1_written_truth.png

书写成真 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a writer closing a notebook as inked words take shape in the world, ink words becoming real, closing notebook, inevitable, fateful
```

## skill_spectator_s1_imagined_creation.png

空想具现 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a vague thought condensing into a towering guardian before its creator, condensing outline, stone guardian, wondrous, sudden
```

## skill_spectator_s1_all_spoken_known.png

凡有言必被知 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a listener as every spoken word around him lights up in glyphs, glowing glyphs, revealed hidden figures, omniscient, vigilant
```

## skill_spectator_s0_declared_future.png

宣告未来 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a figure proclaiming to the field as written fate descends from above, descending script, hushed battlefield, prophetic, absolute
```

## skill_spectator_s0_mind_authority.png

心灵权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a sovereign seated on a throne inside a boundless mindscape, mindscape throne, chained drifting thoughts, sovereign, absolute
```

## skill_spectator_s0_trait_separation.png

特性分离 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, surreal Victorian-era psychological illustration, teal and ivory palette with faint rose-gold haze, dramatic theater spotlight against layered translucent dream veils, fine matte grain texture, a crumbling shell of a body as the true self opens eyes behind it, disintegrating shell, reawakening figure, resurgent, detached
```

# 途径：通识者（savant，36 卡）

## skill_savant_s9_awaken_memory.png

唤醒记忆 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a scholar closing his eyes as glowing pages of memorized books swirl around him, floating illuminated book pages, a halo of recalled diagrams, lucid, awakened
```

## skill_savant_s9_nitroglycerin.png

硝酸甘油 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, an alchemist hurling a small vial that erupts in a raw orange fireball, shaking glass vial, crude bright explosion, explosive, blunt
```

## skill_savant_s9_aqua_regia.png

王水 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a chemist splashing corrosive golden-green liquid that dissolves metal armor, fuming glass flask, armor melting into fumes, corrosive, clinical
```

## skill_savant_s9_gear_device.png

齿轮装置 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, an engineer flinging a chain of interlocking gears that tangle around a foe's limbs, spinning brass gear chain, snaring cogwheel trap, grinding, mechanical
```

## skill_savant_s8_forbidden_lore.png

遗迹禁忌知识 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, an archaeologist calmly reading a forbidden ruin inscription no mind should learn, glowing cursed glyphs, a steady unflinching gaze, forbidden, unshaken
```

## skill_savant_s8_wild_physique.png

荒野体魄 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a weathered archaeologist standing firm in windblown ruins, dust cloak snapping, tattered dust cloak, crumbling desert ruins backdrop, rugged, hardened
```

## skill_savant_s8_excavation.png

考古发掘 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a digger's shovel striking stone as a dust-caked ancient golem rises from the pit, struck shovel blade, rising dust-covered relic golem, awakening, dusty
```

## skill_savant_s8_ritual_magic.png

仪式魔法 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, an archaeologist chalking a half-finished ritual circle that steadies a companion's hand, incomplete chalk circle, faintly glowing charcoal lines, makeshift, focused
```

## skill_savant_s7_appraisal.png

鉴定 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, an appraiser glancing once at a relic and naming its every flaw aloud, appraising monocle glint, a relic losing its luster, sharp, dismissive
```

## skill_savant_s7_hazard_ward.png

危险规避 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, an appraiser sidestepping a falling blow by half an inch, utterly calm, blade missing by a hair, pre-scouted hazard markers, calm, anticipatory
```

## skill_savant_s6_mechanical_marvel.png

机械奇物 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a mechanic pouring scrap brass from a toolbox that assembles into a walking machine, overflowing parts box, half-assembled walking automaton, ingenious, scrappy
```

## skill_savant_s6_mechanic_repair.png

机械维修 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a mechanic welding a wounded construct back together in a shower of sparks, sparking welding torch, opened construct chassis, tinkering, diligent
```

## skill_savant_s6_craft_master.png

制造大师 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a master craftsman tightening the last bolt on a construct finer than any blueprint, oversized workshop wrench, blueprint pinned beside the build, precise, proud
```

## skill_savant_s9_practice_perfect.png

熟能生巧 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, craftsman hands growing steadier with each finished piece on the bench, repeated practiced gestures, a row of finished devices, practiced, flowing
```

## skill_savant_s5_star_deduction.png

星轨推演 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, an astronomer poring over charts of star trajectories by candlelight, inked star-trajectory charts, brass telescope by the window, patient, deductive
```

## skill_savant_s5_false_astral.png

虚假星象 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a falsified night sky with wrong constellations leading a warrior's strike to empty air, inverted star map, a punch hitting empty darkness, deceptive, disorienting
```

## skill_savant_s5_star_blessing.png

星之祝福 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, starlight settling on a companion's shoulders, making gravity feel lighter, soft falling starlight, levitating dust motes, uplifting, weightless
```

## skill_savant_s5_star_curse.png

星之诅咒 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, an invisible ray of starlight piercing a foe as its wounds fester and warp, thin beam of cold starlight, festering warped wound, cold, withering
```

## skill_savant_s4_transmutation.png

炼成 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, an alchemist kneading gravel and iron filings into a short-lived humanoid doll, glowing kneaded scraps, crude awakening doll, makeshift, eerie
```

## skill_savant_s4_ensoul.png

注入灵魂 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, an alchemist pressing a wisp of his own spirit into a construct's chest socket, pale spirit thread, glowing chest socket, intimate, uncanny
```

## skill_savant_s4_soul_forge.png

灵魂熔炉 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, an alchemist catching a construct's still-hot remains as it collapses, hot collapsing frame, outstretched catching hands, reclaiming, unsentimental
```

## skill_savant_s3_drain.png

汲取 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a scholar extending a hand as an invisible pipeline drains an enemy's life force, unseen life current, withering distant enemy, cold, siphoning
```

## skill_savant_s3_disintegration.png

解离 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a beam of white light erasing armor into a drift of gray powder, pale annihilating beam, armor crumbling to dust, absolute, clinical
```

## skill_savant_s3_knowledge_fae.png

知识妖精 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a scholar dissolving into floating glyphs and slipping into an enemy's mind, scattering luminous script, fading human silhouette, ethereal, invasive
```

## skill_savant_s3_dominion.png

环境掌控 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a battlefield bending to one man's will, wind and terrain tripping every enemy, coiling redirected wind, terrain tilting under foes, commanding, inevitable
```

## skill_savant_s2_law_edit.png

规律权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a writer striking through the law of fire in a massive book of physical laws, giant ledger of laws, quill crossing out fire's rule, sovereign, matter-of-fact
```

## skill_savant_s2_analysis_authority.png

解析权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a mentor seeing straight through veils and disguises to every creature's true nature, peeling illusion layers, exposed true forms, penetrating, serene
```

## skill_savant_s2_learning_authority.png

学习权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a mentor's eyes racing across a battle as insight notes stack in the air, spiraling insight annotations, rapidly annotated foe, absorbing, accelerating
```

## skill_savant_s2_creation_authority.png

制造权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a mentor speaking two machines into existence out of empty air, condensing blueprint outlines, raw shapes taking form, effortless, declarative
```

## skill_savant_s2_mentor.png

导师 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a mentor simply pointing as a companion suddenly grasps the perfect technique, one instructing finger, dawning comprehension, enlightening, quiet
```

## skill_savant_s1_civilization_scroll.png

文明图卷 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a vast painted scroll unrolling cities, fields, forges and schools across the battlefield, unrolling civilization scroll, miniature city-farm-forge scenes, sweeping, inspiring
```

## skill_savant_s1_ruinous_rebirth.png

毁灭新生 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, ruins glowing with renewal as fallen companions rise from rubble restored, regenerating rubble, rising restored figures, renewing, hopeful
```

## skill_savant_s1_enlightenment.png

教化权柄 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a teacher lighting a lamp inside a companion's head, eyes suddenly bright, inner head lantern, sparked understanding gaze, illuminating, generous
```

## skill_savant_s0_perfection_field.png

完美之境 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a battlefield rewritten toward perfection, flawless allies beside flawed exposed foes, gleaming perfected silhouettes, fractured flawed outlines, immaculate, austere
```

## skill_savant_s0_reality_knowledge.png

现实知识 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, a scholar editing the blueprint of himself with a pen, redrafting his own numbers, floating personal blueprint, inked altered measurements, omniscient, casual
```

## skill_savant_s0_reality_law.png

现实规律 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, steampunk technical etching, brass and slate-blue engineering palette, blueprint schematic composition with drafting-table lamp lighting, fine engraved linework and riveted gearwork texture, an author rewriting a law of nature in the world's own book before battle begins, cosmic law manuscript, ink rewriting itself, final, preemptive
```

# 途径：阅读者（reader，34 卡）

## skill_reader_s9_photographic_memory.png

过目不忘 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a scholar with glowing pages of memorized books swirling inside his open mind, floating book pages, glowing glyphs, endless candlelit shelves, lucid, serene, assured
```

## skill_reader_s9_comprehension.png

理解力 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a reader tracing a speeding line of script that unwinds into light, rushing ink stream, flipping pages, rising aura, swift, acute, eager
```

## skill_reader_s9_ritual_magic.png

仪式魔法 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a robed reader finishing a candle circle as a spectral fang bites downward, ring of lit candles, chalk sigil circle, spectral bite, ritualistic, hushed, ominous
```

## skill_reader_s8_logic_deduction.png

逻辑推演 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a detective-like scholar tracing a glowing dotted arc back to a flaw, glowing trajectory lines, magnifying lens of light, exposed crack, cold, precise, calculating
```

## skill_reader_s8_observe.png

观察 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a scholar's eye reflecting every strike of his foe in miniature, magnified watching eye, frozen blade motions, note-taking quill, watchful, patient, cool
```

## skill_reader_s8_ritual_expertise.png

仪式魔法专家 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a reader chanting over a grimoire, extra syllables glowing between his lips, glowing rune syllables, open grimoire, deepened sigil circle, masterful, resonant, focused
```

## skill_reader_s9_knowledge_reserve.png

知识储备 · common

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a reader pulling exactly one glowing tome from a vast mental library, towering bookshelves, single radiant tome, floating ladder, abundant, quiet, resourceful
```

## skill_reader_s7_weapon_mastery.png

武器精通 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a scholar in reading robes gripping a sword with textbook-perfect form, unsheathed longsword, annotated fencing manual, ink-stained gloves, composed, lethal, scholarly
```

## skill_reader_s7_combat_master.png

格斗大师 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a scholar redirecting a lunging foe with a flawless deflecting palm, staggering attacker, redirected blade, swept dust ring, fluid, controlled, forceful
```

## skill_reader_s7_replay_event.png

解析还原 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a scholar reading ghostly afterimages of a past strike hanging in the air, faded ghostly afterimages, torn veil of light, clue motes, uncanny, forensic, still
```

## skill_reader_s6_analyze.png

解析 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a scholar peeling glowing layers off a foe like translucent pages, peeling luminous layers, exposed inner workings, annotation glyphs, dissecting, cold, thorough
```

## skill_reader_s6_mimic_novice.png

模仿·初解 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a scholar mirroring an enemy's strike with a clumsy but true imitation, mirrored ghost motion, half-formed echo blade, practice gestures, imitative, tentative, clever
```

## skill_reader_s7_master_reasoner.png

推理大师 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a scholar marking a foe's flaw while its every move lands on his predicted line, glowing predicted path lines, marked weak point, timing gears, inevitable, cold, triumphant
```

## skill_reader_s7_ritual_master.png

仪式魔法大师 · uncommon

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a reader standing at the heart of a seven-layered array as disaster falls outward, seven nested sigil rings, shield dome of light, falling ruin outside, grand, apocalyptic, protected
```

## skill_reader_s5_self_arcana.png

秘术·自创 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a scholar writing a brand-new spell into the air with a glowing pen, self-written glowing script, blank grimoire page, sparking new sigils, inventive, proud, arcane
```

## skill_reader_s5_streamlined_cast.png

省略步骤 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a reader snapping his fingers as ritual candles and ingredients dissolve into light, dissolving ritual tools, single snapping fingers, shortcut runes, effortless, crisp, masterful
```

## skill_reader_s4_prophecy.png

预言 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a prophet watching branching future paths unfold above an hourglass, branching glowing paths, turning hourglass, chosen golden thread, oracular, weighty, hopeful
```

## skill_reader_s4_astral_arcana.png

星界秘术 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a reader drawing pale star-fire from a rift in the night sky, torn starry rift, pale astral fire, drained glowing wisps, cosmic, eerie, hungry
```

## skill_reader_s5_mimic_arcana.png

模仿·秘术导师 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a scholar replicating an enemy's spell with a near-perfect ghost hand, ghostly copied casting, six-tenths sigil gauge, matched stances, assured, mirroring, potent
```

## skill_reader_s4_mimic_prophet.png

模仿·预言家 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a reader replaying a foe's technique while sharing its very thoughts, twin mirrored figures, shared thought glyphs, glowing echo weapon, uncanny, fluent, dominant
```

## skill_reader_s5_arcana_tutelage.png

秘术传授 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a mentor pressing a glowing line of scripture into a companion's palm, glowing script in palm, receiving ally, shared candlelight, generous, solemn, warm
```

## skill_reader_s4_astral_sanctum.png

星界秘域 · rare

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a reader opening a star-field domain where the future lies flat like an open book, unfolding star-field pages, pinned slow-motion foes, domain sigil dome, cosmic, overwhelming, serene
```

## skill_reader_s3_discern.png

洞悉 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, an insight master seeing enemies as cracked clockwork rule-machines, cracked rule gears, fracture lines over foes, cold dissecting gaze, ruthless, lucid, sweeping
```

## skill_reader_s3_law_breach.png

规律·撬动 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a scholar flicking one line of the world's laws so a foe's armor unravels, flicked glowing law-thread, unraveling armor plates, scattered shield shards, surgical, transgressive, calm
```

## skill_reader_s2_mimic_cherub.png

模仿·智天使 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a cherub-faced scholar copying a foe down to its shadow, near-perfect mirrored double, single missing spark, halo of scripts, sacred, uncanny, complete
```

## skill_reader_s2_wisdom_authority.png

智慧权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a wise commander standing half a step ahead on a glowing path of best choices, glowing optimal path, faint future footsteps, crown of starlight, supreme, serene, inevitable
```

## skill_reader_s2_optimal_choice.png

局势推演 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a whispered word from a sage guiding an ally's strike onto the perfect line, whispered glowing word, guided perfect strike, fleeting golden window, decisive, trusted, bright
```

## skill_reader_s3_law_authority.png

规律权柄 · epic

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a judge-like scholar writing unerasable decrees onto the battlefield, burning decree script, iron-bound law chains, unblinking scale of law, absolute, unyielding, solemn
```

## skill_reader_s1_omniscience_mark.png

全知·现在与过去 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, an all-seeing eye marking every enemy with a glowing sigil of total knowledge, vast all-seeing eye, glowing marks on foes, revealed hidden shapes, total, cold, inescapable
```

## skill_reader_s1_astral_tutor.png

星界导师 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a tutor editing a foe's intent in the star-realm, its blade swinging at empty air, editing hand in star-realm, swinging blade at nothing, rewritten concept glyphs, cosmic, eerie, commanding
```

## skill_reader_s1_mimic_omniscience.png

模仿·全知之眼 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a scholar producing a flawless double of a foe's ultimate technique, perfect mirrored technique, excluded crown-like authority sigil, twin shockwaves, flawless, hungry, supreme
```

## skill_reader_s0_tower_creation.png

白塔·创造 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a white tower blooming from open pages, birthing a living construct, white tower rising from book, newly formed construct, cascading page-brick, creative, majestic, alive
```

## skill_reader_s0_astral_stairs.png

星界阶梯 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a stairway of starlight carrying a wounded ally beyond the blades, spiraling star stairway, fading ally silhouette, shielding star veil, rescuing, cosmic, tender
```

## skill_reader_s0_omniscience.png

白塔·全知 · legendary

```
vertical 3:4 trading card artwork, full-bleed, no border, no frame, no text, no watermark, Western European dark fantasy in a Victorian-era 19th-century industrial world, European character design in period clothing such as tailcoats, long dresses, military uniforms, top hats and cloaks, European architecture with gaslit streets and candlelit interiors, no xianxia, no wuxia, no hanfu, no Chinese or East Asian architecture, no Eastern fantasy, no cultivation or immortal imagery, no jade artifacts, scholarly European illuminated-manuscript painting, parchment beige and royal blue palette, floating tomes circling a candlelit library tower, fine gold-leaf linework, a white tower summit where all knowledge of past present future streams as one, summit of the white tower, converging knowledge streams, open book of the world, omniscient, vast, tranquil
```

