"""美术派生图生成：原图母版（source/）→ 三档 WebP 派生（assets/）。

为什么需要
----------
原图母版都是 1152×1536 的大 PNG（2–6MB），实际显示：卡面 compact 仅 60×80、
full 120×160，详情页最大 420px；立绘最小 34×45。浏览器按原图尺寸下载，面积浪费
两个数量级。本脚本按显示尺寸导出小档 WebP，前端用 <img srcset> 让浏览器按
「显示尺寸 × 设备 DPR」自选档。

目录约定（见仓库根 CLAUDE.md 与 assets/README.md）
------------------------------------------------
  source/   原图（母版 + 废稿）——不进 git，上传 R2 留档，本脚本的输入
  assets/   派生发布图 —— 进 git，site 与 game 双端取用，本脚本的输出

源→派生是「相对路径同构」映射：`source/cards/<id>.png` → `assets/cards/<id>@<w>w.webp`，
avatars 平级同理。`archive/` 下的废稿跳过（不产发布图）。

档位（宽）与目标场景
--------------------
  200w  卡面 compact 60×80 / 立绘缩略图 34×45、战场格 46×58
  400w  卡面 full 120×160 / 立绘中型展示
  800w  卡面 zoom 大图、详情页 420px / 立绘竖屏主图

不放大：母版窄于某档时跳过该档。

用法
----
  python tools/build_art_variants.py                    # source/ → assets/
  python tools/build_art_variants.py --force            # 覆盖已存在的派生图
  python tools/build_art_variants.py --dry-run          # 只报计划，不写文件
  python tools/build_art_variants.py --widths 400,800   # 只出两档

依赖 Pillow。母版的云端归档走 `tools/sync_art.py`，本脚本只出派生图、不碰网络。
"""

from __future__ import annotations

import argparse
import sys
from collections.abc import Iterator
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("需要 Pillow：pip install Pillow")

DEFAULT_SRC = "source"
DEFAULT_OUT = "assets"
DEFAULT_WIDTHS = (200, 400, 800)


def iter_masters(src_root: Path) -> Iterator[Path]:
    """src_root 下所有母版 png（递归），跳过 archive/ 废稿。"""
    for p in sorted(src_root.rglob("*.png")):
        if "archive" in p.relative_to(src_root).parts:
            continue
        yield p


def build_one(src: Path, src_root: Path, out_root: Path,
              widths: tuple[int, ...], quality: int, force: bool, dry: bool) -> int:
    """为一张母版导出各档 WebP（写到 out_root 的对应相对路径），返回写出的档数。"""
    rel = src.relative_to(src_root)
    with Image.open(src) as im:
        # 立绘/头像可能是 RGBA（透明底），卡面是 RGB。保留 alpha 以免透明区被涂黑。
        img = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
        ow, oh = img.size

        written = 0
        for w in widths:
            if w > ow:  # 不放大
                print(f"  跳过 {w}w（母版仅 {ow}px 宽）  {rel}")
                continue
            out = out_root / rel.parent / f"{src.stem}@{w}w.webp"
            if out.exists() and not force:
                print(f"  存在，跳过  {out.relative_to(out_root)}")
                continue
            nh = max(1, round(oh * w / ow))
            resized = img.resize((w, nh), Image.LANCZOS)
            if dry:
                print(f"  [dry] {out.relative_to(out_root)}  {w}×{nh}")
            else:
                out.parent.mkdir(parents=True, exist_ok=True)
                resized.save(out, "WEBP", quality=quality, method=5)
                print(f"  {out.relative_to(out_root)}  {w}×{nh}  {out.stat().st_size // 1024}KB")
            written += 1
    return written


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="原图母版（source/）→ 三档 WebP 派生（assets/）")
    ap.add_argument("--src", default=DEFAULT_SRC, help=f"原图根目录，默认 {DEFAULT_SRC}")
    ap.add_argument("--out", default=DEFAULT_OUT, help=f"派生根目录，默认 {DEFAULT_OUT}")
    ap.add_argument("--widths", default=",".join(map(str, DEFAULT_WIDTHS)),
                    help="逗号分隔的目标宽度，默认 200,400,800")
    ap.add_argument("--quality", type=int, default=80, help="WebP 质量，默认 80")
    ap.add_argument("--force", action="store_true", help="覆盖已存在的派生图")
    ap.add_argument("--dry-run", action="store_true", help="只报计划，不写文件")
    args = ap.parse_args(argv)

    widths = tuple(int(x) for x in args.widths.split(",") if x.strip())
    src_root, out_root = Path(args.src), Path(args.out)
    if not src_root.is_dir():
        sys.exit(f"原图目录不存在：{src_root}")

    masters = list(iter_masters(src_root))
    print(f"[{src_root}]  {len(masters)} 张母版 → {out_root}/")
    total = 0
    for src in masters:
        total += build_one(src, src_root, out_root, widths, args.quality, args.force, args.dry_run)

    verb = "计划" if args.dry_run else "生成"
    print(f"\n合计：{len(masters)} 张母版，{verb} {total} 个派生文件（档位 {widths}，q{args.quality}）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
