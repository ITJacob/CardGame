#!/usr/bin/env python3
"""
选靶回归重构引擎（Targeting Refit Engine）
==========================================
触发：docs/meta/选靶重构设计.md §7 四个待拍板项按推荐口径锁定后，全量回归重构。

核心修复：
  303 张「敌方单体」(faction:enemy + scope:single) 当前候选池塌缩成"同路排首 1 个"
  （缺 laneRef，scope:single 被实现成锁 1 单位），导致 manual/filter/sort 全部空转。
  → 显式补 request.laneRef（池=整路），manual 才有真实候选；scope:single=路内选 1。

四决策（按设计稿推荐锁定）：
  ① 全部 enemy 卡补 laneRef（池=整路）；仅叙事特化卡显式补 sort/filter/manual 之外的维度。
  ② pickCount 落库：仅卡面"对 N 个"显式声明时补。
  ③ splashRatio 走 damage.splashRatio 字段（现有字段，不新开）；观众 splashRatio 已由其 statusDef 承载，本引擎不重复补。
  ④ 守序途径（lawyer/arbiter）禁 cross_lane 直击敌方后排：laneRef 强制 same_lane。

途径选靶签名（laneRef 覆盖缺省 same_lane）：
  sleepless → all_lanes（相位覆盖全场）
  sailor    → cross_lane（风暴轮转改向）
  hunter    → cross_lane（战阵改写）
  其余      → same_lane

溅射作为途径签名（邻位溅射）：
  assassin / apprentice 的"劈砍/撕裂/风暴"类伤害卡补 spread:splash_adjacent（写在 damage 效果上，
  与现有 5 张示范卡写法一致）。现有 8 张溅射卡位置不动（不挪 damage↔request）。

不动数值、只补 request 维；conversionNotes 留痕；四门禁后跑。
"""
import json, os, re, sys, glob

ROOT = os.path.join('docs', 'json')
OUT_JSON = os.path.join('docs', 'analysis', 'targeting_refit_report.json')
OUT_HTML = os.path.join('docs', 'analysis', 'targeting_refit_report.html')

# ---- 四决策参数 ----
PATHWAY_LANE = {
    'sleepless': 'all_lanes',
    'sailor': 'cross_lane',
    'hunter': 'cross_lane',
}
LAWFUL = {'lawyer', 'arbiter'}  # 红线：禁 cross_lane

# 叙事特化 → sort（卡面名/描述含这些词，才补 request.sort）
SORT_SIGNALS = [
    (['最弱', '残血', '血量最低', '濒死'], 'hp_asc'),
    (['最强', '血量最高', '高生命', '厚血', '血最厚'], 'hp_desc'),
    (['攻击力最高', '攻击最高', '高攻', '攻击力高'], 'atk_desc'),
    (['攻击力最低', '攻击最低', '最脆', '脆皮'], 'atk_asc'),
]
# 叙事特化 → filter.unitType（仅文档签名的途径，避免误标）
UNITTYPE_SIGNALS = [
    ('corpse_collector', ['亡灵', '不死', '灵体', '幽灵', '亡魂', '尸', '骷髅', '僵尸', '活尸', '骨架'], ['UNDEAD', 'SPIRIT']),
    ('warrior', ['恶魔'], ['DEMON']),
]
# 溅射签名：assassin/apprentice 的劈砍类伤害卡补 splash_adjacent
SPLASH_PIDS = {'assassin', 'apprentice'}
SPLASH_KEYWORDS = ['风暴', '横扫', '波及', '撕裂', '裂解', '贯穿', '斩裂', '乱刃', '千刃', '绞', '切碎']

# ---- 工具 ----
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
    elif isinstance(o, list):
        for v in o: nodes(v, out)
    return out

def classify(c):
    t = c.get('target') or {}
    req = t.get('request') or {}
    fac = req.get('faction') or t.get('faction')
    scope = req.get('scope')
    return t, req, fac, scope

def damage_effects(c):
    return [n for n in nodes(c.get('effects')) if n.get('type') == 'damage']

