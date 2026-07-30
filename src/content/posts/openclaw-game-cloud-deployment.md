---
title: 游戏云服务器部署 OpenClaw：低成本打造专属 AI 助手（支持微信/QQ）
published: 2026-07-30
tags:
  - OpenClaw
  - AI助手
  - 游戏云
  - CentOS
  - 微信
  - QQ
category: 技术教程
description: 使用第三方游戏云服务器低成本部署 OpenClaw 个人 AI 助手，支持微信、QQ等多平台接入，详细记录从零开始的完整部署流程。
pin: false
comment: true
image: images/openclaw-cover.png
---

# 游戏云服务器部署 OpenClaw：低成本打造专属 AI 助手（支持微信/QQ）

> 最近想玩一些随身 AI 助手，对 OpenClaw 比较感兴趣。考虑到很多人没有长时间可运行 OpenClaw 的机器，所以我采用了一个第三方游戏云来跑 OpenClaw。现在记录一下这个部署教程，顺便对比一下各种部署方案的优缺点。OpenClaw 支持接入微信、QQ、Telegram 等 25+ 消息平台，让 AI 助手真正融入你的日常生活。

## 为什么选择游戏云？

### 部署方案对比

| 方案 | 优点 | 缺点 | 适合人群 |
|------|------|------|----------|
| **Windows 电脑** | 部署简单、图形界面友好 | 需要长时间开机、耗电、占用电脑资源 | 有闲置电脑且不关机的用户 |
| **MacBook/Mac** | 系统稳定、功耗低 | 需要长时间开盖、合盖会休眠、价格贵 | 已有 Mac 的用户 |
| **云服务器（阿里云/腾讯云）** | 24小时运行、公网IP、稳定 | 价格较贵（4核8G约100+/月）、需要一定配置能力 | 有预算、需要公网访问的用户 |
| **游戏云** | **价格便宜（几块到几十块/月）、24小时运行、配置简单** | 端口需要额外配置、部分功能受限 | **预算有限、想体验AI助手的用户** |

### 为什么选游戏云？

1. **成本低**：游戏云服务器价格通常是普通云服务器的 1/3 到 1/10
2. **24小时在线**：服务器长期运行，AI 助手随时可用
3. **无需本地机器**：不用占用你的 Windows 或 Mac
4. **配置简单**：CentOS 系统，命令行操作即可

> 💡 **注意**：游戏云和普通云服务器的主要区别在于：
> - 游戏云通常端口限制较多，需要手动开放
> - 带宽和网络质量可能不如普通云服务器
> - 适合跑轻量级服务，不太适合高并发场景

**📦 项目地址：** [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)

