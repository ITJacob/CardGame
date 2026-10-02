# -*- coding: utf-8 -*-
"""
时长族 ×5 重标定迁移脚本（2026-10-02，1 回合 = 5 tick 拍板的存量清算）。

背景：2026-09-30 拍板 1 回合 = 5 tick（调度参数 §〇点五），但当批只回归了
24 个 duration 节点 + 10 个状态默认时长；冷却 / 吟唱 / 状态时长三族的其余存量
仍停在稿期事故口径（「N 回合」1:1 落 tick），回合视角普遍偏短
（冷却中位 5 tick = 1.0 回合、状态时长众数 3 tick = 0.6 回合）。
2026-10-02 拍板：时长族一律 ×5 还原稿期回合意图；吟唱是回合内粒度，不动。

改动规则：
  - 任何 "duration" 键：正整数 ×5；0 / -1（常驻、瞬时占位）与 null 不动
  - 同对象 "durationUnit" == "turn" 且 duration 为正：值一并 ×5 并改写为 "tick"
    （语义不变——turn 本就按 1 turn = 5 tick 解析；此举是把存储统一到
    调度参数 §〇点五「全部 duration 字段一律 tick 存储」的拍板）
  - cards[].cost.cooldown：正整数 ×5；0（无冷却）不动
  - cost.castTime 吟唱、minIntervalTicks、advance_clock 的 tick 参数：一律不动

产出：直接改写 docs/json/*.skills.json 与 *.statuses.json（round-trip 格式不变）。
跑完归档到 docs/archive/tools/（一次性迁移脚本约定）。
"""
import json, glob, os

JSON_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "json")


def is_pos_int(v):
    return isinstance(v, int) and not isinstance(v, bool) and v > 0


def walk(n, stats):
    """递归改写；返回改动的键值对数。"""
    if isinstance(n, dict):
        if is_pos_int(n.get("duration")):
            n["duration"] *= 5
            stats["duration"] += 1
            if n.get("durationUnit") == "turn":
                n["durationUnit"] = "tick"
                stats["turn_to_tick"] += 1
        for v in n.values():
            walk(v, stats)
    elif isinstance(n, list):
        for v in n:
            walk(v, stats)


def main():
    total = {"duration": 0, "turn_to_tick": 0, "cooldown": 0}
    for f in sorted(glob.glob(os.path.join(JSON_DIR, "*.json"))):
        base = os.path.basename(f)
        if not (base.endswith(".skills.json") or base.endswith(".statuses.json")):
            continue
        raw = open(f, encoding="utf-8").read()
        d = json.loads(raw)
        stats = {"duration": 0, "turn_to_tick": 0, "cooldown": 0}
        # 1) duration 族（含顶层三池、状态定义、卡面任意嵌套）
        walk(d, stats)
        # 2) 冷却（吟唱不动）
        for c in d.get("cards", []):
            cost = c.get("cost") or {}
            if is_pos_int(cost.get("cooldown")):
                cost["cooldown"] *= 5
                stats["cooldown"] += 1
        if not any(stats.values()):
            continue
        out = json.dumps(d, ensure_ascii=False, indent=2) + "\n"
        assert out != raw
        with open(f, "w", encoding="utf-8") as fh:
            fh.write(out)
        for k in total:
            total[k] += stats[k]
        print("%-32s duration×5: %4d  turn→tick: %2d  cooldown×5: %4d"
              % (base, stats["duration"], stats["turn_to_tick"], stats["cooldown"]))
    print("=== TOTAL ===")
    print("duration×5: %d | turn→tick 存储统一: %d | cooldown×5: %d"
          % (total["duration"], total["turn_to_tick"], total["cooldown"]))


if __name__ == "__main__":
    main()
