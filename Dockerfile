# ============================================================
# 全栈一体化 Dockerfile（免费云平台专用 - 简化版）
# 前端已在本地构建为 dist/，Docker 直接复制，无需 Node.js
# 后端: Flask + Gunicorn + Chroma向量库
# ============================================================

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

# 创建必要目录
RUN mkdir -p instance chroma_db static

# 安装Python依赖
COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn==21.2.0

# 复制后端源码
COPY backend/ /app/

# 复制前端预构建产物（已在本地 npm run build）
COPY frontend/dist/ /app/static/

# 复制Chroma向量库（已导入2549个知识块）
COPY backend/chroma_db/ /app/chroma_db/

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
