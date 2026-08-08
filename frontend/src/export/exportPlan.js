import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// 方案导出：PDF（html2canvas + jspdf）、图片（html2canvas）、文本（Blob）。
// 这些函数对「方案页 DOM 容器」或「结构化方案数据」做导出，全部在前端完成。

function triggerDownload(href, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = href;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportPdf(containerEl, filename = '高考志愿方案.pdf') {
  if (!containerEl) return;
  const canvas = await html2canvas(containerEl, { scale: 2, backgroundColor: '#fff', useCORS: true });
  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const imgW = pw;
  const imgH = (canvas.height * imgW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(img, 'PNG', 0, position, imgW, imgH);
  heightLeft -= ph;
  while (heightLeft > 0) {
    position -= ph;
    pdf.addPage();
    pdf.addImage(img, 'PNG', 0, position, imgW, imgH);
    heightLeft -= ph;
  }
  pdf.save(filename);
}

export async function exportImage(containerEl, filename = '高考志愿方案.png') {
  if (!containerEl) return;
  const canvas = await html2canvas(containerEl, { scale: 2, backgroundColor: '#fff', useCORS: true });
  triggerDownload(canvas.toDataURL('image/png'), filename);
}

export function exportText(planData, data, filename = '高考志愿方案.txt') {
  if (!planData) return;
  const w = (data && data.weights) || { major: 34, school: 33, city: 33 };
  const lines = [];
  lines.push('高考志愿填报方案（演示示意，非真实 RAG 结论）');
  lines.push('============================================================');
  lines.push(`省份 / 选科：${data && data.province ? data.province : '—'} · ${data && data.mode ? data.mode : '—'}${data && data.first ? (' · ' + data.first) : ''}`);
  lines.push(`总分 / 位次：${data && data.score ? data.score : '—'} 分 / ${data && data.rank ? data.rank + ' 位' : '未填'}`);
  lines.push(`核心权重：保专业 ${w.major}% · 保学校 ${w.school}% · 冲城市 ${w.city}%`);
  lines.push('');
  lines.push('※ 数据：2025 各省录取位次（约数）· 非实时 · 以省考试院官方为准。');
  lines.push('※ 适配度、就业与决策解释为演示示意，非真实大模型 / RAG 结论。');
  lines.push('');

  const sections = [
    { key: 'sprint', label: '冲刺' },
    { key: 'stable', label: '稳妥' },
    { key: 'safe', label: '保底' },
  ];
  sections.forEach((sec) => {
    const items = planData[sec.key] || [];
    lines.push(`【${sec.label}层】 ${items.length} 所`);
    if (!items.length) lines.push('  （该档暂无匹配院校）');
    items.forEach((s, i) => {
      lines.push(`  ${i + 1}. ${s.school}（适配度 ${s.match}）`);
      lines.push(`     梯度：${s.hit} · 层次：${(s.tier || []).join('/')}`);
      if (s.group) lines.push(`     ${s.group}`);
    });
    lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
