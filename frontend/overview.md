# 高考志愿填报 APP 前端 — 交付概览

## TL;DR
单文件 HTML 交互原型已工程化为**可运行的 Vite + React 18（原生 JSX）**前端项目，44 个文件，QA 静态验证通过。

## 交付概览
- **状态**：✅ 已交付（QA 通过）
- **验证**：引擎自测 + 全量 import/export 交叉核对通过；真实浏览器回归待用户本地执行
- **已知问题**：0 个代码缺陷；2 项轻微项（见「遗留与建议」）

## 技术栈
Vite 5 + React 18 + 原生 JSX｜自定义组件库 + CSS 变量（破晓金橙 + 晨曦天蓝）｜zustand + localStorage｜html2canvas + jspdf 导出｜自研 SVG 雷达图（无图表库）

## 核心文件清单
- 配置：`package.json` / `vite.config.js` / `index.html`
- 设计系统：`src/design/{tokens,IosFrame,uiStyles}.*`、`src/styles/{tokens,global}.css`
- 组件（8）：`src/components/{TopBar,PrimaryBtn,GhostBtn,Card,RadarChart,Field,Section,RiskRow,Chips}.jsx`
- 引擎（3）：`src/engine/{recommend,artRecommend,interest}.js`
- 状态：`src/store/useAppStore.js`
- 数据：`src/data/demoPlan.js`、`public/gaokao-db.js`（`window.GK_DB`）
- 屏（13）：`src/screens/*.jsx`
- 导出：`src/export/exportPlan.js`

## 用户下一步
1. `cd "D:\AI 产品经理学习\高考志愿填报APP\frontend"`
2. `npm install`
3. `npm run dev` → 打开 http://localhost:5173 预览
4. `npm run build` 验证生产打包
5. 人工回归：主链路（信息收集 → 测评 → 专业匹配 → 生成方案 → 详情 → 决策解释）、特长生链路、导出 PDF/图片/文本

## 遗留与建议
- 沙箱无网络，未跑 `npm` 构建与浏览器渲染，请本地执行上述命令完成最终验收。
- `artRecommend` 文档入参名（culture/art）与真实（score/artScore）不一致，已确认为文档措辞问题，代码无误。
- 建议在 `global.css` 引入 Google Fonts（Noto Serif/Sans SC）以完全还原原型字体。
- 详情卡文案（reason/rag/employ/risk/radar）来自原型 demo 数据，保留「演示示意，非真实 RAG 结论」免责声明，待后端 RAG 接入替换。
