import React from 'react';
import { C } from '../design/tokens.js';

export function Card({ children, style, tap, onClick }) {
  return (
    <div className={tap ? 'tap' : ''} onClick={onClick} style={{
      background: C.card, borderRadius: 18, padding: 16, border: '1px solid ' + C.line,
      boxShadow: '0 6px 20px rgba(120,80,30,0.06)', ...style,
    }}>{children}</div>
  );
}

export default Card;
