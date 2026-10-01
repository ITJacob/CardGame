# -*- coding: utf-8 -*-
"""
分析与评分统一入口：一键重生成 docs/analysis/ 全部产物。

依次跑五个只读脚本（固定顺序便于输出阅读）：
  1. score.py                     评分   -> scorecard.md + scores.json
  2. build_overview.py            总览   -> SKILLS_OVERVIEW.md
  3. build_profession_analysis.py 职业统计 -> SKILLS_ANALYSIS_BY_PROFESSION.md
  4. build_axis_analysis.py       轴报告 -> analysis_by_profession/*.md
  5. build_entity_analysis.py     编目三件套 -> ENTITIES_ANALYSIS.md

用法：python docs/tools/build_analysis.py
约定（WORKFLOW.md「分析与评分工作流」）：docs/json/ 任何变更，四门禁全绿后同轮跑本入口，
产物与 JSON 变更同一 commit——网页评分页与计分卡永远与 JSON 同代。
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

STEPS = [
    ("评分 score.py", "score.py"),
    ("总览 build_overview.py", "build_overview.py"),
    ("职业统计 build_profession_analysis.py", "build_profession_analysis.py"),
    ("轴报告 build_axis_analysis.py", "build_axis_analysis.py"),
    ("编目三件套 build_entity_analysis.py", "build_entity_analysis.py"),
]


def main():
    failed = []
    for label, script in STEPS:
        print("==> %s" % label, flush=True)
        r = subprocess.run([sys.executable, os.path.join(HERE, script)])
        if r.returncode != 0:
            failed.append(script)
            print("!! %s 失败（exit %d），继续跑后续" % (script, r.returncode), flush=True)
    print("----")
    if failed:
        print("FAILED: %s" % ", ".join(failed))
        sys.exit(1)
    print("分析与评分产物全部刷新：scorecard.md | scores.json | SKILLS_OVERVIEW.md | "
          "SKILLS_ANALYSIS_BY_PROFESSION.md | analysis_by_profession/*.md | ENTITIES_ANALYSIS.md")


if __name__ == "__main__":
    main()
