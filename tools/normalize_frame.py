"""边框图后处理：把近黑背景压成绝对纯黑，并量化体检「边框带是否过宽」。

为什么需要
----------
扩散模型出的「纯黑底」实测常是 #050505~#1a1a1a 的深灰，或带布纹颗粒 / 辉光灰雾。
站点以 `mix-blend-mode: screen` 叠框图，任何近黑都会把整张卡面整体提灰、发雾，
所以入库前必须压成 #000000。prompt 只能缓解、无法保证，本脚本是硬保证。

同时提供 `--check` 体检：报告非纯黑像素占比、背景最亮值，以及**边框带内伸宽度
占卡宽的百分比**——用来量化核对「框太宽」这一 complaints（目标 < 4%）。

实现说明
--------
纯标准库实现（不依赖 Pillow / numpy），支持 8-bit RGB / RGBA 的非隔行 PNG。
出图平台（豆包 / 即梦 / MJ / SD）导出的 PNG 基本都落在这个子集内；
若遇到 16-bit / 调色板 / 隔行格式，脚本会明确报错而不是静默损坏文件。

用法
----
  python tools/normalize_frame.py 图.png [图2.png ...]      # 原地压黑并覆盖
  python tools/normalize_frame.py --check 图.png            # 只体检，不改写
  python tools/normalize_frame.py --threshold 32 图.png     # 调阈值（默认 24）
  python tools/normalize_frame.py --in-place 图.png         # 同默认；默认即原地

阈值语义：亮度 v = max(r,g,b)。v <= t 归零；t < v <= 2t 线性压缩到 0（软过渡，
避免辉光灰雾边界出现硬边圆环）；v > 2t 原样保留（框线本体不受影响）。
"""

import argparse
import struct
import sys
import zlib
from pathlib import Path

PNG_SIG = b"\x89PNG\r\n\x1a\n"


# ---------------------------------------------------------------- PNG 解码

def _chunks(data: bytes):
    """遍历 PNG chunk，yield (type, payload)。"""
    if data[:8] != PNG_SIG:
        raise ValueError("不是 PNG 文件")
    pos = 8
    while pos + 8 <= len(data):
        (length,) = struct.unpack(">I", data[pos:pos + 4])
        ctype = data[pos + 4:pos + 8]
        payload = data[pos + 8:pos + 8 + length]
        yield ctype, payload
        pos += 12 + length
        if ctype == b"IEND":
            break


def _unfilter(raw: bytes, width: int, height: int, bpp: int, stride: int) -> bytearray:
    """还原 PNG 行过滤器，返回逐行像素数据（无 filter 字节）。"""
    out = bytearray()
    prev = bytearray(stride)
    p = 0
    for _ in range(height):
        ftype = raw[p]
        p += 1
        line = bytearray(raw[p:p + stride])
        p += stride
        if ftype == 1:
            for i in range(bpp, stride):
                line[i] = (line[i] + line[i - bpp]) & 0xFF
        elif ftype == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif ftype == 3:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif ftype == 4:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i - bpp] if i >= bpp else 0
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 0xFF
        elif ftype != 0:
            raise ValueError(f"不支持的行过滤器类型 {ftype}")
        out += line
        prev = line
    return out


def read_png(path: Path):
    """读 8-bit RGB/RGBA 非隔行 PNG，返回 (width, height, channels, bytearray)。"""
    data = path.read_bytes()
    width = height = depth = ctype = None
    interlace = 0
    idat = b""
    for ctype_, payload in _chunks(data):
        if ctype_ == b"IHDR":
            width, height, depth, ctype, _comp, _filt, interlace = struct.unpack(
                ">IIBBBBB", payload
            )
        elif ctype_ == b"IDAT":
            idat += payload
    if None in (width, height, depth, ctype):
        raise ValueError("缺少 IHDR")
    if depth != 8:
        raise ValueError(f"仅支持 8-bit，当前位深 {depth}（请先转成 8-bit）")
    if ctype not in (2, 6):
        raise ValueError(f"仅支持 RGB/RGBA，当前色彩类型 {ctype}（调色板图请先转 RGB）")
    if interlace:
        raise ValueError("不支持隔行 PNG（导出时请关闭 interlaced）")
    channels = 3 if ctype == 2 else 4
    stride = width * channels
    raw = zlib.decompress(idat)
    return width, height, channels, _unfilter(raw, width, height, channels, stride), ctype


