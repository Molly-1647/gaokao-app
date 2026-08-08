import React from 'react';
import { C } from '../design/tokens.js';

export function GhostBtn({ children, onClick, full }) {
  return (
    <div className="tap" onClick={onClick} style={{
      width: full ? '100%' : 'auto', padding: '14px 20px', borderRadius: 16,
      background: '#fff', color: C.ink, fontWeight: 600, fontSize: 15, textAlign: 'center',
      border: '1.5px solid rgba(43,41,38,0.12)',
    }}>{children}</div>
  );
}

export default GhostBtn;
