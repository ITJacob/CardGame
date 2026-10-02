# -*- coding: utf-8 -*-
"""
时长族 ×5 重标定的文案同步 pass（2026-10-02）。

migrate_duration_x5.py 只改了结构化数值；卡面 describe / note / 状态文案里的
「N tick」镜像数值还是旧值（如数据已 15、文案仍写 3 tick）。本脚本把这些文本
镜像一并 ×5，跳过 tick 原生粒度、不在重标定范围内的提及：

  - 周期节流「每 N tick」（minIntervalTicks / 月相自发轮转 / zone on_occupy_tick 类）
  - 战场时钟「推进 N tick」（advance_clock 原语参数，本就不是时长族）
  - 吟唱时长「吟唱 N tick」（吟唱是回合内粒度，拍板不动；但「N tick『免吟唱』」
    是状态时长镜像，照常 ×5）

规则：匹配 `(\d+)\s*(tick|t)`（t 为 tick 缩写，如 眩晕 1t），按 ±10 字上下文判定。
"""
import json, glob, os, re

JSON_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "json")
PAT = re.compile(r"(\d+)\s*(tick|t)(?![a-zA-Z])")
SKIP_BEFORE = ("每",)
SKIP_CTX = ("推进", "时钟")
SKIP_UNLESS = {"吟唱": ("免吟唱",)}


def transform(s, stats):
    out, last, n_x5 = [], 0, 0
    for m in PAT.finditer(s):
        head = s[max(0, m.start() - 10):m.start()]
        ctx = s[max(0, m.start() - 10):m.end() + 10]
        skip = any(k in head[-5:] for k in SKIP_BEFORE) or any(k in ctx for k in SKIP_CTX)
        if not skip:
            for k, unless in SKIP_UNLESS.items():
                if k in ctx and not any(u in ctx for u in unless):
                    skip = True
        if skip:
            stats["skip"] += 1
            continue
        out.append(s[last:m.start()])
        out.append(str(int(m.group(1)) * 5) + m.group(2))
        last = m.end()
        n_x5 += 1
    if not n_x5:
        return s
    stats["x5"] += n_x5
    out.append(s[last:])
    return "".join(out)


def walk(n, stats):
    if isinstance(n, dict):
        for k, v in n.items():
            n[k] = walk(v, stats)
    elif isinstance(n, list):
        for i, v in enumerate(n):
            n[i] = walk(v, stats)
    elif isinstance(n, str):
        return transform(n, stats)
    return n


def main():
    total = {"x5": 0, "skip": 0}
    for f in sorted(glob.glob(os.path.join(JSON_DIR, "*.json"))):
        base = os.path.basename(f)
        if not (base.endswith(".skills.json") or base.endswith(".statuses.json")):
            continue
        raw = open(f, encoding="utf-8").read()
        d = json.loads(raw)
        stats = {"x5": 0, "skip": 0}
        walk(d, stats)
        if not stats["x5"]:
            continue
        out = json.dumps(d, ensure_ascii=False, indent=2) + "\n"
        assert out != raw
        with open(f, "w", encoding="utf-8") as fh:
            fh.write(out)
        for k in total:
            total[k] += stats[k]
        print("%-32s 文案×5: %4d  跳过: %3d" % (base, stats["x5"], stats["skip"]))
    print("=== TOTAL === 文案×5: %d | 跳过（周期/时钟/吟唱）: %d" % (total["x5"], total["skip"]))


if __name__ == "__main__":
    main()
