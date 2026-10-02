# -*- coding: utf-8 -*-
"""途径风格距离基线报告。用法: python docs/tools/build_style_analysis.py

2026-10-01 差异化专项建立（差异化重构计划 阶段一）。
产物：docs/analysis/STYLE_DISTANCE.md（人读产物，勿手改；与 score.py 指纹口径同源——
本脚本直接 import score 的 fingerprint/cos_dist/PATHWAY_SIGNATURES，保证第七维与报告永不漂移）。
只读脚本，不改任何数据文件。
"""
import os, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))          # docs/tools/
ANALYSIS_DIR = os.path.join(os.path.dirname(HERE), "analysis")

sys.path.insert(0, HERE)
import score


def main():
    pathways = score.load_skills()
    unit_types = score.load_unit_types(pathways)

    fps = {pid: score.fingerprint(d.get("cards") or []) for pid, d in pathways.items()}
    ids = sorted(fps)
    # 22×22 距离矩阵 + 最近邻
    dist = {a: {} for a in ids}
    for a in ids:
        for b in ids:
            dist[a][b] = score.cos_dist(fps[a], fps[b]) if a != b else 0.0
    nearest = {a: min((b for b in ids if b != a), key=lambda b: dist[a][b]) for a in ids}
    mean_d = {a: sum(dist[a][b] for b in ids if b != a) / (len(ids) - 1) for a in ids}

    # 签名键用量（与 score.py 第七维同算法；lineage_ids 口径同步——sref:lineage_stack 读侧
    # 取带 lineageStack 字段的状态集，2026-10-02 批次九对齐，免报告与评分漂移）
    lineage_ids = {sd["id"] for pid_, label_, sd in score.iter_status_defs() if "lineageStack" in sd}
    casttime_ids = {sd["id"] for pid_, label_, sd in score.iter_status_defs()
                    if any(bm.get("op") == "cast_time_set" for bm in (sd.get("behaviorModifiers") or [])
                           if isinstance(bm, dict))}
    grow_ids = {sd["id"] for pid_, label_, sd in score.iter_status_defs() if sd.get("statPerStack")}
    flag_index = {"cast_time_set": casttime_ids, "statPerStack": grow_ids}
    sig = {pid: score.signature_counts(d.get("cards") or [], score.PATHWAY_SIGNATURES.get(pid, []),
                                       unit_type_of=unit_types, lineage_ids=lineage_ids,
                                       flag_status_index=flag_index)
           for pid, d in pathways.items()}

    L = []
    L.append("# 途径风格距离（STYLE DISTANCE）\n")
    L.append("> 由 `docs/tools/build_style_analysis.py` 自动生成——**勿手改**；指纹口径与 score.py 第七维同源"
             "（原语分布 + 元素分布 + modify_stat 键分布，1−cos 距离）。差异化迭代后重跑本报告看距离拉开。"
             "生成时间：%s。\n" % datetime.date.today())

    L.append("## 一、最近邻榜（距离越小越雷同，差异化迭代优先拆这些对）\n")
    L.append("| 途径 | 最近邻 | 距离 | 对他途径均距 |")
    L.append("|---|---|---:|---:|")
    for a in sorted(ids, key=lambda x: mean_d[x]):
        L.append("| %s | %s | %.3f | %.3f |" % (a, nearest[a], dist[a][nearest[a]], mean_d[a]))
    L.append("")

    L.append("## 二、22×22 距离矩阵\n")
    L.append("| | " + " | ".join(ids) + " |")
    L.append("|---|" + "---|" * len(ids))
    for a in ids:
        L.append("| **%s** | %s |" % (a, " | ".join("%.2f" % dist[a][b] for b in ids)))
    L.append("")

    L.append("## 三、途径指纹（各途径 Top-5 指纹键）\n")
    L.append("| 途径 | Top-5 指纹键 |")
    L.append("|---|---|")
    for a in ids:
        top = sorted(fps[a].items(), key=lambda kv: -kv[1])[:5]
        L.append("| %s | %s |" % (a, "；".join("%s ×%d" % kv for kv in top) or "—"))
    L.append("")

    L.append("## 四、签名键用量（≥2 卡 = 落地；空白键 = 差异化迭代立项依据）\n")
    L.append("| 途径 | 签名键用量 |")
    L.append("|---|---|")
    for a in ids:
        cells = ["%s ×%d%s" % (k, v, "" if v >= 2 else "（发芽）" if v == 1 else "（空白）")
                 for k, v in sig[a].items()]
        L.append("| %s | %s |" % (a, "；".join(cells)))
    L.append("")

    io_path = os.path.join(ANALYSIS_DIR, "STYLE_DISTANCE.md")
    import io
    io.open(io_path, "w", encoding="utf-8").write("\n".join(L))
    print("style distance report -> %s" % io_path)


if __name__ == "__main__":
    main()
