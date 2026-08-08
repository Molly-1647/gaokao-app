// 前端API调用模块

const BASE_URL = '/api';

export async function fetchRecommend(data) {
  /**
   * 获取志愿推荐
   * @param {Object} data - 用户数据
   * @param {string} data.province - 省份
   * @param {number} data.rank - 省位次
   * @param {Object} data.weights - 权重配置
   * @param {string} data.score - 分数（可选）
   * @returns {Promise<Object>} 推荐结果
   */
  const response = await fetch(`${BASE_URL}/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function fetchProvinces() {
  /**
   * 获取省份列表
   * @returns {Promise<Array>} 省份列表
   */
  const response = await fetch(`${BASE_URL}/provinces`);
  return response.json();
}

export async function fetchSchools(province) {
  /**
   * 获取指定省份的院校列表
   * @param {string} province - 省份名称
   * @returns {Promise<Array>} 院校列表
   */
  const response = await fetch(`${BASE_URL}/schools?province=${encodeURIComponent(province)}`);
  return response.json();
}

export async function fetchGeneratePlan(data) {
  /**
   * 生成完整志愿方案
   * @param {Object} data - 用户数据
   * @returns {Promise<Object>} 完整方案
   */
  const response = await fetch(`${BASE_URL}/generate_plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function fetchHollandQuiz() {
  /**
   * 获取霍兰德测试题
   * @returns {Promise<Array>} 测试题列表
   */
  const response = await fetch(`${BASE_URL}/holland/quiz`);
  return response.json();
}

export async function fetchHollandAnalyze(answers) {
  /**
   * 分析霍兰德测试结果
   * @param {Array} answers - 答案数组
   * @returns {Promise<Object>} 分析结果
   */
  const response = await fetch(`${BASE_URL}/holland/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answers }),
  });
  return response.json();
}

export async function fetchRagSearch(query) {
  /**
   * RAG检索
   * @param {string} query - 检索词
   * @returns {Promise<Object>} 检索结果
   */
  const response = await fetch(`${BASE_URL}/rag/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  return response.json();
}

export async function saveUserData(data) {
  /**
   * 保存用户数据
   * @param {Object} data - 用户数据
   * @returns {Promise<Object>} 保存结果
   */
  const response = await fetch(`${BASE_URL}/user/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function loadUserData() {
  /**
   * 加载用户数据
   * @returns {Promise<Object>} 用户数据
   */
  const response = await fetch(`${BASE_URL}/user/load`);
  return response.json();
}
