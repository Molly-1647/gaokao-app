import React from 'react';

// 适配度雷达图（原样移植原型的 RadarChart）。
export function RadarChart({ values, labels, size = 176 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 26;
  const n = values.length;
  const ang = (i) => (-90 + (i * 360) / n) * (Math.PI / 180);
  const pt = (i, val) => { const rr = r * (val / 100); return [cx + rr * Math.cos(ang(i)), cy + rr * Math.sin(ang(i))]; };
  const poly = values.map((v, i) => pt(i, v).join(',')).join(' ');
  const rings = [0.25, 0.5, 0.75, 1].map((f) => values.map((_, i) => { const rr = r * f; return [cx + rr * Math.cos(ang(i)), cy + rr * Math.sin(ang(i))].join(','); }).join(' '));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFB23E" /><stop offset="100%" stopColor="#3E95ED" />
        </linearGradient>
      </defs>
      {rings.map((rg, i) => (<polygon key={i} points={rg} fill="none" stroke="rgba(43,41,38,0.08)" strokeWidth="1" />))}
      {values.map((_, i) => { const [x, y] = pt(i, 100); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(43,41,38,0.08)" strokeWidth="1" />; })}
      <polygon className="float-up" points={poly} fill="url(#radarFill)" fillOpacity="0.28" stroke="#F4722B" strokeWidth="2.2" />
      {values.map((v, i) => { const [x, y] = pt(i, v); return <circle key={i} cx={x} cy={y} r="3.2" fill="#F4722B" />; })}
      {labels.map((lb, i) => { const [x, y] = pt(i, 118); return (
        <text key={i} x={x} y={y} fontSize="10.5" fill="#6b655c" textAnchor="middle" dominantBaseline="middle" fontFamily="'Noto Sans SC',sans-serif">{lb}</text>
      ); })}
    </svg>
  );
}

export default RadarChart;
