import React from 'react';
import { C } from '../design/tokens.js';

export function TopBar({ title, sub, onBack, step, total }) {
  return (
    <div style={{ padding: '14px 18px 10px', background: 'rgba(255,253,249,0.92)', backdropFilter: 'blur(6px)', position: 'sticky', top: 0, zIndex: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onBack && <div className="tap" onClick={onBack} style={{ fontSize: 22, lineHeight: 1, color: C.ink, padding: '2px 4px' }}>‹</div>}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: C.sub, marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {step != null && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ height: 4, flex: 1, borderRadius: 999, background: i <= step ? C.sunGrad : 'rgba(43,41,38,0.10)' }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default TopBar;
