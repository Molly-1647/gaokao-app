import React from 'react';
import { C, serif } from '../design/tokens.js';
import { TopBar } from '../components/TopBar.jsx';
import { Card } from '../components/Card.jsx';
import { PrimaryBtn } from '../components/PrimaryBtn.jsx';
import { HOLLAND, recommendMajors } from '../engine/interest.js';

export function MajorFit({ go, back, data }) {
  const { hp, picks } = recommendMajors(data.quiz, data.likeMajors, data.dislikeMajors);
  const profileShort = hp.top.length ? hp.top.map((t) => HOLLAND[t].short).join(' + ') : '未测评';
  const interestSentence = hp.top.length
    ? hp.top.map((t) => HOLLAND[t].desc).join(' ')
    : '你跳过了测评，以下仅依据你在第 2 步填写的专业偏好推荐。';
  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="为你推荐的专业方向" sub="第 4 步 · 基于你的兴趣画像" onBack={back} step={3} total={5} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 8px' }}>
        <Card style={{ marginBottom: 14, background: 'linear-gradient(135deg,#FFF3DF,#EAF3FE)', border: '1px solid #f0e2cc' }}>
          <div style={{ fontSize: 13, color: C.sub }}>你的兴趣画像（霍兰德式）</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginTop: 4 }}>{profileShort}</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 6, lineHeight: 1.7 }}>{interestSentence}</div>
        </Card>
        <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>适配专业方向（示意 · 兴趣代码 → 职业理论映射）</div>
        {picks.length === 0 && <Card style={{ marginBottom: 14, color: C.sub, textAlign: 'center' }}>暂无匹配方向，可返回补充专业偏好或完成测评。</Card>}
        {picks.map((m) => (
          <Card key={m.name} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>{m.name}</div>
              <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: '#FFF1E2', color: C.sunDeep, fontWeight: 600 }}>{HOLLAND[m.from].short}</span>
            </div>
            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 8, lineHeight: 1.75 }}>
              <div>· 培养方向：{m.train}</div>
              <div>· 就业面向：{m.employ}</div>
              <div>· 长期路径：{m.path}</div>
            </div>
            <div style={{ fontSize: 12, color: C.ink, marginTop: 8, lineHeight: 1.65, background: '#FBF6EF', border: '1px solid #f0e6d6', borderRadius: 10, padding: '8px 11px' }}>
              适配理由：你偏 {profileShort}，{m.name}（{m.train}）与你的倾向契合；就业面向 {m.employ}，呼应你的长远规划。
            </div>
          </Card>
        ))}
        <div style={{ fontSize: 10.5, color: C.muted, background: '#FBF6EF', border: '1px solid #f0e6d6', borderRadius: 12, padding: '8px 12px', marginBottom: 14, lineHeight: 1.6 }}>
          ※ 以上专业方向为「兴趣代码 → 职业理论映射」的演示示意，非真实 RAG / 大模型结论；具体选科要求与就业以官方为准。
        </div>
      </div>
      <div style={{ padding: '12px 18px 18px', borderTop: '1px solid ' + C.line, background: '#fff' }}>
        <PrimaryBtn full onClick={() => go('wiz4')}>下一步 · 确认生成 ›</PrimaryBtn>
      </div>
    </div>
  );
}

export default MajorFit;
