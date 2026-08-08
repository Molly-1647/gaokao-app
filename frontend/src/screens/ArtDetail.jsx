import React from 'react';
import { C } from '../design/tokens.js';
import { TopBar } from '../components/TopBar.jsx';
import { Card } from '../components/Card.jsx';
import { Section } from '../components/Section.jsx';
import { RiskRow } from '../components/RiskRow.jsx';
import { PrimaryBtn } from '../components/PrimaryBtn.jsx';

export function ArtDetail({ back, item }) {
  if (!item) return null;
  const s = item;
  const ratio = s.ratio || [40, 60];
  const ratioTxt = ratio[0] + ':' + ratio[1];
  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <TopBar title={s.school} sub={(s.tier || []).join(' · ')} onBack={back} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 8px' }}>
        <Card style={{ marginBottom: 14, background: 'linear-gradient(135deg,#FFF3DF,#FDEAF0)', border: '1px solid #f3d9c2' }}>
          <div style={{ fontSize: 12, color: C.sub }}>综合分（示意）</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: C.sunDeep, fontFamily: 'Noto Serif SC, serif', lineHeight: 1.1 }}>{s.comp}</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>折算公式：综合分 = 文化×{ratio[0]}% + 专业×2.5×{ratio[1]}%（比例 {ratioTxt}）</div>
          <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginTop: 8 }}>● {s.hit} · 录取综合分约 {s.line}</div>
          {s.cert && <div style={{ fontSize: 12, color: '#C2557A', fontWeight: 600, marginTop: 6 }}>校考优先匹配（持该校合格证）</div>}
        </Card>
        <Section title="双线控制（advisory）">
          <RiskRow icon={s.doublePass ? '✓' : '✗'} t="文化线 + 专业线" d={s.doublePass ? '双线达标，可参与排序（示意）。' : '双线未同时达标，实际不计入推荐。请以省考试院控制线为准。'} />
        </Section>
        <Section title="专业强对应" accent>
          <p style={{ fontSize: 13, color: '#4a463f', lineHeight: 1.75, margin: 0 }}>该专业属于「{s.cls}」，与你的特长大类强对应（跨类硬性拦截），避免误报不对口专业。</p>
        </Section>
        <Section title="风险与提示" warn>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#FFF6EE', border: '1px solid #FBE0C4', borderRadius: 12, padding: '11px 13px' }}>
            <span style={{ fontSize: 15 }}>⚠️</span>
            <span style={{ fontSize: 12.5, color: '#9a5a1e', lineHeight: 1.65 }}>综合分折算比例、文化/专业控制线、录取综合分均为演示示意，非真实数据；校考/统考批次规则以省考试院与院校章程当年公布为准。</span>
          </div>
        </Section>
      </div>
      <div style={{ padding: '12px 18px 18px', borderTop: '1px solid ' + C.line, background: '#fff' }}>
        <PrimaryBtn full onClick={() => {}}>解锁深度版 / 追问迭代 ›</PrimaryBtn>
      </div>
    </div>
  );
}

export default ArtDetail;
