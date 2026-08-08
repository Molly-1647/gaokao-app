import { create } from 'zustand';

// localStorage 持久化键（刷新可恢复）。
const KEY = 'gk_app_v1';

const DEFAULT_DATA = {
  province: '广东', mode: '3+1+2', first: '物理', score: '588', rank: '30000',
  tiers: ['985', '211', '双一流', '公办'], region: 'want', quiz: [], skipped: false,
  likeMajors: [], dislikeMajors: [], regions: [],
  weights: { major: 34, school: 33, city: 33 },
  isArt: false, artType: [], artScore: '', artCert: [], artRatio: null, artCultureType: null, category: null, track: null,
};

function loadPersisted() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persist(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      screen: state.screen,
      data: state.data,
      plan: state.plan,
      artPlan: state.artPlan,
    }));
  } catch {
    /* 容量或隐私限制时静默失败，不影响主流程 */
  }
}

const persisted = loadPersisted() || {};

export const useAppStore = create((set, get) => ({
  screen: persisted.screen || 'welcome',
  data: { ...DEFAULT_DATA, ...(persisted.data || {}) },
  plan: persisted.plan || null,
  artPlan: persisted.artPlan || null,

  setScreen: (screen) => { set({ screen }); persist(get()); },
  setData: (data) => { set({ data }); persist(get()); },
  setPlan: (plan) => { set({ plan }); persist(get()); },
  setArtPlan: (artPlan) => { set({ artPlan }); persist(get()); },
  reset: () => { set({ screen: 'welcome', data: { ...DEFAULT_DATA }, plan: null, artPlan: null }); persist(get()); },
}));

export { DEFAULT_DATA };