# ---------------------------------------------------------------- PNG 编码

def write_png(path: Path, width: int, height: int, pixels: bytearray, ctype: int) -> None:
    """以 filter 0（None）写回 PNG。压缩率略低但零风险。"""
    channels = 3 if ctype == 2 else 4
    stride = width * channels
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        raw += pixels[y * stride:(y + 1) * stride]

    def chunk(tag: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + tag
            + payload
            + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", width, height, 8, ctype, 0, 0, 0)
    body = (
        PNG_SIG
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(body)


# ---------------------------------------------------------------- 核心处理

def _crush(pixels: bytearray, channels: int, threshold: int) -> int:
    """就地压黑，返回被改动的像素数。软过渡避免灰雾硬边。"""
    t = threshold
    changed = 0
    for i in range(0, len(pixels), channels):
        r, g, b = pixels[i], pixels[i + 1], pixels[i + 2]
        v = r if r > g else g
        if b > v:
            v = b
        if v > t * 2:
            continue
        if v <= t:
            factor = 0.0
        else:
            factor = (v - t) / float(t)
        nr, ng, nb = int(r * factor), int(g * factor), int(b * factor)
        if (nr, ng, nb) != (r, g, b):
            changed += 1
            pixels[i], pixels[i + 1], pixels[i + 2] = nr, ng, nb
        if channels == 4:
            pixels[i + 3] = 255  # 背景须完全不透明，否则 screen 叠出洞
    return changed


def _scan_depth(is_bright, length: int, gap_allow: int) -> tuple[int, int]:
    """从一端向内扫描边框带：返回 (外缘 margin, 带深度=最内侧亮像素+1)。

    容许多达 gap_allow 个连续背景像素的间隔，避免把双线/三线之间的空隙
    误判成带结束。若无任何亮像素返回 (0, 0)。
    """
    margin = -1
    depth = 0
    gap = 0
    for i in range(length):
        if is_bright(i):
            if margin < 0:
                margin = i
            depth = i + 1
            gap = 0
        else:
            if margin < 0:
                continue  # 还没进带，继续找外缘
            gap += 1
            if gap > gap_allow:
                break
    return (margin if margin >= 0 else 0), depth


def _p95(values: list[int]) -> int:
    """取 95 分位，避免水印 / 噪点等孤立极值把整体指标拉爆。"""
    if not values:
        return 0
    s = sorted(values)
    return s[min(len(s) - 1, int(len(s) * 0.95))]


def band_metrics(pixels: bytearray, width: int, height: int, channels: int,
                 threshold: int, gap_allow: int = 24, step: int = 2) -> dict:
    """测四边的 margin 与带深度（像素），以及带深度占卡宽百分比。

    step: 行/列采样步长，纯 Python 逐像素扫描太慢，默认隔一采一已足够精确。
    """
    stride = width * channels

    def bright_at(x: int, y: int) -> int:
        i = y * stride + x * channels
        return max(pixels[i], pixels[i + 1], pixels[i + 2])

    lefts, rights, tops, bottoms = [], [], [], []
    for y in range(0, height, step):
        m, d = _scan_depth(lambda x: bright_at(x, y) > threshold, width, gap_allow)
        if d:
            lefts.append((m, d))
        m, d = _scan_depth(lambda x: bright_at(width - 1 - x, y) > threshold, width, gap_allow)
        if d:
            rights.append((m, d))
    for x in range(0, width, step):
        m, d = _scan_depth(lambda y: bright_at(x, y) > threshold, height, gap_allow)
        if d:
            tops.append((m, d))
        m, d = _scan_depth(lambda y: bright_at(x, height - 1 - y) > threshold, height, gap_allow)
        if d:
            bottoms.append((m, d))

    lm = _p95([v[0] for v in lefts])
    ld = _p95([v[1] for v in lefts])
    rm = _p95([v[0] for v in rights])
    rd = _p95([v[1] for v in rights])
    tm = _p95([v[0] for v in tops])
    td = _p95([v[1] for v in tops])
    bm = _p95([v[0] for v in bottoms])
    bd = _p95([v[1] for v in bottoms])

    horiz = (ld + rd) / float(width) * 100.0
    vert = (td + bd) / float(height) * 100.0
    return {
        "margin": (lm, rm, tm, bm),
        "depth": (ld, rd, td, bd),
        "pct": max(horiz, vert),
    }


def crop_rect(pixels: bytearray, width: int, height: int, channels: int,
              box: tuple[int, int, int, int]):
    """按绝对矩形裁剪（端点含）。用于截掉 AI 出图在画布边缘的伪影/残留线。"""
    x0, y0, x1, y1 = box
    x0 = max(0, x0)
    y0 = max(0, y0)
    x1 = min(width - 1, x1)
    y1 = min(height - 1, y1)
    cw, chh = x1 - x0 + 1, y1 - y0 + 1
    stride = width * channels
    out = bytearray(cw * chh * channels)
    for y in range(chh):
        src = (y0 + y) * stride + x0 * channels
        out[y * cw * channels:(y + 1) * cw * channels] = pixels[src:src + cw * channels]
    return out, cw, chh


def resize_to(pixels: bytearray, width: int, height: int, channels: int,
              new_w: int, new_h: int) -> bytearray:
    """双线性重采样。用于「裁内容后拉伸铺满目标比例画布」——模型画的比例对不上
    3:4 时，靠拉伸消除补黑边造成的左右 margin（线宽横纵拉伸比差异约 3%，不可察）。
    """
    out = bytearray(new_w * new_h * channels)
    stride = width * channels
    sx = (width - 1) / max(1, new_w - 1)
    sy = (height - 1) / max(1, new_h - 1)
    for y in range(new_h):
        fy = y * sy
        y0 = int(fy)
        y1 = min(y0 + 1, height - 1)
        wy = fy - y0
        b0 = y0 * stride
        b1 = y1 * stride
        dst_row = y * new_w * channels
        for x in range(new_w):
            fx = x * sx
            x0 = int(fx)
            x1 = min(x0 + 1, width - 1)
            wx = fx - x0
            i00 = b0 + x0 * channels
            i01 = b0 + x1 * channels
            i10 = b1 + x0 * channels
            i11 = b1 + x1 * channels
            dst = dst_row + x * channels
            for c in range(channels):
                top = pixels[i00 + c] * (1 - wx) + pixels[i01 + c] * wx
                bot = pixels[i10 + c] * (1 - wx) + pixels[i11 + c] * wx
                out[dst + c] = int(top * (1 - wy) + bot * wy)
    return out


def autocrop_to_content(pixels: bytearray, width: int, height: int, channels: int,
                        threshold: int, pad: int = 8,
                        ratio: tuple[int, int] = (3, 4),
                        tight: bool = False, pad_ratio: bool = True):
    """裁到框体外扩 pad 像素，并把画布补齐到目标宽高比（只补黑边、不裁内容）。

    ⚠️ 不能用全局 min/max bbox：右下角水印等离群亮块会把 bbox 撑大，
    导致裁完框体偏位。这里按行/列扫描取**中位数**定位框沿——框沿在
    数百行/列上恒定，水印只污染少数行/列，中位数天然抗离群。
    返回 (新像素, 新宽, 新高)。
    """
    stride = width * channels

    def _med(vals: list[int]) -> int:
        s = sorted(vals)
        return s[len(s) // 2]

    lefts, rights = [], []
    for y in range(0, height, 2):
        base = y * stride
        left = right = -1
        for x in range(0, width, 2):
            i = base + x * channels
            v = pixels[i]
            g = pixels[i + 1]
            b = pixels[i + 2]
            if g > v:
                v = g
            if b > v:
                v = b
            if v > threshold:
                if left < 0:
                    left = x
                right = x
        if left >= 0:
            lefts.append(left)
            rights.append(right)
    if not lefts:
        return pixels, width, height
    tops, bottoms = [], []
    for x in range(0, width, 2):
        top = bottom = -1
        for y in range(0, height, 2):
            i = y * stride + x * channels
            v = pixels[i]
            g = pixels[i + 1]
            b = pixels[i + 2]
            if g > v:
                v = g
            if b > v:
                v = b
            if v > threshold:
                if top < 0:
                    top = y
                bottom = y
        if top >= 0:
            tops.append(top)
            bottoms.append(bottom)

    if tight:
        # 严格外接矩形：输入图须已无离群亮块（水印已去 / 大画布小内容路线）
        minx, maxx = min(lefts + rights), max(lefts + rights)
        miny, maxy = min(tops + bottoms), max(tops + bottoms)
    else:
        minx, maxx = _med(lefts), _med(rights)
        miny, maxy = _med(tops), _med(bottoms)
    x0 = max(0, minx - pad)
    x1 = min(width - 1, maxx + pad)
    y0 = max(0, miny - pad)
    y1 = min(height - 1, maxy + pad)
    cw, chh = x1 - x0 + 1, y1 - y0 + 1

    new_w, new_h = cw, chh
    if pad_ratio:
        # 补齐到目标比例：只扩短边（补黑），绝不裁内容。
        # 配合 --stretch 时须关闭，否则补齐的黑边会被一起拉伸、margin 消不掉。
        tw, th = ratio
        if cw * th < chh * tw:  # 太窄 → 补宽
            new_w = chh * tw // th
        else:  # 太矮 → 补高
            new_h = cw * th // tw
    out = bytearray(new_w * new_h * channels)
    ox = (new_w - cw) // 2
    oy = (new_h - chh) // 2
    for y in range(chh):
        src = ((y0 + y) * stride + x0 * channels)
        dst = ((oy + y) * new_w + ox) * channels
        out[dst:dst + cw * channels] = pixels[src:src + cw * channels]
    return out, new_w, new_h


def process(path: Path, threshold: int, check_only: bool, autocrop: int = 0,
            masks: list[tuple[int, int, int, int]] | None = None,
            tight: bool = False, stretch: tuple[int, int] | None = None,
            crop: tuple[int, int, int, int] | None = None) -> bool:
    try:
        width, height, channels, pixels, ctype = read_png(path)
    except ValueError as e:
        print(f"  [跳过] {path.name}: {e}")
        return False

    if autocrop and not check_only:
        pixels, width, height = autocrop_to_content(
            pixels, width, height, channels, threshold, pad=autocrop, tight=tight,
            pad_ratio=not stretch)
        ctype = 2 if channels == 3 else 6  # autocrop 不改通道数

    if crop and not check_only:
        pixels, width, height = crop_rect(pixels, width, height, channels, crop)
        ctype = 2 if channels == 3 else 6
        print(f"    已按矩形裁切 -> {width}x{height}")

    if stretch and not check_only:
        sw, sh = stretch
        # 裁完后直接拉伸铺满目标画布：内容比例不对也能消除左右/上下 margin
        if (width, height) != (sw, sh):
            pixels = resize_to(pixels, width, height, channels, sw, sh)
            width, height = sw, sh
            ctype = 2 if channels == 3 else 6

    if masks and not check_only:
        stride = width * channels
        for mx, my, mw, mh in masks:
            mx = max(0, mx)
            my = max(0, my)
            mw = min(mw, width - mx)
            mh = min(mh, height - my)
            for y in range(my, my + mh):
                base = y * stride + mx * channels
                for x in range(mw):
                    i = base + x * channels
                    pixels[i] = pixels[i + 1] = pixels[i + 2] = 0
                    if channels == 4:
                        pixels[i + 3] = 255
        print(f"    已涂黑 {len(masks)} 处 mask 区域")

    stats = _stats(pixels, width, height, channels, threshold)
    band = stats["band"]
    total = width * height
    print(f"  {path.name}: {width}x{height}, {channels}ch")
    print(f"    黑底纯度 : 中心区最亮 {stats['bg_max']}"
          f"  {'OK 纯黑' if stats['bg_max'] == 0 else '不纯(近黑灰)'}"
          f"   灰雾像素 {stats['haze_pct']:.2f}%")
    print(f"    框线占比 : {stats['ink_pct']:.2f}%")
    print(f"    框带宽度 : 左右深 {band['depth'][0]}/{band['depth'][1]}px"
          f"  上下深 {band['depth'][2]}/{band['depth'][3]}px"
          f"  → {band['pct']:.2f}% {'OK' if band['pct'] <= 4.0 else '偏宽(目标<4%)'}")
    print(f"    外缘留白 : 左/右/上/下 {band['margin'][0]}/{band['margin'][1]}"
          f"/{band['margin'][2]}/{band['margin'][3]}px")

    if check_only:
        return True

    changed = _crush(pixels, channels, threshold)
    write_png(path, width, height, pixels, ctype)
    after = _stats(pixels, width, height, channels, threshold)
    print(f"    已压黑 {changed} 像素 -> 中心区最亮 {after['bg_max']},"
          f" 灰雾 {after['haze_pct']:.2f}%")
    return True


def _stats(pixels: bytearray, width: int, height: int, channels: int,
           threshold: int) -> dict:
    """体检指标：黑底纯度 / 灰雾占比 / 框线占比 / 框带几何。"""
    stride = width * channels
    # 中心 60% 区域视作「背景」，其最亮值反映黑底纯不纯
    x0, x1 = int(width * 0.2), int(width * 0.8)
    y0, y1 = int(height * 0.2), int(height * 0.8)
    bg_max = 0
    haze = ink = 0
    total = width * height
    for y in range(height):
        for x in range(width):
            i = y * stride + x * channels
            v = pixels[i]
            g = pixels[i + 1]
            b = pixels[i + 2]
            if g > v:
                v = g
            if b > v:
                v = b
            if v == 0:
                continue
            if v <= threshold:
                haze += 1
            elif v > threshold * 2:
                ink += 1
            if x0 <= x < x1 and y0 <= y < y1 and v > bg_max:
                bg_max = v
    return {
        "bg_max": bg_max,
        "haze_pct": haze / total * 100.0,
        "ink_pct": ink / total * 100.0,
        "band": band_metrics(pixels, width, height, channels, threshold),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="边框图纯黑化 + 框宽体检")
    ap.add_argument("files", nargs="+", help="PNG 文件路径")
    ap.add_argument("--threshold", type=int, default=24, help="压黑阈值，默认 24")
    ap.add_argument("--check", action="store_true", help="只体检，不改写文件")
    ap.add_argument("--autocrop", type=int, default=0, metavar="PAD",
                    help="裁到内容外扩 PAD 像素并补齐 3:4（顺带裁掉外圈水印），默认不裁")
    ap.add_argument("--tight", action="store_true",
                    help="严格按最外侧亮像素裁剪（默认中位数裁，用于抗水印离群）")
    ap.add_argument("--crop", metavar="X0,Y0,X1,Y1",
                    help="按绝对矩形裁剪（端点含），用于截掉 AI 出图的边缘残留/伪影")
    ap.add_argument("--stretch", metavar="WxH",
                    help="裁后拉伸到该尺寸铺满画布（如 1024x1536），消除比例不符造成的 margin")
    ap.add_argument("--mask", action="append", default=[], metavar="X,Y,W,H",
                    help="把该矩形涂黑（可多次；坐标按 autocrop 之后的图像），用于清除框内侧水印")
    args = ap.parse_args()

    crop = None
    if args.crop:
        vals = [int(v) for v in args.crop.split(",")]
        if len(vals) != 4:
            ap.error(f"--crop 需要 X0,Y0,X1,Y1 四个整数: {args.crop}")
        crop = tuple(vals)

    stretch = None
    if args.stretch:
        try:
            sw, sh = (int(v) for v in args.stretch.lower().split("x"))
            stretch = (sw, sh)
        except ValueError:
            ap.error(f"--stretch 需要 WxH 格式: {args.stretch}")

    masks = []
    for spec in args.mask:
        parts = [int(v) for v in spec.split(",")]
        if len(parts) != 4:
            ap.error(f"--mask 需要 X,Y,W,H 四个整数: {spec}")
        masks.append(tuple(parts))

    ok = True
    for f in args.files:
        p = Path(f)
        if not p.exists():
            print(f"  [缺失] {f}")
            ok = False
            continue
        ok = process(p, args.threshold, args.check, args.autocrop, masks,
                        args.tight, stretch, crop) and ok
    print("体检完成（未改写）" if args.check else "压黑完成")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
