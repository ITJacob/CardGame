# -*- coding: utf-8 -*-
"""技能池 JSON 全库校验器。用法: python docs/json/validate.py"""
import json, io, sys, glob, os

PRIMS = {"damage","heal","mount_status","modify_stat","modify_resource","move","spawn","dispel","drain","domain","translocate",
         "modify_damage","transfer_status","target_override","snapshot","restore_snapshot",
         "echo_last_skill","gauge_shuffle","status_shuffle"}
OPS = {"sequence","repeat","if"}
EVENTS = {"on_apply","on_remove","on_tick","on_turn_start","on_battle_start","on_spawn","on_death","on_kill","on_attack","on_take_damage","on_deal_damage","on_active_skill"}
ELEMENTS = {"fire","ice","poison","shock","mental","physical","water","holy","none"}
REACH = {"melee","ranged","none"}
SORTS = {"none","hp_asc","hp_desc","atk_desc","index_asc","index_desc","energy_desc","armor_desc","buff_count_desc","debuff_count_desc","gauge_asc","gauge_desc","stat_max_desc"}
STATS = {"attack","defense","armor","rank","hp_max","energy_max","energy_regen","stamina_rate","stamina_threshold","gauge.rate","summon_cap"} | {"resist:"+e for e in ELEMENTS - {"none"}} | {"resist:*"}
RESOURCES = {"hp","energy","shield","armor","lost","gauge.current","gauge.rate","gauge.threshold"}
CATS = {"dot","hot","buff","debuff","control","reactive","aura","stance","fear","retarget","link","contract","conceal","seal"}
MOVE_OPS = {"swap_neighbor","insert_tail_cross_lane","swap_ally","param","pull_forward","push_back","charge_forward"}
DOMAIN_OPS = {"overlay","swap","hero"}
TRANS_OPS = {"pull_into","banish"}
RARITY_BY_SEQ = lambda s: "common" if s>=8 else "uncommon" if s>=6 else "rare" if s>=4 else "epic" if s>=2 else "legendary"

HERE = os.path.dirname(os.path.abspath(__file__))

