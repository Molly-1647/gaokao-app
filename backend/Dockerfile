# ============================================================
# 后端 Dockerfile - 生产环境
# 基础镜像: Python 3.11 Alpine
# WSGI服务器: Gunicorn (多进程 + gevent异步)
# ============================================================

FROM python:3.11-slim-bullseye

LABEL maintainer="gaokao-app"
LABEL description="高考志愿填报APP - 后端服务"

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai \
    # 强制TF-IDF离线模式（无需下载模型）
    FORCE_TFIDF=1 \
    # Flask环境
    FLASK_ENV=production \
    FLASK_CONFIG=production

# 安装系统依赖（SQLite、编译工具等）
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    sqlite3 \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建工作目录
WORKDIR /app

# 创建数据存储目录
RUN mkdir -p /app/chroma_db /app/instance /app/data && \
    chmod 755 /app/chroma_db /app/instance /app/data

# 复制依赖清单并安装
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn==21.2.0 gevent==23.9.1

# 复制应用源码
COPY . /app/

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://127.0.0.1:5000/api/health || exit 1

# 启动Gunicorn生产服务器
# - 4个worker进程（根据CPU核数调整）
# - 异步worker: gevent
# - 超时60秒
CMD ["gunicorn", \
    "--worker-class", "gevent", \
    "--workers", "4", \
    "--worker-connections", "1000", \
    "--timeout", "60", \
    "--keep-alive", "5", \
    "--max-requests", "1000", \
    "--max-requests-jitter", "200", \
    "--bind", "0.0.0.0:5000", \
    "--access-logfile", "-", \
    "--error-logfile", "-", \
    "--log-level", "info", \
    "app:create_app('production')"]
