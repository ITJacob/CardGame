# -*- coding: utf-8 -*-
"""按 JSON Schema 校验技能池全库 + 跨字段一致性检查。

用法:
    python docs/tools/validate_schema.py            # 校验 manifest + 22 份技能池
    python docs/tools/validate_schema.py --max 20   # 每文件最多打印 20 条错误

依赖: jsonschema（可选）
    pip install jsonschema
未安装时只执行不依赖它的跨字段检查（第二部分）。

与 docs/tools/validate.py 的分工:
    validate.py        —— 语义/枚举/引用完整性校验（原语与参数取值域、状态 id 存在性、
                          rarity↔sequence 映射、界域租金等）
    validate_schema.py —— 结构校验（字段是否存在、类型是否正确、有无未知字段）
                          + 跨字段一致性（axis∈axes、id 前缀、manifest 对齐）
两者都应为 0 错误才视为合规。
"""
import io, os, sys, glob, json

HERE = os.path.dirname(os.path.abspath(__file__))          # docs/tools/
JSON_DIR = os.path.join(os.path.dirname(HERE), "json")      # docs/json/
SCHEMA_DIR = os.path.join(JSON_DIR, "schema")               # docs/json/schema/

try:
    from jsonschema import Draft202012Validator
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False

try:
    from status_loader import iter_status_defs
except ImportError:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from status_loader import iter_status_defs


def load(name):
    return json.load(io.open(os.path.join(SCHEMA_DIR, name), encoding="utf-8"))


def schema_check(schema, instance, label, errors, max_errors):
    """结构校验；按 JSON 指针排序输出，便于定位。"""
    if not HAS_JSONSCHEMA:
        errors.append("%s: 跳过（未安装 jsonschema，pip install jsonschema）" % label)
        return
    v = Draft202012Validator(schema)
    n = 0
    for err in sorted(v.iter_errors(instance), key=lambda e: list(e.absolute_path)):
        n += 1
        if n > max_errors:
            errors.append("%s: ... 另有错误未列出（超过 %d 条上限）" % (label, max_errors))
            break
        loc = "/" + "/".join(str(p) for p in err.absolute_path) if err.absolute_path else "(root)"
        errors.append("%s %s: %s" % (label, loc, err.message[:220]))


