// 兴趣代码（霍兰德式）与专业方向映射（演示示意，非真实 RAG）。
// 从原型逐一切出，供 MajorFit / Detail / Decision 等屏使用。

export const HOLLAND = {
  R: { name: '现实型 (R)', short: '现实型', desc: '动手操作、喜欢具体可触的任务，偏好技术与工程。', majors: [
    { name: '电子信息类', train: '电路、嵌入式与信号处理', employ: '芯片、智能硬件、通信设备', path: '硬件工程师 → 技术专家' },
    { name: '机械类', train: '机械设计、制造与自动化', employ: '装备制造、汽车、机器人', path: '结构 / 控制工程师 → 研发负责' },
    { name: '自动化', train: '控制理论与智能系统', employ: '工业自动化、智能制造', path: '控制工程师 → 系统集成' },
    { name: '电气工程', train: '电力系统与电气控制', employ: '电网、新能源、电气装备', path: '电气工程师 → 项目负责' },
  ] },
  I: { name: '研究型 (I)', short: '研究型', desc: '喜欢观察、思考与探索规律，偏好分析与抽象问题。', majors: [
    { name: '计算机类', train: '算法、系统与软件工程', employ: '互联网、人工智能、科研', path: '研发 → 科学家 / 架构师' },
    { name: '数学 / 统计学', train: '建模、概率与数据分析', employ: '金融、AI、精算、调研', path: '量化 / 数据科学家' },
    { name: '物理学', train: '物质运动与前沿理论', employ: '科研、半导体、航天', path: '研究员 → 教授' },
    { name: '生物科学', train: '生命机理与实验研究', employ: '医药研发、检测、高校', path: '科研 → 博后 / 药企' },
  ] },
  A: { name: '艺术型 (A)', short: '艺术型', desc: '追求美感与自我表达，偏好创意与自由。', majors: [
    { name: '设计学类', train: '视觉、产品与交互设计', employ: '互联网、文创、品牌', path: '设计师 → 创意总监' },
    { name: '建筑学', train: '空间、美学与工程结合', employ: '设计院、城市更新', path: '建筑师 → 主创' },
    { name: '新闻传播学', train: '内容、媒介与叙事', employ: '媒体、公关、运营', path: '内容 / 品牌负责' },
    { name: '音乐与美术', train: '艺术语言与创作', employ: '文创、教育、演出', path: '创作者 / 艺术教育' },
  ] },
  S: { name: '社会型 (S)', short: '社会型', desc: '乐于助人、重视关系，偏好服务与影响他人。', majors: [
    { name: '临床医学', train: '疾病诊治与健康管理', employ: '医院、卫健、科研', path: '医师 → 专科 / 主任' },
    { name: '教育学', train: '教学与课程设计', employ: '学校、教培、教研', path: '教师 → 教研 / 管理' },
    { name: '心理学', train: '行为与认知研究', employ: '咨询、HR、用户研究', path: '咨询师 / 研究员' },
    { name: '护理学', train: '照护与健康管理', employ: '医院、社区、康养', path: '护理 → 管理 / 专科' },
  ] },
  E: { name: '企业型 (E)', short: '企业型', desc: '喜欢影响与组织他人，偏好目标与结果导向。', majors: [
    { name: '工商管理', train: '组织、战略与运营', employ: '企业、创业、咨询', path: '管理 → 创业者 / 高管' },
    { name: '金融学', train: '资本、市场与风控', employ: '投行、证券、银行', path: '分析师 → 投资负责' },
    { name: '经济学', train: '资源配置与政策分析', employ: '券商、智库、公职', path: '研究 / 政策分析' },
    { name: '市场营销', train: '品牌、用户与增长', employ: '快消、互联网、广告', path: '市场 → 品牌负责' },
  ] },
  C: { name: '常规型 (C)', short: '常规型', desc: '偏好秩序、规则与稳定，细致可靠。', majors: [
    { name: '会计学', train: '核算、报表与税务', employ: '企业、事务所、公职', path: '会计师 → 财务负责' },
    { name: '法学', train: '规则、论证与合规', employ: '律所、法务、公职', path: '律师 / 法务负责' },
    { name: '财务管理', train: '资金与投融资管理', employ: '企业、金融机构', path: '财务 → 资金负责' },
    { name: '信息管理与信息系统', train: '数据流程与系统治理', employ: '企业 IT、政务、运营', path: '系统 / 数据治理' },
  ] },
};
export const HOLLAND_ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];

export const QUIZ = [
  { q: '你更享受哪种活动？', types: ['R', 'A', 'S', 'E'], a: ['动手做实验 / 拆装物件', '与人讨论观点 / 写作', '帮助他人解决困难', '组织活动 / 影响他人'] },
  { q: '面对一个项目，你倾向？', types: ['I', 'A', 'S', 'E'], a: ['先厘清规律与数据', '追求美感与创意表达', '确保团队顺畅推进', '快速拿到可落地结果'] },
  { q: '理想的职业状态是？', types: ['I', 'A', 'C', 'E'], a: ['钻研技术成为专家', '自由创作不被束缚', '稳定且有社会价值', '带领团队做成大事'] },
];

export function hollandFromQuiz(quiz) {
  const counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  (quiz || []).forEach((ai, qi) => {
    if (ai == null) return;
    const t = QUIZ[qi] && QUIZ[qi].types && QUIZ[qi].types[ai];
    if (t) counts[t]++;
  });
  const ranked = HOLLAND_ORDER.slice().sort((a, b) => counts[b] - counts[a]);
  const top = ranked.filter((t) => counts[t] > 0).slice(0, 3);
  return { counts, top, code: top.slice(0, 2).join('') };
}

// 由兴趣代码 + 专业偏好，推导推荐专业方向（演示示意，非真实 RAG）
export function recommendMajors(quiz, likeMajors, dislikeMajors) {
  const hp = hollandFromQuiz(quiz);
  let picks = [];
  hp.top.forEach((t) => { (HOLLAND[t].majors || []).forEach((m) => picks.push({ ...m, from: t })); });
  const seen = new Set();
  picks = picks.filter((m) => { if (seen.has(m.name)) return false; seen.add(m.name); return true; });
  if (dislikeMajors && dislikeMajors.length) {
    picks = picks.filter((m) => !dislikeMajors.some((d) => m.name.includes(d) || d.includes(m.name)));
  }
  if (likeMajors && likeMajors.length) {
    picks.sort((a, b) => (likeMajors.includes(b.name) ? 1 : 0) - (likeMajors.includes(a.name) ? 1 : 0));
  }
  return { hp, picks: picks.slice(0, 5) };
}
