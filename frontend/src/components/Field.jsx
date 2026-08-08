import React from 'react';

export function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#2B2926', marginBottom: 8 }}>
        <span>{label}</span>
        {required && <span style={{ color: '#FF6B6B', fontSize: 12 }}>*</span>}
        {hint && <span style={{ fontSize: 11, color: '#A89E8F', fontWeight: 400 }}>· {hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default Field;
