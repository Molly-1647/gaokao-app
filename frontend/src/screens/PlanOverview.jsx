import React from 'react';
import { C } from '../design/tokens.js';
import { TopBar } from '../components/TopBar.jsx';
import { Card } from '../components/Card.jsx';
import { PrimaryBtn } from '../components/PrimaryBtn.jsx';
import { GhostBtn } from '../components/GhostBtn.jsx';
import { getPlan, db } from '../engine/recommend.js';

function SchoolCard({ s, onOpen }) {
  const tierColor = { sprint: C.sun, stable: C.sky, safe: C.green };
  return (
    <div className="tap" onClick={onOpen} style={{ background: '#fff', borderRadius: 16, padding: 14, border: '1px solid ' + C.line, boxShadow: '0 6px 18px rgba(120,80,30,0.06)', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>{s.school}</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>{s.group}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: tierColor[s.tierKey], fontFamily: 'Noto Serif SC, serif' }}>{s.match}</div>
          <div style={{ fontSize: 10.5, color: C.muted }}>适配度</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {s.tier.map((t) => <span key={t} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, background: '#F4F8FD', color: C.sky, fontWeight: 600 }}>{t}</span>)}
        <span style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, background: '#FFF1E2', color: C.sunDeep, fontWeight: 600 }}>{s.hit}</span>
      </div>
    </div>
  );
}

export function PlanOverview({ go, back, onOpen, plan, data }) {
  const planData = getPlan(plan, data);
  const sections = [
    { key: 'sprint', label: '冲刺', desc: '略高于你的位次，搏一搏更好的平台', color: C.sun, items: planData.sprint },
    { key: 'stable', label: '稳妥', desc: '与你的位次基本持平，主力录取区间', color: C.sky, items: planData.stable },
    { key: 'safe', label: '保底', desc: '明显低于你的位次，防滑档的安全垫', color: C.green, items: planData.safe },
  ];
  const base = planData.base || { province: data.province, rank: data.rank };
  const modeTxt = data.mode === '3+1+2' ? '院校专业组' : data.mode === '3+3' ? '专业平行志愿' : '院校平行志愿';
  const cov = (db() && db().coverage[base.province]) ? db().coverage[base.province].join(' / ') : '—';
  const totalCnt = planData.sprint.length + planData.stable.length + planData.safe.length;
  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="我的志愿方案" sub="真实位次 · 冲 / 稳 / 保（适配度示意）" onBack={back} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 8px' }}>
        <Card style={{ marginBottom: 14, background: 'linear-gradient(135deg,#FFF3DF,#EAF3FE)', border: '1px solid #f0e2cc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: C.sub }}>你的基准</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginTop: 2 }}>{data.score || '—'} 分 · 位次约 {base.rank ? Number(base.rank).toLocaleString() : '未填'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: C.sub }}>投档模式</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.sky }}>{modeTxt}</div>
            </div>
          </div>
        </Card>
        <div style={{ fontSize: 10.5, color: C.muted, background: '#FBF6EF', border: '1px solid #f0e6d6', borderRadius: 12, padding: '8px 12px', marginBottom: 14, lineHeight: 1.6 }}>
          数据：2025 各省录取位次（约数）· 非实时 · 以省考试院官方为准。本省份覆盖：{cov}。适配度雷达 / 就业 / 决策解释为演示示意。
        </div>
        {totalCnt === 0 && (
          <Card style={{ marginBottom: 14, textAlign: 'center', color: C.sub }}>未生成方案：请填写省位次后重新生成。</Card>
        )}
        {sections.map((sec) => (
          <div key={sec.key} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: sec.color }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{sec.label}层</span>
              <span style={{ fontSize: 11.5, color: C.sub }}>{sec.desc}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted }}>{sec.items.length} 所</span>
            </div>
            {sec.items.length === 0
              ? <div style={{ fontSize: 12.5, color: C.muted, padding: '10px 4px' }}>该档暂无匹配院校（可调整位次或权重重试）。</div>
              : sec.items.map((s) => (<SchoolCard key={s.id} s={s} onOpen={() => onOpen(s, sec.key)} />))
            }
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 18px 18px', borderTop: '1px solid ' + C.line, background: '#fff', display: 'flex', gap: 10 }}>
        <GhostBtn onClick={() => go('decision')}>决策解释 / 风险</GhostBtn>
        <div style={{ flex: 1 }}><PrimaryBtn full sky onClick={() => go('export')}>导出方案</PrimaryBtn></div>
      </div>
    </div>
  );
}

export default PlanOverview;
