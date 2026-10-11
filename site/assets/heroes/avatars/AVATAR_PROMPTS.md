# 英雄头像 prompt 维护（独立，不引用 heroArtStyle）

> ⛔ 本文件独立维护**英雄头像**（战场卡牌透明底）的出图提示词，**不引用 `game/src/data/heroArt.json` 的 `heroArtStyle`**。
> 立绘（full-body）与头像（avatar）风格解耦：立绘保持油画风（heroArtStyle 含 painterly），头像保持干净卡牌风。
> ⛔ 出头像**绝不回写** `heroArt.json` 的 `heroArtStyle`——那是立绘的锚，美术风格保持不变。

## 出图方式
- **图生图**：以对应英雄的**原立绘 PNG**（`../hero_s{strength}a{agility}i{intelligence}_{gender}.png`）作为 `image1`，`input_fidelity: high` 保同人。
- 尺寸：1024（战场小图）。放大不虚化面部靠干净卡牌风锚，避免油画笔触被放大炸出。
- 透明底：`ImageGen` 的 `background: "transparent"` 在本环境**不生效**（实测落 RGB），需 `buddy-image-processing` 的 `matting` 去底（只加 alpha、不改 RGB，不虚化面部）。

## 头像风格锚（avatarArtStyle）—— 干净卡牌风
`clean semi-realistic card-game character illustration, smooth crisp digital rendering with clean edges, no oil-paint look, no painterly brushwork, no visible brushstrokes, no impasto, no canvas texture, no heavy impasto, European features, same character as the reference, upper-body focus, head and shoulders, no extra limbs`

> 图生图时 `same character as the reference` 承担人物一致性，风格锚只管渲染观感；**不得出现 painterly / painted / oil-paint 字样**（那是立绘油画锚的用词，头像要干净卡牌风）。

## 已出清单
| 文件 | 英雄 | 说明 |
|---|---|---|
| `hero_s0a0i3_male__idle_src.png` | 书房男 | 去油画 + 砖墙街角背景版（RGB 1024，1.71MB） |
| `hero_s0a0i3_male__idle.png` | 书房男 | 上者 matting 去底透明版（RGBA，战场用） |
| `hero_s1a1i1_male__idle_src.png` | 街角男 | 同上口径 |
| `hero_s1a1i1_male__idle.png` | 街角男 | matting 去底透明版 |

## 纪律
- 新风格约束 → 先写回本文件 → 重跑出图 → 确认产物 prompt 已更新 → 才出图。
- 成本 5–10 积分/张；**先出 1 张验证，主人满意再批量**；ImageGen 每条消息单张串行（同秒同名临时文件会互相覆盖）。
- 图不放 `.workbuddy/tmp/`（会被宿主清理）；放 `avatars/`（正式版）+ 其下 `archive/`（废版）。
