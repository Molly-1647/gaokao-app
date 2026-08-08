import React from 'react';
import { C } from '../design/tokens.js';

export function PrimaryBtn({ children, onClick, full, disabled, sky }) {
  return (
    <div className="tap" onClick={disabled ? null : onClick} style={{
      width: full ? '100%' : 'auto', padding: '15px 22px', borderRadius: 16,
      background: disabled ? 'rgba(43,41,38,0.14)' : (sky ? C.skyGrad : C.sunGrad),
      color: disabled ? 'rgba(43,41,38,0.45)' : '#fff',
      fontWeight: 700, fontSize: 16, textAlign: 'center', boxShadow: disabled ? 'none' : '0 10px 24px rgba(244,114,43,0.30)',
      opacity: disabled ? 0.9 : 1,
    }}>{children}</div>
  );
}

export default PrimaryBtn;
