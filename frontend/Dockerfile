# ============================================================
# 前端 Dockerfile - 生产环境
# 两阶段构建:
#   Stage 1: Node.js 18 - 构建静态文件
#   Stage 2: Nginx Alpine - 托管静态文件 + 反向代理API
# ============================================================

# ========== Stage 1: 构建阶段 ==========
FROM node:18-alpine AS build-stage

LABEL maintainer="gaokao-app"

# 设置工作目录
WORKDIR /app

# 复制依赖清单（利用Docker缓存）
COPY package*.json ./

# 安装npm依赖（国内镜像加速）
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --no-audit --no-fund

# 复制源码
COPY . .

# 构建生产包
RUN npm run build

# ========== Stage 2: 运行阶段 ==========
FROM nginx:1.25-alpine AS production-stage

LABEL maintainer="gaokao-app"
LABEL description="高考志愿填报APP - 前端服务"

# 设置时区
ENV TZ=Asia/Shanghai

# 复制构建产物到Nginx静态目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
