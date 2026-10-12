"""美术原图云留档同步：本地 source/ ↔ Cloudflare R2（S3 兼容）。

为什么需要
----------
原图母版与废稿（source/，不进 git）的唯一正源不能只靠本地——硬盘坏了就全丢。
本脚本把 source/ 与 R2 桶做增量同步，作为「留档」层。派生发布图（assets/）进 git，
不走这里。

用法
----
  python tools/sync_art.py push             # 本地 → R2（默认，上传留档）
  python tools/sync_art.py pull             # R2 → 本地（新机恢复）
  python tools/sync_art.py push --dry-run   # 只报计划，不传
  python tools/sync_art.py --src source     # 指定原图根目录

配置（环境变量，见项目记忆「美术资源管理架构决策」的 R2 申请流程）
----
  R2_ACCOUNT_ID          Cloudflare 账号 ID（S3 端点 https://<id>.r2.cloudflarestorage.com）
  R2_ACCESS_KEY_ID       R2 API Token 的 Access Key ID
  R2_SECRET_ACCESS_KEY   对应 Secret（只显示一次，务必存好）
  R2_BUCKET              桶名

增量：比对本地文件 MD5 与远端 ETag，一致则跳过。R2 单文件 < 5GB 走单段上传，
ETag 即文件 MD5，可直接比对。

依赖 boto3（pip install boto3）。
"""

from __future__ import annotations

import argparse
import hashlib
import os
import sys
from collections.abc import Iterator
from pathlib import Path

DEFAULT_SRC = "source"

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:  # pragma: no cover
    sys.exit("需要 boto3：pip install boto3")


def make_client():
    """从环境变量建 R2 的 S3 客户端，返回 (client, bucket)。缺变量则明确报错。"""
    need = ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET")
    missing = [k for k in need if not os.environ.get(k)]
    if missing:
        sys.exit("缺少环境变量：" + "、".join(missing)
                 + "\n（R2 申请步骤见项目记忆「美术资源管理架构决策」与 tools/README.md）")
    client = boto3.client(
        "s3",
        endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto",  # R2 一律 auto，不能用具体 region
    )
    return client, os.environ["R2_BUCKET"]


def md5_of(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def remote_etag(s3, bucket: str, key: str) -> str | None:
    """远端对象的 MD5（ETag 去引号）；不存在返回 None。"""
    try:
        return s3.head_object(Bucket=bucket, Key=key)["ETag"].strip('"')
    except ClientError:
        return None


def iter_local(src_root: Path) -> Iterator[tuple[Path, str]]:
    for p in sorted(src_root.rglob("*")):
        if p.is_file():
            yield p, p.relative_to(src_root).as_posix()


def do_push(s3, bucket: str, src_root: Path, dry: bool) -> None:
    up = skip = 0
    for path, key in iter_local(src_root):
        if remote_etag(s3, bucket, key) == md5_of(path):
            skip += 1
            continue
        print(f"  {'[dry] ' if dry else ''}↑ {key}")
        if not dry:
            s3.upload_file(str(path), bucket, key)
        up += 1
    print(f"\npush 完成：上传 {up}，跳过（已一致）{skip}")


def do_pull(s3, bucket: str, src_root: Path, dry: bool) -> None:
    down = skip = 0
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            dest = src_root / key
            if dest.exists() and md5_of(dest) == obj["ETag"].strip('"'):
                skip += 1
                continue
            print(f"  {'[dry] ' if dry else ''}↓ {key}")
            if not dry:
                dest.parent.mkdir(parents=True, exist_ok=True)
                s3.download_file(bucket, key, str(dest))
            down += 1
    print(f"\npull 完成：下载 {down}，跳过（已一致）{skip}")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="美术原图 source/ ↔ R2 增量同步")
    ap.add_argument("action", choices=["push", "pull"], nargs="?", default="push",
                    help="push=上传留档（默认）/ pull=下载恢复")
    ap.add_argument("--src", default=DEFAULT_SRC, help=f"原图根目录，默认 {DEFAULT_SRC}")
    ap.add_argument("--dry-run", action="store_true", help="只报计划，不实际传输")
    args = ap.parse_args(argv)

    src_root = Path(args.src)
    if args.action == "push" and not src_root.is_dir():
        sys.exit(f"本地目录不存在：{src_root}")

    s3, bucket = make_client()
    if args.action == "push":
        do_push(s3, bucket, src_root, args.dry_run)
    else:
        do_pull(s3, bucket, src_root, args.dry_run)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
