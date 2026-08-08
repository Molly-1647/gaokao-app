import React from 'react';
import { C, serif } from '../design/tokens.js';

export function Home({ go }) {
  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 30px', textAlign: 'center' }}>
        <svg width="170" height="170" viewBox="0 0 170 170" style={{ marginBottom: 18 }}>
          <g className="sun-rays">
            {Array.from({ length: 12 }).map((_, i) => { const a = i * 30 * Math.PI / 180; const x1 = 85 + 46 * Math.cos(a), y1 = 85 + 46 * Math.sin(a), x2 = 85 + 72 * Math.cos(a), y2 = 85 + 72 * Math.sin(a); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFC15A" strokeWidth="4" strokeLinecap="round" opacity="0.8" />; })}
          </g>
          <circle className="sun-core" cx="85" cy="85" r="44" fill="url(#g)" />
          <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD36B" /><stop offset="100%" stopColor="#F4722B" /></linearGradient></defs>
        </svg>
        <div style={{ ...serif, fontSize: 27, fontWeight: 700, lineHeight: 1.35, color: C.ink }}>
          你的未来，<br />正破晓而出
        </div>
        <div style={{ fontSize: 14, color: C.sub, marginTop: 14, lineHeight: 1.7, maxWidth: 280 }}>
          不止「能报什么」，更懂「为什么适合你」。<br />用适配，让志愿填报有据可依。
        </div>
      </div>
      <div style={{ padding: '0 24px 30px' }}>
        <div className="tap" onClick={() => go('track')} style={{ padding: '16px', borderRadius: 18, background: C.sunGrad, color: '#fff', fontWeight: 700, fontSize: 17, textAlign: 'center', boxShadow: '0 12px 28px rgba(244,114,43,0.34)' }}>
          开始志愿填报 ›
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 14 }}>
          已有方案？<span style={{ color: C.sky, fontWeight: 600 }} className="tap" onClick={() => go('plan')}>恢复上次草稿</span>
        </div>
      </div>
    </div>
  );
}

export default Home;
