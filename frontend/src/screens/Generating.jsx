import React, { useState, useEffect } from 'react';
import { C, serif } from '../design/tokens.js';

export function Generating({ onDone }) {
  const [p, setP] = useState(0);
  const [stage, setStage] = useState(0);
  const stages = ['正在解读你的兴趣与能力画像…', '正在检索专业 · 就业 · 产业知识库（RAG）…', '正在匹配冲刺 / 稳妥 / 保底梯度…', '正在生成可解释决策方案…'];
  useEffect(() => { const t = setInterval(() => setP((prev) => (prev >= 100 ? 100 : prev + Math.random() * 9 + 4)), 320); return () => clearInterval(t); }, []);
  useEffect(() => { setStage(Math.min(stages.length - 1, Math.floor(p / 25))); }, [p]);
  useEffect(() => { if (p >= 100) { const t = setTimeout(onDone, 750); return () => clearTimeout(t); } }, [p]);

  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: 'linear-gradient(180deg,#FFF6EC,#FFFDF9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 36px', textAlign: 'center' }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ marginBottom: 24 }}>
        <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(244,114,43,0.15)" strokeWidth="8" />
        <circle cx="60" cy="60" r="46" fill="none" stroke="url(#pg)" strokeWidth="8" strokeLinecap="round" strokeDasharray={2 * Math.PI * 46} strokeDashoffset={2 * Math.PI * 46 * (1 - p / 100)} transform="rotate(-90 60 60)" />
        <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFC15A" /><stop offset="100%" stopColor="#3E95ED" /></linearGradient></defs>
        <text x="60" y="66" fontSize="22" fontWeight="700" fill="#F4722B" textAnchor="middle" fontFamily="'Noto Sans SC'">{Math.round(p)}</text>
      </svg>
      <div style={{ ...serif, fontSize: 20, fontWeight: 700, color: C.ink }}>方案生成中</div>
      <div style={{ fontSize: 13.5, color: C.sub, marginTop: 12, height: 20 }}>{stages[stage]}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 22 }}>
        {stages.map((_, i) => (<div key={i} style={{ width: 26, height: 4, borderRadius: 999, background: i <= stage ? C.sunGrad : 'rgba(43,41,38,0.12)' }} />))}
      </div>
    </div>
  );
}

export default Generating;
