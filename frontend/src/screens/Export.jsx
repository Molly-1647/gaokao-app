import React, { useRef, useState } from 'react';
import { C } from '../design/tokens.js';
import { TopBar } from '../components/TopBar.jsx';
import { PrimaryBtn } from '../components/PrimaryBtn.jsx';
import { GhostBtn } from '../components/GhostBtn.jsx';
import { getPlan } from '../engine/recommend.js';
import { exportPdf, exportImage, exportText } from '../export/exportPlan.js';

export function Export({ back, plan, data }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const planData = getPlan(plan, data);
  const sections = [
    { key: 'sprint', label: '冲刺', color: C.sun },
    { key: 'stable', label: '稳妥', color: C.sky },
    { key: 'safe', label: '保底', color: C.green },
  ];

  const doPdf = async () => { setBusy(true); try { await exportPdf(ref.current); } finally { setBusy(false); } };
  const doImage = async () => { setBusy(true); try { await exportImage(ref.current); } finally { setBusy(false); } };
  const doText = () => exportText(planData, data);

  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="导出方案" sub="支持 PDF / 图片 / 文本" onBack={back} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 8px' }}>
        {/* 可导出容器：导出时由 html2canvas 截图 / jsPDF 打印此区域 */}
        <div ref={ref} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid ' + C.line }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, fontFamily: "'Noto Serif SC', serif" }}>我的高考志愿方案</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 6, lineHeight: 1.7 }}>
            {data.province || '—'} · {data.mode || '—'}{data.first ? (' · ' + data.first) : ''} · {data.score || '—'} 分 / {data.rank ? data.rank + ' 位' : '未填'}
          </div>
          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
            数据：2025 各省录取位次（约数）· 非实时 · 以省考试院官方为准。适配度 / 就业 / 决策解释为演示示意，非真实 RAG 结论。
          </div>
          {sections.map((sec) => {
            const items = planData[sec.key] || [];
            return (
              <div key={sec.key} style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: sec.color }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{sec.label}层（{items.length} 所）</span>
                </div>
                {items.length === 0 ? <div style={{ fontSize: 12, color: C.muted }}>该档暂无匹配院校</div> : items.map((s) => (
                  <div key={s.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid ' + C.line }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{s.school}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: sec.color }}>适配度 {s.match}</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{s.hit} · {(s.tier || []).join('/')}{s.group ? ' · ' + s.group : ''}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 11, color: C.muted, marginTop: 12, lineHeight: 1.6 }}>
          导出后可直接用于家庭沟通或打印留存；PDF / 图片为前端浏览器下载（含适配度与梯度），文本为结构化摘要。
        </div>
      </div>
      <div style={{ padding: '12px 18px 18px', borderTop: '1px solid ' + C.line, background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryBtn full disabled={busy} onClick={doPdf}>{busy ? '导出中…' : '导出为 PDF'}</PrimaryBtn>
        <GhostBtn full disabled={busy} onClick={doImage}>导出为图片</GhostBtn>
        <GhostBtn full onClick={doText}>导出为文本</GhostBtn>
      </div>
    </div>
  );
}

export default Export;
