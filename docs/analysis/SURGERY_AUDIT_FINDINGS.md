# 骨架手术收官轮 · 逐张卡审计结论（2026-10-03）

> 审计对象：`docs/tools/surgery_engine.py` 收官轮对 657 张通用骨架卡的批量换形（lawyer/supplicant 为试点轮手工，未走配方引擎）。
> 审计脚本：`docs/tools/audit_surgery.py` → `docs/analysis/surgery_audit.html`（可筛选逐张卡表）+ `surgery_audit.json`。

## 〇、修复状态（2026-10-03 已修，四门禁全绿）

第二节提出的「确认级 BUG：warrior/hunter target_override 误植」已修复，脚本 `docs/tools/fix_warrior_hunter.py`：

| 途径 | 误植节点 | 修复后签名段 | 张数 |
|---|---|---|---|
| warrior | `target_override(anchor=self)` 注入到打敌人的进攻卡 → 战士打自己 | `modify_targetability(target=self, untargetable=true, direction=enemy_targeted, duration=3)` **嘲讽（替承真义：把指向同伴的攻击揽到自己身上，本卡伤害仍正常落敌）** | 16 |
| hunter | `target_override(anchor=self_faction_hp_desc / incited)` 注入到伤害卡 → 误伤己方（友军最高血 / 同阵营最高血） | `modify_rule_slot(slot=1, field=punish, mode=append, value=友军分润 1 能量)` **团队计价（集众记账，不再误伤友军）** | 20 |

- 保留不动（良性改指，非 BUG）：hunter 的 `target_override(anchor=taunt_source / first_empty)` 共 10 张——指向敌人 / 空位，不造成自伤或误伤友军。
- 验证：`validate.py` 0 错 / `validate_schema.py` 22 文件 0 错 / `check_enum_sync.py` OK / `check_glossary.py` 0 缺词条。
- 重跑 `audit_surgery.py` 后 `OFFENSIVE_REDIRECT` 标记归零（报告已标「已修复」）。
- 已知限制（非正确性）：hunter 的 `modify_rule_slot` 团队计价依赖战场 rule slot 1 的 punish 触发器，若同场无律师/仲裁人写入触发器则该分润可能不触发——属后续「逐轴深化」轮的待办，不影响门禁与当前正确性。

## 一、批量修改方式是否合理？

**结论：作为「机械去同质化」手段合理，但作为「各轴独立玩法」手段不达标。**

| 维度 | 评价 | 说明 |
|---|---|---|
| 自动化/可重放 | ✅ 好 | 配方引擎按「筛卡→判角色→注签名段→补 describe→conversionNotes 留痕」四步，确定性、可溯源；四门禁已全绿。 |
| 命中问题根因 | ✅ 好 | 只改 77% 的纯通用骨架卡（数值不动），不动轴身份卡；用低频/闲置原语（transfer_status/take_control/set_luminance/restore_snapshot/echo_last_skill/grant_immunity）拉升指纹距离——这正是同质化根源。 |
| 角色判定 | ⚠️ 机械 | `role_of()` 只看卡上「含哪种原语」判 dmg/debuff/buff/heal/dispel/stat/res，**不读卡面叙事**。注入段按角色盲贴，与原卡具体主题无关。 |
| 各轴分化 | ❌ 坍塌 | 6 条途径（apothecary/criminal/monster/pryer/reader/savant）的 buff/stat/res **三段完全相同**（注入同一签名段），即「buff 卡＝stat 卡＝res 卡」。全库仅 4–7 种不同注入段/途径，远未到「各轴有独立玩法」。 |
| 功能改动 | ⚠️ 越界 | 引擎自称「只改形状不改数值」，但部分配方改了**卡的作用对象/新增资源税**，属功能改动，见下。 |

> 注：设计文档 §二·五 已把目标收敛为「每途径一个骨架形状」，所以坍塌符合当前 spec；但相对你最初「各途径各轴有自身玩法」的诉求，这是已知的范围降级，需在平衡期补「逐轴深化」轮次。

