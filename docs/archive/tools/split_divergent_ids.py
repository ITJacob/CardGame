"""
拆分两处有意的同名异义状态（charm/stealth）为独立 id，使全库强制单点定义（不再设豁免白名单）。
- charm  -> assassin 轴身份状态改为 charm_axis；lawyer/criminal 的通用 charm 保持
- stealth-> sleepless 影纱改为 shadow_veil；apothecary 的隐身药水 stealth 保持
只改动 def.id 与 mount_status.statusId / filter.statusId，不碰 note 文本里出现的同名单词。
"""
import json

JSON_DIR = "."

# (文件, old_id, new_id, 作用域说明)
OPS = [
    ("assassin.statuses.json", "charm", "charm_axis"),
    ("assassin.skills.json", "charm", "charm_axis"),
    ("sleepless.statuses.json", "stealth", "shadow_veil"),
    ("sleepless.skills.json", "stealth", "shadow_veil"),
]

def rename_refs(o, old, new):
    changed = False
    if isinstance(o, dict):
        if o.get("type") == "mount_status" and o.get("statusId") == old:
            o["statusId"] = new
            changed = True
        if isinstance(o.get("filter"), dict) and o.get("filter", {}).get("statusId") == old:
            o["filter"]["statusId"] = new
            changed = True
        # axes.<x>.statusId 等顶层 statusId 字段
        if "statusId" in o and o["statusId"] == old and o.get("type") != "mount_status":
            o["statusId"] = new
            changed = True
        for v in o.values():
            if rename_refs(v, old, new):
                changed = True
    elif isinstance(o, list):
        for x in o:
            if rename_refs(x, old, new):
                changed = True
    return changed

def rename_def_id(defs, old, new):
    for sd in defs:
        if sd.get("id") == old:
            sd["id"] = new
            return True
    return False

total_changes = 0
for fname, old, new in OPS:
    path = f"{JSON_DIR}/{fname}"
    d = json.load(open(path, encoding="utf-8"))
    c = 0
    # 1) 状态定义文件：改 def.id
    if "statusDefs" in d:
        if rename_def_id(d["statusDefs"], old, new):
            c += 1
            print(f"  [{fname}] def.id {old} -> {new}")
    # 2) 全文件递归改引用
    if rename_refs(d, old, new):
        c += 1
    if c:
        json.dump(d, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        total_changes += 1
        print(f"  [{fname}] 引用 {old} -> {new} 已更新")
    else:
        print(f"  [{fname}] 无 {old} 引用，跳过")

print("\n完成，改动文件数:", total_changes)
