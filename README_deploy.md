# 高考志愿填报APP - 云部署完整指南

> 本项目已封装好 **Docker 一键部署**，复制到云服务器后，一条命令即可启动。
> 推荐配置: **2核4G内存 + 50G磁盘**，系统 Ubuntu 22.04 LTS（Debian/CentOS 也可）。

---

## 一、部署前准备

### 1.1 本地要做的事（上传之前）
1. 确认 **`高考志愿填报数据库/`** 文件夹里的 Markdown 知识库齐全
2. 确认 **`backend/chroma_db/`** 如果本地已导入，可一起上传（省云服务器上导入时间）

### 1.2 云服务器要做的事
1. 购买一台 **Ubuntu 20.04/22.04 LTS** 云服务器（阿里云/腾讯云/华为云/轻量应用服务器都可）
2. 在 **云控制台-安全组/防火墙** 中开放以下端口:
   | 端口 | 协议 | 用途 | 必须? |
   |------|------|------|-------|
   | 22   | TCP  | SSH远程登录 | ✅ 是 |
   | 80   | TCP  | HTTP访问前端 | ✅ 是 |
   | 443  | TCP  | HTTPS（有域名时才用） | ⭕ 推荐 |

3. 用 SSH 工具（FinalShell、Xshell、Termius）登录服务器

### 1.3 推荐的文件上传方式
Windows 用户推荐用 **FinalShell** 或 **WinSCP**，把整个项目目录上传到:
```
/opt/gaokao-app/
```
(或其他你喜欢的路径，比如 `/root/gaokao-app/`)

---

## 二、一键部署（最简单的方式）

SSH 登录云服务器后，进入项目目录，执行 **2条命令**:

```bash
# 1. 进入项目根目录（你上传的路径）
cd /opt/gaokao-app

# 2. 给脚本加权限并执行
chmod +x deploy/*.sh && sudo deploy/install.sh
```

**脚本会自动帮你做以下所有事情**:
- ✅ 自动安装 Docker 和 Docker Compose
- ✅ 创建数据目录并设置权限
- ✅ 自动生成 `.env` 配置和随机 SECRET_KEY
- ✅ 构建前端和后端镜像
- ✅ 启动所有容器
- ✅ 自动导入 RAG 知识库（首次部署时）
- ✅ 打印访问地址和服务状态

**等待几分钟**，看到最后输出 `http://你的服务器IP` 就完成了。

> 💡 首次构建可能较慢（5-15分钟，取决于网络和服务器配置）。

---

## 三、部署后验证

### 3.1 确认服务状态
```bash
cd /opt/gaokao-app
docker compose ps
```
两个服务 **State** 都是 `Up (healthy)` 就正常。

### 3.2 浏览器访问
打开浏览器访问 **http://你的服务器公网IP**
- 能看到前端首页: ✅ 正常
- 随便点个功能，接口不出错: ✅ 正常

### 3.3 接口健康检查
```bash
curl http://127.0.0.1/api/health
```
返回 JSON 包含 `"ok": true` 就是正常。

### 3.4 查看日志
```bash
# 查看所有服务日志
docker compose logs -f

# 只看后端
docker compose logs -f backend

# 只看前端Nginx
docker compose logs -f frontend
```

---

## 四、绑定域名 + 配置 HTTPS（强烈推荐）

### 4.1 域名解析
在你的域名管理后台（阿里云/腾讯云/Cloudflare），添加一条 A 记录:
```
主机记录: @ 或 www
记录类型: A
记录值: 你的服务器公网IP
TTL: 默认
```

等几分钟解析生效。

### 4.2 申请免费 SSL 证书（Let's Encrypt）
```bash
# 1. 安装 certbot
sudo apt update && sudo apt install -y certbot

# 2. 申请证书（把 your-domain.com 换成你真实的域名）
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 3. 验证证书生成
sudo ls /etc/letsencrypt/live/your-domain.com/
# 有 fullchain.pem 和 privkey.pem 就成功了
```

### 4.3 部署外层 Nginx（宿主机入口）

如果你 **没有其他网站** 在云服务器上运行，可以跳过这一步——
直接用 Docker 的 80 端口暴露即可。

如果需要 **和其他服务共存** 或 **启用 HTTPS**:

1. **修改 `deploy/nginx.host.conf`** 中 3 处 `your-domain.com` 为你真实的域名
2. **修改 docker-compose.yml** 中 frontend 的端口映射，把 `80:80` 改成 `8080:80`（或其他非80端口）
3. 在宿主机安装 Nginx 并启用:

```bash
# 安装宿主机Nginx
sudo apt install -y nginx

# 复制配置
sudo cp /opt/gaokao-app/deploy/nginx.host.conf /etc/nginx/conf.d/gaokao.conf

# 检查配置语法
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx

# 设为开机自启
sudo systemctl enable nginx
```

浏览器访问 `https://你的域名` 就能看到小绿锁 🔒

