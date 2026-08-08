#!/bin/bash
# ============================================================
# 项目更新脚本 - 代码/知识库更新后执行
# 用法:
#   sudo deploy/update.sh                # 更新代码并重启
#   sudo deploy/update.sh --reingest     # 更新代码 + 重新导入RAG知识库
#   sudo deploy/update.sh --no-rebuild   # 只重启不重新构建
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# 参数解析
REINGEST=false
REBUILD=true
for arg in "$@"; do
    case $arg in
        --reingest)   REINGEST=true ; shift ;;
        --no-rebuild) REBUILD=false; shift ;;
        *) ;;
    esac
done

if [ "$EUID" -ne 0 ]; then
    log_error "请使用 sudo 或 root 用户运行本脚本"
    exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# ----------------------------
# 1. 重新构建镜像（如需要）
# ----------------------------
if [ "$REBUILD" = true ]; then
    log_info "重新构建镜像..."
    docker compose build
else
    log_info "跳过镜像构建 (--no-rebuild)"
fi

# ----------------------------
# 2. 重启容器
# ----------------------------
log_info "重启服务..."
docker compose down --remove-orphans
docker compose up -d

# ----------------------------
# 3. 等待后端就绪
# ----------------------------
log_info "等待后端启动..."
for i in $(seq 1 30); do
    sleep 3
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' gaokao-backend 2>/dev/null || echo "starting")
    if [ "$STATUS" = "healthy" ]; then
        break
    fi
    echo -n "."
done

# ----------------------------
# 4. 重新导入知识库（如需要）
# ----------------------------
if [ "$REINGEST" = true ]; then
    log_info "开始重新导入RAG向量库..."
    docker exec gaokao-backend python -c "
import shutil, os
path = '/app/chroma_db'
if os.path.exists(path):
    shutil.rmtree(path)
os.makedirs(path, exist_ok=True)
print('旧向量库已清除')
" || true

    docker exec gaokao-backend python ingest_docs.py --path /app/高考志愿填报数据库 && \
        log_info "知识库重新导入成功！" || \
        log_warn "知识库导入失败，请检查日志"

    # 重启后端加载新的向量库
    log_info "重启后端容器加载新向量库..."
    docker compose restart backend
fi

echo ""
log_info "更新完成！"
docker compose ps
