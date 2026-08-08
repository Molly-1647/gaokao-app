import React, { useState } from 'react';
import { C } from '../design/tokens.js';
import { TopBar } from '../components/TopBar.jsx';
import { Card } from '../components/Card.jsx';
import { Field } from '../components/Field.jsx';
import { PrimaryBtn } from '../components/PrimaryBtn.jsx';
import { GhostBtn } from '../components/GhostBtn.jsx';
import { inpStyle, secTitle } from '../design/uiStyles.js';
import { ART_LINE, ART_RATIO, ART_CLASS, artComposite } from '../engine/artRecommend.js';

function ArtCertEditor({ data, setV }) {
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [rank, setRank] = useState('');
  const add = () => { if (!school.trim()) return; const cur = data.artCert || []; setV('artCert', [...cur, { school: school.trim(), major: major.trim(), rank: rank.trim() }]); setSchool(''); setMajor(''); setRank(''); };
  const del = (i) => { const cur = (data.artCert || []).filter((_, x) => x !== i); setV('artCert', cur); };
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="院校" style={{ ...inpStyle, flex: '1.2' }} />
        <input value={major} onChange={(e) => setMajor(e.target.value)} placeholder="专业" style={{ ...inpStyle, flex: 1 }} />
        <input value={rank} onChange={(e) => setRank(e.target.value)} placeholder="名次" inputMode="numeric" style={{ ...inpStyle, flex: '.8' }} />
      </div>
      <GhostBtn full onClick={add}>+ 添加合格证</GhostBtn>
      {(data.artCert || []).map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: C.sub, padding: '7px 0', borderBottom: '1px solid ' + C.line }}>
          <span>{c.school}{c.major ? ' · ' + c.major : ''}{c.rank ? ' · 名次 ' + c.rank : ''}</span>
          <span className="tap" style={{ color: '#D9534F', fontWeight: 600 }} onClick={() => del(i)}>删除</span>
        </div>
      ))}
    </div>
  );
}

function DoubleLineRow({ label, val, line, pass, unit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid ' + C.line }}>
      <div style={{ fontSize: 13, color: C.ink, fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12.5, color: C.sub }}>{val} / 线 {line} {unit}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: pass ? C.green : '#D9534F' }}>{pass ? '✓' : '✗'}</span>
      </div>
    </div>
  );
}

