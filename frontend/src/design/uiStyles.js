// 原型中跨屏复用的内联样式片段（selStyle / inpStyle / secTitle / pStyle ...）。
// 原样移植，供各组件与屏共享，保证视觉一致。
import { C } from './tokens.js';

export const selStyle = { width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid rgba(43,41,38,0.14)', fontSize: 14.5, background: '#fff', color: C.ink, fontFamily: 'inherit' };
export const inpStyle = { width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid rgba(43,41,38,0.14)', fontSize: 14.5, background: '#fff', color: C.ink, fontFamily: 'inherit' };
export const tagRow = { marginTop: 8 };
export const warnTag = { fontSize: 11.5, color: '#b5611f', background: '#FFF1E2', padding: '5px 10px', borderRadius: 999, fontWeight: 600 };
export const hintRow = { fontSize: 11.5, color: C.muted, marginTop: 8, lineHeight: 1.5 };
export const secTitle = { fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 };
export const pStyle = { fontSize: 13, color: '#4a463f', lineHeight: 1.75, margin: 0 };
export const fieldLabel = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 8 };
export const ragBadge = { fontSize: 10.5, padding: '4px 9px', borderRadius: 999, background: '#EAF3FE', color: C.sky, fontWeight: 600, border: '1px solid #DCEBFB' };
