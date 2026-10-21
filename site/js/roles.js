// 卡角色口径（SCORING.md §一·附，2.12 立）。站点只做展示，角色判定在 score.py / validate.py。
// 六值固定顺序用于所有角色条/热图列：顺序本身是配比语义（core 承重 → … → tech 对策），
// 不要按用量重排，否则同一张图在不同途径下读法会变。
export const ROLE_ORDER = ['core', 'starter', 'bridge', 'generic', 'trap', 'tech'];

export const ROLE_INFO = {
  core: { label: '承重', full: '轴循环承重件', desc: '命中身份动作（挂锚点状态 / 读写锚点通道 / 签名键载体 / 被 enablers·payoffs 登记 / 写本途径跨系枢纽）' },
  starter: { label: '入门', full: '低序列教学卡', desc: '低序列（common）教学卡，starter↔starter 近重复对豁免去重惩罚' },
  bridge: { label: '桥接', full: '跨轴/跨系连接', desc: '读本途径他轴私有状态/facet，或读他途径枢纽/耦合通道' },
  generic: { label: '泛用', full: '泛用骨架 + 刻意补位', desc: '不入途径间指纹向量；不得被 axes 登记、不得携带签名键、不得旗舰' },
  trap: { label: '赌博', full: 'core 同族的赌博变体', desc: '须命中身份动作且带风险段（chance / 失败分支 / 自伤）' },
  tech: { label: '对策', full: '对策卡', desc: '驱散 / 反制 / 针对 filter 的语义对策卡' },
  flagship: { label: '旗舰', full: '旗舰（独立 bool，不是 role）', desc: '旗舰不并入 role；卡位须 ⊆ core ∪ trap' },
};

export const ROLE_LABEL = Object.fromEntries(
  [...ROLE_ORDER, 'flagship'].map((r) => [r, ROLE_INFO[r].label]),
);

export const roleFull = (r) => ROLE_INFO[r]?.full || r;
export const roleDesc = (r) => ROLE_INFO[r]?.desc || '';
