# -*- coding: utf-8 -*-
"""抽离：将各卡内联 statusDefs 搬到 <pathway>.statuses.json。

规则：
- 已在 common.statuses.json 中的 id（中立公共状态，如 poison/shield/stun/vulnerable/shackle…）
  → 删除卡内联副本，不重复定义。
- 其余 → 收集到 <pathway>.statuses.json（途径私有）。同途径内同名只保留首份（异义告警）。
- 卡面移除 statusDefs 字段。
- 仅当本途径确有私有状态时才生成 .statuses.json；状态全归 common 的途径不落文件。
"""
import io, os, glob, json
from status_loader import load_common_ids

HERE = os.path.dirname(os.path.abspath(__file__))
JSON_DIR = os.path.join(os.path.dirname(HERE), "json")
COMMON_IDS = load_common_ids()


def main():
    for f in sorted(glob.glob(os.path.join(JSON_DIR, "*.skills.json"))):
        pid = os.path.basename(f).replace(".skills.json", "")
        d = json.load(io.open(f, encoding="utf-8"))
        collected = []
        seen_ids = {}
        any_sd = False
        for c in d.get("cards", []):
            sds = c.get("statusDefs") or []
            if not sds:
                continue
            any_sd = True
            for sd in sds:
                sid = sd.get("id")
                if sid in COMMON_IDS:
                    continue  # 已在 common，删除卡内联副本
                if sid in seen_ids:
                    if json.dumps(seen_ids[sid], ensure_ascii=False, sort_keys=True) != \
                       json.dumps(sd, ensure_ascii=False, sort_keys=True):
                        print("  WARN %s: 同途径内 statusDef '%s' 定义不一致，保留首份" % (pid, sid))
                    continue
                seen_ids[sid] = sd
                collected.append(sd)
            if "statusDefs" in c:
                del c["statusDefs"]
        if not any_sd:
            continue
        # 写回 skills.json（移除 statusDefs）
        with io.open(f, "w", encoding="utf-8") as wf:
            json.dump(d, wf, ensure_ascii=False, indent=2, sort_keys=False)
            wf.write("\n")
        if collected:
            out = {"statusDefs": collected}
            with io.open(os.path.join(JSON_DIR, "%s.statuses.json" % pid), "w", encoding="utf-8") as wf:
                json.dump(out, wf, ensure_ascii=False, indent=2, sort_keys=False)
                wf.write("\n")
            print("  %-16s 抽离 %2d 个状态 -> %s.statuses.json" % (pid, len(collected), pid))
        else:
            print("  %-16s 状态全部归于 common（无独立文件）" % pid)


if __name__ == "__main__":
    main()
