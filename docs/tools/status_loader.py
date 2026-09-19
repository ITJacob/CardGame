# -*- coding: utf-8 -*-
"""共享状态注册表加载：扫描 *.statuses.json，产出 (pid, label, statusDef) 流。

抽离后，所有可被 mount_status 引用的状态定义都集中在这类文件里：
  - <pathway>.statuses.json : 途径私有状态
  - common.statuses.json    : 中立公共状态
卡面内联 statusDefs 是过渡期遗留，抽离脚本会清掉；本 loader 只认 *.statuses.json。
"""
import io, os, glob, json

HERE = os.path.dirname(os.path.abspath(__file__))
JSON_DIR = os.path.join(os.path.dirname(HERE), "json")

STATUS_SCHEMA = os.path.join(JSON_DIR, "schema", "skills.schema.json")
_statusdef_schema = None


def status_def_schema():
    """复用 skills.schema.json 的 $defs/statusDef 作为 *.statuses.json 每项的校验基准。"""
    global _statusdef_schema
    if _statusdef_schema is None:
        sch = json.load(io.open(STATUS_SCHEMA, encoding="utf-8"))
        _statusdef_schema = sch.get("$defs", {}).get("statusDef")
    return _statusdef_schema


def iter_status_defs():
    """Yield (pid, label, def_dict) for every statusDef across *.statuses.json。"""
    for f in sorted(glob.glob(os.path.join(JSON_DIR, "*.statuses.json"))):
        pid = os.path.basename(f).replace(".statuses.json", "")
        label = os.path.basename(f)
        try:
            d = json.load(io.open(f, encoding="utf-8"))
        except Exception:
            continue
        for sd in d.get("statusDefs") or []:
            yield (pid, label, sd)


def load_common_ids():
    """返回 common.statuses.json 中声明的 id 集合（抽离时用于跳过，避免重复定义）。"""
    p = os.path.join(JSON_DIR, "common.statuses.json")
    if not os.path.exists(p):
        return set()
    try:
        d = json.load(io.open(p, encoding="utf-8"))
    except Exception:
        return set()
    return set(s["id"] for s in d.get("statusDefs") or [])