def cross_check(docs, manifest, errors, warns):
    """schema 表达不了的跨字段约束。"""
    # 1) axis 必须在本文件 axes 中声明
    for name, d in docs.items():
        axes = set(d.get("axes") or {})
        for c in d.get("cards", []):
            ax = c.get("axis")
            if ax is not None and ax not in axes:
                errors.append("%s %s: axis '%s' 未在顶层 axes 声明" % (name, c.get("id"), ax))

    # 2) 卡片 id 前缀须为 skill_<pathwayId>_s<seq>_
    for name, d in docs.items():
        pid = d.get("pathwayId")
        for c in d.get("cards", []):
            cid = c.get("id", "")
            if not cid.startswith("skill_%s_s" % pid):
                errors.append("%s %s: id 前缀应为 skill_%s_s<N>_" % (name, cid, pid))
            seq = c.get("sequence")
            if seq is not None and ("_s%s_" % seq) not in cid:
                errors.append("%s %s: id 中的序列位阶与 sequence=%s 不一致" % (name, cid, seq))

    # 3) 状态 id 跨途径复用：同名必须同定义，定义冲突才是错误
    #    例外：已登记为「有意分化」的同名状态（轴身份状态本就该独立于通用副本）
    KNOWN_STATUS_DIVERGENCE = {
        # 刺客 charm 已升级为「魅轴身份状态」（叠层 + 阈值 payoff），
        # 与律师【贿赂·魅惑】的 F15 纯引用副本语义不同。2026-09-19 裁定：保持分化，不拆 id。
        ("charm", "assassin", "lawyer"),
        # 潜行 stealth 为「隐身药水(apothecary)」与「影纱(sleepless)」的有意分化：
        # 前者破除无副作用，后者破除时连带驱散（dispelTarget）。2026-09-19 裁定：保持分化，不拆 id。
        ("stealth", "apothecary", "sleepless"),
    }
    seen = {}
    reused = set()
    diverged = []
    # 收集所有 statusDef：卡内联（过渡期遗留）+ *.statuses.json（抽离后的权威源）
    ext_defs = []  # (pid, where, sd)
    for name, d in docs.items():
        pid = d.get("pathwayId")
        for c in d.get("cards", []):
            for sd in c.get("statusDefs") or []:
                ext_defs.append((pid, "%s/%s" % (name, c.get("id")), sd))
    for spid, slabel, sd in iter_status_defs():
        ext_defs.append((spid, slabel, sd))
    for pid, where, sd in ext_defs:
        sid = sd.get("id")
        sig = json.dumps({k: sd.get(k) for k in
                          ("name", "category", "dispelable", "duration", "modifiers",
                           "maxStacks", "stackPolicy", "charges", "triggers", "effects")},
                         ensure_ascii=False, sort_keys=True)
        if sid in seen:
            old_sig, old_where, old_pid = seen[sid]
            if old_sig != sig:
                pair = tuple(sorted((pid, old_pid)))
                if (sid,) + pair in KNOWN_STATUS_DIVERGENCE:
                    diverged.append("%s/%s: statusDef '%s' 与 %s 同名异义（已登记为有意分化，不告警）"
                                    % (pid, where, sid, old_where))
                else:
                    warns.append("%s %s: statusDef '%s' 与 %s 同名但定义不一致（需确认是否应拆分为两个状态）" % (where, sid, sid, old_where))
            else:
                reused.add(sid)
        else:
            seen[sid] = (sig, where, pid)
    if reused:
        print("  · 跨途径复用状态 %d 个（同名同定义，视为共享状态，非错误）" % len(reused))
    if diverged:
        print("  · 已登记的同名异义状态 %d 处（有意分化，见 KNOWN_STATUS_DIVERGENCE）：" % len(diverged))
        for x in diverged:
            print("      - %s" % x)

    if not manifest:
        return

    # 4) manifest ↔ 文件对齐
    m_by_id = {p["id"]: p for p in manifest.get("pathways", [])}
    for pid, d in docs.items():
        if pid not in m_by_id:
            errors.append("manifest: 缺少途径条目 %s" % pid)
            continue
        p = m_by_id[pid]
        n = len(d.get("cards", []))
        if p.get("cardCount") != n:
            errors.append("manifest %s: cardCount %s != 实际 %d" % (pid, p.get("cardCount"), n))
        if p.get("file") != "%s.skills.json" % pid:
            errors.append("manifest %s: file 字段 %r 与 pathwayId 不匹配" % (pid, p.get("file")))
        if p.get("status") != "done":
            errors.append("manifest %s: status=%r（非 done）" % (pid, p.get("status")))
        tent = sum(1 for c in d["cards"] if c.get("tentative"))
        if "tentativeCount" in p and p["tentativeCount"] != tent:
            errors.append("manifest %s: tentativeCount %d != 实际 %d" % (pid, p["tentativeCount"], tent))
        ff = sum(1 for c in d["cards"] if c.get("frameworkFlags"))
        if "frameworkFlagCount" in p and p["frameworkFlagCount"] != ff:
            errors.append("manifest %s: frameworkFlagCount %d != 实际 %d" % (pid, p["frameworkFlagCount"], ff))

    for pid in m_by_id:
        if pid not in docs:
            errors.append("manifest: 途径 %s 在 manifest 中登记但缺文件" % pid)

    # 5) totalCards
    total = sum(len(d.get("cards", [])) for d in docs.values())
    if manifest.get("totalCards") != total:
        errors.append("manifest: totalCards %s != 实际 %d" % (manifest.get("totalCards"), total))

    # 6) 稀有度映射（schema 无法表达 sequence → rarity 派生关系）
    rev = {}
    for rar, seqs in (manifest.get("rarityMap") or {}).items():
        for s in seqs:
            rev[s] = rar
    for name, d in docs.items():
        for c in d.get("cards", []):
            exp = rev.get(c.get("sequence"))
            if exp and c.get("rarity") != exp:
                errors.append("%s %s: sequence %s 应为 %s，实为 %s"
                              % (name, c.get("id"), c.get("sequence"), exp, c.get("rarity")))


def main():
    max_errors = 15
    if "--max" in sys.argv:
        max_errors = int(sys.argv[sys.argv.index("--max") + 1])

    errors = []
    warns = []
    skills_schema = load("skills.schema.json")
    manifest_schema = load("manifest.schema.json")

    files = sorted(glob.glob(os.path.join(JSON_DIR, "*.skills.json")))
    docs = {}
    for f in files:
        d = json.load(io.open(f, encoding="utf-8"))
        docs[d.get("pathwayId", os.path.basename(f))] = d

    manifest = None
    mpath = os.path.join(JSON_DIR, "manifest.json")
    if os.path.exists(mpath):
        manifest = json.load(io.open(mpath, encoding="utf-8"))
        schema_check(manifest_schema, manifest, "manifest.json", errors, max_errors)

    for name in sorted(docs):
        schema_check(skills_schema, docs[name], name, errors, max_errors)

    # 校验 *.statuses.json 中每个 statusDef 项（复用 skills_schema 的 $defs/statusDef）
    sdef = skills_schema.get("$defs", {}).get("statusDef")
    if sdef:
        # 用带 $defs 的 wrapper 包住 $ref，确保 statusDef 内部 #/$defs/* 指针可解析
        statusdef_validator = {
            "$ref": "#/$defs/statusDef",
            "$defs": skills_schema.get("$defs", {}),
        }
        for f in sorted(glob.glob(os.path.join(JSON_DIR, "*.statuses.json"))):
            try:
                d = json.load(io.open(f, encoding="utf-8"))
            except Exception as e:
                errors.append("%s: 解析失败 %s" % (os.path.basename(f), e))
                continue
            for i, sd in enumerate(d.get("statusDefs") or []):
                schema_check(statusdef_validator, sd, "%s#/statusDefs/%d" % (os.path.basename(f), i), errors, max_errors)

    cross_check(docs, manifest, errors, warns)

    print("-" * 60)
    print("files:", len(docs), "| errors:", len(errors), "| warns:", len(warns))
    if errors:
        print("-" * 60)
        for e in errors:
            print("  E:", e)
    if warns:
        print("-" * 60)
        for w in warns:
            print("  W:", w)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
