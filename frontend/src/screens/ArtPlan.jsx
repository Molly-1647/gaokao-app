import React from 'react';
import { C } from '../design/tokens.js';
import { TopBar } from '../components/TopBar.jsx';
import { Card } from '../components/Card.jsx';
import { PrimaryBtn } from '../components/PrimaryBtn.jsx';
import { ART_RATIO } from '../engine/artRecommend.js';

function ArtSchoolCard({ s, onOpen }) {
  const tierColor = { sprint: C.sun, stable: C.sky, safe: C.green };
  return (
    <div className="tap" onClick={onOpen} style={{ background: '#fff', borderRadius: 16, padding: 14, border: '1px solid ' + C.line, boxShadow: '0 6px 18px rgba(120,80,30,0.06)', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>{s.school}</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>{s.group}</div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>你的综合分 {s.comp} · 录取线约 {s.line}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: tierColor[s.tierKey], fontFamily: 'Noto Serif SC, serif' }}>{s.match}</div>
          <div style={{ fontSize: 10.5, color: C.muted }}>适配度</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {s.tier.map((t) => <span key={t} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, background: '#F4F8FD', color: C.sky, fontWeight: 600 }}>{t}</span>)}
        <span style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, background: '#FFF1E2', color: C.sunDeep, fontWeight: 600 }}>{s.hit}</span>
        <span style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, background: '#EAFBF0', color: C.green, fontWeight: 600 }}>专业强对应</span>
        {s.cert && <span style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, background: '#FDEAF0', color: '#C2557A', fontWeight: 600 }}>校考优先</span>}
      </div>
    </div>
  );
}

export function ArtPlan({ go, back, onOpen, planData, data }) {
  const plan = planData || { sprint: [], stable: [], safe: [], base: null, doublePass: false };
  const sections = [
    { key: 'sprint', label: '冲刺', desc: '综合分略低于录取线，搏一搏', color: C.sun, items: plan.sprint },
    { key: 'stable', label: '稳妥', desc: '综合分基本持平，主力区间', color: C.sky, items: plan.stable },
    { key: 'safe', label: '保底', desc: '综合分明显高于录取线', color: C.green, items: plan.safe },
  ];
  const base = plan.base || {};
  const ratio = base.ratio || ART_RATIO[data.province] || [40, 60];
  const ratioTxt = ratio[0] + ':' + ratio[1];
  const totalCnt = plan.sprint.length + plan.stable.length + plan.safe.length;
  const dp = plan.doublePass;
  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="特长生志愿方案" sub="综合分 · 冲 / 稳 / 保（双线示意）" onBack={back} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 8px' }}>
        <div style={{ ...(dp ? { background: 'linear-gradient(135deg,#EAFBF0,#EAF3FE)', border: '1px solid #bfe9cf' } : { background: 'linear-gradient(135deg,#FDECEC,#FDEAF0)', border: '1px solid #f3c9c7' }), borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.sub }}>双线体检</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: dp ? C.green : '#D9534F', marginTop: 2 }}>{dp ? '✓ 文化线 + 专业线 双线达标' : '✗ 双线未达标，以下按综合分演示（实际不计入推荐）'}</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>文化 {base.culture != null ? base.culture : '—'}{base.cultureType ? ('（' + base.cultureType + '）') : ''} / 专业 {base.art != null ? base.art : '—'} · 折算比例 {ratioTxt}</div>
        </div>
        <div style={{ fontSize: 10.5, color: C.muted, background: '#FBF6EF', border: '1px solid #f0e6d6', borderRadius: 12, padding: '8px 12px', marginBottom: 14, lineHeight: 1.6 }}>
          综合分折算 / 双线控制 / 专业强对应 / 校考优先均为演示示意，公式与合格线以省考试院当年公布为准。适配度（雷达/评分）非真实 RAG 结论。
        </div>
        {totalCnt === 0 && <Card style={{ marginBottom: 14, textAlign: 'center', color: C.sub }}>暂无匹配院校：请检查特长类型与专业课成绩，或返回调整。</Card>}
        {sections.map((sec) => (
          <div key={sec.key} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: sec.color }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{sec.label}层</span>
              <span style={{ fontSize: 11.5, color: C.sub }}>{sec.desc}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted }}>{sec.items.length} 所</span>
            </div>
            {sec.items.length === 0 ? <div style={{ fontSize: 12.5, color: C.muted, padding: '10px 4px' }}>该档暂无匹配（可调整综合分或权重重试）。</div>
              : sec.items.map((s) => <ArtSchoolCard key={s.id} s={s} onOpen={() => onOpen(s, sec.key)} />)}
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 18px 18px', borderTop: '1px solid ' + C.line, background: '#fff' }}>
        <PrimaryBtn full sky onClick={() => go('welcome')}>返回首页</PrimaryBtn>
      </div>
    </div>
  );
}

export default ArtPlan;