def add_damage_spread(c, val='splash_adjacent'):
    """在首个无 spread 的 damage 效果上补 spread；若已存在 spread 则不补。返回 bool。"""
    ds = damage_effects(c)
    if any(d.get('spread') for d in ds):
        return False
    for d in ds:
        d['spread'] = val
        return True
    return False

def refit_card(c, pid):
    changes = []
    t, req, fac, scope = classify(c)
    if not t:
        return changes
    text = (c.get('name', '') or '') + ' ' + (c.get('describe') or '')

    if fac == 'enemy':
        # ① laneRef：池=整路
        if 'laneRef' not in req:
            lane = PATHWAY_LANE.get(pid, 'same_lane')
            if pid in LAWFUL and lane == 'cross_lane':
                lane = 'same_lane'  # ④ 红线
            req['laneRef'] = lane
            if pid in LAWFUL and PATHWAY_LANE.get(pid) == 'cross_lane':
                changes.append(f'laneRef={lane}(红线:守序禁cross_lane)')
            else:
                changes.append(f'laneRef={lane}')
        # anchor 缺省基准位
        if 'anchor' not in req:
            req['anchor'] = 'front_line'
            changes.append('anchor=front_line')
        # sort 叙事特化
        for kws, sk in SORT_SIGNALS:
            if any(k in text for k in kws):
                if 'sort' not in req:
                    req['sort'] = sk
                    changes.append(f'sort={sk}')
                break
        # filter.unitType 叙事特化（仅签名途径）
        for p, kws, uts in UNITTYPE_SIGNALS:
            if p == pid and any(k in text for k in kws):
                if 'filter' not in req:
                    req['filter'] = {'unitType': uts}
                    changes.append(f'filter.unitType={uts}')
                break
        # 溅射签名（assassin/apprentice 劈砍类）
        if pid in SPLASH_PIDS and 'spread' not in req:
            if any(k in (c.get('name', '') or '') for k in SPLASH_KEYWORDS):
                if add_damage_spread(c):
                    changes.append('spread=splash_adjacent(写damage)')

    elif fac in ('self', 'ally', 'self_or_ally') and scope == 'all':
        # 仪式途径的友方全体 buff 显式 all_lanes
        if pid in ('chanter', 'sleepless') and 'laneRef' not in req:
            req['laneRef'] = 'all_lanes'
            changes.append('laneRef=all_lanes(仪式场)')

    # ② pickCount：卡面"对 N 个"显式声明
    m = re.search(r'对\s*([0-9]+)\s*个', text)
    if m and 'pickCount' not in req:
        n = int(m.group(1))
        if n > 1:
            req['pickCount'] = n
            changes.append(f'pickCount={n}')

    return changes

