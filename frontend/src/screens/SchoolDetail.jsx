import React from 'react';
import { C } from '../design/tokens.js';
import { TopBar } from '../components/TopBar.jsx';
import { Card } from '../components/Card.jsx';
import { Section } from '../components/Section.jsx';
import { PrimaryBtn } from '../components/PrimaryBtn.jsx';
import { RadarChart } from '../components/RadarChart.jsx';
import { TIER_LABEL, clamp } from '../engine/recommend.js';
import { hollandFromQuiz, HOLLAND } from '../engine/interest.js';
import { findPlanDetail, RADAR_LABELS } from '../data/demoPlan.js';

export function SchoolDetail({ back, item, ctx }) {
  if (!item) return null;
  const s = item;
  const w = (ctx && ctx.weights) || { major: 34, school: 33, city: 33 };
  const prov = (ctx && ctx.province) || '—';
  const hp = hollandFromQuiz(ctx && ctx.quiz);
  const interestFit = (() => {
    if (!hp.top.length) return 0;
    const research = hp.top.includes('I') || hp.top.includes('A');
    const practical = hp.top.includes('R') || hp.top.includes('E');
    let f = 0;
    if (research && (s.tier.includes('985') || s.tier.includes('211') || s.tier.includes('双一流'))) f += 6;
    if (practical && (s.tier.includes('行业特色') || s.tier.includes('双非'))) f += 6;
    return f;
  })();
  const tierDesc = TIER_LABEL[s.tier && s.tier[0]] || (s.tier && s.tier[0]) || '本科';

  // 组合 recommend() 校列表 与 PLAN 演示详情（reason/rag/employ/risk/radar 来自 demoPlan）。
  const pd = findPlanDetail(s.school);
  const radar = pd ? pd.radar : [clamp(s.match - 3 + interestFit), clamp(s.match - 7), clamp(s.match + 1), clamp(s.match - 4), clamp(s.match - 9)];
  const employTxt = ({
    '985': '顶尖平台 + 深造 / 名企通道，升学与就业双优。',
    '211': '行业认可度高，就业面向稳定宽广。',
    '双一流': '学科特色鲜明，在特定领域就业竞争力强。',
    '双非': '区域产业契合度高，本地就业口碑扎实。',
    '行业特色': '对口行业（电网 / 铁路 / 师范 / 医学等）就业通道明确。',
  })[s.tier && s.tier[0]] || '就业面向以该校优势学科为主。';
  const interestNote = hp.top.length ? `你的兴趣画像为 ${hp.top.map((t) => HOLLAND[t].name).join(' + ')}，` : '';
  const likeList = (ctx && ctx.likeMajors && ctx.likeMajors.length) ? ctx.likeMajors : [];
  const likeNote = likeList.length ? `你标注感兴趣的方向含「${likeList.join('、')}」，可优先在该校对应专业组中关注。` : '';
  const reason = `「${s.school}」属于${tierDesc}${s.industry ? ('（' + s.industry + '）') : ''}。在${prov} 2025 年最低录取位次约 ${s.rank.toLocaleString()}（对应分数约 ${s.score || '—'} 分）。结合你的权重（保专业 ${w.major}% / 保学校 ${w.school}% / 冲城市 ${w.city}%），该校适合作为「${s.hit}」档候选。${interestNote}${likeNote}`;

  const finalReason = pd ? pd.reason : reason;
  const finalEmploy = pd ? pd.employ : employTxt;
  const ragBadges = pd && pd.rag ? pd.rag : ['示例来源 · 非真实 RAG', '各省教育考试院投档线（2025）'];

  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <TopBar title={s.school} sub={(s.tier || []).join(' · ') + (s.industry ? (' · ' + s.industry) : '')} onBack={back} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 8px' }}>
        <Card style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
          <RadarChart values={radar} labels={RADAR_LABELS} size={172} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.sub }}>综合适配度（示意）</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: C.sunDeep, fontFamily: 'Noto Serif SC, serif', lineHeight: 1.1 }}>{s.match}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {(s.tier || []).map((t) => <span key={t} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, background: '#F4F8FD', color: C.sky, fontWeight: 600 }}>{t}</span>)}
            </div>
            <div style={{ fontSize: 11, color: C.green, fontWeight: 600, marginTop: 8 }}>● {s.hit} · 位次约 {s.rank.toLocaleString()}</div>
            {hp.top.length > 0 && <div style={{ fontSize: 11, color: C.sunDeep, fontWeight: 600, marginTop: 6 }}>兴趣画像：{hp.top.map((t) => HOLLAND[t].short).join(' + ')}</div>}
          </div>
        </Card>

        <Section title="推荐理由（示意）" accent>
          <p style={{ fontSize: 13, color: '#4a463f', lineHeight: 1.75, margin: 0 }}>{finalReason}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {ragBadges.map((b, i) => <span key={i} style={{ fontSize: 10.5, padding: '4px 9px', borderRadius: 999, background: '#EAF3FE', color: C.sky, fontWeight: 600, border: '1px solid #DCEBFB' }}>{b}</span>)}
          </div>
        </Section>

        <Section title="专业 / 就业前景（示意）">
          <p style={{ fontSize: 13, color: '#4a463f', lineHeight: 1.75, margin: 0 }}>{finalEmploy}</p>
        </Section>

        <Section title="风险提示" warn>
          {pd && pd.risk && (
            <div style={{ fontSize: 12.5, color: '#9a5a1e', lineHeight: 1.65, background: '#FFF6EE', border: '1px solid #FBE0C4', borderRadius: 12, padding: '11px 13px', marginBottom: 10 }}>
              {pd.risk}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#FFF6EE', border: '1px solid #FBE0C4', borderRadius: 12, padding: '11px 13px' }}>
            <span style={{ fontSize: 15 }}>⚠️</span>
            <span style={{ fontSize: 12.5, color: '#9a5a1e', lineHeight: 1.65 }}>本卡适配度与就业说明为演示示意，非真实大模型/RAG 结论。录取位次为 2025 年约数，实际填报请以当年官方数据为准。</span>
          </div>
          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 8 }}>※ 以上为 advisory 提示，非录取保障承诺。</div>
        </Section>
      </div>
      <div style={{ padding: '12px 18px 18px', borderTop: '1px solid ' + C.line, background: '#fff' }}>
        <PrimaryBtn full onClick={() => {}}>解锁深度版 / 追问迭代 ›</PrimaryBtn>
      </div>
    </div>
  );
}

export default SchoolDetail;
