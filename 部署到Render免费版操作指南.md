# 免费云端部署操作指南（Render版）

> 已为你准备好全部代码和配置，跟着下面的步骤操作即可。
> 全程 **零费用**，不需要信用卡，不需要服务器。
> 预计耗时：**15-20分钟**（大部分是等构建）

---

## 第一阶段：注册 GitHub（3分钟）

GitHub 是代码托管平台，Render 会从这里自动拉取你的代码并部署。

### 1.1 注册账号
1. 打开 **https://github.com/signup**
2. 输入你的邮箱（推荐QQ邮箱/163邮箱/Gmail都行）
3. 设置一个密码
4. 用户名用英文（比如 `gaokao2026`）
5. 完成验证码，点 **Create account**
6. 去邮箱收验证码，输入确认

### 1.2 创建代码仓库
1. 登录后，点右上角 **+** 号 → **New repository**
2. **Repository name** 填: `gaokao-app`
3. **Description**（可选）: `高考志愿填报APP`
4. 选择 **Public**（必须选公开，Render免费版只能部署公开仓库）
5. **不要**勾选 "Add a README file"
6. 点 **Create repository**
7. 你会看到一个页面，上面有你的仓库地址，格式类似:
   ```
   https://github.com/你的用户名/gaokao-app.git
   ```
   **把这个地址记下来！** 后面要用。

### 1.3 创建 Personal Access Token（推送代码用）
1. 点右上角头像 → **Settings**
2. 左侧菜单最下方 → **Developer settings**
3. 左侧 → **Personal access tokens** → **Tokens (classic)**
4. 点 **Generate new token** → **Generate new token (classic)**
5. **Note** 填: `push-code`
6. **Expiration** 选: `30 days`
7. 勾选 **repo**（第一个大选项，勾上后下面的子项会自动全选）
8. 拉到最下面点 **Generate token**
9. 会显示一串以 `ghp_` 开头的字符串，**立刻复制保存！**（关掉就看不到了）

---

## 第二阶段：推送代码到 GitHub（2分钟）

注册完 GitHub 后，回来告诉我，我会帮你把代码推上去。

或者你自己执行（在项目目录下）：

### 2.1 设置 Git 身份
打开 PowerShell，执行（把名字和邮箱换成你的）：
```powershell
cd "d:\AI 产品经理学习\高考志愿填报APP"
$env:Path = "D:\Git\cmd;" + $env:Path
git config user.name "你的GitHub用户名"
git config user.email "你的邮箱@example.com"
```

### 2.2 关联远程仓库并推送
```powershell
# 把下面 URL 换成你自己的仓库地址
git remote add origin https://github.com/你的用户名/gaokao-app.git
git branch -M main
git push -u origin main
```
推送时会弹出登录框（或命令行输入）：
- **用户名**: 你的GitHub用户名
- **密码**: 粘贴刚才保存的 Token（`ghp_`开头的那串，不是你的账号密码！）

看到类似 `main -> main` 就成功了。

---

## 第三阶段：注册 Render 并部署（5分钟注册 + 10分钟构建）

### 3.1 注册 Render
1. 打开 **https://render.com**
2. 点右上角 **Sign Up**
3. 选 **GitHub** 登录（用刚注册的GitHub账号）
4. 授权 Render 访问你的 GitHub

### 3.2 创建服务
1. 登录后，点 **New +** → **Web Service**
2. 找到你刚创建的 `gaokao-app` 仓库，点 **Connect**
3. 填写配置:
   - **Name**: `gaokao-volunteer`（会变成你的网址一部分）
   - **Region**: `Singapore`（新加坡，国内访问最快）
   - **Branch**: `main`
   - **Runtime**: 会自动检测到 Docker（因为有 Dockerfile）
   - **Instance Type**: 选 **Free**（免费版）
4. 点 **Create Web Service**

### 3.3 等待构建
- Render 会自动:
  1. 拉取代码 (1分钟)
  2. Node.js 构建前端 (2-3分钟)
  3. Python 安装依赖 (3-5分钟)
  4. 打包 Docker 镜像 (2-3分钟)
  5. 启动服务 (1分钟)
- 总计约 **5-15分钟**
- 页面上会显示实时构建日志，看到 `Your service is live` 就成功了！

### 3.4 访问你的APP
构建完成后，页面顶部会显示你的网址:
```
https://gaokao-volunteer.onrender.com
```
点开就能用了！把这个链接发给别人也能访问。

---

## 注意事项

### 关于休眠（冷启动）
- Render 免费版会在 **15分钟无访问** 后自动休眠
- 下次访问时需要 **30-60秒** 冷启动
- 等一会儿就能打开，不是坏了

### 关于数据
- 免费版 **没有持久磁盘**，服务重启后用户数据会清空
- 但 RAG 知识库（向量库）打包在镜像里，**不会丢**
- 自己试用完全没问题

### 关于更新
- 以后改了代码，只需要在本地 `git push` 到 GitHub
- Render 会自动检测到新代码并重新部署

---

## 极简速查（看完上面的再看这个）

| 步骤 | 在哪做 | 做什么 |
|------|--------|--------|
| 1 | github.com | 注册账号 |
| 2 | github.com | 创建 Public 仓库 `gaokao-app` |
| 3 | github.com | 创建 Token（勾选repo权限） |
| 4 | 本地终端 | `git push` 推送代码（我帮你做） |
| 5 | render.com | 用GitHub登录 |
| 6 | render.com | New Web Service → 选仓库 → Free → 部署 |
| 7 | 等待 | 5-15分钟自动构建 |
| 8 | 浏览器 | 打开 `https://xxx.onrender.com` 试用 |