**📚 官方文档：** [https://docs.openclaw.ai](https://docs.openclaw.ai)

---

## 1. 连接服务器

### 1.1 SSH 远程连接

使用 Windows PowerShell 连接服务器：

```powershell
# your-server-ip = 你的服务器IP地址（如 123.45.67.89）
# your-port = 你的SSH端口号（如 50234，从服务器控制台查看）
ssh root@your-server-ip -p your-port
```

> 💡 **端口说明**：游戏云服务器的 SSH 端口可能不是默认的 22，具体端口请查看你的服务器控制台。

### 1.2 解决旧密钥冲突

如果出现报错，可能是因为有旧密钥冲突，执行以下命令清除：

```powershell
# 将 your-server-ip 和 your-port 替换为你的实际信息
ssh-keygen -R [your-server-ip]:your-port
```

然后重新连接即可。

### 1.3 输入密码

连接成功后，输入 root 账号的密码登录服务器。

---

## 2. 系统初始化

### 2.1 更新系统

```bash
dnf upgrade -y
```

### 2.2 设置时区

```bash
timedatectl set-timezone Asia/Shanghai
```

### 2.3 安装基础依赖

```bash
dnf install -y curl git gcc gcc-c++ make ca-certificates firewalld
```

---

## 3. 安装 OpenClaw

### 3.1 运行安装脚本

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### 3.2 完成安装引导

安装过程中会有几个交互步骤：

**第一步：确认安装**

第一次跑完脚本后输入 `yes` 确认安装。

**第二步：配置大模型密钥**

第二次跑完后会询问是否配置大模型密钥：
- 如果你有 API Key → 输入 `yes`
- 如果没有 → 输入 `no`

> 💡 **建议**：提前准备好 OpenAI、Claude 或其他模型提供商的 API Key。

**第三步：选择模型提供商**

使用上下箭头和回车选择你的模型提供商（如 OpenAI、Anthropic 等）。

**第四步：输入 API Key**

选择密钥类型后，输入你的模型 API Key 并回车。

**第五步：设置默认模型**

有三个选项：
- `Keep current` - 保持当前模型（如果没有其他要求，选这个即可）
- `Enter model manually` - 手动输入模型名称
- `Browse all models` - 浏览全部可用模型

建议选择 `Keep current`，后续可以再调整。

---

## 4. 启动网关

### 4.1 退出安装界面

按 `Ctrl+C` 退出 OpenClaw 界面，或者新开一个终端。

### 4.2 启动网关服务

```bash
openclaw gateway start
```

### 4.3 确认运行状态

```bash
openclaw gateway status
```

看到类似以下输出表示启动成功：

```
Gateway running on port 18789
```

---

## 5. 获取网关 Token

### 5.1 读取配置文件

```bash
cat ~/.openclaw/openclaw.json
```

在输出的 JSON 内容中找到 `token` 字段，这个令牌用于后续登录 Web 控制台。

> ⚠️ **重要**：请妥善保管你的 Token，不要泄露给他人。

---

## 6. 本地访问 Web 控制台

### 6.1 开启 SSH 隧道

**新开一个 PowerShell 终端**，执行以下命令开启端口转发：

```powershell
# 将 your-server-ip 和 your-port 替换为你的实际信息
ssh -L 18789:127.0.0.1:18789 root@your-server-ip -p your-port
```

> 💡 **原理**：将本地的 18789 端口转发到服务器的 18789 端口，这样就可以在本地访问服务器上的 OpenClaw Web 界面。

### 6.2 访问 Web 界面

隧道建立后，打开浏览器访问：

```
http://127.0.0.1:18789/
```

### 6.3 登录控制台

在登录页面输入之前获取的 Token 即可登录。

### 6.4 日常使用

之后每次需要打开 Web 页面，只需要运行隧道命令即可：

```powershell
# 将 your-server-ip 和 your-port 替换为你的实际信息
ssh -L 18789:127.0.0.1:18789 root@your-server-ip -p your-port
```

---

## 7. 常见问题

### SSH 连接被拒绝

```powershell
# 检查端口是否正确
ssh root@服务器IP -p 端口号

# 如果还是不行，尝试清除旧密钥
ssh-keygen -R [服务器IP]:端口号
```

### 安装脚本执行失败

```bash
# 检查网络连接
ping openclaw.ai

# 检查基础依赖是否安装
dnf install -y curl git
```

### 网关启动失败

```bash
# 查看详细日志
openclaw gateway --verbose

# 检查端口占用
netstat -tlnp | grep 18789
```

### 无法访问 Web 界面

1. 确认 SSH 隧道已建立
2. 确认浏览器访问的是 `http://127.0.0.1:18789/`
3. 检查服务器网关是否运行：`openclaw gateway status`

---

## 8. 常用管理命令

```bash
# 启动网关
openclaw gateway start

# 停止网关
openclaw gateway stop

# 重启网关
openclaw gateway restart

# 查看状态
openclaw gateway status

# 查看日志
openclaw gateway logs

# 前台调试模式
openclaw gateway --verbose

# 更新 OpenClaw
openclaw update
```

---

## 9. 接入微信和 QQ

### 🎯 傻瓜式操作（推荐）

OpenClaw 本身就是 AI 助手，你可以直接告诉它你想接入什么平台！

**在 Web 控制台的对话框中输入：**

```
我要接入微信
```

或者：

```
我要接入QQ
```

OpenClaw 会自动：
1. 安装对应的插件
2. 配置相关参数
3. 生成登录二维码或指引你完成设置

> 💡 **提示**：这种方式最简单，AI 会一步步引导你完成所有配置。

---

### 📝 手动配置（进阶）

如果你想了解具体配置过程，可以参考下面的手动配置教程。

---

## 10. 配置微信接入（手动）

OpenClaw 通过腾讯官方的 `@tencent-weixin/openclaw-weixin` 插件连接微信。

### 9.1 安装微信插件

```bash
# 方式一：快速安装
npx -y @tencent-weixin/openclaw-weixin-cli install

# 方式二：手动安装
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

安装完成后重启网关：

```bash
openclaw gateway restart
```

### 9.2 微信扫码登录

在运行网关的服务器上执行：

```bash
openclaw channels login --channel openclaw-weixin
```

**二维码获取方式：**

- **方式一：终端直接显示二维码**
  执行命令后，终端会直接显示一个二维码，用手机微信扫描即可。

- **方式二：获取登录链接**
  如果终端无法显示二维码，OpenClaw 会提供一个登录链接，在浏览器中打开后用微信扫描。

> 💡 **提示**：
> - 登录成功后，插件会自动保存账号凭证到本地
> - 二维码和链接有时效性，过期需重新获取

### 9.3 添加多个微信账号

如果需要添加另一个微信账号，再次执行登录命令即可：

```bash
openclaw channels login --channel openclaw-weixin
```

### 9.4 访问控制

微信私聊使用 OpenClaw 标准的配对和白名单机制。

**查看待审批的发送者：**

```bash
openclaw pairing list openclaw-weixin
```

**审批新发送者：**

```bash
openclaw pairing approve openclaw-weixin <code>
```

---

## 11. 配置 QQ 接入（手动）

OpenClaw 通过官方 QQ Bot API 连接 QQ。

### 10.1 安装 QQ 插件

```bash
openclaw plugins install @openclaw/qqbot
```

### 10.2 创建 QQ 机器人

1. 访问 [QQ 开放平台](https://q.qq.com/)
2. 用手机 QQ 扫码登录
3. 点击 **创建机器人**
4. 在机器人设置页面找到 **AppID** 和 **AppSecret** 并复制

> ⚠️ **重要**：AppSecret 离开页面后无法再次查看，务必当场复制保存！

### 10.3 添加 QQ 频道

**方式一：命令行添加**

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

**方式二：交互式添加**

```bash
openclaw channels add
```

按提示选择 QQ Bot 并输入 AppID 和 AppSecret。

### 10.4 配置文件方式

也可以直接编辑配置文件：

```json
{
  "channels": {
    "qqbot": {
      "enabled": true,
      "appId": "YOUR_APP_ID",
      "clientSecret": "YOUR_APP_SECRET"
    }
  }
}
```

### 10.5 重启网关

```bash
openclaw gateway restart
```

### 10.6 QQ 机器人功能

- ✅ **私聊（C2C）**：支持文字、图片、语音、视频、文件
- ✅ **群聊 @**：支持群内 @机器人触发回复
- ✅ **频道消息**：支持文字和远程图片
- ❌ 不支持：表情回应、话题帖

---

## 12. 其他支持的平台

OpenClaw 支持 25+ 消息平台，以下是部分常用平台：

| 平台 | 安装命令 |
|------|----------|
| **Telegram** | `openclaw channels add --channel telegram` |
| **Discord** | `openclaw channels add --channel discord` |
| **WhatsApp** | `openclaw channels add --channel whatsapp` |
| **Slack** | `openclaw channels add --channel slack` |
| **飞书** | `openclaw channels add --channel feishu` |
| **Matrix** | `openclaw channels add --channel matrix` |

更多平台请参考官方文档：[https://docs.openclaw.ai/channels](https://docs.openclaw.ai/channels)

---

## 📝 避坑汇总

1. **端口问题**：游戏云服务器的 SSH 端口不是默认的 22，记得查看控制台获取正确端口

2. **旧密钥冲突**：连接失败时，先清除旧密钥再重试

3. **Token 保管**：`openclaw.json` 中的 Token 很重要，登录 Web 界面需要

4. **隧道命令**：每次打开 Web 界面前都需要先运行 SSH 隧道命令

5. **API Key 准备**：安装前先准备好模型提供商的 API Key

---

## 🎯 总结

通过游戏云服务器部署 OpenClaw 具有以下优势：

- ✅ **低成本**：游戏云服务器价格相对便宜
- ✅ **24小时运行**：服务器长时间在线，AI 助手随时可用
- ✅ **无需本地机器**：不需要长时间通电的 Windows 或 MacBook
- ✅ **随时随地访问**：通过 SSH 隧道即可访问
- ✅ **多平台接入**：支持微信、QQ、Telegram 等 25+ 消息平台

部署完成后，你就拥有了一个专属的个人 AI 助手平台，可以通过微信、QQ 等日常使用的聊天工具与 AI 对话，真正融入你的日常生活。

---

*如果你觉得这篇文章对你有帮助，欢迎点赞、收藏、转发！*
