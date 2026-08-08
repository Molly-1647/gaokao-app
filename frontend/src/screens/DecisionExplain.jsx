import React from 'react';
import { C } from '../design/tokens.js';
import { TopBar } from '../components/TopBar.jsx';
import { Card } from '../components/Card.jsx';
import { Section } from '../components/Section.jsx';
import { RiskRow } from '../components/RiskRow.jsx';
import { getPlan } from '../engine/recommend.js';
import { recommendMajors } from '../engine/interest.js';

export function DecisionExplain({ back, plan, data }) {
  const planData = getPlan(plan, data);
  const w = (data && data.weights) || { major: 34, school: 33, city: 33 };
  const domKey = Object.keys(w).reduce((a, b) => (w[a] >= w[b] ? a : b));
  const domLabel = { major: '保专业', school: '保学校', city: '冲城市' }[domKey];
  const all = [...planData.sprint, ...planData.stable, ...planData.safe].sort((a, b) => (b.match || 0) - (a.match || 0));
  const A = all[0] || null;
  const B = all.find((c) => c !== A && c.tierKey !== (A && A.tierKey)) || all[1] || null;
  const total = planData.sprint.length + planData.stable.length + planData.safe.length;
  const { hp, picks } = recommendMajors(data.quiz, data.likeMajors, data.dislikeMajors);

  return (
    <div className="screen-enter" style={{ minHeight: '100%', background: C.softGrad, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="决策解释与风险" sub="用于家庭沟通的论据" onBack={back} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 8px' }}>
        {total === 0 ? (
          <Card style={{ marginBottom: 14, textAlign: 'center', color: C.sub }}>尚未生成方案：请先完成信息采集并「确定生成方案」。</Card>
        ) : (
          <>
            <Section title="关键取舍：为什么 A 而非 B">
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, background: '#FFF1E2', border: '1px solid #FBE0C4', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.sunDeep }}>A · {A.school}</div>
                  <div style={{ fontSize: 11.5, color: '#9a5a1e', marginTop: 4, lineHeight: 1.6 }}>适配度 {A.match} · {(A.tier || []).join('/')} · {A.hit}</div>
                  <div style={{ fontSize: 11.5, color: '#9a5a1e', marginTop: 4, lineHeight: 1.6 }}>{A.group}</div>
                </div>
                <div style={{ flex: 1, background: '#F4F8FD', border: '1px solid #DCEBFB', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.sky }}>B · {B ? B.school : '无对照院校'}</div>
                  <div style={{ fontSize: 11.5, color: '#3a6ea5', marginTop: 4, lineHeight: 1.6 }}>
                    {B ? ('适配度 ' + B.match + ' · ' + (B.tier || []).join('/') + ' · ' + B.hit) : '当前未匹配到对照院校'}
                  </div>
                  {B && <div style={{ fontSize: 11.5, color: '#3a6ea5', marginTop: 4, lineHeight: 1.6 }}>{B.group}</div>}
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#4a463f', lineHeight: 1.75, margin: 0 }}>
                {B
                  ? `你当前「${domLabel}」权重最高（${w[domKey]}%）。系统按冲 / 稳 / 保梯度与你的权重排出方案，A（${A.school}，适配度 ${A.match}）是综合排序最靠前的选择；B（${B.school}，适配度 ${B.match}）属「${B.hit}」梯度，可作为对照权衡。`
                  : `你当前「${domLabel}」权重最高（${w[domKey]}%）。系统按冲 / 稳 / 保梯度与你的权重排出方案，A（${A.school}，适配度 ${A.match}）是综合排序最靠前的选择。当前仅匹配到这一所院校，可调低位次或更换省份再试。`}
              </p>
            </Section>

            <Section title="A 牺牲了什么">
              <p style={{ fontSize: 13, color: '#4a463f', lineHeight: 1.75, margin: 0 }}>
                {B
                  ? `选择 A，意味着相对 B（${B.school}）而言，你在「${B.hit}」梯度上的机会被压缩。若你更想搏 B 这类院校，可在第 2 步调整权重后重新生成，系统将重排冲 / 稳 / 保。`
                  : `当前仅匹配到 A 一所院校，暂无对照项。放宽位次区间或调整权重后重新生成，可获得更多对照选项。`}
              </p>
            </Section>
          </>
        )}

        <Section title="你的适配专业方向（示意）">
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8 }}>
            兴趣画像：<b style={{ color: C.ink }}>{hp.top.length ? HOLLAND_SHORT(hp.top).join(' + ') : '未测评'}</b>
            {hp.top.length ? '。以下方向由你的兴趣代码推导，可与上方院校方案结合参考。' : '（可在第 3 步完成测评后刷新）'}
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {picks.length ? picks.map((m) => (
              <span key={m.name} style={{ fontSize: 12, padding: '6px 11px', borderRadius: 999, background: '#FFF1E2', color: C.sunDeep, fontWeight: 600, border: '1px solid #FBE0C4' }}>{m.name}</span>
            )) : <span style={{ fontSize: 12.5, color: C.muted }}>暂无匹配方向</span>}
          </div>
          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>※ 兴趣代码 → 职业理论映射的演示示意，非真实 RAG / 大模型结论。</div>
        </Section>

        <Section title="风险总览（advisory）" warn>
          <RiskRow icon="⚠️" t="退档 / 滑档" d={`本方案共 ${total} 所（冲刺 ${planData.sprint.length} / 稳妥 ${planData.stable.length} / 保底 ${planData.safe.length}），按梯度填满可防滑档。`} />
          <RiskRow icon="🩺" t="体检 / 单科限制" d="所推荐专业组无特殊体检限制，选科均满足（示意，请以官方章程为准）。" />
          <RiskRow icon="🔁" t="调剂风险" d="组内专业含你「排斥」项时建议谨慎，或选「不服从调剂」。" />
          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 8 }}>※ 风险提示非录取保障承诺，请以省考试院当年规定为准。本方案适配度为演示示意，非真实 RAG 结论。</div>
        </Section>
      </div>
    </div>
  );
}

function HOLLAND_SHORT(top) {
  // 兴趣画像短标签：与原型 HOLLAND[t].short 一致（避免额外引入 HOLLAND 全量）。
  const map = { R: '现实型', I: '研究型', A: '艺术型', S: '社会型', E: '企业型', C: '常规型' };
  return top.map((t) => map[t] || t);
}

export default DecisionExplain;
