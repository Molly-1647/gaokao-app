// 真实推荐引擎（基于 gaokao-db.js 的 2025 各省位次）。
// 逻辑与交互原型完全一致；仅将 window.GK_DB 的读取收口为 db()，
// 以便浏览器（window.GK_DB）与 node 自测（globalThis.GK_DB）都能用。
export function db() {
  if (typeof window !== 'undefined' && window.GK_DB) return window.GK_DB;
  if (typeof globalThis !== 'undefined' && globalThis.GK_DB) return globalThis.GK_DB;
  return null;
}

// 位次语义：数值越小 = 学校越好。以用户位次为锚，按比值分冲/稳/保。
export const TIER_LABEL = { '985': '985', '211': '211', '双一流': '双一流', '双非': '双非强校', '行业特色': '行业特色' };
export const clamp = (v, a = 50, b = 99) => Math.max(a, Math.min(b, Math.round(v)));

export function calcMatch(key, r) {
  let m;
  if (key === 'sprint') m = 70 + 15 * Math.min(1, r / 0.9);          // 70→85
  else if (key === 'stable') m = 96 - 8 * Math.abs(r - 1) / 0.1;        // 88↔96
  else m = 98 - 8 * Math.min(1, (r - 1.1) / 0.5);                     // 90↔98
  return clamp(m);
}

export function sortKey(item, userRank, weights) {
  const r = item.rank / userRank;
  const closeness = Math.abs(Math.log(r));
  let bias = 0;
  const w = weights || { major: 34, school: 33, city: 33 };
  if (w.school >= w.city && (item.tier === '985' || item.tier === '211')) bias -= 0.03;
  if (w.city > w.school && (item.tier === '行业特色' || item.tier === '双非' || item.tier === '双一流')) bias -= 0.03;
  return closeness + bias;
}

// 本地推荐引擎（备用）
export function recommendLocal(province, userRank, weights) {
  userRank = parseInt(userRank, 10);
  if (!db() || !province || !userRank) return { sprint: [], stable: [], safe: [], base: null };
  const list = (db().schools[province] || []).filter((s) => s.rank && s.rank > 0);
  const buckets = { sprint: [], stable: [], safe: [] };
  list.forEach((s) => {
    const r = s.rank / userRank;
    let key;
    if (r < 0.9) key = 'sprint';
    else if (r <= 1.1) key = 'stable';
    else key = 'safe';
    const match = calcMatch(key, r);
    const tags = [TIER_LABEL[s.tier] || s.tier];
    if (s.industry) tags.push(s.industry);
    buckets[key].push({
      ...s, id: s.school + '|' + key + '|' + (s.note || ''), tierKey: key, match, hit: key === 'sprint' ? '冲刺' : key === 'stable' ? '稳妥' : '保底',
      tier: tags, group: `最低 ${s.score || '—'} 分 · 位次约 ${s.rank.toLocaleString()}`,
    });
  });
  const limits = { sprint: 3, stable: 4, safe: 3 };
  Object.keys(buckets).forEach((k) => {
    buckets[k].sort((a, b) => sortKey(a, userRank, weights) - sortKey(b, userRank, weights));
    const seen = new Set();
    buckets[k] = buckets[k]
      .filter((it) => { if (seen.has(it.school)) return false; seen.add(it.school); return true; })
      .slice(0, limits[k]);
  });
  return { sprint: buckets.sprint, stable: buckets.stable, safe: buckets.safe, base: { province, rank: userRank, weights } };
}

// 远程API推荐引擎（优先）
export async function recommendRemote(province, userRank, weights, score) {
  try {
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ province, rank: userRank, weights, score }),
    });
    const result = await response.json();
    
    // 为返回的数据添加id字段（保持与本地推荐一致）
    ['sprint', 'stable', 'safe'].forEach(key => {
      result[key] = (result[key] || []).map(item => ({
        ...item,
        id: `${item.school}|${key}|${item.note || ''}`
      }));
    });
    
    return result;
  } catch (error) {
    console.error('后端推荐请求失败，使用本地推荐:', error);
    return recommendLocal(province, userRank, weights);
  }
}

// 生成完整方案（调用后端API）
export async function generatePlan(data) {
  try {
    const response = await fetch('/api/generate_plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    // 添加id字段
    ['sprint', 'stable', 'safe'].forEach(key => {
      result[key] = (result[key] || []).map(item => ({
        ...item,
        id: `${item.school}|${key}|${item.note || ''}`
      }));
    });
    
    return result;
  } catch (error) {
    console.error('生成方案请求失败:', error);
    return recommendLocal(data.province, data.rank, data.weights);
  }
}

// 默认推荐函数（优先使用远程API）
export async function recommend(province, userRank, weights, score) {
  return recommendRemote(province, userRank, weights, score);
}

export const EMPTY_PLAN = { sprint: [], stable: [], safe: [], base: null };
export function getPlan(planData, data) {
  if (planData && (planData.sprint.length || planData.stable.length || planData.safe.length || planData.base)) return planData;
  if (data && data.province && data.rank) return recommendLocal(data.province, data.rank, data.weights);
  return EMPTY_PLAN;
}
