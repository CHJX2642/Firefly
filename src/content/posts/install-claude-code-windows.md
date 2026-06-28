---
title: Windows 安装 Claude Code 完整教程
published: 2026-06-26
description: 详细教程：如何在 Windows 系统上安装和配置 Claude Code，包括环境配置、API 设置、代理配置、常见问题解决等。
tags: [Claude, AI, 编程工具, 教程, Windows]
category: 技术教程
draft: false
image: ./images/claude-code-cover.png
---

## 📌 前言

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) 是 Anthropic 推出的 AI 编程助手，运行在终端中的 AI 智能体。与 Copilot 这类"下一行预测"工具不同，你只需要在命令行中描述任务目标，它就能自主规划步骤：读取相关文件、理解整个代码库、执行 Shell 命令、甚至操作 Git 提交。

本教程专门针对 **Windows 用户**，手把手教你安装和配置 Claude Code。

### 相关资源链接

| 资源 | 链接 |
|------|------|
| Claude Code 官方文档 | https://code.claude.com/docs/zh-CN/overview |
| Claude Code 中文文档 | https://code.claude.com/docs/zh-CN/quickstart |
| Node.js 下载 | https://nodejs.org/zh-cn/download |
| cc-switch 工具 | https://www.ccswitch.io/zh/docs?section=getting-started |
| Anthropic API 控制台 | https://console.anthropic.com/ |
| DeepSeek API 平台 | https://platform.deepseek.com/usage |

## 📋 第一步：环境准备

### 1.1 安装 Node.js

Claude Code 需要 Node.js 环境，确保版本在 18.0 以上（推荐 22+）。

**检查是否已安装 Node.js：**

按 `Win + R`，输入 `cmd` 打开命令提示符，执行：

```cmd
node --version
npm --version
```

如果显示版本号，说明已安装。如果提示"不是内部或外部命令"，需要安装 Node.js。

**安装 Node.js：**

1. 访问 Node.js 官网：https://nodejs.org/zh-cn/download
2. 下载 **LTS（长期支持版）** Windows 安装包（.msi）
3. 双击运行，按安装向导点击"下一步"
4. **重要**：确保勾选 "Add to PATH"（添加到环境变量）
5. 完成安装后，重新打开命令提示符验证

### 1.2 安装 Git

Claude Code 在执行任务时会用到 Git 的 bash 命令，需要安装 Git。

**检查是否已安装 Git：**

```cmd
git --version
```

如果显示版本号，说明已安装。如果没有安装，可以从 https://git-scm.com/downloads/win 下载安装。

## 📋 第二步：安装 Claude Code

Claude Code 有两种安装方式，推荐使用方式一（原生安装）。

### 方式一：原生安装（推荐）

打开命令提示符或 PowerShell，执行以下命令：

**Windows CMD：**

```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

**Windows PowerShell：**

```powershell
irm https://claude.ai/install.ps1 | iex
```

安装完成后，验证是否安装成功：

```cmd
claude --version
```

### 方式二：npm 安装

如果原生安装失败，可以使用 npm 安装：

```cmd
# 以管理员身份运行命令提示符

# 全局安装
npm install -g @anthropic-ai/claude-code

# 验证安装
claude --version
```

> 💡 **提示**：如果提示权限不足，请以管理员身份运行命令提示符。

## 📋 第三步：绕过 IP 校验

由于 Claude Code 会校验位置信息，国内用户直接运行可能会报错：

```
Unable to connect to Anthropic services
Failed to connect to api.anthropic.com: ERR_BAD_REQUEST
```

有两种方式可以解决：

### 方式一：配置代理网络（推荐）

如果你有代理软件（如 Clash、V2Ray 等），可以为 Claude Code 配置代理。

1. 找到你的代理端口（通常是 7890 或 1080）
2. 在项目目录下创建 `.claude/settings.json` 文件，添加：

```json
{
  "env": {
    "HTTP_PROXY": "http://127.0.0.1:7890",
    "HTTPS_PROXY": "http://127.0.0.1:7890"
  }
}
```

> 💡 **提示**：将 `7890` 替换为你代理软件的实际端口。

### 方式二：修改配置绕过校验

1. 打开文件资源管理器，进入 `C:\Users\你的用户名\` 目录
2. 找到 `.claude.json` 文件（如果没有就新建一个）
3. 用记事本打开，添加以下内容：

```json
{
  "hasCompletedOnboarding": true
}
```

4. 保存文件

## 📋 第四步：配置 API Key

配置好绕过校验后，启动 Claude Code 会提示你登录。我们可以使用 API 的方式跳过登录。

### 方式一：使用 cc-switch（推荐）

[cc-switch](https://www.ccswitch.io/zh/docs?section=getting-started) 是一个 Claude Code API 切换工具，图形化界面，使用简单。

**下载安装：**

1. 访问 cc-switch 官网：https://www.ccswitch.io/zh/docs?section=getting-started
2. 下载 Windows 版安装包
3. 双击运行安装程序，按提示完成安装

**添加 API 配置：**

1. 打开 cc-switch
2. 点击"添加 API"
3. 选择 API 类型，输入 API Key
4. 点击"保存"

### 方式二：全局环境变量配置

按 `Win + R`，输入 `sysdm.cpl`，打开系统属性：

1. 点击"高级" → "环境变量"
2. 在"用户变量"中点击"新建"
3. 添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ANTHROPIC_API_KEY` | `sk-ant-xxxxx` | 你的 API Key |
| `ANTHROPIC_BASE_URL` | `https://api.xxx.com` | API 地址 |
| `ANTHROPIC_MODEL` | `模型名称` | 可选，不设置默认使用 claude-sonnet-4-6 |

