# tools/ — 与 docs 设计无关的周边工具

## 收纳原则（2026-09-24 主人裁定）

仓库是**纯 DDD 战斗设计文档库**，`docs/` 必须保持纯粹——只放设计相关内容。

| 目录 | 放什么 |
|---|---|
| `docs/tools/` | **设计侧**脚本：技能池校验（Gate）、docs 内文档生成、设计数据迁移 |
| `tools/`（本目录） | **非设计侧**周边工具：产物落在 `assets/`（发布资源）或 `source/`（原图留档）的生产、图片处理等 |

判据很简单：**脚本的产物落在哪、服务谁**。产物在 `assets/`（发布资源）、`source/`（原图）或处理图片素材 → 放 `tools/`；产物/作用对象是 docs 内的设计数据或文档 → 放 `docs/tools/`。

## 现有脚本

### `build_frame_prompts.py`
导出全部边框图 prompt 清单到 `assets/frames/PROMPTS.md`，供批量出图。

```bash
python tools/build_frame_prompts.py
```

数据源：`docs/json/manifest.json` 的 `artFrame`（前五档自包含 prompt）、`artFrameFormat`（44 张职业框共用约束）+ 各途径 `*.skills.json` 的 `artFrameEpic` / `artFrameLegendary`。改了 JSON 里的边框 prompt 后重跑本脚本，**勿手改产物**。

### `normalize_frame.py`
边框图后处理：把近黑背景压成绝对纯黑，并量化体检框带宽度。纯标准库实现（不依赖 Pillow），支持 8-bit RGB/RGBA 非隔行 PNG。

```bash
# 标准流程：裁掉外圈留白（顺带裁掉水印）+ 拉伸到 3:4 + 压黑
python tools/normalize_frame.py --autocrop 8 --stretch 1152x1536 图.png

# 只体检不改写：黑底纯度 / 四边留白 / 框带宽度
python tools/normalize_frame.py --check assets/frames/*.png
```

常用参数：

| 参数 | 作用 |
|---|---|
| `--autocrop PAD` | 裁到框体外扩 PAD 像素（按中位数定框沿，抗水印离群） |
| `--tight` | 改用严格外接矩形裁（输入图须已无离群亮块，更贴边） |
| `--crop X0,Y0,X1,Y1` | 按绝对矩形裁剪，截掉 AI 出图的边缘残留/伪影 |
| `--stretch WxH` | 双线性拉伸铺满目标画布（**目标一律 3:4，如 1152x1536**；卡面是 3:4，`object-fit: cover` 下比例不符会裁掉框边） |
| `--mask X,Y,W,H` | 把该矩形涂黑（可多次），清除框内侧水印 |
| `--threshold N` | 压黑阈值，默认 24 |

验收标准：黑底中心区最亮值 **0**、四边留白**对称**、框线占比随线数递进（单线 1% 级 / 双线 2% 级 / 三线 3% 级）。

### `build_art_variants.py`
把原图母版（`source/`，1152×1536 大 PNG）导出三档 WebP 派生图到 `assets/`，前端用 `<img srcset>` 按「显示尺寸 × 设备 DPR」自选档——避免小卡面（compact 60×80）拖下全尺寸大图。

```bash
python tools/build_art_variants.py                    # source/ → assets/
python tools/build_art_variants.py --dry-run          # 只报计划，不写文件
python tools/build_art_variants.py --force            # 覆盖已存在的派生图
```

档位（宽）：`200w`（卡面 compact 60×80 / 立绘缩略图 34×45）、`400w`（卡面 full 120×160）、`800w`（卡面 zoom 大图 / 详情页 420px / 立绘主图）。源→派生同构映射（`source/cards/<id>.png` → `assets/cards/<id>@<w>w.webp`，avatars 同理），`archive/` 废稿跳过，前端按 cardId 现拼、无需索引。

**出图 / 换图后必须重跑**（覆盖用 `--force`），前端才有对应档；母版窄于某档时自动跳过该档（不放大）。

### `sync_art.py`
把 `source/` 原图与 Cloudflare R2 增量同步（本地 MD5 ↔ 远端 ETag 比对，一致跳过）。

```bash
python tools/sync_art.py push             # 本地 → R2（上传留档）
python tools/sync_art.py pull             # R2 → 本地（新机恢复）
python tools/sync_art.py push --dry-run
```

配置走环境变量 `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET`（R2 控制台申请；依赖 `pip install boto3`）。

## 49 张框的标准出图流程

1. 出图：用 `assets/frames/PROMPTS.md` 里对应那条 prompt（大画布小内容版）
2. 线带诊断：判有无边缘残留（**间距异常即残留**——真多线之间间距一致，残留线间距明显不同）
3. 有残留 → `--crop` 精确截；无残留 → `--autocrop 8`
4. `--stretch 1152x1536` 统一到 3:4
5. `--check` 验收，不达标就调 prompt 重出，别入库

出图会消耗积分，**先出一张验证、确认风格后再批量**。