export function ArtCollect({ go, back, data, set, onGenerate }) {
  const setV = (k, v) => set({ ...data, [k]: v });
  const ratio = data.artRatio || ART_RATIO[data.province] || [40, 60];
  const comp = artComposite(data.score, data.artScore, ratio);
  const culturePass = (Number(data.score) || 0) >= ART_LINE.culture;
  const artPass = (Number(data.artScore) || 0) >= ART_LINE.art;
  const doublePass = culturePass && artPass;
  const typeCls = (data.artType || []).map((t) => (ART_CLASS[t] || []).join('、')).filter(Boolean).join('；') || '—';
  const ratioPresets = [['3:7', [30, 70]], ['4:6', [40, 60]], ['5:5', [50, 50]]];
  const canGen = (Number(data.score) > 0) && (Number(data.artScore) > 0);
  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="特长生信息采集" sub={(data.category ? data.category + ' · ' : '') + '综合分折算与双线体检'} onBack={back} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 8px' }}>
        <Card style={{ marginBottom: 14, background: 'linear-gradient(135deg,#FFF3DF,#FDEAF0)', border: '1px solid #f3d9c2' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 6 }}>特长科目</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.sunDeep }}>{data.category || (data.artType || []).join('、') || '—'}</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 6, lineHeight: 1.7 }}>可报专业类：{typeCls}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>推荐专业须属特长大类，跨类硬性拦截（如美术不可报音乐类）。</div>
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <div style={secTitle}>文化科目（文科 / 理科）</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {['文科', '理科'].map((c) => {
              const on = (data.artCultureType || '文科') === c;
              return <div key={c} className="tap" onClick={() => setV('artCultureType', c)} style={{ flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, border: '1.5px solid ' + (on ? C.sky : 'rgba(43,41,38,0.14)'), background: on ? '#EAF3FE' : '#fff', color: on ? C.sky : C.ink }}>{c}</div>;
            })}
          </div>
          <Field label="文化总分（文科或理科）" required>
            <input value={data.score} onChange={(e) => setV('score', e.target.value)} inputMode="numeric" placeholder="如 412" style={inpStyle} />
          </Field>
          <Field label="省统考分（专业）" required hint="满分 300 · 示意">
            <input value={data.artScore} onChange={(e) => setV('artScore', e.target.value)} inputMode="numeric" placeholder="如 240" style={inpStyle} />
          </Field>
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>综合分折算公式</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {ratioPresets.map(([lb, r]) => {
              const on = ratio[0] === r[0] && ratio[1] === r[1];
              return <div key={lb} className="tap" onClick={() => setV('artRatio', r)} style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1.5px solid ' + (on ? C.sun : 'rgba(43,41,38,0.14)'), background: on ? '#FFF1E2' : '#fff', color: on ? C.sunDeep : C.ink }}>{lb}</div>;
            })}
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.7 }}>
            综合分 = 文化总分 × {ratio[0]}% + 专业统考分 × 2.5 × {ratio[1]}%<br />
            <span style={{ fontSize: 11, color: C.muted }}>（专业满分 300，×2.5 折为 750 当量；比例按省份示意，以省考试院公布为准）</span>
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: C.sub }}>你的综合分（示意）</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.sunDeep, fontFamily: 'Noto Serif SC, serif', lineHeight: 1.1 }}>{comp}</div>
            </div>
            <span style={{ fontSize: 10.5, padding: '4px 9px', borderRadius: 999, background: '#EAF3FE', color: C.sky, fontWeight: 600, border: '1px solid #DCEBFB' }}>省考试院/院校章程（示意）</span>
          </div>
        </Card>

        <Card style={{ marginBottom: 14, background: doublePass ? 'linear-gradient(135deg,#EAFBF0,#EAF3FE)' : 'linear-gradient(135deg,#FDECEC,#FDEAF0)', border: '1px solid ' + (doublePass ? '#bfe9cf' : '#f3c9c7') }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>双线体检</div>
          <DoubleLineRow label="文化控制线" val={Number(data.score) || 0} line={ART_LINE.culture} pass={culturePass} unit="分" />
          <DoubleLineRow label="专业合格线" val={Number(data.artScore) || 0} line={ART_LINE.art} pass={artPass} unit="分(统考300)" />
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: doublePass ? C.green : '#D9534F' }}>{doublePass ? '✓ 双线达标，可参与排序' : '✗ 双线未达标，实际不计入推荐'}</div>
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>校考合格证（可选 · 持证院校优先匹配）</div>
          <ArtCertEditor data={data} setV={setV} />
        </Card>

        <div style={{ fontSize: 10.5, color: C.muted, background: '#FBF6EF', border: '1px solid #f0e6d6', borderRadius: 12, padding: '8px 12px', marginBottom: 14, lineHeight: 1.6 }}>
          ※ 综合分折算比例、文化/专业控制线、录取综合分均为演示示意，非真实数据；校考/统考批次规则以省考试院与院校章程当年公布为准。
        </div>
      </div>
      <div style={{ padding: '12px 18px 18px', borderTop: '1px solid ' + C.line, background: '#fff' }}>
        <PrimaryBtn full disabled={!canGen} onClick={onGenerate}>{canGen ? (doublePass ? '确定生成特长生方案 🚀' : '生成演示方案（双线未达标）') : '请先填写文化分与统考分'}</PrimaryBtn>
      </div>
    </div>
  );
}

export default ArtCollect;
