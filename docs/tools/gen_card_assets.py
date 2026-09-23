#!/usr/bin/env python3
"""扫描 site/assets/cards/<cardId>/ 生成 index.json。

为什么需要这个脚本：站点是纯静态（GitHub Pages / python -m http.server），
浏览器**无法列举目录**，所以「文件夹里有什么文件」必须在构建期落盘成索引。
手机上传的图片文件名（IMG_0042.HEIC、微信图片_20260923.jpg…）不可控，
前端只能按索引给的路径取图，猜不出来。

用法（仓库根目录）：
    python docs/tools/gen_card_assets.py            # 扫描并写 index.json
    python docs/tools/gen_card_assets.py --check    # 只体检不写盘
    python docs/tools/gen_card_assets.py --scaffold # 按 cardId 预建空目录（+ .gitkeep）

--scaffold 是给「手机直接传图」准备的：目录先建好，上传时选目录即可，不用手打
cardId（八百多个目录里挑一个，手打必错）。空目录 git 不跟踪，故每个放 .gitkeep。

目录约定：
    site/assets/cards/<cardId>/任意文件名.任意图片格式
    同一文件夹多张图 → 全部进索引，按自然序排序，第一张作主图；
    想指定主图就给文件名加数字前缀（1_xxx.png / 2_yyy.png）。
    旧的扁平放法 site/assets/cards/<cardId>.webp 仍被识别（标 legacy）。

零依赖：Pillow 缺失时只是拿不到宽高/不能压缩，其余照常。
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CARDS_DIR = os.path.join(ROOT, 'site', 'assets', 'cards')
INDEX_PATH = os.path.join(CARDS_DIR, 'index.json')
JSON_DIR = os.path.join(ROOT, 'docs', 'json')

# 浏览器能直接渲染的格式（HEIC/HEIF 不在内：Safari 可以，Chrome/安卓一律不认）
IMG_EXT = {'png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp', 'svg'}
# 手机相册常见但浏览器渲染不了 / 不该进索引的
KNOWN_BAD_EXT = {'heic', 'heif', 'tif', 'tiff', 'psd', 'raw', 'cr2', 'arw', 'pdf'}
SKIP_NAMES = {'.ds_store', 'thumbs.db', 'index.json', 'readme.md', 'desktop.ini'}

# 大图阈值：手机原图动辄 3~5 MB，Pages 上首屏会很痛，体检时点名
BIG_BYTES = 1_500_000


def natural_key(s: str):
    """自然序：a2 排在 a10 前面，数字前缀（1_/2_）因此可直接控主图。"""
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', s)]


def load_card_ids() -> set:
    """已知 cardId 全集，用来给「目录名拼错」兜底报警。"""
    ids = set()
    manifest_path = os.path.join(JSON_DIR, 'manifest.json')
    if not os.path.exists(manifest_path):
        return ids
    with open(manifest_path, encoding='utf-8') as f:
        manifest = json.load(f)
    for p in manifest.get('pathways', []):
        fp = os.path.join(JSON_DIR, p.get('file', ''))
        if not os.path.exists(fp):
            continue
        with open(fp, encoding='utf-8') as f:
            doc = json.load(f)
        for c in doc.get('cards', []) or []:
            if c.get('id'):
                ids.add(c['id'])
    return ids


def probe_size(path: str):
    """拿宽高，Pillow 不在就返回 None（前端不依赖它）。"""
    try:
        from PIL import Image  # noqa: PLC0415
        with Image.open(path) as im:
            return im.size
    except Exception:
        return None


def scan() -> dict:
    cards, legacy, unknown_dirs, bad_files, big_files = {}, [], [], [], []
    known_ids = load_card_ids()

    if not os.path.isdir(CARDS_DIR):
        print(f'[错误] 目录不存在：{CARDS_DIR}', file=sys.stderr)
        return {'cards': {}}

    for entry in sorted(os.listdir(CARDS_DIR), key=natural_key):
        full = os.path.join(CARDS_DIR, entry)
        if os.path.isdir(full):
            files = []
            for name in sorted(os.listdir(full), key=natural_key):
                if name.lower() in SKIP_NAMES or name.startswith('.'):
                    continue
                ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
                fp = os.path.join(full, name)
                if not os.path.isfile(fp):
                    continue
                if ext in KNOWN_BAD_EXT or ext not in IMG_EXT:
                    bad_files.append((entry, name))
                    continue
                size = os.path.getsize(fp)
                if size > BIG_BYTES:
                    big_files.append((f'{entry}/{name}', size))
                size_wh = probe_size(fp)
                w, h = size_wh if size_wh else (None, None)
                item = {'file': name, 'bytes': size}
                if w:
                    item['w'], item['h'] = w, h
                files.append(item)
            if files:
                cards[entry] = files
            if entry not in known_ids:
                unknown_dirs.append(entry)
        elif os.path.isfile(full):
            # 旧扁平放法：<cardId>.<ext>
            name = entry
            ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
            stem = name.rsplit('.', 1)[0] if '.' in name else name
            if name.lower() in SKIP_NAMES or ext not in IMG_EXT:
                continue
            size_wh = probe_size(full)
            w, h = size_wh if size_wh else (None, None)
            item = {'file': name, 'bytes': os.path.getsize(full), 'legacy': True}
            if w:
                item['w'], item['h'] = w, h
            cards[stem] = cards.get(stem, []) + [item]
            legacy.append(name)

    return {
        'cards': cards,
        'legacy': legacy,
        'unknown_dirs': unknown_dirs,
        'bad_files': bad_files,
        'big_files': big_files,
    }


def report(res: dict) -> int:
    """体检输出。返回告警条数，便于 --check 决定退出码。"""
    cards = res['cards']
    n_files = sum(len(v) for v in cards.values())
    print(f'卡面索引：{len(cards)} 张卡 / {n_files} 个文件')
    multi = {k: len(v) for k, v in cards.items() if len(v) > 1}
    if multi:
        print(f'  多图（第一张为主图）：{len(multi)} 张')
    if res['legacy']:
        print(f'  旧扁平放法 {len(res["legacy"])} 个：{", ".join(res["legacy"][:5])}'
              + (' …' if len(res['legacy']) > 5 else ''))
    warns = 0
    if res['unknown_dirs']:
        warns += len(res['unknown_dirs'])
        print(f'  ⚠ 目录名不在 cardId 全集里（拼错？）{len(res["unknown_dirs"])} 个：'
              + ', '.join(res['unknown_dirs'][:8]))
    if res['bad_files']:
        warns += len(res['bad_files'])
        print(f'  ⚠ 浏览器渲染不了 / 非图片 {len(res["bad_files"])} 个（HEIC 等，需转 jpg/png/webp）：')
        for d, n in res['bad_files'][:10]:
            print(f'      {d}/{n}')
    if res['big_files']:
        warns += len(res['big_files'])
        print(f'  ⚠ 超过 {BIG_BYTES // 1_000_000} MB 的大图 {len(res["big_files"])} 个：')
        for n, s in res['big_files'][:10]:
            print(f'      {n}  {s / 1_000_000:.1f} MB')
    return warns


def scaffold() -> int:
    ids = load_card_ids()
    if not ids:
        print('[错误] 读不到 cardId 全集（docs/json/manifest.json 缺失？）', file=sys.stderr)
        return 1
    made = 0
    for cid in sorted(ids):
        d = os.path.join(CARDS_DIR, cid)
        if os.path.isdir(d):
            continue
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, '.gitkeep'), 'w', encoding='utf-8') as f:
            f.write('')
        made += 1
    print(f'预建目录 {made} 个（已存在的跳过），共 {len(ids)} 个 cardId')
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='只体检，不写 index.json')
    ap.add_argument('--scaffold', action='store_true', help='按 cardId 预建空目录，不写 index.json')
    args = ap.parse_args()

    if args.scaffold:
        return scaffold()

    res = scan()
    report(res)

    if args.check:
        print('（--check：未写盘）')
        return 0

    doc = {
        'generated': datetime.now(timezone.utc).astimezone().isoformat(timespec='seconds'),
        'dirPattern': '<cardId>/<任意文件名>.<格式>',
        'note': '由 docs/tools/gen_card_assets.py 生成，勿手改；新增/换图后重跑一次',
        'cards': res['cards'],
    }
    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write('\n')
    print(f'已写入 {os.path.relpath(INDEX_PATH, ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
