import React from 'react';

export function RiskRow({ icon, t, d }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(43,41,38,0.08)' }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div><div style={{ fontSize: 13.5, fontWeight: 600, color: '#2B2926' }}>{t}</div><div style={{ fontSize: 12, color: '#6b655c', marginTop: 2, lineHeight: 1.6 }}>{d}</div></div>
    </div>
  );
}

export default RiskRow;
