# assets/ — 发布美术资源（site + game 双端取图处）

`assets/` 进 git，放派生发布图（三档 webp）与边框 png；**原图母版在 `source/`，不进 git**（根 `.gitignore` 已排除），唯一正源靠 `tools/sync_art.py` 上传 Cloudflare R2 留档。各类的**生图 prompt 清单随 `assets/<类>/PROMPTS.md` 进 git**（版本历史 + clone 即得），`source/` 只留纯图片。

## 目录

```
assets/（进 git）
├─ cards/    <cardId>@<200|400|800>w.webp    由 source/cards/<cardId>.png 派生
├─ heroes/   hero_*@<w>w.webp + PROMPTS.md   立绘派生 + 生图 prompt
├─ avatars/  hero_*__idle{,_src}@<w>w.webp + PROMPTS.md
└─ frames/   frame-*.png（直取，无派生）+ PROMPTS.md（build_frame_prompts.py 生成，勿手改）

source/（不进 git，R2 留档）
├─ cards/    <cardId>.png          +  archive/<cardId>__<日期>.png
├─ heroes/   hero_s{力}a{敏}i{智}_{gender}.png  +  archive/hero_*__v<n>.png
└─ avatars/  hero_*__idle{,_src}.png             +  archive/…
```

- **定稿**：`<id>.png`（卡面用 cardId；立绘 10 组力敏智 × 2 性别 = 20；头像 `__idle` 为成品、`__idle_src` 为源）
- **废稿**：改名 `<id>__<版本或日期>.png` 放进该类 `archive/`——脚本跳过废稿，不产派生图

## 工作流

1. **生图**：按 `assets/<类>/PROMPTS.md` 里对应条目出候选
2. **定稿**：选中的按上述命名放进 `source/<类>/`
3. **废稿归档**：落选的改名 `<id>__<版本>` 移进 `source/<类>/archive/`
4. **产出发布图**：`python tools/build_art_variants.py` → 三档 webp 进 `assets/`
5. **上传留档**：`python tools/sync_art.py push` → 整个 `source/` 增量传 R2；新机 `pull` 恢复

## 相关

- 派生图档位与用法：`tools/README.md` 的 `build_art_variants.py`
- 云端同步：`tools/sync_art.py`（凭证走环境变量 `R2_*`）
- 母版 / 派生的整体架构：仓库根 `CLAUDE.md`
