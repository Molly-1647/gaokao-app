import React from 'react';
import { Card } from './Card.jsx';
import { C } from '../design/tokens.js';

// 区块容器：左侧竖条 accent/sky/warn，标题 + 内容。
export function Section({ title, children, accent, warn }) {
  const bar = accent ? C.sun : warn ? C.rose : C.sky;
  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 4, height: 15, borderRadius: 999, background: bar }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{title}</span>
      </div>
      {children}
    </Card>
  );
}

export default Section;
