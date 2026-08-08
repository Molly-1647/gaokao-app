import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 配置：React 18 + JSX。
// 数据文件 gaokao-db.js 放在 public/，通过 index.html 的 <script> 引入，
// 挂载到 window.GK_DB，供引擎层（recommend / artRecommend）读取。
// 添加代理配置，将 /api 请求转发到 Flask 后端。
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
