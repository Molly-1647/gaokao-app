# ============================================================
# 全栈一体化 Dockerfile（轻量版 - 无chromadb/sentence-transformers）
# 后端: Flask + Gunicorn + 纯TF-IDF RAG
# 前端: 预构建静态文件
# ============================================================

FROM python:3.11-slim-bullseye

LABEL maintainer="gaokao-app"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai \
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
RUN mkdir -p instance static

# 安装Python依赖（轻量版：无chromadb/sentence-transformers）
COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 复制后端源码
COPY backend/ /app/

# 复制前端预构建产物
COPY backend/static/ /app/static/

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT:-5000}/api/health || exit 1

# 启动Gunicorn
CMD gunicorn \
    --workers 1 \
    --worker-connections 100 \
    --timeout 60 \
    --bind 0.0.0.0:${PORT:-5000} \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    app:create_app('production')
