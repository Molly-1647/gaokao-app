import React from 'react';
import { C } from '../design/tokens.js';
import { TopBar } from '../components/TopBar.jsx';
import { Card } from '../components/Card.jsx';
import { PrimaryBtn } from '../components/PrimaryBtn.jsx';
import { hollandFromQuiz, HOLLAND } from '../engine/interest.js';

export function Confirm({ go, back, data, set, onGenerate }) {
  const rows = [
    ['省份 / 选科', `${data.province || '—'} · ${data.mode || '—'}${data.first ? (' · ' + data.first) : ''}`],
    ['总分 / 位次', `${data.score || '—'} 分 / ${data.rank ? data.rank + ' 位' : '未填'}`],
    ['院校层次', data.tiers.length ? data.tiers.join('、') : '无偏好'],
    ['地域', data.region === 'any' ? '无所谓' : (data.region === 'want' ? '想去' : '不去')],
    ['核心权重', `保专业 ${data.weights.major}% · 保学校 ${data.weights.school}% · 冲城市 ${data.weights.city}%`],
    ['测评', data.skipped ? '已跳过' : '已完成（解锁适配雷达）'],
    ['兴趣画像', data.skipped ? '已跳过（未生成）' : (() => { const hp = hollandFromQuiz(data.quiz); return hp.top.length ? hp.top.map((t) => HOLLAND[t].short).join(' + ') : '—'; })()],
  ];
  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="确认并生成" sub="第 5 步 · 核对信息" onBack={back} step={4} total={5} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 8px' }}>
        <Card style={{ marginBottom: 14 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < rows.length - 1 ? '1px solid ' + C.line : 'none' }}>
              <span style={{ fontSize: 13, color: C.sub }}>{r[0]}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, textAlign: 'right', maxWidth: '62%' }}>{r[1]}</span>
            </div>
          ))}
        </Card>
        <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '4px 10px', lineHeight: 1.6 }}>
          点击确定后，将基于 RAG 知识库 + 大模型生成可解释方案（含适用你的适配度与决策解释）。
        </div>
      </div>
      <div style={{ padding: '12px 18px 18px', borderTop: '1px solid ' + C.line, background: '#fff' }}>
        <PrimaryBtn full onClick={onGenerate}>确定生成方案 🚀</PrimaryBtn>
      </div>
    </div>
  );
}

export default Confirm;
