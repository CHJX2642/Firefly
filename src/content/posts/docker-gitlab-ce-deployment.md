---
title: Docker 部署 GitLab CE 完整指南 — 从零搭建私有代码仓库
published: 2026-07-22
description: Windows 环境下使用 Docker Desktop 部署 GitLab CE，包含 WSL2 资源配置、中文汉化、项目创建和代码推送完整流程。
tags: [Docker, GitLab, DevOps, 代码管理, WSL2]
category: 技术教程
draft: false
image: ./images/gitlab-ce-cover.png
---

## 🚀 前言

GitLab CE（Community Edition）是一个功能强大的开源代码托管平台，支持代码仓库管理、CI/CD、Issue 追踪、代码审查等功能。对于团队协作和个人项目管理来说，搭建一个私有的 GitLab 服务是非常有价值的。

本文将详细介绍如何在 Windows 环境下，使用 Docker Desktop 部署 GitLab CE，包括：

1. WSL2 资源配置（防止内存不足）
2. Docker 环境准备
3. GitLab 容器部署
4. 中文界面设置
5. 项目创建和代码推送

## 📋 环境要求

- **操作系统**：Windows 10/11
- **Docker**：Docker Desktop（WSL2 后端）
- **内存**：至少 8GB（推荐 16GB）
- **磁盘空间**：至少 20GB 可用空间

## 一、配置 WSL2 资源（关键前置步骤）

GitLab 最低建议内存 **4GB**，默认 WSL 无资源限制，极易出现 502 网关错误、启动卡死。

> 💡 **为什么需要配置 WSL2 资源？**
> Windows 下 Docker Desktop 依托 WSL2 运行，限制 WSL 资源即可限制 Docker 资源。如果不配置，GitLab 可能因内存不足而无法启动。

### 步骤 1：新建 WSL 配置文件

1. 打开文件资源管理器，进入路径：
   ```
   C:\Users\你的Windows用户名\
   ```
   示例：`C:\Users\chenjiaxu\`

2. 在该目录新建文件，文件名：`.wslconfig`

> ⚠️ **重点**：新建文本文档后重命名，把 `.txt` 后缀彻底删除；如果看不到后缀，文件管理器勾选【查看→文件扩展名】

### 步骤 2：写入配置内容

用记事本打开 `.wslconfig`，粘贴下面配置：

```ini
[wsl2]
memory=4GB
processors=2
swap=2GB
```

**参数说明：**

- `memory=4GB`：分配给 WSL 最大内存 4GB（GitLab 最低标准，电脑配置高可改为 6GB）
- `processors=2`：分配 CPU 核心数量，根据电脑调整
- `swap=2GB`：交换分区，缓解内存不足

### 步骤 3：生效配置

1. 关闭 Docker Desktop

2. 以管理员身份打开 PowerShell，执行命令关闭全部 WSL：
   ```powershell
   wsl --shutdown
   ```

3. 重新启动 Docker Desktop，配置生效。

> 💡 **验证方式**：进入 WSL 终端输入 `free -h` 查看内存上限。

## 二、安装 Docker Desktop

1. 官网下载 Docker Desktop 安装包

2. 运行安装程序，**一路默认选项**即可，安装完成后会自动配置 WSL2 后端

3. 启动 Docker，等待引擎加载完成

4. PowerShell 验证环境：
   ```powershell
   docker -v
   docker compose version
   ```

## 三、拉取 GitLab CE 镜像

```powershell
docker pull gitlab/gitlab-ce:latest
```

> 💡 **提示**：GitLab CE 镜像较大（约 2GB），请耐心等待下载完成。

## 四、创建工作目录 + docker-compose.yml

### 4.1 创建目录

```powershell
mkdir D:\Docker\gitlab-work
cd D:\Docker\gitlab-work
```

### 4.2 创建 `docker-compose.yml`

```yaml
version: '3.8'
services:
  gitlab:
    image: gitlab/gitlab-ce:latest
    container_name: gitlab-ce
    restart: always
    ports:
      - "8080:80"
      - "8443:443"
      - "2222:22"
    volumes:
      - D:/Docker/gitlab/config:/etc/gitlab
      - D:/Docker/gitlab/logs:/var/log/gitlab
      - D:/Docker/gitlab/data:/var/opt/gitlab
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'http://localhost:8080'
        gitlab_rails['gitlab_shell_ssh_port'] = 2222
    shm_size: '256m'
```

> ⚠️ **注意**：Windows 路径必须使用 `/`，禁止 `\`

**端口说明：**

- `8080:80`：HTTP 访问端口
- `8443:443`：HTTPS 访问端口
- `2222:22`：SSH 端口（用于 Git 操作）

## 五、启动 GitLab 容器

在 `D:\Docker\gitlab-work` 打开 PowerShell 执行：

```powershell
docker compose up -d
```

查看运行状态：

```powershell
docker ps
```

观察 STATUS 列，等待 `health: starting` → `healthy`。首次启动耗时 3~6 分钟，不要急于访问网页。

日志查看（调试用）：

```powershell
docker logs -f gitlab-ce
```

**停止/重启命令：**

```powershell
# 停止
docker compose down

