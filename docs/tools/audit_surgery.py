#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
骨架手术审计（2026-10-03 收官轮复核）

目标：逐张核对 surgery_engine.py 的批量换形结果——
  1. 每张被改卡的角色判定（role_of）是否合理；
  2. 注入的签名段语义是否与原卡功能/原著设定冲突；
  3. 标记需人工复核的卡（特别是 target_override 重定向、迷失通胀等）。

输出：
  docs/analysis/surgery_audit.json    全量结构化数据（供 HTML 报告消费）
  docs/analysis/surgery_audit.html    可筛选的逐张卡核对表
  stdout                             riven 概要 + 风险卡聚焦
"""
import json, os, collections, html

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
JSON_DIR = os.path.join(ROOT, 'docs', 'json')
OUT_DIR = os.path.join(ROOT, 'docs', 'analysis')
os.makedirs(OUT_DIR, exist_ok=True)

GEN = {'damage', 'mount_status', 'modify_stat', 'modify_resource', 'heal', 'dispel'}
# 各途径签名原语（非通用六件套，surgery 注入的主要贡献项）
SIGN = {
    'prisoner': {'transfer_status', 'modify_resource', 'modify_status'},
    'assassin': {'translocate', 'modify_targetability', 'modify_resource'},
    'sleepless': {'advance_clock', 'set_luminance'},
    'thief': {'target_override', 'take_control', 'transfer_status'},
    'corpse_collector': {'spawn', 'drain', 'reveal', 'modify_status', 'if'},
    'criminal': {'modify_resource', 'move'},
    'spectator': {'write_rule_slot', 'modify_status'},
    'reader': {'reveal', 'snapshot', 'modify_skill'},
    'pryer': {'modify_skill'},
    'hunter': {'target_override', 'move'},
    'monster': {'restore_snapshot', 'if'},
    'apprentice': {'translocate', 'echo_last_skill', 'modify_resource'},
    'seer': {'take_control', 'modify_rule_slot'},
    'arbiter': {'write_rule_slot', 'modify_rule_slot'},
    'apothecary': {'grant_immunity', 'transfer_status'},
    'warrior': {'target_override', 'grant_immunity'},
    'planter': {'spawn'},
    'sailor': {'move'},
    'savant': {'modify_rule_slot', 'spawn'},
    'chanter': {'set_luminance', 'grant_immunity'},
    'lawyer': set(),   # 试点轮手工，无配方段
    'supplicant': set(),
}

def nodes(o, out=None):
    if out is None: out = []
    if isinstance(o, dict):
        if 'op' in o:
            for k in ('steps', 'then', 'else', 'effects'):
                if k in o: nodes(o[k], out)
            return out
        if isinstance(o.get('type'), str):
            out.append(o)
            for v in o.values():
                if isinstance(v, (dict, list)): nodes(v, out)
        else:
            for v in o.values():
                if isinstance(v, (dict, list)): nodes(v, out)
    elif isinstance(o, list):
        for v in o: nodes(v, out)
    return out

def flat_types(c):
    return [n.get('type') for n in nodes(c.get('effects')) if n.get('type')]

def card_target(c):
    t = c.get('target') or {}
    req = t.get('request') or {}
    return {
        'faction': req.get('faction'),
        'anchor': req.get('anchor'),
        'scope': req.get('scope'),
        'sort': req.get('sort'),
    }

def parse_role(cn):
    # conversionNotes 形如 "...骨架手术：诅咒反照换形（角色=dmg）"
    if not cn: return None
    if isinstance(cn, list): cn = ' ｜ '.join(str(x) for x in cn)
    import re
    m = re.search(r'角色=([a-z]+)', cn)
    return m.group(1) if m else None

def main():
    rows = []
    per_pathway = collections.defaultdict(lambda: collections.Counter())
    role_to_seg = collections.defaultdict(set)
    flags = collections.defaultdict(list)

    for fn in sorted(os.listdir(JSON_DIR)):
        if not fn.endswith('.skills.json'): continue
        pid = fn[:-len('.skills.json')]
        d = json.load(open(os.path.join(JSON_DIR, fn), encoding='utf-8'))
        pname = d.get('pathwayName', pid)
        for c in d['cards']:
            cn = c.get('conversionNotes')
            if not cn or '骨架手术' not in str(cn): continue
            role = parse_role(cn)
            ts = flat_types(c)
            injected = [t for t in ts if t in SIGN.get(pid, set())]
            original = [t for t in ts if t in GEN]
            tgt = card_target(c)
            # 标记
            f = []
            # F1: 进攻性卡（dmg/debuff）被 target_override 重定向到友方/自身
            if 'target_override' in injected and role in ('dmg', 'debuff'):
                anc = None
                for n in nodes(c.get('effects')):
                    if n.get('type') == 'target_override':
                        anc = n.get('anchor')
                if anc in ('self', 'self_faction_hp_desc', 'self_or_ally'):
                    f.append('OFFENSIVE_REDIRECT')
            # F2: 迷失通胀（lost+1 注入）
            if 'modify_resource' in injected:
                for n in nodes(c.get('effects')):
                    if n.get('type') == 'modify_resource' and n.get('resource') == 'lost':
                        f.append('LOST_TAX'); break
            # F3: spectator heal/debuff 无敌方 debuff 时落到 wslot trigger
            if pid == 'spectator' and role in ('heal', 'dispel', 'dmg', 'debuff'):
                has_enemy_debuff = any(
                    n.get('type') == 'mount_status' and n.get('target') not in ('self','caster','all_allies','allies_except_self','all','board')
                    for n in nodes(c.get('effects')))
                if not has_enemy_debuff:
                    f.append('SPECTATOR_FALLBACK_WRITESLOT')
            # F4: 原卡已是 res（modify_resource 非签名资源）又叠加签名资源
            if role == 'res' and 'modify_resource' in original:
                # 原卡自带 modify_resource，签名段又加一个
                f.append('DOUBLE_RES')
            per_pathway[pid][role] += 1
            for s in injected:
                role_to_seg[(pid, role)].add(s)
            rows.append({
                'pid': pid, 'pname': pname,
                'id': c.get('id'), 'name': c.get('name'),
                'axis': c.get('axis'), 'role': role,
                'original': sorted(set(original)),
                'injected': sorted(set(injected)),
                'target': tgt,
                'describe': (c.get('describe') or '').strip(),
                'flags': f,
            })
            if f:
                flags[pid].append((c.get('id'), c.get('name'), role, f))

    # 写 JSON
    data = {'rows': rows, 'per_pathway': {k: dict(v) for k, v in per_pathway.items()},
            'role_to_seg': {f"{k[0]}/{k[1]}": sorted(v) for k, v in role_to_seg.items()}}
    with open(os.path.join(OUT_DIR, 'surgery_audit.json'), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # 概要
    print(f"被改卡总数: {len(rows)}")
    print("各途径角色分布 / 注入段种类数:")
    for pid in sorted(per_pathway):
        rs = per_pathway[pid]
        segkinds = len(set(tuple(sorted(v)) for v in role_to_seg.values() if v and v and pid in [k[0] for k in role_to_seg]))
        print(f"  {pid:18s} 卡={sum(rs.values()):3d}  角色={dict(rs)}")
    print("\nbuff/stat/res 是否同段（坍塌检测）:")
    for pid in sorted(per_pathway):
        b = role_to_seg.get((pid,'buff')); s = role_to_seg.get((pid,'stat')); r = role_to_seg.get((pid,'res'))
        if b is not None or s is not None or r is not None:
            same = (b == s == r)
            print(f"  {pid:18s} buff={sorted(b or [])}  stat={sorted(s or [])}  res={sorted(r or [])}  {'← 三同段' if same else ''}")

    print("\n⚠️ 风险卡聚焦:")
    for pid, lst in flags.items():
        print(f"\n  [{pid}] {len(lst)} 张 flagged")
        for cid, name, role, fl in lst[:40]:
            print(f"    - {cid} ({name}) 角色={role} 标记={fl}")

    # 写 HTML
    write_html(data, OUT_DIR)

def write_html(data, out_dir):
    rows = data['rows']
    # 途径中文名映射
    pnames = sorted({(r['pid'], r['pname']) for r in rows})
    pathways = [{'id': p, 'name': n} for p, n in pnames]
    html_json = html.escape(json.dumps(rows, ensure_ascii=False))
    flag_counts = collections.Counter()
    for r in rows:
        for f in r['flags']:
            flag_counts[f] += 1
    flag_legend = {
        'OFFENSIVE_REDIRECT': '进攻性卡被 target_override 重定向到友方/自身（疑似自伤/误伤友军）',
        'LOST_TAX': '注入了迷失值+1（失控通胀税）',
        'SPECTATOR_FALLBACK_WRITESLOT': '观众治疗/驱散/伤害卡无敌方debuff时落wslot trigger（语义牵强）',
        'DOUBLE_RES': '原卡自带资源修改，签名段又叠加一个资源',
    }
    legend_html = ''.join(
        f'<div class="lg"><span class="badge {k}">{k}</span> {html.escape(flag_legend.get(k,k))} '
        f'<b>({flag_counts.get(k,0)})</b></div>' for k in flag_legend)
    rowcards = ''.join(
        f'''<div class="rc" data-pid="{html.escape(r['pid'])}" data-role="{html.escape(r['role'] or '')}"
              data-flags="{html.escape(' '.join(r['flags']))}"
              data-q="{html.escape((r['name']+r['describe']).lower())}">
          <div class="c1"><b>{html.escape(r['name'])}</b><br><span class="mut">{html.escape(r['id'])}</span></div>
          <div class="c2">{html.escape(r['pname'])}</div>
          <div class="c3"><span class="role">{html.escape(r['role'] or '-')}</span></div>
          <div class="c4">{html.escape('·'.join(r['original']))}</div>
          <div class="c5">{html.escape('·'.join(r['injected'])) or '-'}</div>
          <div class="c6">{html.escape(str(r['target'].get('faction')))}/{html.escape(str(r['target'].get('anchor')))}</div>
          <div class="c7">{html.escape(r['describe'])}</div>
          <div class="c8">{' '.join('<span class="badge '+f+'">'+f+'</span>' for f in r['flags']) or ''}</div>
        </div>''' for r in rows)
    doc = f'''<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>骨架手术逐张卡审计</title>
<style>
  body{{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#f5f6f8;color:#1d2129;}}
  h1{{font-size:18px;margin:12px 16px 4px;}}
  .sub{{margin:0 16px 10px;color:#5c6670;font-size:13px;}}
  .ctrl{{position:sticky;top:0;background:#fff;border-bottom:1px solid #e3e6eb;padding:10px 16px;z-index:5;display:flex;gap:10px;flex-wrap:wrap;align-items:center;}}
  .ctrl input,.ctrl select{{padding:6px 8px;border:1px solid #cfd4da;border-radius:6px;font-size:13px;}}
  .ctrl input[type=text]{{min-width:240px;}}
  .stats{{margin:0 16px 8px;font-size:13px;color:#5c6670;}}
  .lg{{font-size:12.5px;margin:2px 16px;color:#333;}}
  .lg .badge{{font-size:11px;padding:1px 6px;border-radius:4px;color:#fff;margin-right:4px;}}
  .badge.OFFENSIVE_REDIRECT{{background:#d4373a;}}
  .badge.LOST_TAX{{background:#e08a00;}}
  .badge.SPECTATOR_FALLBACK_WRITESLOT{{background:#8b5cf6;}}
  .badge.DOUBLE_RES{{background:#0b8a6b;}}
  .head,.rc{{display:grid;grid-template-columns:170px 90px 70px 150px 150px 120px 1fr 160px;gap:8px;
    padding:6px 16px;align-items:start;border-bottom:1px solid #eceef1;font-size:12.5px;}}
  .head{{position:sticky;top:54px;background:#eef1f4;font-weight:600;color:#303840;z-index:4;border-bottom:1px solid #d4d9df;}}
  .rc:hover{{background:#f0f6ff;}}
  .rc.flag{{background:#fff4f4;}}
  .rc.flag:hover{{background:#ffeaea;}}
  .mut{{color:#8a929c;font-size:11px;}}
  .role{{background:#e7edf5;padding:1px 7px;border-radius:10px;font-size:11px;}}
  .c5 b{{color:#b8860b;}}
  .c6{{color:#6b7480;}}
  .c7{{line-height:1.45;}}
  .badge{{font-size:10px;padding:1px 5px;border-radius:4px;color:#fff;display:inline-block;margin:1px 0;}}
</style></head><body>
<h1>骨架手术逐张卡审计 · {len(rows)} 张被改卡</h1>
<div class="sub">surgery_engine.py 收官轮结果核对 · 角色判定 / 注入签名段 / 语义冲突标记</div>
<div class="ctrl">
  <input type="text" id="q" placeholder="搜索卡名 / 描述关键词…">
  <select id="pid"><option value="">全部途径</option>{''.join(f'<option value="{p["id"]}">{p["name"]}（{p["id"]}）</option>' for p in pathways)}</select>
  <select id="role"><option value="">全部角色</option><option value="dmg">dmg</option><option value="debuff">debuff</option><option value="buff">buff</option><option value="heal">heal</option><option value="dispel">dispel</option><option value="stat">stat</option><option value="res">res</option></select>
  <select id="fl"><option value="">全部（含无标记）</option><option value="flag">仅高亮风险卡</option></select>
  <span id="cnt" class="stats"></span>
</div>
<div class="stats">标记图例：</div>
{legend_html}
<div class="head"><div>卡名 / id</div><div>途径</div><div>角色</div><div>原卡原语</div><div>注入签名段</div><div>卡面选靶</div><div>玩家可读描述（含后缀）</div><div>标记</div></div>
<div id="list">{rowcards}</div>
<script>
const rows = {html_json};
const box = document.getElementById('list');
const q = document.getElementById('q'), pidS = document.getElementById('pid'),
      roleS = document.getElementById('role'), flS = document.getElementById('fl'),
      cnt = document.getElementById('cnt');
const els = Array.from(document.querySelectorAll('.rc'));
function apply(){{
  const Q=q.value.trim().toLowerCase(), P=pidS.value, R=roleS.value, F=flS.value;
  let n=0;
  els.forEach(e=>{{
    const show = (!Q||e.dataset.q.includes(Q)) && (!P||e.dataset.pid===P)
      && (!R||e.dataset.role===R) && (!F||(F==='flag'?(e.dataset.flags.trim()!==''):true));
    e.style.display = show?'grid':'none';
    if(show) n++;
  }});
  cnt.textContent = '显示 '+n+' / {len(rows)} 张';
}}
q.oninput=apply; pidS.onchange=apply; roleS.onchange=apply; flS.onchange=apply; apply();
</script></body></html>'''
    with open(os.path.join(out_dir, 'surgery_audit.html'), 'w', encoding='utf-8') as f:
        f.write(doc)
    print(f"\nHTML 报告: {os.path.join(out_dir, 'surgery_audit.html')}")
    print(f"JSON 数据: {os.path.join(out_dir, 'surgery_audit.json')}")

if __name__ == '__main__':
    main()
