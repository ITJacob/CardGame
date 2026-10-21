#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""玩法蓝图解析器（零依赖，不 import score/validate——供 blueprint_score 与 score 双向复用）。

机读约定：只认 `## 玩法蓝图` 之下各 `###` 节的管道表格；单元格列表用半角逗号、
禁 `|`/换行；节缺失=扣分；下一个 `##` 即蓝图章结束。逐行 split 解析。
"""

import io

SECTIONS = {
    "命题": ["一句话命题", "可操作变量", "变量代价/输面"],
    "风格边界": ["主签名维度", "使用的全局通用机制", "红线来源"],
    "轴玩法": ["轴", "名称", "锚点(kind:id)", "产出→消费→清除", "玩家决策点", "签名键承诺(键:卡位)", "计划卡数", "角色配比"],
    "跨轴钩子": ["卡位", "读轴", "概念", "facet", "用途"],
    "跨系钩子": ["枢纽状态", "写入卡位", "读取卡位", "participants"],
    "角色配比": ["角色", "张数", "卡位"],
}

STATES = ("草案", "已拍板", "回溯补登")


def _split_row(line):
    """管道表格行 -> 去空白单元格列表。"""
    return [c.strip() for c in line.strip().strip("|").split("|")]


def _is_sep(cells):
    return all(set(c) <= set("-: ") and c for c in cells)


def parse_blueprint(path):
    """状态机解析 rounds 文件的玩法蓝图章。返回 {meta, sections: {节名: {rows, header_ok}}, header_errors}；
    无蓝图章返回 None。表头不匹配记 header_errors。"""
    lines = io.open(path, encoding="utf-8").read().splitlines()
    start = None
    for i, ln in enumerate(lines):
        if ln.startswith("## 玩法蓝图"):
            start = i
            break
    if start is None:
        return None
    title = lines[start]
    meta = {"state": None, "date": None}
    if "（" in title and "）" in title:
        seg = title[title.index("（") + 1:title.rindex("）")]
        parts = [p.strip() for p in seg.split("·")]
        if parts and parts[0] in STATES:
            meta["state"] = parts[0]
        if len(parts) > 1:
            meta["date"] = parts[1]

    sections, header_errors = {}, []
    cur = None
    i = start + 1
    while i < len(lines):
        ln = lines[i]
        if ln.startswith("## ") and not ln.startswith("###"):
            break
        if ln.startswith("### "):
            cur = ln[4:].strip()
            rest = cur
            for name in SECTIONS:
                if cur == name or cur.startswith(name + " ") or cur.startswith(name + "|"):
                    cur = name
                    rest = ln[4 + len(name):]
                    break
            if cur in SECTIONS and cur not in sections:
                sections[cur] = {"rows": [], "header_ok": None}
                if "|" in rest:   # 表头与节标题同行
                    hdr = _split_row(rest)
                    sections[cur]["header_ok"] = hdr[:len(SECTIONS[cur])] == SECTIONS[cur]
                    if not sections[cur]["header_ok"]:
                        header_errors.append(cur)
            elif cur not in SECTIONS:
                cur = None
            i += 1
            continue
        if cur and ln.strip().startswith("|"):
            cells = _split_row(ln)
            if _is_sep(cells):
                i += 1
                continue
            sec = sections[cur]
            if sec["header_ok"] is None:
                sec["header_ok"] = cells[:len(SECTIONS[cur])] == SECTIONS[cur]
                if not sec["header_ok"]:
                    header_errors.append(cur)
                i += 1
                continue
            if any(cells):
                row = dict(zip(SECTIONS[cur], cells))
                sec["rows"].append(row)
        i += 1
    return {"meta": meta, "sections": sections, "header_errors": header_errors}


def _cells(text):
    """单元格内半角逗号列表。"""
    return [x.strip() for x in (text or "").split(",") if x.strip()]


def _parse_sig_commit(text):
    """签名键承诺单元格 -> {键: [卡位]}。格式 `prim:translocate:卡A,卡B;elem:ice:卡C`。"""
    out = {}
    for seg in (text or "").split(";"):
        seg = seg.strip()
        if not seg or ":" not in seg:
            continue
        key, _, slots = seg.rpartition(":")
        out[key.strip()] = _cells(slots)
    return out


def _parse_axis_roles(text):
    """轴角色配比列 -> {角色: 数量}。格式 `core×2,generic×1`。"""
    out = {}
    for seg in _cells(text):
        if "×" in seg:
            r, _, n = seg.partition("×")
            if r.strip() and n.strip().isdigit():
                out[r.strip()] = int(n.strip())
    return out


def _is_declared_none(rows, first_col):
    """显式声明无：只一行且首格为「无」。"""
    return len(rows) == 1 and rows[0].get(first_col) in ("无", "—")


def parse_pc_chain(text, card_names):
    """轴玩法表「产出→消费→清除」列 -> (E*, P*)：产层/消费段声明卡位集。

    不按 marker 文字切分（全库 19 种变体），用卡名词典匹配：段1（首个 → 前）
    出现的本途径卡名 = E*，段2（两个 → 之间）= P*；清除段为叙述文本不参与。
    """
    parts = (text or "").split("→")
    if len(parts) < 2:
        return set(), set()

    def _hit(seg):
        # 先长后短消耗式匹配：命中后占位替换，防「仪式魔法专家」把子串卡「仪式魔法」误吸进集
        out = set()
        for n in sorted(card_names, key=len, reverse=True):
            if n and n in seg:
                out.add(n)
                seg = seg.replace(n, "\0")
        return out

    return _hit(parts[0]), _hit(parts[1])
