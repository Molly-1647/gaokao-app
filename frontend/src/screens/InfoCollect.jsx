import React, { useState } from 'react';
import { C } from '../design/tokens.js';
import { TopBar } from '../components/TopBar.jsx';
import { Card } from '../components/Card.jsx';
import { Field } from '../components/Field.jsx';
import { PrimaryBtn } from '../components/PrimaryBtn.jsx';
import { selStyle, inpStyle, tagRow, warnTag, hintRow, secTitle } from '../design/uiStyles.js';
import { db } from '../engine/recommend.js';

// InfoCollect = 原型 Wiz1（基本信息）+ Wiz2（偏好与权重）合并为一屏，
// 内部 step 0/1 切换，保留「下一步 / 上一步」与进度指示（PRD §10 基础校验）。
export function InfoCollect({ go, back, data, set }) {
  const [step, setStep] = useState(0);
  const setV = (k, v) => set({ ...data, [k]: v });

  // 省份列表 / 覆盖信息
  const provinces = (db() && db().provinces) ? db().provinces : ['广东', '浙江', '山东', '河南', '四川', '江苏'];
  const coverage = (db() && db().coverage[data.province]) ? db().coverage[data.province].join(' / ') : '—';

  // —— 第 1 步：基本信息 ——
  const baseValid = !!data.province && !!data.score;

  // —— 第 2 步：偏好与权重 ——
  const tiers = ['985', '211', '双一流', '公办', '民办', '中外合作'];
  const toggleTier = (t) => { const s = new Set(data.tiers); s.has(t) ? s.delete(t) : s.add(t); setV('tiers', [...s]); };
  const toggleLike = (m) => { const cur = data.likeMajors || []; setV('likeMajors', cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]); };
  const toggleDislike = (m) => { const cur = data.dislikeMajors || []; setV('dislikeMajors', cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]); };
  const setW = (k, v) => {
    const o = { ...data.weights, [k]: v }; const sum = o.major + o.school + o.city;
    if (sum === 0) { setV('weights', o); return; }
    const others = ['major', 'school', 'city'].filter((x) => x !== k);
    const rest = 100 - v; const rsum = o[others[0]] + o[others[1]];
    const a = rsum === 0 ? rest / 2 : Math.round((rest * o[others[0]]) / rsum);
    const b = rest - a;
    o[others[0]] = a; o[others[1]] = b; setV('weights', o);
  };
  const preset = (p) => { if (p === 'major') setV('weights', { major: 60, school: 25, city: 15 }); if (p === 'school') setV('weights', { major: 25, school: 55, city: 20 }); if (p === 'city') setV('weights', { major: 25, school: 25, city: 50 }); };

  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <TopBar title={step === 0 ? '基本信息' : '偏好与权重'} sub={`第 ${step + 1} 步 · ${step === 0 ? '让我们认识你' : '你真正在意什么'}`} onBack={() => (step > 0 ? setStep(0) : back())} step={step} total={5} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 8px' }}>
        {step === 0 ? (
          <>
            {data.category && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '11px 14px', borderRadius: 14, background: 'linear-gradient(135deg,#FFF3DF,#EAF3FE)', border: '1px solid #f0e2cc' }}>
                <span style={{ fontSize: 12, color: C.sub }}>报考类别</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{data.category}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: C.sky, fontWeight: 600 }} className="tap" onClick={back}>更换 ›</span>
              </div>
            )}
            <Card style={{ marginBottom: 14 }}>
              <Field label="高考省份" required>
                <select value={data.province} onChange={(e) => setV('province', e.target.value)} style={selStyle}>
                  {provinces.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              {data.province && coverage !== '—' && (
                <div style={tagRow}><span style={warnTag}>本省份数据覆盖：{coverage}（位次为 2025 约数）</span></div>
              )}
              <Field label="选科模式">
                <div style={{ display: 'flex', gap: 8 }}>
                  {['3+1+2', '3+3', '传统文理'].map((m) => (
                    <div key={m} className="tap" onClick={() => setV('mode', m)} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 12, fontSize: 13.5, fontWeight: 600, border: '1.5px solid ' + (data.mode === m ? C.sun : 'rgba(43,41,38,0.14)'), background: data.mode === m ? '#FFF1E2' : '#fff', color: data.mode === m ? C.sunDeep : C.ink }}>{m}</div>
                  ))}
                </div>
              </Field>
              {data.mode === '3+1+2' && (
                <Field label="首选科目">
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['物理', '历史'].map((s) => (
                      <div key={s} className="tap" onClick={() => setV('first', s)} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, border: '1.5px solid ' + (data.first === s ? C.sky : 'rgba(43,41,38,0.14)'), background: data.first === s ? '#EAF3FE' : '#fff', color: data.first === s ? C.sky : C.ink }}>{s}</div>
                    ))}
                  </div>
                </Field>
              )}
            </Card>
            <Card style={{ marginBottom: 14 }}>
              <Field label="高考总分" required>
                <input value={data.score} onChange={(e) => setV('score', e.target.value)} inputMode="numeric" placeholder="如 612" style={inpStyle} />
              </Field>
              <Field label="省位次" hint="建议填写，可提升精度">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input value={data.rank} onChange={(e) => setV('rank', e.target.value)} inputMode="numeric" placeholder="系统可自动反查" style={{ ...inpStyle, flex: 1 }} />
                  <span style={{ fontSize: 11, color: C.green, fontWeight: 600, whiteSpace: 'nowrap' }}>✓ 已反查预填</span>
                </div>
                {!data.rank && <div style={hintRow}>不填位次将降低推荐精度，但不影响提交。</div>}
              </Field>
            </Card>
            <Card style={{ marginBottom: 14, background: 'linear-gradient(135deg,#FFF3DF,#EAF3FE)', border: '1px solid #f0e2cc' }}>
              <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.7 }}>普通类考生填写高考总分与省位次即可；艺体类请在首页选择对应特长生后，于专属页面填写「文化分 + 统考分」。</div>
            </Card>
          </>
        ) : (
          <>
            <Card style={{ marginBottom: 14 }}>
              <div style={secTitle}>院校层次</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tiers.map((t) => (
                  <div key={t} className="tap" onClick={() => toggleTier(t)} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: '1.5px solid ' + (data.tiers.includes(t) ? C.sun : 'rgba(43,41,38,0.14)'), background: data.tiers.includes(t) ? '#FFF1E2' : '#fff', color: data.tiers.includes(t) ? C.sunDeep : C.ink }}>{t}</div>
                ))}
              </div>
            </Card>
            <Card style={{ marginBottom: 14 }}>
              <div style={secTitle}>地域偏好</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {[['want', '想去'], ['avoid', '不去'], ['any', '无所谓']].map(([k, lb]) => (
                  <div key={k} className="tap" onClick={() => setV('region', k)} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1.5px solid ' + (data.region === k ? C.sky : 'rgba(43,41,38,0.14)'), background: data.region === k ? '#EAF3FE' : '#fff', color: data.region === k ? C.sky : C.ink }}>{lb}</div>
                ))}
              </div>
              {data.region !== 'any' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {['江浙沪', '大湾区', '京津冀', '成渝'].map((r) => {
                    const on = (data.regions || []).includes(r);
                    return <div key={r} className="tap" onClick={() => { const cur = data.regions || []; setV('regions', cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]); }} style={{ padding: '7px 12px', borderRadius: 999, fontSize: 12.5, background: on ? '#EAF3FE' : '#F4F8FD', color: on ? C.sky : '#6b655c', fontWeight: 600, border: '1.5px solid ' + (on ? C.sky : 'rgba(43,41,38,0.14)') }}>{r}</div>;
                  })}
                </div>
              )}
            </Card>
            <Card style={{ marginBottom: 14 }}>
              <div style={secTitle}>专业偏好</div>
              <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 6 }}>感兴趣（点击切换）</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {['计算机', '临床医学', '经济学', '设计', '机械'].map((m) => {
                  const on = (data.likeMajors || []).includes(m);
                  return <div key={m} className="tap" onClick={() => toggleLike(m)} style={{ padding: '7px 12px', borderRadius: 999, fontSize: 12.5, background: on ? '#FFF1E2' : '#fff', color: on ? C.sunDeep : '#6b655c', fontWeight: 600, border: '1.5px solid ' + (on ? C.sun : 'rgba(43,41,38,0.14)') }}>+ {m}</div>;
                })}
              </div>
              <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 6 }}>排斥（点击切换，将影响推荐）</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['化学工程', '农业', '哲学'].map((m) => {
                  const on = (data.dislikeMajors || []).includes(m);
                  return <div key={m} className="tap" onClick={() => toggleDislike(m)} style={{ padding: '7px 12px', borderRadius: 999, fontSize: 12.5, background: on ? '#FDECEC' : '#fff', color: on ? '#D9534F' : '#6b655c', fontWeight: 600, border: '1.5px solid ' + (on ? '#F3B7B5' : 'rgba(43,41,38,0.14)') }}>− {m}</div>;
                })}
              </div>
            </Card>
            <Card style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={secTitle}>核心诉求权重</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[['major', '专业优先'], ['school', '学校优先'], ['city', '城市优先']].map(([k, lb]) => (
                    <div key={k} className="tap" onClick={() => preset(k)} style={{ fontSize: 11, padding: '5px 9px', borderRadius: 999, background: '#F4F8FD', color: C.sky, fontWeight: 600 }}>{lb}</div>
                  ))}
                </div>
              </div>
              {[['major', '保专业'], ['school', '保学校'], ['city', '冲城市']].map(([k, lb]) => (
                <div key={k} style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ color: C.ink, fontWeight: 600 }}>{lb}</span><span style={{ color: C.sunDeep, fontWeight: 700 }}>{data.weights[k]}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={data.weights[k]} onChange={(e) => setW(k, parseInt(e.target.value))} className="tap" style={{ width: '100%', accentColor: C.sun }} />
                </div>
              ))}
              <div style={hintRow}>权重和自动归一为 100%，决定冲/稳/保的取舍倾向。</div>
            </Card>
          </>
        )}
      </div>
      <div style={{ padding: '12px 18px 18px', borderTop: '1px solid ' + C.line, background: '#fff' }}>
        {step === 0 ? (
          <PrimaryBtn full disabled={!baseValid} onClick={() => setStep(1)}>{baseValid ? '下一步 ›' : '请填写省份与总分'}</PrimaryBtn>
        ) : (
          <PrimaryBtn full onClick={() => go('wiz3')}>下一步 ›</PrimaryBtn>
        )}
      </div>
    </div>
  );
}

export default InfoCollect;
