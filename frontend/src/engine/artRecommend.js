// 特长生（艺体类）推荐引擎（演示示意，非真实录取数据）。
// 逻辑与交互原型完全一致。
export const ART_LINE = { culture: 350, art: 180 }; // 文化控制线 / 专业合格线（示意：文化满分750·专业满分300）
export const ART_RATIO = { '广东': [40, 60], '浙江': [50, 50], '山东': [30, 70], '河南': [40, 60], '四川': [50, 50], '江苏': [40, 60] };
export const ART_CLASS = {
  '美术类': ['美术学类', '设计学类'],
  '音乐类': ['音乐与舞蹈学类'],
  '舞蹈类': ['音乐与舞蹈学类'],
  '播音与主持类': ['播音与主持类'],
  '服装表演(模特)类': ['表演类', '服装相关'],
  '体育类': ['体育学类'],
};
export const ART_SCHOOLS = [
  { type: '美术类', school: '中国美术学院', cls: '美术学类', line: 640, tier: ['顶尖', '双一流'] },
  { type: '美术类', school: '中央美术学院', cls: '美术学类', line: 650, tier: ['顶尖', '双一流'] },
  { type: '美术类', school: '广州美术学院', cls: '设计学类', line: 570, tier: ['公办'] },
  { type: '美术类', school: '四川美术学院', cls: '设计学类', line: 560, tier: ['公办'] },
  { type: '美术类', school: '南京艺术学院', cls: '美术学类', line: 580, tier: ['公办', '省重点'] },
  { type: '音乐类', school: '中央音乐学院', cls: '音乐与舞蹈学类', line: 630, tier: ['顶尖', '211'] },
  { type: '音乐类', school: '上海音乐学院', cls: '音乐与舞蹈学类', line: 620, tier: ['公办', '双一流'] },
  { type: '音乐类', school: '四川音乐学院', cls: '音乐与舞蹈学类', line: 540, tier: ['公办'] },
  { type: '舞蹈类', school: '北京舞蹈学院', cls: '音乐与舞蹈学类', line: 590, tier: ['公办', '特色'] },
  { type: '播音与主持类', school: '中国传媒大学', cls: '播音与主持类', line: 610, tier: ['211', '双一流'] },
  { type: '服装表演(模特)类', school: '北京服装学院', cls: '表演类', line: 555, tier: ['公办'] },
  { type: '服装表演(模特)类', school: '东华大学', cls: '服装相关', line: 600, tier: ['211', '双一流'] },
  { type: '体育类', school: '北京体育大学', cls: '体育学类', line: 600, tier: ['211', '双一流'] },
  { type: '体育类', school: '上海体育大学', cls: '体育学类', line: 560, tier: ['公办'] },
];

export function artComposite(culture, art, ratio) {
  const [a, b] = ratio;
  const c = Number(culture) || 0, s = Number(art) || 0;
  return Math.round(c * (a / 100) + s * 2.5 * (b / 100));
}

export function artRecommend(d) {
  const types = d.artType || [];
  if (!types.length) return { sprint: [], stable: [], safe: [], base: null, doublePass: false };
  const ratio = d.artRatio || ART_RATIO[d.province] || [40, 60];
  const comp = artComposite(d.score, d.artScore, ratio);
  const culturePass = (Number(d.score) || 0) >= ART_LINE.culture;
  const artPass = (Number(d.artScore) || 0) >= ART_LINE.art;
  const doublePass = culturePass && artPass;
  const certSchools = new Set((d.artCert || []).map((c) => c.school));
  const pool = ART_SCHOOLS.filter((s) => types.includes(s.type));
  const buckets = { sprint: [], stable: [], safe: [] };
  pool.forEach((s) => {
    const r = comp / s.line;
    let key;
    if (r >= 1.04) key = 'safe'; else if (r >= 0.96) key = 'stable'; else key = 'sprint';
    const match = clamp(r < 0.96 ? 78 + 10 * Math.min(1, (0.96 - r) / 0.2) : r < 1.04 ? 90 - 8 * Math.abs(r - 1) / 0.05 : 95 - 8 * Math.min(1, (r - 1.04) / 0.3));
    const isCert = certSchools.has(s.school);
    buckets[key].push({ ...s, id: s.school + '|' + key, tierKey: key, match, comp: Math.round(comp), line: s.line, hit: key === 'sprint' ? '冲刺' : key === 'stable' ? '稳妥' : '保底', ratio, doublePass, cert: isCert, group: '录取综合分约 ' + s.line + ' · ' + s.cls });
  });
  Object.keys(buckets).forEach((k) => buckets[k].sort((a, b) => (b.cert ? 1 : 0) - (a.cert ? 1 : 0) || b.match - a.match));
  const limits = { sprint: 3, stable: 4, safe: 3 };
  Object.keys(buckets).forEach((k) => buckets[k] = buckets[k].slice(0, limits[k]));
  return { sprint: buckets.sprint, stable: buckets.stable, safe: buckets.safe, base: { province: d.province, comp: Math.round(comp), ratio, doublePass, culture: Number(d.score) || 0, art: Number(d.artScore) || 0, cultureType: d.artCultureType }, doublePass };
}

function clamp(v, a = 50, b = 99) { return Math.max(a, Math.min(b, Math.round(v))); }
