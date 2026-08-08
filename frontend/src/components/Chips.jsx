import React from 'react';
import { C } from '../design/tokens.js';

// 圆角标签（chip）。原型中多处使用 tiers / tags / 地域 等 chip 样式，统一收口到此组件。
// variant: 'sky' | 'sun' | 'green' | 'rose' | 'neutral'
const VARIANTS = {
  sky: { bg: '#F4F8FD', color: C.sky, border: 'transparent' },
  sun: { bg: '#FFF1E2', color: C.sunDeep, border: 'transparent' },
  green: { bg: '#EAFBF0', color: C.green, border: 'transparent' },
  rose: { bg: '#FDECEC', color: '#D9534F', border: 'transparent' },
  pink: { bg: '#FDEAF0', color: '#C2557A', border: 'transparent' },
  neutral: { bg: '#f1ede7', color: C.sub, border: 'transparent' },
};

export function Chips({ children, variant = 'sky', style }) {
  const v = VARIANTS[variant] || VARIANTS.sky;
  return (
    <span style={{
      fontSize: 10.5, padding: '3px 8px', borderRadius: 999,
      background: v.bg, color: v.color, fontWeight: 600, ...style,
    }}>{children}</span>
  );
}

export default Chips;
