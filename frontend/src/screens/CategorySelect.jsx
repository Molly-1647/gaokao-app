import React from 'react';
import { C } from '../design/tokens.js';
import { TopBar } from '../components/TopBar.jsx';
import { secTitle } from '../design/uiStyles.js';

const TRACKS = [
  { key: 'science', label: '理科生', tag: '普通类', kind: 'normal', icon: '📐' },
  { key: 'arts', label: '文科生', tag: '普通类', kind: 'normal', icon: '📚' },
  { key: 'art', label: '美术生', tag: '艺体类', kind: 'art', artType: '美术类', icon: '🎨' },
  { key: 'music', label: '音乐生', tag: '艺体类', kind: 'art', artType: '音乐类', icon: '🎵' },
  { key: 'pe', label: '体育生', tag: '艺体类', kind: 'art', artType: '体育类', icon: '🏃' },
  { key: 'fashion', label: '服装与表演', tag: '艺体类', kind: 'art', artType: '服装表演(模特)类', icon: '👗' },
];

export function CategorySelect({ go, set, data }) {
  const choose = (t) => {
    if (t.kind === 'normal') {
      set({ ...data, isArt: false, artType: [], artScore: '', artCert: [], artRatio: null, artCultureType: null, track: t.key, category: t.label });
      go('info');
    } else {
      set({ ...data, isArt: true, artType: [t.artType], artScore: '', score: '', artCert: [], artRatio: null, artCultureType: '文科', track: t.key, category: t.label });
      go('artWiz2');
    }
  };
  const normal = TRACKS.filter((t) => t.kind === 'normal');
  const art = TRACKS.filter((t) => t.kind === 'art');
  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="选择报考类别" sub="我们为你准备不同的填报路径" onBack={() => go('welcome')} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 8px' }}>
        <div style={secTitle}>普通高考</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          {normal.map((t) => (
            <div key={t.key} className="tap" onClick={() => choose(t)} style={{ flex: 1, background: '#fff', borderRadius: 18, padding: '20px 12px', border: '1.5px solid rgba(43,41,38,0.10)', boxShadow: '0 6px 18px rgba(120,80,30,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 30 }}>{t.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginTop: 8 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{t.tag}</div>
            </div>
          ))}
        </div>
        <div style={secTitle}>艺体类（特长生）</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {art.map((t) => (
            <div key={t.key} className="tap" onClick={() => choose(t)} style={{ width: 'calc(50% - 6px)', background: 'linear-gradient(135deg,#FFF3DF,#FDEAF0)', borderRadius: 18, padding: '18px 14px', border: '1.5px solid #f3d9c2', boxShadow: '0 6px 18px rgba(120,80,30,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 28 }}>{t.icon}</div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: C.sunDeep, marginTop: 8 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{t.tag}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: C.muted, background: '#FBF6EF', border: '1px solid #f0e6d6', borderRadius: 12, padding: '8px 12px', margin: '18px 0 4px', lineHeight: 1.6 }}>
          ※ 艺体类需填写「文化分（文科 / 理科）+ 省统考分」，并按综合分折算与双线控制生成方案（示意）。
        </div>
      </div>
    </div>
  );
}

export default CategorySelect;
