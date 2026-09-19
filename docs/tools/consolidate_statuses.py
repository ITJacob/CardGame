"""将跨途径重复定义、但实质同义的状态收口为单 owner。

规则（2026-09-19 裁定）：
- 每个状态只保留 1 个 owner 途径的 def，其余途径 .statuses.json 的同 id 副本删除。
- 删除副本不影响挂载引用：loader 合并所有 *.statuses.json 为全局注册表，
  被删副本途径的卡 mount 该状态时靠全局注册表解析（owner 仍定义）。
- 凡「同名异义」的状态（如 stealth：apothecary 隐身药水 vs sleepless 影纱破除行为不同）
  不做收口，须改用 split_divergent_ids.py 拆为独立 id，全库强制单点定义。
"""
import json, glob, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
JSON_DIR = os.path.join(HERE, "..", "json")

# sid -> owner 途径（唯一保留 def 的途径）
OWNER = {
    "puppet_string":  "fool",             # 愚者·秘偶主题最契合「提线木偶」
    "hallucination":  "fool",             # 愚者「制造幻觉」原始概念
    "dread":          "sleepless",        # 不眠者·恐惧灵光链
    "obsession":      "criminal",         # 迷恋=反向嘲讽控制轴
    "spirit_sight":   "corpse_collector", # 收尸人·天然灵视
    "danger_sense":   "monster",          # 怪物·危险预感
    "revive_blocked": "corpse_collector", # 收尸人·真死母版
}

DRY = "--dry" in sys.argv


def main():
    total = 0
    for sid, owner in OWNER.items():
        for f in sorted(glob.glob(os.path.join(JSON_DIR, "*.statuses.json"))):
            pid = os.path.basename(f).replace(".statuses.json", "")
            if pid == owner:
                continue
            d = json.load(open(f, encoding="utf-8"))
            sds = d.get("statusDefs", [])
            kept = [sd for sd in sds if sd.get("id") != sid]
            if len(kept) != len(sds):
                total += len(sds) - len(kept)
                if DRY:
                    print("[DRY] would remove %s from %s.statuses.json" % (sid, pid))
                else:
                    d["statusDefs"] = kept
                    json.dump(d, open(f, "w", encoding="utf-8"),
                               ensure_ascii=False, indent=2)
                    print("removed %s from %s.statuses.json" % (sid, pid))
    print("total copies removed:" if not DRY else "total would remove:", total)


if __name__ == "__main__":
    main()