# 重启
docker compose restart
```

## 六、获取 root 初始管理员密码

```powershell
docker exec -it gitlab-ce grep 'Password:' /etc/gitlab/initial_root_password
```

复制输出的密码，有效期 24 小时。

浏览器访问：`http://localhost:8080`

- **账号**：`root`
- **密码**：粘贴刚才获取的密码

> 💡 **建议**：登录后立即修改密码，确保账户安全。

## 七、GitLab 切换中文界面

> 新版 GitLab 内置简体中文语言包，**无需安装额外插件**，分为【个人界面汉化】和【系统默认语言设置】

### 方式 1：仅当前登录用户切换中文（推荐，立刻生效）

1. GitLab 网页右上角点击 **头像**

2. 下拉菜单选择 **Preferences（偏好设置）**

3. 左侧菜单栏找到 **Localization（本地化）**

4. 找到 `Language` 下拉选项，选择：**简体中文 (zh_CN)**

5. 滑到页面最底部，点击 **Save changes（保存更改）**

6. 刷新页面，界面变为中文。

### 方式 2：设置全站点默认中文（管理员操作，所有新用户默认中文）

1. 使用 root 管理员账号登录

2. 右上角头像 → **管理中心（Admin Area）**

3. 左侧菜单栏：**设置 → 外观（Appearance）**

4. 找到 **Default language（默认语言）**，选择【简体中文 (zh_CN)】

5. 页面底部保存修改。

> ⚠️ **注意**：已经注册的老用户语言不会自动变更，需要用户自行在偏好设置切换。

> ⚠️ **如果下拉找不到简体中文**：镜像版本过旧，重新拉取最新 `gitlab/gitlab-ce` 镜像。

## 八、创建项目、配置 Token、推送代码

### 8.1 创建项目

1. 首页【新建项目】→ 创建空白项目，不要初始化 README

### 8.2 配置访问令牌

1. 头像 → 偏好设置 → **访问令牌 (Access Tokens)**

2. 填写令牌名称，勾选权限：`read_repository、write_repository`

3. 创建，**立即复制令牌（仅显示一次，丢失需要重新生成）**

### 8.3 推送本地代码

本地 Git 命令推送示例：

```powershell
# 进入代码目录
cd 你的本地项目文件夹

git init
git remote set-url origin http://localhost:8080/root/项目名.git
git add .
git commit -m "首次提交实验代码"
git push -u origin main
```

推送弹窗账号密码：
- **用户名**：root
- **密码**：你生成的个人访问令牌

## 九、创建任务看板

1. 进入项目页面

2. 左侧【议题 (Issues)】→【看板 (Boards)】

3. 创建看板，新建列表：待办、进行中、已完成

## 🚫 常见问题与解决方案

### 1. GitLab 502 错误

**原因**：内存不足

**解决方案**：
- 检查 `.wslconfig` 配置是否正确
- 确保分配了至少 4GB 内存
- 关闭其他占用内存的程序

### 2. 无法访问 GitLab 页面

**原因**：容器未完全启动

**解决方案**：
- 等待 3-6 分钟，让 GitLab 完成初始化
- 使用 `docker logs -f gitlab-ce` 查看日志
- 检查端口是否被占用

### 3. 推送代码时提示密码错误

**原因**：GitLab 新版本禁止直接使用 root 密码 push 代码

**解决方案**：**必须使用个人访问令牌**（参考第八节）

### 4. 中文选项找不到

**原因**：镜像版本过旧

**解决方案**：重新拉取最新镜像
```powershell
docker pull gitlab/gitlab-ce:latest
docker compose down
docker compose up -d
```

## 📝 重要避坑汇总

1. WSL `.wslconfig` 文件存放位置必须在当前用户根目录，放错不生效

2. 内存低于 4GB，GitLab 大概率持续 502 无法打开

3. GitLab 新版本禁止直接使用 root 密码 push 代码，**必须使用个人访问令牌**

4. 修改语言仅修改界面显示，仓库地址、分支名称不受影响

5. 重启容器不会丢失数据，数据持久化在 `D:/Docker/gitlab` 目录

## 🎯 总结

通过 Docker 部署 GitLab CE 是一种简单高效的方式，具有以下优势：

- ✅ 部署简单，一键启动
- ✅ 环境隔离，不影响宿主系统
- ✅ 数据持久化，重启不丢失
- ✅ 支持中文界面，使用友好
- ✅ 完整的代码管理功能

搭建完成后，你就可以拥有一个私有的代码托管平台，支持团队协作、代码审查、CI/CD 等功能。

---

*如果你觉得这篇文章对你有帮助，欢迎点赞、收藏、转发！*
