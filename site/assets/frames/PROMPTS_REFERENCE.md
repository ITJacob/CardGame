# 边框 prompt 风格基准（认可版）

本文件是 2026-09-23 主人与奴家拍板认可的**三张定稿框**出图原始 prompt，作为 `PROMPTS.md` 生成结果的**风格基准**。

核心风格约束（所有 47 条 prompt 都须对齐）：

1. **细线贴边**：框线由 `thin ... lines running just inside the card edge` 直接描述，**不得**使用 `a clean border tracing the full rectangle edge` 这类会诱导模型先画「粗边框带」的表述——那会让线变厚。
2. **纯黑底 / 中心空**：`solid pure black background` + `the central area empty pure black`，出图后黑底被 screen 吃透。
3. **窄带不内铺**：`all ornament strictly confined to a narrow band along the edges, no ornament spreading inward, no detached fragments`。
4. **无水印**：`no watermark, no signature, no logo`（平台水印须出图后涂黑或换无痕平台）。
5. **手绘油画笔触**：`hand-painted oil-painting brushstrokes, slightly uneven hand-drawn lines`，与卡面同语汇。

---

## frame-common.png（冷钢银单细线，最简）

```
an extremely minimal ornamental border frame for a vertical trading card, solid pure black background, one single thin cool steel-silver line with a pale bluish sheen running just inside the card edge with minimal margin, small simple geometric corner accents, all ornament strictly confined to a narrow band along the edges, no ornament spreading inward, the central area completely empty pure black, hand-painted oil-painting brushstrokes, slightly uneven hand-drawn lines, understated and quiet, no characters, no scenery, no text, no watermark, no signature, no logo
```

## frame-uncommon.png（青铜绿锈双线 + 连续角托）

```
an ornamental border frame for a vertical trading card, solid pure black background, two thin dark bronze lines with a subtle green patina tint running just inside the card edge with minimal margin, at each of the four corners a small neat continuous geometric bracket ornament that flows out of and connects the two border lines, no detached fragments, no emblems, no central ornament, no scrollwork, no runes, all ornament strictly confined to a narrow band along the edges, the central area completely empty pure black, hand-painted oil-painting brushstrokes, slightly uneven hand-drawn lines, restrained, no characters, no scenery, no text, no watermark, no signature, no logo
```

## frame-rare.png（暖金双线 + 小符文）

```
an ornamental border frame for a vertical trading card, solid pure black background, two thin warm gold lines with a clearly golden bright antique-gold tone running just inside the card edge with minimal margin, small neat rune-like corner accents only, no emblems, no heraldic shields, no central ornament, all ornament strictly confined to a narrow band along the edges, no ornament spreading inward, the central area completely empty pure black, hand-painted oil-painting brushstrokes, slightly uneven hand-drawn lines, restrained, no characters, no scenery, no text, no watermark, no signature, no logo
```
