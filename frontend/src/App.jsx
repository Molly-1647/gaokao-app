import React, { useState, useEffect } from 'react';
import { IosFrame } from './design/IosFrame.jsx';
import { useAppStore } from './store/useAppStore.js';
import { recommend, generatePlan } from './engine/recommend.js';
import { artRecommend } from './engine/artRecommend.js';

import { Home } from './screens/Home.jsx';
import { CategorySelect } from './screens/CategorySelect.jsx';
import { InfoCollect } from './screens/InfoCollect.jsx';
import { Assessment } from './screens/Assessment.jsx';
import { MajorFit } from './screens/MajorFit.jsx';
import { Confirm } from './screens/Confirm.jsx';
import { Generating } from './screens/Generating.jsx';
import { PlanOverview } from './screens/PlanOverview.jsx';
import { SchoolDetail } from './screens/SchoolDetail.jsx';
import { DecisionExplain } from './screens/DecisionExplain.jsx';
import { Export } from './screens/Export.jsx';
import { ArtCollect } from './screens/ArtCollect.jsx';
import { ArtPlan } from './screens/ArtPlan.jsx';
import { ArtDetail } from './screens/ArtDetail.jsx';

// 返回映射（与原型 back 链一致，key 改为本工程的屏名）。
const BACK_MAP = {
  track: 'welcome', info: 'track', wiz3: 'info', majorfit: 'wiz3', wiz4: 'majorfit',
  generating: 'wiz4', plan: 'wiz4', detail: 'plan', decision: 'plan', export: 'plan',
  artWiz2: 'track', artPlan: 'artWiz2', artDetail: 'artPlan',
};

export default function App() {
  const screen = useAppStore((s) => s.screen);
  const data = useAppStore((s) => s.data);
  const plan = useAppStore((s) => s.plan);
  const artPlan = useAppStore((s) => s.artPlan);
  const setScreen = useAppStore((s) => s.setScreen);
  const setData = useAppStore((s) => s.setData);
  const setPlan = useAppStore((s) => s.setPlan);
  const setArtPlan = useAppStore((s) => s.setArtPlan);

  const [detailSchool, setDetailSchool] = useState({ item: null, key: null, ctx: null, art: false });
  const [genTarget, setGenTarget] = useState('plan');
  const [isGenerating, setIsGenerating] = useState(false);

  // 刷新后若停留在 transient 的 generating，回退到已有方案或首页。
  useEffect(() => {
    if (screen === 'generating' && !isGenerating) {
      setScreen(plan ? 'plan' : (artPlan ? 'artPlan' : 'welcome'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (s) => setScreen(s);
  const back = () => setScreen(BACK_MAP[screen] || 'welcome');
  const set = (d) => setData(d);

  const onGenerate = async () => {
    setIsGenerating(true);
    setGenTarget('plan');
    go('generating');
    
    try {
      // 使用generatePlan获取完整方案（包含RAG引用、适配度等）
      const result = await generatePlan({
        province: data.province,
        rank: data.rank,
        weights: data.weights,
        score: data.score,
        quiz: data.quiz,
        likeMajors: data.likeMajors,
        dislikeMajors: data.dislikeMajors
      });
      setPlan(result);
    } catch (error) {
      console.error('生成方案失败:', error);
      // 降级使用本地推荐
      const localResult = await recommend(data.province, data.rank, data.weights, data.score);
      setPlan(localResult);
    } finally {
      setIsGenerating(false);
      go('plan');
    }
  };

  const onGenerateArt = () => {
    setIsGenerating(true);
    setArtPlan(artRecommend(data));
    setGenTarget('artPlan');
    go('generating');
    setTimeout(() => {
      setIsGenerating(false);
      go('artPlan');
    }, 1500);
  };

  const onOpen = (item, key) => {
    setDetailSchool({ item, key, ctx: { province: data.province, weights: data.weights, quiz: data.quiz, likeMajors: data.likeMajors, dislikeMajors: data.dislikeMajors }, art: false });
    go('detail');
  };

  const onOpenArt = (item, key) => {
    setDetailSchool({ item, key, ctx: null, art: true });
    go('artDetail');
  };

  let view;
  switch (screen) {
    case 'welcome': view = <Home go={go} />; break;
    case 'track': view = <CategorySelect go={go} set={set} data={data} />; break;
    case 'info': view = <InfoCollect go={go} back={back} data={data} set={set} />; break;
    case 'wiz3': view = <Assessment go={go} back={back} data={data} set={set} />; break;
    case 'majorfit': view = <MajorFit go={go} back={back} data={data} />; break;
    case 'wiz4': view = <Confirm go={go} back={back} data={data} set={set} onGenerate={onGenerate} />; break;
    case 'generating': view = <Generating onDone={() => go(genTarget)} />; break;
    case 'plan': view = <PlanOverview go={go} back={back} onOpen={onOpen} plan={plan} data={data} />; break;
    case 'detail': view = detailSchool.item ? <SchoolDetail back={back} item={detailSchool.item} ctx={detailSchool.ctx} /> : <PlanOverview go={go} back={back} onOpen={onOpen} plan={plan} data={data} />; break;
    case 'decision': view = <DecisionExplain back={back} plan={plan} data={data} />; break;
    case 'export': view = <Export back={back} plan={plan} data={data} />; break;
    case 'artWiz2': view = <ArtCollect go={go} back={back} data={data} set={set} onGenerate={onGenerateArt} />; break;
    case 'artPlan': view = <ArtPlan go={go} back={back} onOpen={onOpenArt} planData={artPlan} data={data} />; break;
    case 'artDetail': view = detailSchool.item ? <ArtDetail back={back} item={detailSchool.item} ctx={detailSchool.ctx} /> : <ArtPlan go={go} back={back} onOpen={onOpenArt} planData={artPlan} data={data} />; break;
    default: view = <Home go={go} />;
  }

  return <IosFrame>{view}</IosFrame>;
}
