# 英雄头像 prompt 维护（独立，不引用 heroArtStyle）

> ⛔ 本文件独立维护**英雄头像**（战场卡牌透明底）的出图提示词，**不引用 `game/src/data/heroArt.json` 的 `heroArtStyle`**。
> 立绘（full-body）与头像（avatar）风格解耦：立绘保持油画风（heroArtStyle 含 painterly），头像保持干净卡牌风。
> ⛔ 出头像**绝不回写** `heroArt.json` 的 `heroArtStyle`——那是立绘的锚，美术风格保持不变。

## 出图方式
- **图生图**：以对应英雄的**原立绘 PNG**（`source/heroes/hero_s{strength}a{agility}i{intelligence}_{gender}.png`）作为 `image1`，`input_fidelity: high` 保同人。
- 尺寸：1024（战场小图）。放大不虚化面部靠干净卡牌风锚，避免油画笔触被放大炸出。
- 透明底：`ImageGen` 的 `background: "transparent"` 在本环境**不生效**（实测落 RGB），需 `buddy-image-processing` 的 `matting` 去底（只加 alpha、不改 RGB，不虚化面部）。

## 头像风格锚（avatarArtStyle）—— 干净卡牌风
`clean semi-realistic card-game character illustration, smooth crisp digital rendering with clean edges, no oil-paint look, no painterly brushwork, no visible brushstrokes, no impasto, no canvas texture, no heavy impasto, European features, same character as the reference, upper-body focus, head and shoulders, no extra limbs`

> 图生图时 `same character as the reference` 承担人物一致性，风格锚只管渲染观感；**不得出现 painterly / painted / oil-paint 字样**（那是立绘油画锚的用词，头像要干净卡牌风）。

## 已出清单（2026-10-11 批量完成）

**产物落点**：定稿放 `source/avatars/`，废稿改名进 `source/avatars/archive/`；派生三档 webp 进 `assets/avatars/`。

**命名**：`hero_{key}__idle_src.png` = 带背景版（RGB）；`hero_{key}__idle.png` = matting 去底透明版（RGBA，战场卡牌用）。均 1024×1024。

| 英雄 key | 场景 | 状态 |
|---|---|---|
| `hero_s0a0i3_male` | 书房（daylight study） | ✅ |
| `hero_s0a0i3_female` | 书房 | ✅（⚠️ 基于**未提交**的立绘稿 22:22 版；立绘若再改需重出） |
| `hero_s0a1i2_male` / `_female` | 村巷（sunlit village lane） | ✅ |
| `hero_s0a2i1_male` / `_female` | 荒原（open heath） | ✅ |
| `hero_s0a3i0_male` / `_female` | 海崖（coastal cliff path） | ✅ |
| `hero_s1a0i2_male` / `_female` | 市集（market square） | ✅ |
| `hero_s1a1i1_male` / `_female` | 街角（street corner） | ✅ |
| `hero_s1a2i0_male` / `_female` | 河船（river steamer deck） | ✅ |
| `hero_s2a0i1_male` / `_female` | 农场（farmyard） | ✅ |
| `hero_s2a1i0_male` / `_female` | 站台（railway platform） | ✅ |
| `hero_s3a0i0_male` / `_female` | 采石场（stone quarry） | ✅ |

**合计 19/20 英雄，38 张，72.9 MB。** 校验：src 与透明版一一配对无缺，尺寸均 1024，src=RGB / idle=RGBA，无异常文件。

> 场景约束沿用立绘端的踩坑经验：荒原加「plain open sky, no ominous or figure-shaped cloud formations」（防骷髅云）；海崖加「open sea and sky with no streets buildings or town」（防街景浮海）；河船加「no street lamps or street furniture in the water」（防路灯入水）。

## ⛔ 防前景遮挡（2026-10-11 踩坑，头肩构图必加）
- **现象**：`s1a0i2_female`（市集）首版身体被木摊/物件挡住一部分 → matting 抠图产物也跟着缺一块。
- **根因**：头肩构图下人物占满画面，**场景物件（摊档木料/柱子/货物）极易被模型放到人物身前**，形成前景遮挡；抠图只抠人，被挡部分就缺失。此前所有 prompt **从未约束过前景遮挡**。
- **解法（已验证，加在场景描述之后）**：
  `all {场景物件} behind the figure, no posts planks or objects in front of or overlapping the figure, the figure fully visible and unobstructed from head to chest, nothing occluding the body shoulders or arms, clear separation between figure and background`
- ⚠️ 已按此重出 `hero_s1a0i2_female`（旧版归档 `__occluded`）。**同场景的 `hero_s1a0i2_male`（市集男）风险相同，待主人确认是否也要重出**。
- 💡 教训归类：与立绘的「场景元素错乱」同源——模型会在开放区域自动补内容；头肩像里补的东西往往**压到人物身上**，比立绘更致命（直接影响抠图完整性）。

