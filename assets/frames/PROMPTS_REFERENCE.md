# 边框 prompt 风格基准（认可版）

本文件是 2026-09-23 主人与奴家拍板认可的**三张定稿框**出图原始 prompt，作为 `PROMPTS.md` 生成结果的**风格基准**。

核心风格约束（所有 47 条 prompt 都须对齐）：

1. **细线贴边**：框线用 `extremely thin line ... drawn just inside the image edge` 描述。**不得**使用 `a clean border tracing the full rectangle edge`（诱导先画粗边框带）、`ornamental border frame`（诱导装饰边框带）或 `border band`（诱导色块条带）作描述——三者都会让线变厚变实。
2. **背景前置 + 逐项否定纹理**：纯黑背景描述**必须放在句首**，并逐项否定：`no gradient, no vignette, no glow, no fog, no smoke, no ambient light, no canvas texture, no brushstroke texture, no grain`。只写 `solid pure black background` 不够——模型仍会给黑底加布纹/颗粒。
3. **线是笔迹，不是物体**（⚠️ 23:26 教训：写 `metallic sheen` + `oil brushstroke texture on the line` 会把线画成带光泽渐变的**金属色块**）。正确写法：`looking like a fine line drawn directly on the black surface with a sharp fine pen` + `flat and delicate` + `slightly uneven hand-drawn line quality`。手绘感靠「不均匀」，**不靠**油画笔触和金属光泽。
4. **反色块反实体负向词**（每条 prompt 必带）：`no 3D bevel, no glossy highlight, no metallic gradient, no reflection, not a solid band, not a filled strip, not a physical frame, and the space between and around the lines stays pure black`。最后半句最关键——明说线两侧仍是黑的，锚定「细线空腔」语义。
5. **线宽量化**（量化的是**线本身**，不是带）：`each line well under 1 percent of the image width`（1024px 图上约 <10px）。
6. **窄带不内铺**：`all ornament strictly confined to a narrow band along the edges, no ornament spreading inward, no detached fragments`。
7. **无水印**：`no watermark, no signature, no logo`（平台水印须出图后涂黑或换无痕平台；豆包默认 jpeg，入库前先转 png）。

---

## frame-common.png（冷钢银单细线，最简）

```
A large empty canvas with one small vertical trading card centered in it: the card occupies about 70 percent of the canvas width, leaving a wide empty pure black margin on all four sides of the canvas. The card is a vertical rectangle with an exact 3:4 aspect ratio, width to height. The card itself has a flat, completely uniform, absolute pure black (#000000) background: no gradient, no vignette, no glow, no fog, no smoke, no ambient light, no canvas texture, no brushstroke texture and no grain anywhere on the card or in the surrounding margin. The only decoration is one single extremely thin line in cool steel-silver with a pale bluish tint, drawn just inside the card edge with a very small margin, looking like a fine line drawn directly on the black surface with a sharp fine pen. The line is flat and delicate, well under 1 percent of the image width: no 3D bevel, no glossy highlight, no metallic gradient, no reflection, not a solid band, not a filled strip, not a physical frame, and the space on both sides of the line stays pure black. Slightly uneven hand-drawn line quality. The line runs continuously and unbroken around all four edges and turns each corner cleanly with no gaps, with only a tiny minimal geometric tick touching the line at each corner. The whole central area is completely empty flat pure black. No characters, no scenery, no text, no watermark, no signature, no logo, no halo, no light bleed onto the black
```

## frame-uncommon.png（青铜绿锈双线 + 连续角托）

```
A large empty canvas with one small vertical trading card centered in it: the card occupies about 70 percent of the canvas width, leaving a wide empty pure black margin on all four sides of the canvas. The card is a vertical rectangle with an exact 3:4 aspect ratio, width to height. The card itself has a flat, completely uniform, absolute pure black (#000000) background: no gradient, no vignette, no glow, no fog, no smoke, no ambient light, no canvas texture, no brushstroke texture and no grain anywhere on the card or in the surrounding margin. The only decoration is two extremely thin parallel lines in dark bronze with a subtle green patina tint, drawn just inside the card edge with a very small margin, looking like fine lines drawn directly on the black surface with a sharp fine pen, and at each of the four corners one small neat continuous geometric bracket ornament that connects the two lines. The lines are flat and delicate, each well under 1 percent of the image width: no 3D bevel, no glossy highlight, no metallic gradient, no reflection, not a solid band, not a filled strip, not a physical frame, and the space between and around the lines stays pure black. Slightly uneven hand-drawn line quality. The lines run continuously and unbroken around all four edges and turn each corner cleanly with no gaps. The whole central area is completely empty flat pure black. No characters, no scenery, no text, no watermark, no signature, no logo, no halo, no light bleed onto the black
```

## frame-rare.png（暖金三线 + 小符文 + 金辉光）

```
A large empty canvas with one small vertical trading card centered in it: the card occupies about 70 percent of the canvas width, leaving a wide empty pure black margin on all four sides of the canvas. The card is a vertical rectangle with an exact 3:4 aspect ratio, width to height. The card itself has a flat, completely uniform, absolute pure black (#000000) background: no gradient, no vignette, no glow, no fog, no smoke, no ambient light, no canvas texture, no brushstroke texture and no grain anywhere on the card or in the surrounding margin. The only decoration is three extremely thin parallel lines in warm antique gold (absolutely not bronze, not green patina), two main lines with a third even finer inner keyline, all three packed closely together, drawn just inside the card edge with a very small margin, looking like fine lines drawn directly on the black surface with a sharp fine pen, small neat rune-like corner accents only. The lines are flat and delicate, each well under 1 percent of the image width: no 3D bevel, no glossy highlight, no metallic gradient, no reflection, not a solid band, not a filled strip, not a physical frame, and the space between and around the lines stays pure black. Slightly uneven hand-drawn line quality. The lines run continuously and unbroken around all four edges and turn each corner cleanly with no gaps. The whole central area is completely empty flat pure black. No characters, no scenery, no text, no watermark, no signature, no logo, no halo, no light bleed onto the black
```