### 4.4 HTTPS 证书自动续期
Let's Encrypt 证书有效期90天，添加一个定时任务自动续期:
```bash
sudo crontab -e
# 追加一行:
0 3 * * 0 certbot renew --quiet && systemctl reload nginx
```
（每周日凌晨3点自动尝试续期）

---

## 五、日常维护命令

所有命令都要在 **项目根目录** 执行:

| 操作 | 命令 |
|------|------|
| 查看服务状态 | `docker compose ps` |
| 查看实时日志 | `docker compose logs -f backend` |
| 重启所有服务 | `docker compose restart` |
| 停止所有服务 | `docker compose down` |
| 重新启动 | `docker compose up -d` |
| 更新代码后重新部署 | `sudo deploy/update.sh` |
| 更新知识库后重新导入 | `sudo deploy/update.sh --reingest` |
| 备份数据 (一键打包) | `sudo tar -czf gaokao-backup-$(date +%Y%m%d).tar.gz data/ .env` |

### 更新知识库
1. 用新的 Markdown 文件覆盖 **`高考志愿填报数据库/`**
2. 执行:
   ```bash
   sudo deploy/update.sh --reingest
   ```
   脚本会清除旧向量库 → 重新导入 → 重启后端。

---

## 六、数据备份（必须做）

所有业务数据都在 **`data/`** 目录和 **`.env`** 文件里:
```
data/
  └── backend/
      ├── instance/gaokao.db     ← SQLite数据库（用户、收藏、等）
      └── chroma_db/             ← RAG向量库
  └── frontend/logs/             ← Nginx访问日志
.env                              ← 配置文件（含SECRET_KEY）
```

建议每周备份一次，也可以加定时任务:
```bash
sudo crontab -e
# 追加:
0 2 * * * cd /opt/gaokao-app && tar -czf /root/backups/gaokao-backup-$(date +\%Y\%m\%d).tar.gz data/ .env
```

恢复备份:
```bash
cd /opt/gaokao-app
docker compose down
tar -xzf gaokao-backup-YYYYMMDD.tar.gz
docker compose up -d
```

---

## 七、常见问题 FAQ

### Q1: 一键脚本执行到一半断网/失败？
直接重复执行即可，脚本是幂等的（重复执行不会损坏数据）:
```bash
sudo deploy/install.sh
```

### Q2: 浏览器访问 80 端口打不开？
- 检查 **云服务商安全组** 是否开放 **80端口**
- 检查服务器内部防火墙:
  ```bash
  # Ubuntu/Debian
  sudo ufw status
  sudo ufw allow 80
  sudo ufw reload
  ```

### Q3: 知识库导入失败 / 空？
检查 `高考志愿填报数据库/` 下是否真的有 `.md` 文件。然后手动导入:
```bash
docker exec -it gaokao-backend python ingest_docs.py --path /app/高考志愿填报数据库
```

### Q4: 服务器配置太低（2核2G）跑不动？
编辑 `docker-compose.yml` 修改资源限制:
```yaml
backend:
  deploy:
    resources:
      limits:
        memory: 1G    # 改小
        cpus: '1.0'   # 改小
```
同时修改 `gunicorn workers` 数量（Dockerfile里: `--workers 2`）

### Q5: 如何升级到 MySQL/PostgreSQL？
修改 `.env`:
```bash
DATABASE_URL=mysql+pymysql://user:pass@host:3306/gaokao
```
并在 `docker-compose.yml` 添加一个数据库服务（MySQL/PostgreSQL），把 backend 依赖它。

### Q6: 接口502 Bad Gateway？
后端没起来，查看日志排查:
```bash
docker compose logs backend --tail 100
```
常见原因: 权限不足、端口被占用、数据损坏。

### Q7: 想修改前端API地址？
前端打包的API地址是相对路径 `/api`，由前端Nginx转发到后端容器，
所以 **无需修改** ，不管域名/IP怎么变都能自动适配。

---

## 八、项目结构一览（部署相关文件）
```
高考志愿填报APP/
├── backend/
│   ├── Dockerfile              ← 后端镜像 (Python 3.11 + Gunicorn)
│   └── requirements.txt
├── frontend/
│   ├── Dockerfile              ← 前端镜像 (两阶段: Node 构建 + Nginx 托管)
│   └── nginx.conf              ← 前端Nginx内部配置(SPA + API代理)
├── deploy/
│   ├── install.sh              ← ★ 一键部署脚本
│   ├── update.sh               ← ★ 一键更新脚本
│   └── nginx.host.conf         ← 宿主机外层Nginx模板(HTTPS用)
├── docker-compose.yml          ← Docker Compose编排
├── .env.example                ← 环境变量模板
└── README_deploy.md            ← 本文档
```

---

## 九、极简 3 步速记（不想看长文档看这里）

```bash
# 1. 上传项目到 /opt/gaokao-app 后 SSH 登录
cd /opt/gaokao-app

# 2. 一键部署
chmod +x deploy/*.sh && sudo deploy/install.sh

# 3. 更新代码时
sudo deploy/update.sh
# 更新知识库时
sudo deploy/update.sh --reingest
```

**有问题先看日志:** `docker compose logs -f`