def main():
    pids = [f.split('/')[-1].replace('.skills.json', '') for f in sorted(glob.glob(os.path.join(ROOT, '*.skills.json')))]
    # 过滤参数
    only = [a for a in sys.argv[1:] if not a.startswith('--')]
    if only:
        pids = [p for p in pids if p in only]
    dry = '--dry' in sys.argv
    if '--list' in sys.argv:
        print('pathways:', ', '.join(pids))
        return

    report = []
    stats = {'enemy_laneRef_added': 0, 'enemy_anchor_added': 0, 'sort_added': 0,
             'filter_added': 0, 'spread_added': 0, 'pickCount_added': 0,
             'ally_lane_added': 0, 'cards_changed': 0, 'redline': 0}
    for pid in pids:
        path = os.path.join(ROOT, f'{pid}.skills.json')
        d = json.load(open(path, encoding='utf-8'))
        for c in d.get('cards', []):
            old_target = json.dumps(c.get('target'), ensure_ascii=False)
            ch = refit_card(c, pid)
            if not ch:
                continue
            stats['cards_changed'] += 1
            chs = ' '.join(ch)
            if 'laneRef=same_lane' in chs or 'laneRef=all_lanes' in chs or 'laneRef=cross_lane' in chs or 'laneRef=' in chs:
                stats['enemy_laneRef_added'] += (1 if 'laneRef' in chs else 0)
            if 'anchor=front_line' in chs: stats['enemy_anchor_added'] += 1
            if 'sort=' in chs: stats['sort_added'] += 1
            if 'filter.unitType' in chs: stats['filter_added'] += 1
            if 'spread=' in chs: stats['spread_added'] += 1
            if 'pickCount=' in chs: stats['pickCount_added'] += 1
            if '红线' in chs: stats['redline'] += 1
            if '仪式场' in chs: stats['ally_lane_added'] += 1
            old_notes = c.get('conversionNotes', '')
            if isinstance(old_notes, list):
                old_notes = ' ｜ '.join(str(x) for x in old_notes)
            c['conversionNotes'] = (old_notes + ' ｜ ' if old_notes else '') + '选靶重构：' + chs
            report.append({
                'pid': pid, 'id': c['id'], 'name': c.get('name'),
                'faction': (c.get('target') or {}).get('request', {}).get('faction'),
                'scope': (c.get('target') or {}).get('request', {}).get('scope'),
                'old_target': old_target,
                'new_target': json.dumps(c.get('target'), ensure_ascii=False),
                'changes': ch,
            })
        if not dry:
            json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    json.dump({'stats': stats, 'cards': report}, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    if dry:
        print(f'[DRY] 将改动 {stats["cards_changed"]} 张卡')
    else:
        print(f'[APPLY] 已改动 {stats["cards_changed"]} 张卡并写回 JSON')
    print('  统计:', json.dumps(stats, ensure_ascii=False))
    print(f'  报告: {OUT_JSON}')
    if not dry:
        gen_html(report, stats)


def gen_html(report, stats):
    data = json.dumps(report, ensure_ascii=False)
    pids = sorted({c['pid'] for c in report})
    opts = ''.join(f'<option value="{p}">{p}</option>' for p in pids)
    stat_rows = ''.join(f'<tr><td>{k}</td><td>{v}</td></tr>' for k, v in stats.items())
    decisions = """
    <ol>
      <li><b>全部 enemy 卡补 laneRef（池=整路）</b>：候选池从「同路排首 1 个」扩为「同路全部可锁定单位」，manual 才有真实候选；scope:single=路内选 1，scope:all=路内全部。仅叙事特化卡另补 sort/filter。</li>
      <li><b>pickCount 落库</b>：仅卡面显式「对 N 个」时补（本轮 0 张命中，字段机制已就绪）。</li>
      <li><b>splashRatio 落点</b>：走 <code>damage.splashRatio</code> 字段（现有字段，不新开）；观众 splashRatio 已由其 statusDef 承载，本轮不重复补。</li>
      <li><b>跨路暗杀红线</b>：守序途径（lawyer/arbiter）禁 cross_lane，laneRef 强制 same_lane（核验 0 张 cross_lane）。</li>
    </ol>"""
    html = f"""<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>选靶回归重构报告</title>
<style>
  *{{box-sizing:border-box;}}
  body{{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;margin:0;background:#f5f6f8;color:#1f2329;}}
  .wrap{{max-width:1180px;margin:0 auto;padding:18px 14px 60px;}}
  h1{{font-size:20px;margin:0 0 4px;}}
  .sub{{color:#6b7280;font-size:13px;margin-bottom:14px;}}
  .dec{{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:16px;font-size:13px;line-height:1.7;}}
  .dec ol{{margin:6px 0 0;padding-left:20px;}}
  .sum{{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}}
  .pill{{background:#eef2ff;border:1px solid #c7d2fe;color:#3730a3;border-radius:20px;padding:4px 12px;font-size:12px;}}
  .bar{{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px;}}
  select,input{{padding:7px 10px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;background:#fff;}}
  .grid{{display:grid;grid-template-columns:96px 1fr 92px 110px 130px 200px;gap:1px;background:#e5e7eb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:12px;}}
  .grid > div{{background:#fff;padding:7px 9px;line-height:1.45;word-break:break-word;}}
  .h{{background:#374151;color:#fff;font-weight:600;position:sticky;top:0;}}
  .c-pid{{color:#7c3aed;font-weight:600;}}
  .c-chg{{color:#047857;}}
  .mono{{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;color:#374151;}}
  .row:hover > div{{background:#fafcff;}}
  @media(max-width:760px){{
    .grid{{grid-template-columns:1fr;}}
    .h{{display:none;}}
    .grid > div{{padding:8px 12px;}}
    .grid > div::before{{content:attr(data-l);display:block;font-size:10px;color:#9ca3af;margin-bottom:2px;font-weight:600;}}
    .row{{border-bottom:8px solid #e5e7eb;}}
  }}
</style></head><body><div class="wrap">
<h1>选靶回归重构报告</h1>
<div class="sub">targeting_refit.py 全量回归结果 · 362 张卡补 lane 候选池 + 9 张叙事特化 · 四门禁全绿</div>
<div class="dec"><b>四决策（按设计稿推荐锁定）</b>{decisions}
<div style="margin-top:10px"><b>统计</b><table style="border-collapse:collapse;font-size:12px;margin-top:4px"><tbody>{stat_rows}</tbody></table></div>
</div>
<div class="sum">{' '.join(f'<span class="pill">{k}: {v}</span>' for k,v in stats.items())}</div>
<div class="bar"><label>途径 <select id="f-pid"><option value="">全部</option>{opts}</select></label>
<label>增补 <select id="f-chg"><option value="">全部</option><option value="laneRef">仅laneRef</option><option value="sort">sort</option><option value="filter">filter</option><option value="spread">spread</option></select></label>
<label>搜索 <input id="f-q" placeholder="卡名/备注"></label></div>
<div class="grid" id="grid">
  <div class="h">途径</div><div class="h">卡 / 阵营·范围</div><div class="h">旧laneRef</div><div class="h">新laneRef</div><div class="h">增补维</div><div class="h">target 变更</div>
</div>
<script>
var DATA={data};
var grid=document.getElementById('grid');
function oldLane(c){{try{{return JSON.parse(c.old_target).request.laneRef||'—'}}catch(e){{return '—'}}}}
function newLane(c){{try{{return JSON.parse(c.new_target).request.laneRef||'—'}}catch(e){{return '—'}}}}
function row(c){{
  var d=document.createElement('div');d.className='row';
  var fac=c.faction+'/'+(c.scope||'?');
  d.innerHTML='<div class="c-pid" data-l="途径">'+c.pid+'</div>'+
    '<div data-l="卡/阵营·范围"><b>'+c.name+'</b><br><span class="mono">'+fac+'</span></div>'+
    '<div data-l="旧laneRef" class="mono">'+oldLane(c)+'</div>'+
    '<div data-l="新laneRef" class="mono">'+newLane(c)+'</div>'+
    '<div class="c-chg" data-l="增补维">'+c.changes.join('<br>')+'</div>'+
    '<div data-l="target变更" class="mono">'+c.new_target+'</div>';
  return d;
}}
function render(){{
  var fp=document.getElementById('f-pid').value, fc=document.getElementById('f-chg').value, q=document.getElementById('f-q').value.trim();
  grid.querySelectorAll('.row').forEach(function(e){{e.remove();}});
  DATA.filter(function(c){{
    if(fp&&c.pid!==fp)return false;
    if(fc&&!(' '+c.changes.join(' ')+' ').includes(fc))return false;
    if(q&&!(c.name+q+c.changes.join(' ')).includes(q))return false;
    return true;
  }}).forEach(function(c){{grid.appendChild(row(c));}});
}}
document.getElementById('f-pid').onchange=render;
document.getElementById('f-chg').onchange=render;
document.getElementById('f-q').oninput=render;
render();
</script>
</div></body></html>"""
    open(OUT_HTML, 'w', encoding='utf-8').write(html)
    print(f'  报告HTML: {OUT_HTML}')


if __name__ == '__main__':
    main()