def main():
    m = json.load(io.open(os.path.join(HERE,'manifest.json'), encoding='utf-8'))
    CLOSED = set(m["statusIds"].values())
    expect = {p["id"]: p["cardCount"] for p in m["pathways"]}

    globs = set()
    files = sorted(glob.glob(os.path.join(HERE,'*.skills.json')))
    for f in files:
        d = json.load(io.open(f, encoding='utf-8'))
        for c in d.get("cards",[]):
            for sd in c.get("statusDefs") or []: globs.add(sd["id"])
    ALLSTATUS = CLOSED | globs

    errors_all, warns_all = [], []
    total_cards = 0

    def walk(effs, cid, path, flags, errors, warns):
        for i, e in enumerate(effs or []):
            p = "%s.%d" % (path, i)
            t = e.get("type")
            if t is None:
                op = e.get("op")
                if op not in OPS: errors.append("%s %s: bad operator %s" % (cid,p,op)); continue
                if op in ("sequence","repeat"): walk(e.get("steps"), cid, p, flags, errors, warns)
                else:
                    walk(e.get("then"), cid, p+".then", flags, errors, warns)
                    walk(e.get("else"), cid, p+".else", flags, errors, warns)
                continue
            if t not in PRIMS: errors.append("%s %s: bad primitive %s" % (cid,p,t)); continue
            el = e.get("element")
            if el is not None and el not in ELEMENTS and not str(el).startswith("$"):
                errors.append("%s %s: bad element %s"%(cid,p,el))
            if t=="modify_stat":
                st = e.get("stat")
                if st not in STATS and not str(st).startswith("resist:$"):
                    errors.append("%s %s: bad stat %s"%(cid,p,st))
            if t=="modify_resource" and e.get("resource") not in RESOURCES:
                errors.append("%s %s: bad resource %s"%(cid,p,e.get("resource")))
            if t=="mount_status":
                sid = e.get("statusId")
                if not sid: errors.append("%s %s: mount_status missing statusId"%(cid,p))
                elif sid != "$self" and sid not in ALLSTATUS:
                    errors.append("%s %s: unknown statusId %s"%(cid,p,sid))
            if t=="move" and e.get("op") not in MOVE_OPS: errors.append("%s %s: bad move.op %s"%(cid,p,e.get("op")))
            if t=="domain" and e.get("op") not in DOMAIN_OPS: errors.append("%s %s: bad domain.op %s"%(cid,p,e.get("op")))
            if t=="translocate" and e.get("op") not in TRANS_OPS: errors.append("%s %s: bad translocate.op %s"%(cid,p,e.get("op")))
            if t=="dispel":
                for cat in e.get("filter",{}).get("category",[]) or []:
                    if cat not in CATS: errors.append("%s %s: bad dispel category %s"%(cid,p,cat))

    def trigs(trs, cid, path, flags, errors, warns):
        for i,tr in enumerate(trs or []):
            ev = tr.get("event")
            if ev not in EVENTS:
                if flags: warns.append("%s %s.%d: nonstandard event %s (frameworkFlagged)"%(cid,path,i,ev))
                else: errors.append("%s %s.%d: bad event %s"%(cid,path,i,ev))
            walk(tr.get("effects"), cid, "%s.t%d"%(path,i), flags, errors, warns)

    for f in files:
        d = json.load(io.open(f, encoding='utf-8'))
        pid = d.get("pathwayId", os.path.basename(f))
        errors, warns = [], []
        cards = d.get("cards", [])
        total_cards += len(cards)
        if pid in expect and len(cards) != expect[pid]:
            errors.append("card count %d != manifest %d" % (len(cards), expect[pid]))
        ids = set()
        for c in cards:
            cid = c.get("id","?")
            if cid in ids: errors.append("dup id %s"%cid)
            ids.add(cid)
            flags = c.get("frameworkFlags") or []
            for fld in ("id","name","kind","sequence","sequenceName","rarity","axis","lore","flavor","describe","effects"):
                if fld not in c: errors.append("%s: missing %s"%(cid,fld))
            if "rarity" in c and "sequence" in c and c["rarity"] != RARITY_BY_SEQ(c["sequence"]):
                errors.append("%s: rarity mismatch (seq %s, %s)"%(cid,c["sequence"],c["rarity"]))
            if c.get("kind")=="active":
                if "cost" not in c or "reach" not in c or "target" not in c:
                    errors.append("%s: active incomplete"%cid)
                elif c["reach"] not in REACH: errors.append("%s: bad reach"%cid)
                fs = (c.get("target") or {}).get("fallbackSort")
                if fs and fs not in SORTS:
                    if flags: warns.append("%s: nonstandard fallbackSort %s (flagged)"%(cid,fs))
                    else: errors.append("%s: bad fallbackSort %s"%(cid,fs))
                if (c.get("target") or {}).get("selectionMode")=="manual" and not fs:
                    warns.append("%s: manual but fallbackSort null"%cid)
            elif c.get("kind")=="passive":
                if c.get("hook") not in EVENTS: errors.append("%s: bad hook %s"%(cid,c.get("hook")))
            else: errors.append("%s: bad kind"%cid)
            walk(c.get("effects"), cid, "eff", flags, errors, warns)
            for t in (c.get("upgradeLadder") or {}).get("tiers",[]): walk(t.get("effects"), cid, "lad", flags, errors, warns)
            for v in c.get("variants") or []: walk(v.get("effects"), cid, "var", flags, errors, warns)
            trigs(c.get("triggers"), cid, "card", flags, errors, warns)
            for sd in c.get("statusDefs") or []:
                for cat in sd.get("category",[]) or []:
                    if cat not in CATS: errors.append("%s sd %s: bad category %s"%(cid,sd.get("id"),cat))
                walk(sd.get("effects"), cid, "sd:"+sd.get("id","?"), flags, errors, warns)
                trigs(sd.get("triggers"), cid, "sd:"+sd.get("id","?"), flags, errors, warns)
            if c.get("domainDef"): trigs(c["domainDef"].get("triggers"), cid, "dd", flags, errors, warns)
            flat = json.dumps(c.get("effects",[]), ensure_ascii=False)
            if ('"domain"' in flat or '"translocate"' in flat) and '"lost"' not in flat:
                errors.append("%s: domain/translocate without lost rent"%cid)
        for e in errors: print("  E:", pid, e)
        for w in warns: print("  W:", pid, w)
        errors_all += [pid+": "+e for e in errors]
        warns_all += warns

    print("-"*60)
    print("TOTAL cards:", total_cards, "| errors:", len(errors_all), "| warns:", len(warns_all))
    return 1 if errors_all else 0

if __name__ == "__main__":
    sys.exit(main())
