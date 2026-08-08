import React, { useState } from 'react';
import { C } from '../design/tokens.js';
import { TopBar } from '../components/TopBar.jsx';
import { Card } from '../components/Card.jsx';
import { PrimaryBtn } from '../components/PrimaryBtn.jsx';
import { QUIZ } from '../engine/interest.js';

export function Assessment({ go, back, data, set }) {
  const [ans, setAns] = useState(data.quiz || []);
  const choose = (qi, ai) => { const n = [...ans]; n[qi] = ai; setAns(n); };
  const done = ans.filter((x) => x != null).length;
  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="兴趣能力测评" sub="第 3 步 · 5 分钟发现适配方向（可跳过）" onBack={back} step={2} total={5} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 8px' }}>
        <div style={{ background: 'linear-gradient(135deg,#FFF3DF,#EAF3FE)', borderRadius: 16, padding: '14px 16px', marginBottom: 14, border: '1px solid #f0e2cc' }}>
          <div style={{ fontSize: 13, color: C.ink, fontWeight: 600 }}>霍兰德式短测评</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.6 }}>基于 Holland 兴趣理论（R/I/A/S/E/C）。完成可解锁「适配度雷达」与「决策解释」，跳过也不影响生成方案。</div>
        </div>
        {QUIZ.map((item, qi) => (
          <Card key={qi} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 10 }}>{qi + 1}. {item.q}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {item.a.map((opt, ai) => (
                <div key={ai} className="tap" onClick={() => choose(qi, ai)} style={{ padding: '11px 14px', borderRadius: 12, fontSize: 13.5, border: '1.5px solid ' + (ans[qi] === ai ? C.sun : 'rgba(43,41,38,0.12)'), background: ans[qi] === ai ? '#FFF1E2' : '#fff', color: ans[qi] === ai ? C.sunDeep : C.ink }}>
                  {ans[qi] === ai ? '● ' : '○ '}{opt}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div style={{ padding: '12px 18px 18px', borderTop: '1px solid ' + C.line, background: '#fff' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="tap" onClick={() => { set({ ...data, quiz: ans, skipped: true }); go('majorfit'); }} style={{ flex: '0 0 84px', textAlign: 'center', padding: '15px 0', borderRadius: 16, border: '1.5px solid rgba(43,41,38,0.14)', color: C.sub, fontWeight: 600, fontSize: 14 }}>跳过</div>
          <div style={{ flex: 1 }}>
            <PrimaryBtn full disabled={done < QUIZ.length} onClick={() => { set({ ...data, quiz: ans, skipped: false }); go('majorfit'); }}>完成测评 · 下一步 ›</PrimaryBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Assessment;
