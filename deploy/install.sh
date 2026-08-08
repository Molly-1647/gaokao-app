#!/bin/bash
# ============================================================
# 一键部署脚本 (云服务器用，适用于 Ubuntu 20.04+/Debian 10+/CentOS 7+)
#
# 用法:
#   1. 将整个项目上传到云服务器后，在项目根目录下执行:
#      chmod +x deploy/install.sh && sudo deploy/install.sh
#
# 功能:
#   1. 自动检查/安装 Docker 和 Docker Compose
#   2. 创建必要的目录和权限
#   3. 复制 .env.example 为 .env (如不存在)
#   4. 初始化RAG向量库 (首次部署时导入知识库)
#   5. 构建并启动所有容器
#   6. 打印访问地址和状态
# ============================================================

set -e

# ----------------------------
# 颜色输出
# ----------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ----------------------------
# 1. 检查 root 权限
# ----------------------------
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 sudo 或 root 用户运行本脚本"
    exit 1
fi

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

log_info "项目目录: $PROJECT_DIR"

# ----------------------------
# 2. 检查/安装 Docker
# ----------------------------
log_info "检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    log_warn "Docker 未安装，开始安装..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh || \
    curl -fsSL https://get.daocloud.io/docker -o /tmp/get-docker.sh
    sh /tmp/get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm -f /tmp/get-docker.sh
    log_info "Docker 安装完成"
else
    log_info "Docker 已安装: $(docker --version)"
fi

# ----------------------------
# 3. 检查/安装 Docker Compose 插件
# ----------------------------
log_info "检查 Docker Compose..."
if ! docker compose version &> /dev/null; then
    log_warn "Docker Compose 插件未安装，开始安装..."
    apt-get update && apt-get install -y docker-compose-plugin || \
    yum install -y docker-compose-plugin
    log_info "Docker Compose 安装完成"
else
    log_info "Docker Compose 已安装: $(docker compose version)"
fi

# ----------------------------
# 4. 创建数据目录和权限
# ----------------------------
log_info "创建数据目录..."
mkdir -p \
    "$PROJECT_DIR/data/backend/instance" \
    "$PROJECT_DIR/data/backend/chroma_db" \
    "$PROJECT_DIR/data/backend/logs" \
    "$PROJECT_DIR/data/frontend/logs"

# 允许容器读写
chmod -R 755 "$PROJECT_DIR/data"
chown -R 1000:1000 "$PROJECT_DIR/data" 2>/dev/null || true

log_info "数据目录创建完成"

# ----------------------------
# 5. 初始化 .env
# ----------------------------
if [ ! -f "$PROJECT_DIR/.env" ]; then
    log_warn ".env 不存在，从 .env.example 复制..."
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"

    # 自动生成 SECRET_KEY
    NEW_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || \
              openssl rand -hex 32 2>/dev/null || \
              echo "please_change_this_secret_key_manually")

    sed -i "s|^SECRET_KEY=.*|SECRET_KEY=$NEW_KEY|" "$PROJECT_DIR/.env"
    log_info ".env 已创建，SECRET_KEY 已自动生成"
else
    log_info ".env 已存在，跳过"
fi

# ----------------------------
# 6. 检查知识库目录
# ----------------------------
KB_DIR="$PROJECT_DIR/高考志愿填报数据库"
if [ ! -d "$KB_DIR" ] || [ -z "$(ls -A "$KB_DIR" 2>/dev/null)" ]; then
    log_warn "知识库目录 '$KB_DIR' 为空或不存在！RAG功能将使用模拟数据。"
    log_warn "请将 Markdown 知识库上传后，执行: sudo deploy/update.sh --reingest"
else
    log_info "知识库目录存在，准备导入..."
fi

# ----------------------------
# 7. 构建镜像
# ----------------------------
log_info "开始构建 Docker 镜像（首次较慢，请耐心等待）..."
docker compose build

# ----------------------------
# 8. 停止旧容器
# ----------------------------
log_info "停止旧容器（如存在）..."
docker compose down --remove-orphans || true

# ----------------------------
# 9. 启动容器
# ----------------------------
log_info "启动所有服务..."
docker compose up -d

# ----------------------------
# 10. 等待服务就绪并执行RAG导入
# ----------------------------
log_info "等待后端健康检查通过..."
for i in $(seq 1 30); do
    sleep 3
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' gaokao-backend 2>/dev/null || echo "starting")
    if [ "$STATUS" = "healthy" ]; then
        log_info "后端服务启动成功！"
        break
    fi
    echo -n "."
done

# 如果知识库存在，触发向量库导入
if [ -d "$KB_DIR" ] && [ -n "$(ls -A "$KB_DIR" 2>/dev/null)" ] && [ ! -f "$PROJECT_DIR/data/backend/chroma_db/index" ]; then
    log_info "开始导入RAG知识库到向量库（可能需要几分钟）..."
    docker exec gaokao-backend python ingest_docs.py --path /app/高考志愿填报数据库 || \
        log_warn "向量库导入失败，请检查知识库格式"
fi

# ----------------------------
# 11. 打印状态
# ----------------------------
echo ""
echo "============================================================"
log_info "部署完成！服务状态如下:"
echo "============================================================"
docker compose ps

echo ""
echo "============================================================"
echo "  🎉  访问地址"
echo "============================================================"
# 获取公网IP
PUBLIC_IP=$(curl -s --max-time 3 ifconfig.me 2>/dev/null || curl -s --max-time 3 ip.sb 2>/dev/null || echo "你的服务器公网IP")
echo "   前端/接口:  http://$PUBLIC_IP"
echo "   健康检查:   curl http://$PUBLIC_IP/api/health"
echo ""
echo "  📂 数据目录 (宿主机)"
echo "   SQLite DB:  $PROJECT_DIR/data/backend/instance/gaokao.db"
echo "   向量库:     $PROJECT_DIR/data/backend/chroma_db/"
echo "   日志目录:   $PROJECT_DIR/data/backend/logs/ 及 frontend/logs/"
echo ""
echo "  🛠 常用命令 (项目根目录执行)"
echo "   查看状态:   docker compose ps"
echo "   查看日志:   docker compose logs -f [backend|frontend]"
echo "   重启服务:   docker compose restart"
echo "   停止服务:   docker compose down"
echo "   更新部署:   sudo deploy/update.sh"
echo "============================================================"
