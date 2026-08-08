# ============================================================
# 全栈一体化 Dockerfile（免费云平台专用）
# Stage 1: Node.js 构建前端
# Stage 2: Python 后端 + 前端静态文件 + Chroma向量库
# 最终镜像只有一个服务: Flask 托管前端 + 提供API
# ============================================================

# ========== Stage 1: 构建前端 ==========
FROM node:18-alpine AS frontend-build

WORKDIR /build

# 复制前端依赖清单（利用缓存层）
COPY frontend/package*.json ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --no-audit --no-fund

# 复制前端源码并构建
COPY frontend/ ./
RUN npm run build

# ========== Stage 2: 后端 + 前端静态文件 ==========
FROM python:3.11-slim-bullseye

LABEL maintainer="gaokao-app"
LABEL description="高考志愿填报APP - 全栈一体化（免费云部署版）"

# 环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai \
    FORCE_TFIDF=1 \
    FLASK_ENV=production \
    FLASK_CONFIG=production \
    PORT=5000

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 安装Python依赖
COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn==21.2.0

# 复制后端源码
COPY backend/ /app/

# 复制前端构建产物到 static 目录（Flask托管）
COPY --from=frontend-build /build/dist/ /app/static/

# 复制Chroma向量库（已导入2549个知识块，29MB）
COPY backend/chroma_db/ /app/chroma_db/

# 复制知识库源文件（供首次导入用）
COPY 高考志愿填报数据库/ /app/高考志愿填报数据库/

# 暴露端口（Render会通过PORT环境变量指定）
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT:-5000}/api/health || exit 1

# 启动Gunicorn（读取PORT环境变量，适配Render动态端口）
CMD sh -c "gunicorn \
    --workers 2 \
    --worker-connections 500 \
    --timeout 60 \
    --bind 0.0.0.0:${PORT:-5000} \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    app:create_app('production')"