## 二、改完语义/机制是否符合原著？

**结论：途径层 fidelity 好；个别途径的进攻卡出现确认级 BUG。**

### ✅ 贴合原著（抽样核对 OK）
- 收尸人 `reveal` 灵视、击杀 `spawn(killed_unit)` 役使 → 亡者之语/冥界 ✔
- 偷盗者 `transfer_status` 借增益、`take_control` 借身 → 夺取顶替 ✔
- 怪物 `restore_snapshot` 命运轮盘、`chance` 仅用于非伤害维度（符合 R1–R6）✔
- 歌颂者 `set_luminance(8)` 白昼对极、`grant_immunity` 净化不走裸 dispel → 太阳/公证 ✔
- 不眠者 `set_luminance(2)` 暗夜主场 ✔｜ 占卜家 `modify_rule_slot` 嫁接 ✔｜ 刺客/学徒 镜中/门位移 ✔

### ❌ 确认级 BUG：warrior / hunter 的 target_override 重定向
`target_override`（SCHEMA §5.2，效果级选靶锚点）被当成「替承/指挥」机制贴到**进攻卡**上，导致：
- **warrior 11 张 dmg + 4 张 debuff**：注入 `target_override(anchor=self)`。原卡 `target.faction=enemy`（打敌人），注入后效果指向自身 → 战士**打自己**（如 `格斗术·连击` 描述却写「替承：这一击改落到守者身上」）。设计意图是「替友军承伤」，但引擎语义是把**本卡自己的攻击**重定向到自身，方向反了。
- **hunter 10 张 dmg + 4 张 debuff**：注入 `target_override(anchor=self_faction_hp_desc, sort=hp_desc)` → 猎人的伤害**打向己方血最厚的友军**（误伤友军，如 `扑杀`/`炽白之枪` 描述写「改指友军中血最厚者」）。

两种结局都坏：若引擎对「后挂的 target_override」回溯生效 → 自伤/误伤；若不回溯 → describe 文本与机制不符（对玩家说谎）。**无论哪种都必须修**。

> 修复方向（建议）：把「替承/指挥」改成真正防御语义——例如 warrior 用 `modify_targetability`/`grant_immunity` 或 `damageTransfer` 把**指向友军的伤害**揽过来（而非重定向本卡攻击）；hunter 的「指挥调防」应作用于**敌方/友军单位的攻击指向**，不要动本卡自身的伤害锚点。最小改动：把这两家的 dmg/debuff 段从 `over(self/self_faction_hp_desc)` 换回纯 flavor 或正确的防御原语。

### ⚠️ 平衡项（非正确性，平衡期评估）
- **迷失通胀税**：prisoner(16) / assassin(11) / apprentice(11) 在 buff/stat/res/dispel 段批量 `modify_resource(lost,+1)`。原著「用非凡力量抬升失控」成立，但每卡必 +1 且未调参，满 build 易快速失控，需在平衡期按途径设上限或阶梯。
- **spectator 兜底写入**：5 张 heal/dispel/dmg 卡因无敌方 debuff 而落到 `write_rule_slot(trigger:rank_gap>=2)`——给治疗/驱散卡硬塞一条规则槽，语义牵强（已标记 `SPECTATOR_FALLBACK_WRITESLOT`）。

## 三、逐张卡核对入口
见 `docs/analysis/surgery_audit.html`：可按途径/角色/风险标记筛选，查看每张卡的「原卡原语 / 注入签名段 / 卡面选靶 / 玩家可读描述」。红底＝已标记风险卡。

## 四、建议下一步
1. **立即修**：warrior + hunter 的 `target_override` 重定向（确认级 bug，影响 29 张进攻卡）。
2. **平衡期**：迷失通胀税调参；spectator 兜底段改写。
3. **深化轮（后续）**：针对 buff/stat/res 坍塌的 6 途径，补充「逐轴差异化」配方，把单一骨架形状拆成真正按轴的玩法。
