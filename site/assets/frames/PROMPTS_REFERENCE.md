# 边框 prompt 风格基准（认可版）

本文件是 2026-09-23 主人与奴家拍板认可的**三张定稿框**出图原始 prompt，作为 `PROMPTS.md` 生成结果的**风格基准**。

核心风格约束（所有 47 条 prompt 都须对齐）：

1. **细线贴边**：框线用 `ultra-fine hairline ... drawn just inside the image edge` 描述。**不得**使用 `a clean border tracing the full rectangle edge`（诱导先画粗边框带）或 `ornamental border frame`（诱导装饰边框带）作句首——两者都会让带变厚。
2. **背景前置 + 逐项否定纹理**：纯黑背景描述**必须放在句首**，并逐项否定：`no gradient, no vignette, no glow, no fog, no smoke, no ambient light, no canvas texture, no brushstroke texture, no grain`。只写 `solid pure black background` 不够——模型仍会给黑底加布纹/颗粒。
3. **笔触只在线上**：`hand-painted oil brushstroke texture and metallic sheen appear only on the hairline itself and never on the background`。⚠️ 若写成全局的 `hand-painted oil-painting brushstrokes`，模型会把整张图当油画画布处理，黑底直接变成带颗粒的深灰——这是「黑底不纯」的头号元凶。
4. **辉光零外溢**：任何 glow / sheen 必须写明 `stays on the lines themselves, zero spill onto the black`。裸写 `luminous gold glow` 必然在黑底上糊出灰雾。
5. **宽度量化**：`the entire border band is extremely narrow, well under 3-4 percent of the card width`。只写 `a narrow band` 没有量化，模型自由发挥就会宽。
6. **窄带不内铺**：`all ornament strictly confined to a narrow band along the edges, no ornament spreading inward, no detached fragments`。
7. **无水印**：`no watermark, no signature, no logo`（平台水印须出图后涂黑或换无痕平台）。

---

## frame-common.png（冷钢银单细线，最简）

```
A vertical trading card image on a flat, completely uniform, absolute pure black (#000000) background: no gradient, no vignette, no glow, no fog, no smoke, no ambient light, no canvas texture, no brushstroke texture and no grain anywhere in the background. The only decoration is one single ultra-fine hairline in cool steel-silver with a pale bluish sheen, drawn just inside the image edge with a very small margin, no corner ornaments, only tiny minimal geometric corner ticks at the four corners, no detached fragments. The entire border band is extremely narrow, well under 3 percent of the card width, hugging the edge. Hand-painted oil brushstroke texture and metallic sheen appear only on the hairline itself and never on the background. The whole central area is completely empty flat pure black. No characters, no scenery, no text, no watermark, no signature, no logo, no halo, no light bleed onto the black
```

## frame-uncommon.png（青铜绿锈双线 + 连续角托）

```
A vertical trading card image on a flat, completely uniform, absolute pure black (#000000) background: no gradient, no vignette, no glow, no fog, no smoke, no ambient light, no canvas texture, no brushstroke texture and no grain anywhere in the background. The only decoration is two ultra-fine hairlines in dark bronze with a subtle green patina tint, drawn just inside the image edge with a very small margin, and at each of the four corners one small neat continuous geometric bracket ornament that flows out of and connects the two hairlines, no detached fragments, no emblems, no scrollwork, no central ornament. The entire border band is extremely narrow, well under 4 percent of the card width, hugging the edge. Hand-painted oil brushstroke texture and metallic sheen appear only on the lines themselves and never on the background. The whole central area is completely empty flat pure black. No characters, no scenery, no text, no watermark, no signature, no logo, no halo, no light bleed onto the black
```

## frame-rare.png（暖金三线 + 小符文 + 金辉光）

```
A vertical trading card image on a flat, completely uniform, absolute pure black (#000000) background: no gradient, no vignette, no glow, no fog, no smoke, no ambient light, no canvas texture, no brushstroke texture and no grain anywhere in the background. The only decoration is three ultra-fine hairlines in bright warm antique gold (absolutely not bronze, not green patina): two main lines with a third even finer inner keyline, all three packed tightly together within the same narrow band just inside the image edge with a very small margin, the subtle luminous gold sheen stays on the lines themselves and produces zero spill onto the black, small neat rune-like corner accents only, no emblems, no heraldic shields, no central ornament. The entire border band is extremely narrow, well under 4 percent of the card width, hugging the edge. Hand-painted oil brushstroke texture appears only on the lines themselves and never on the background. The whole central area is completely empty flat pure black. No characters, no scenery, no text, no watermark, no signature, no logo, no halo, no light bleed onto the black
```