**使用命令行配置（临时）：**

```cmd
set ANTHROPIC_API_KEY="sk-ant-xxxxx"
set ANTHROPIC_BASE_URL="https://api.xxx.com"
set ANTHROPIC_MODEL="模型名称"
```

**使用命令行配置（永久）：**

```cmd
setx ANTHROPIC_API_KEY "sk-ant-xxxxx"
setx ANTHROPIC_BASE_URL "https://api.xxx.com"
setx ANTHROPIC_MODEL "模型名称"
```

### 方式三：配置文件配置

在 `C:\Users\你的用户名\.claude\settings.json` 文件中添加：

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-ant-xxxxx",
    "ANTHROPIC_BASE_URL": "https://api.xxx.com",
    "ANTHROPIC_MODEL": "模型名称"
  }
}
```

### API 配置示例

#### DeepSeek API

1. 访问 DeepSeek API 平台：https://platform.deepseek.com/usage
2. 创建 API Key
3. 找到 Anthropic BaseURL 和模型名称

```cmd
set ANTHROPIC_API_KEY="你的 DeepSeek API Key"
set ANTHROPIC_BASE_URL="https://api.deepseek.com"
set ANTHROPIC_MODEL="deepseek-chat"
```

## 📋 第五步：启动 Claude Code

配置完成后，启动 Claude Code：

```cmd
claude
```

第一次启动时会询问是否读取当前目录文件，选择 **Yes** 即可。

如果提示选择 API 方式，选择 **Yes** 使用 API Key。

## 🔧 常见问题

### 问题 1：安装后提示找不到 `claude` 命令

**原因**：环境变量没有配置正确。

**解决**：
1. 重新安装 Node.js，确保勾选 "Add to PATH"
2. 或者手动添加环境变量到系统 PATH

### 问题 2：npm install 权限错误

**解决**：以管理员身份运行命令提示符。

右键点击"命令提示符"，选择"以管理员身份运行"，然后重新执行安装命令。

### 问题 3：网络问题（安装超时）

**原因**：npm 默认源在国内访问较慢。

**解决**：使用淘宝镜像源：

```cmd
npm config set registry https://registry.npmmirror.com
```

然后重新安装：

```cmd
npm install -g @anthropic-ai/claude-code
```

### 问题 4：启动后报错 `Unable to connect to Anthropic services`

**原因**：IP 校验失败。

**解决**：
1. 配置代理（见第三步方式一）
2. 或者修改配置绕过校验（见第三步方式二）

### 问题 5：启动后提示需要登录

**原因**：没有配置 API Key。

**解决**：
1. 配置 API Key（见第四步）
2. 重新启动 Claude Code
3. 选择 Yes 使用 API Key 方式

### 问题 6：提示模型不可用

**原因**：配置的模型名称不正确或该模型不支持。

**解决**：
1. 检查模型名称是否正确
2. 尝试不设置 `ANTHROPIC_MODEL`，使用默认模型
3. 换一个可用的模型

### 问题 7：配置文件找不到

**解决**：在 `C:\Users\你的用户名\` 目录下手动创建 `.claude.json` 或 `.claude/settings.json` 文件。

## 💡 进阶配置

### 查看帮助

```cmd
claude --help
```

### 清空对话

```cmd
/clear
```

### 退出 Claude Code

按 `Ctrl + C` 或输入 `/exit`

### 卸载 Claude Code

```cmd
npm uninstall -g @anthropic-ai/claude-code
```

## 📝 总结

在 Windows 上安装 Claude Code 的步骤：

1. ✅ 安装 Node.js（18+）
2. ✅ 安装 Claude Code
3. ✅ 绕过 IP 校验（代理或配置文件）
4. ✅ 配置 API Key
5. ✅ 启动使用

Claude Code 是一个强大的 AI 编程助手，善用它可以大大提高开发效率！

---

*如果这篇教程对你有帮助，欢迎点赞收藏！有问题欢迎在评论区留言。*

**参考文章**：[Claude Code 安装与配置（详细教程）](https://blog.csdn.net/xhmico/article/details/159132449)