## ⛔ 防圆形裁切（2026-10-11 踩坑，头肩构图必加）
- **现象**：`s1a1i1_female` 首版 src 四角是纯白、只有中心圆形区域有画面 → **被模型裁成圆形徽章式头像**；matting 后圆外变透明，人物被裁掉一圈，不可用。
- **根因**：prompt 里的 **`avatar` 一词**被模型解读为"圆形头像/徽章"，自作主张加圆形裁切 + 白底。（⚠️ 同批 20 张里只有这 1 张触发，属**偶发**，但必须防。）
- **解法（已验证）**：把开头改成 `square 1:1 head-and-shoulders portrait of the same person filling the entire square frame edge to edge`，并加：
  `full-bleed rectangular image, no circular crop, no round badge or circular frame, no vignette, no white border or margin, no blank area around the figure`
- ✅ 已按此重出 `hero_s1a1i1_female`（旧版归档 `__circular`），重出后四角白点 0/8，满幅正常。

## ⛔ 头肩像禁手（2026-10-11 踩坑）
- **现象**：`s2a0i1_female`（农场）背景里多出一只手，抠图后头顶连着一小块背景残留 → 不可用。
- **根因**：立绘动作带手部（抱干草捆/翻书/推石/提箱），**头肩构图下模型会把动作和手一起带进来，甚至多长出一只**（多余肢体）。
- **解法（已验证）**：头肩像**只保留体型/着装/面部/场景，动作与手一律不写**，并加：
  `no hands or arms visible anywhere in the frame, no raised hands, no extra hands, no floating hands, no deformed or duplicated limbs`
- ✅ 已重出 `hero_s2a0i1_female`（旧版归档 `__extrahand`）。
- ⚠️ **同类高风险卡**（立绘动作带手，可能出现多余手/手入画）：`s2a0i1_male`(抱干草，风险最高)、`s1a0i2_male/_female`(翻书)、`s3a0i0_male/_female`(推石)、`s2a1i0_male/_female`(提箱)。出图/补图时**默认带上禁手约束**，并请主人重点目视这几张。
- **二轮踩坑（举手构图压不住）**：`s2a0i1_female` 立绘是**手举过头顶**，`input_fidelity:high` 会忠实继承举手构图，纯否定词（禁手）压不住 → 反而更严重。**解法（已验证）**：① 去掉 `input_fidelity`（降保真重绘）；② 开头改 `redraw this character as a ...`；③ 给**替代姿态**而非只否定：`head and shoulders only, both arms lowered straight down at her sides and completely out of frame, no raised arms whatsoever, no hands or forearms anywhere above the shoulders`。重出后头顶无手，双臂出画 ✅（旧版归档 `__raisedhand2`）。代价：降保真后同人相似度略降，需目视把关。
- ✅ 全库 20 张 src 已逐一目视复查：无多余手、无举手、无前景遮挡、满幅无圆框。

## 🔍 出图后必做的自检（2026-10-11 深夜更新：当前模型已可直读图片，优先目视，脚本做辅助）
1. **目视**（首选）：直接 Read 出图，逐张核对多余手/举手/前景遮挡/圆框/风格漂移。
2. **圆形/白底检测**（脚本辅助）：src 四角 + 四边中点共 8 点，≥6 点白（RGB 均 >238）而中心非白 → 判圆形裁切，必须重出。
3. **alpha 连通域**（透明版）：检测孤立悬浮碎片（碎块与主体不相连的残渣）；注意它抓不到"与人物相连的举手/连体残留"。
4. **前景遮挡**：脚本难判定，靠 prompt 预防 + 目视。
3. **配对与通道**：src=RGB / idle=RGBA，均 1024；两者按 `hero_s\d+a\d+i\d+_(?:male|female)` 提取 key 一一配对（⚠️ 正则别写成 `_\w+`，会贪婪吃到 `__idle_src` 造成误报）。
> 力量型（s2a1i0 / s3a0i0 男女）沿用反写实锚 `stylised card-game rendering with clean heroic proportions, not photorealistic`。

## 纪律
- 新风格约束 → 先写回本文件 → 重跑出图 → 确认产物 prompt 已更新 → 才出图。
- 成本 5–10 积分/张；**先出 1 张验证，主人满意再批量**；ImageGen 每条消息单张串行（同秒同名临时文件会互相覆盖）。
- 图不放 `.workbuddy/tmp/`（会被宿主清理）；放 `avatars/`（正式版）+ 其下 `archive/`（废版）。
