---
title: Claude Code + MATLAB MCP 实战：让 AI 直接操控 MATLAB 与 Simulink
published: 2026-10-11
tags:
  - Claude Code
  - MATLAB
  - MCP
  - Simulink
  - AI编程
category: 技术教程
description: 手把手教你给 Claude Code 接上 MathWorks 官方 MATLAB MCP Server：从安装、配置、验证到用自然语言自动建模、跑仿真、审查代码、跑单元测试，含完整参数表和避坑指南。
pinned: false
comment: true
image: images/claude-matlab-mcp-cover.png
---

# Claude Code + MATLAB MCP 实战：让 AI 直接操控 MATLAB 与 Simulink

> 你还在手动一个个拖拽 Simulink 模块吗？MathWorks 官方发布的 MATLAB MCP Server，让 Claude Code 可以直接调用 MATLAB 引擎——你用中文描述需求，AI 帮你把模型搭好、仿真跑起来、代码检查完。
>
> 这篇是 [Windows 安装 Claude Code 完整教程](/posts/install-claude-code-windows/) 的续篇。上一篇我们把 Claude Code 装好并配上了 API，这一篇给它装上第一件"专业外设"。

## 一、MCP 是什么，为什么值得折腾

### 1.1 MCP：AI 工具的 USB 接口

**MCP（Model Context Protocol，模型上下文协议）** 是 Anthropic 推出的开放协议，用来把 AI 应用和外部工具、数据源连接起来。

在此之前，想让 AI 操作 MATLAB，你只能"复制一段代码 → 粘到 AI 里问 → 把 AI 给的代码复制回 MATLAB 跑"。这个循环里，AI 看不到真实的运行结果，你也一直在当"人工剪贴板"。

有了 MCP 就不一样了：

```mermaid
flowchart LR
    U[你: 自然语言需求] --> C[Claude Code<br/>AI 大脑]
    C -->|MCP 协议<br/>stdio| M[matlab-mcp-server]
    M -->|MATLAB Engine| E[MATLAB / Simulink<br/>执行引擎]
    E -->|真实运行结果| M
    M -->|工具返回| C
    C --> R[建模完成 / 报错 / 数据曲线]
```

关键在于 **AI 能看到真实的返回结果**。代码报错了，它读到错误信息自己改；仿真跑出数据了，它接着画图分析。这是一个可以自我纠错的闭环，而不是一次性的问答。

### 1.2 三种方案的对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| ChatGPT / 网页版 AI + MATLAB | 零配置，通用对话 | 需要手动复制代码，AI 看不到运行结果 |
| 自己写 MATLAB 脚本 | 精确控制，完全可控 | 效率低，Simulink API 学习门槛高 |
| **Claude Code + MATLAB MCP** | **AI 直接调用 MATLAB API，闭环自纠错** | 需要一次性配置 |

结论很明确：前两种方案你都得当"人工中间层"，只有 MCP 方案让 AI 真正拿到了执行权。

## 二、环境准备

### 2.1 MATLAB 版本要求

| 组件 | 最低要求 | 说明 |
|------|----------|------|
| MATLAB | **R2021a 或更高** | 必需，且要能通过命令行启动 |
| MATLAB | **R2023a 或更高** | 想用「连接已有会话」模式才需要 |
| Claude Code | 任意可用版本 | 见 [安装教程](/posts/install-claude-code-windows/) |

### 2.2 把 MATLAB 加入系统 PATH

MCP Server 默认会从系统 PATH 里找第一个 MATLAB。如果你的 MATLAB 没在 PATH 里，启动时就会报错。

**检查是否已在 PATH：**

```cmd
where matlab
```

**如果没有任何输出**，需要手动添加。MATLAB 的可执行文件在 `<MATLAB安装目录>\bin` 下，例如：

```
D:\Program Files\MATLAB\R2025b\bin
```

添加方法（Windows）：

1. `Win + R` 输入 `sysdm.cpl` → 「高级」→「环境变量」
2. 在「用户变量」里找到 `Path`，双击 →「新建」
3. 粘贴上面的 `bin` 目录路径 → 一路确定
4. **重新打开**命令行窗口，再次执行 `where matlab` 验证

> 💡 如果不想动 PATH，后面配置时用 `--matlab-root` 参数直接指定 MATLAB 根目录也行。注意这个参数**不要带 `/bin`**。

## 三、安装 MATLAB MCP Server

> ℹ️ **先澄清一个常见误解**：MATLAB 本身**不自带** MCP Server。这个二进制文件是独立的，需要你自己下载后放到一个固定的地方。网上有些说法会让人误以为装完 MATLAB 就有了，其实不是。

### 3.1 从 GitHub Releases 下载（推荐）

**仓库地址：** [https://github.com/matlab/matlab-mcp-server](https://github.com/matlab/matlab-mcp-server)

打开 [Releases 页面](https://github.com/matlab/matlab-mcp-server/releases/latest)，按平台下载：

| 平台 | 文件名 |
|------|--------|
| Windows x64 | `matlab-mcp-server-windows-x64.exe` |
| Linux x64 | `matlab-mcp-server-linux-x64` |
| macOS Apple Silicon | `matlab-mcp-server-macos-arm64` |
| macOS Intel | `matlab-mcp-server-macos-x64` |

**macOS 用户**可以直接用命令下载，并记得加执行权限：

```bash
# Apple Silicon
curl -L -o ~/Downloads/matlab-mcp-server \
  https://github.com/matlab/matlab-mcp-server/releases/latest/download/matlab-mcp-server-macos-arm64

# Intel
curl -L -o ~/Downloads/matlab-mcp-server \
  https://github.com/matlab/matlab-mcp-server/releases/latest/download/matlab-mcp-server-macos-x64

chmod +x ~/Downloads/matlab-mcp-server
```

### 3.2 从源码构建（可选）

装了 Go 的话，也可以直接从源码装：

```bash
go install github.com/matlab/matlab-mcp-server/cmd/matlab-mcp-server@latest
```

装完后二进制会出现在 `$(go env GOPATH)/bin/` 下。

### 3.3 把二进制放到哪儿？🔥

这一步很多人会随手丢进下载文件夹，然后过两个月清理磁盘时误删，Claude Code 就报连不上了。**建议放进 MATLAB 自己的 `bin` 目录**：

```
<你的 MATLAB 根目录>\bin\matlab-mcp-server-windows-x64.exe
```

比如本机的实际路径是：

```
D:\Program Files\MATLAB\R2025b\bin\matlab-mcp-server-windows-x64.exe
```

**为什么推荐放这儿？**

- 位置本来就"属于 MATLAB"，语义上对得上，不会误删
- 这个目录通常已经在系统 PATH 里了（如果你按第二章配过），路径稳定
- 以后查问题时，MATLAB 相关的工具都在一起，好找

> ⚠️ **MATLAB 根目录在哪？** 不确定的话，在 MATLAB 命令窗口里执行 `matlabroot`，它会直接告诉你，比如输出 `D:\Program Files\MATLAB\R2025b`。注意这个路径**不含 `/bin`**，而二进制要放进 `bin` 里面。
>
> ⚠️ **升级 MATLAB 版本时要注意**：新版本的安装目录会变（比如 `R2025b` → `R2026a`），旧目录里的二进制不会自动跟过去。而且 Claude Code 里记录的是**绝对路径**，所以升级后要做两件事：把二进制复制到新目录，然后**重新执行一次 `claude mcp add`**（或者直接编辑配置文件改路径）。只改 `--matlab-root` 是不够的——那个参数管的是"启动哪个 MATLAB"，不是"二进制在哪"。

### 3.4 验证二进制能跑

不管用哪种方式拿到文件，先确认它能正常执行：

```cmd
"D:\Program Files\MATLAB\R2025b\bin\matlab-mcp-server-windows-x64.exe" --version
```

输出类似：

```
github.com/matlab/matlab-mcp-server v0.11.0
```

看到版本号就说明文件是好的，可以进入下一步配置了。

## 四、把 MCP Server 接进 Claude Code

### 4.1 一条命令搞定

打开终端，执行（把路径换成你自己的）：

```bash
claude mcp add --transport stdio matlab -- "D:\Program Files\MATLAB\R2025b\bin\matlab-mcp-server-windows-x64.exe"
```

命令拆解：

| 部分 | 含义 |
|------|------|
| `claude mcp add` | 添加一个 MCP 服务器 |
| `--transport stdio` | 用标准输入输出通信（本地进程的标准方式） |
| `matlab` | 给这个服务器起的名字，后面 `/mcp` 里会用到 |
| `--` | **分隔符**：后面的内容全部交给 MCP Server 自己解析 |
| `"D:\...\matlab-mcp-server-windows-x64.exe"` | 二进制文件完整路径 |

> ⚠️ **最容易踩的坑就是漏掉 `--`**。Claude Code 会把 `--` 之后的参数原样传给 MCP Server，没有它，服务器自己的参数（比如 `--matlab-root`）会被 Claude Code 当成自己的参数解析，然后报一堆莫名其妙的错。
>
> 另外：路径里有空格（比如 `Program Files`）时，Windows 下**一定要加引号**。

### 4.2 带参数的高级配置

如果 MATLAB 不在 PATH 里，或者你想调整启动行为，把参数加在 `--` 后面：

```bash
claude mcp add --transport stdio matlab -- ^
  "D:\Program Files\MATLAB\R2025b\bin\matlab-mcp-server-windows-x64.exe" ^
  --matlab-root="D:\Program Files\MATLAB\R2025b" ^
  --matlab-session-mode=existing ^
  --log-level=info
```

> 💡 Windows CMD 里换行符是 `^`，PowerShell 里是 `` ` ``（反引号），Bash 里是 `\`。嫌麻烦的话写成一行也可以。

### 4.3 作用域：三种配置范围

`claude mcp add` 默认写进「本地」配置，只在当前项目生效。用 `-s` 参数可以改：

```bash
# local（默认）：只在当前项目对你生效，不写进版本库
claude mcp add -s local matlab -- <binary>

# user：对你所有项目生效（推荐！MATLAB 又不挑项目）
claude mcp add -s user matlab -- <binary>

# project：写进项目的 .mcp.json，团队成员都能用
claude mcp add -s project matlab -- <binary>
```

| 作用域 | 存放位置 | 是否进版本库 | 适用场景 |
|--------|----------|--------------|----------|
| `local` | `~/.claude.json` 项目节点下 | 否 | 临时试验 |
| `user` | `~/.claude.json` 全局节点 | 否 | **个人常驻配置，推荐** |
| `project` | 项目根目录 `.mcp.json` | 是 | 团队共享（注意许可证限制） |

**大多数人选 `user`**：MATLAB 是通用工具，不该跟某个项目绑定。

```bash
claude mcp add -s user --transport stdio matlab -- "D:\Program Files\MATLAB\R2025b\bin\matlab-mcp-server-windows-x64.exe"
```

### 4.4 手动配置（等价写法）

如果命令不好使，直接编辑配置文件也行。全局配置在 `C:\Users\你的用户名\.claude.json`：

```json
{
  "mcpServers": {
    "matlab": {
      "type": "stdio",
      "command": "D:\\Program Files\\MATLAB\\R2025b\\bin\\matlab-mcp-server-windows-x64.exe",
      "args": [],
      "env": {}
    }
  }
}
```

> ⚠️ JSON 里的反斜杠要写成 `\\` 转义。

**项目级配置**则是项目根目录的 `.mcp.json`：

```json
{
  "mcpServers": {
    "matlab": {
      "type": "stdio",
      "command": "D:\\Program Files\\MATLAB\\R2025b\\bin\\matlab-mcp-server-windows-x64.exe",
      "args": ["--initial-working-folder=C:\\Users\\21023\\Documents\\MATLAB"]
    }
  }
}
```

### 4.5 验证配置

```bash
claude mcp list
```

正常会看到 `matlab` 后面跟着 ✔ 和 `connected`。

进入 Claude Code 会话后，还可以用斜杠命令查看详情：

```
/mcp
```

它会把所有已连接的 MCP Server 和它们提供的工具列出来。看到 `matlab` 下面挂着 5 个 `mcp__matlab__*` 工具，就说明通了。

> 💡 **验证小技巧**：直接在 Claude Code 里说"列出我 MATLAB 装了什么工具箱"，它会调用 `detect_matlab_toolboxes`。如果你看到它真的调用了 `mcp__matlab__detect_matlab_toolboxes` 并返回了工具箱清单——恭喜，整条链路已经打通。

## 五、五个工具 + 两个资源，逐个讲清

MCP Server 提供的工具不多，但每个都很实在。

### 5.1 工具一览

| 工具 | 作用 | 关键参数 | 是否只读 |
|------|------|----------|----------|
| `detect_matlab_toolboxes` | 返回已安装的 MATLAB 和工具箱版本 | — | ✅ 只读 |
| `check_matlab_code` | **静态代码分析**，不执行代码 | `script_path` | ✅ 只读 |
| `evaluate_matlab_code` | 执行一段 MATLAB 代码字符串 | `code`, `project_path` | ❌ 会执行 |
| `run_matlab_file` | 执行 `.m` 脚本文件 | `script_path` | ❌ 会执行 |
| `run_matlab_test_file` | 运行 MATLAB 单元测试 | `script_path` | ❌ 会执行 |

### 5.2 `check_matlab_code`：不运行就能审查代码

这是最被低估的一个工具。它调用 MATLAB 自带的 Code Analyzer 做静态分析，**不会执行你的代码**，返回的是代码风格、潜在错误、弃用函数、性能问题、最佳实践违规的清单。

因为不执行，所以拿它来检查一段陌生代码是很安全的：

> **你可以这样问 Claude Code：**
>
> ```
> 用 check_matlab_code 检查一下当前目录里的 pid_controller.m，
> 把警告按严重程度分类，先别改代码，只给我一份清单。
> ```

返回的每条警告都自带**出现位置和修改建议**，Claude 可以直接据此动手改。

### 5.3 `evaluate_matlab_code`：执行代码字符串

适合做快速计算、临时验证、环境检查。

> **提问示例：**
> ```
> 帮我算一下 2x2 矩阵 [1 2; 3 4] 的特征值和特征向量，顺便验证 A*V = V*D
> ```

Claude 会调用 `evaluate_matlab_code` 把代码发给 MATLAB 执行，然后把真实输出拿回来。它的 `project_path` 参数可以指定 MATLAB 的当前工作目录。

### 5.4 两个 Resources：给 AI 补 MATLAB 常识

这是 MCP 里 `Resources`（资源）的概念——不是工具，而是**可以直接喂给 AI 的参考资料**。

| 资源 | URI | 内容 |
|------|-----|------|
| MATLAB 编码规范 | `guidelines://coding` | 命名、格式、注释、性能优化、错误处理的完整规范 |
| Plain Text Live Code 规范 | `guidelines://plain-text-live-code` | 纯文本 Live Script 的生成规则 |

**为什么要专门给 AI 这个？** 因为 AI 写 MATLAB 代码时，很容易写成"能跑但很丑"的样子：变量名随手起、不留注释、用循环做向量化能做的事。让 Claude 先读一遍 `guidelines://coding`，它写出来的代码会明显更符合 MATLAB 社区的习惯。

> **实测有效的用法：**
> ```
> 在写代码之前，先读一下 guidelines://coding 这个资源，
> 然后按里面的规范帮我重写 analysis.m。
> ```

## 六、启动参数完整表

所有参数都可以通过三种方式指定：命令行参数、配置文件、环境变量。环境变量的命名规则是：加 `MW_MCP_SERVER_` 前缀，转大写，连字符换成下划线。比如 `--matlab-root` 对应 `MW_MCP_SERVER_MATLAB_ROOT`。

**命令行参数的优先级高于环境变量。**

| 参数 | 说明 | 示例 |
|------|------|------|
| `--matlab-root` | 指定启动哪个 MATLAB。**路径不含 `/bin`**。默认在 PATH 里找第一个 | `--matlab-root=D:\\Program Files\\MATLAB\\R2025b` |
| `--initialize-matlab-on-startup` | 设为 `true` 时，启动服务器就立刻初始化 MATLAB。默认是**第一次调用工具时才启动** | `--initialize-matlab-on-startup=true` |
| `--initial-working-folder` | MATLAB 启动时的工作目录。不指定则用 AI 应用的第一个 Root，再没有就用用户文档目录 | `--initial-working-folder=C:\\Users\\21023\\Documents\\MATLAB` |
| `--matlab-display-mode` | `desktop`（默认，显示 MATLAB 桌面）或 `nodesktop`（不显示） | `--matlab-display-mode=nodesktop` |
| `--matlab-session-mode` | `new` / `auto`（默认）/ `existing`，详见下一节 | `--matlab-session-mode=existing` |
| `--extension-file` | 指向自定义工具的 JSON 定义文件，可指定多个 | `--extension-file=C:\\tools\\my-tools.json` |
| `--log-folder` | 日志存放目录，默认用系统临时目录 | `--log-folder=C:\\Users\\21023\\AppData\\Local\\Temp` |
| `--log-level` | `debug` / `info` / `warn` / `error`，默认 `info` | `--log-level=debug` |
| `--disable-telemetry` | 设为 `true` 关闭匿名使用数据上报（默认开启） | `--disable-telemetry=true` |
| `--help` / `--version` | 查看帮助 / 版本号 | `--version` |

> 💡 **关于 `nodesktop` 的一个反直觉点**：即使设成 `nodesktop`，遇到 `edit`、`open`、`open_system`、`uifigure`、`appdesigner` 这类**需要图形界面**的命令，MATLAB 窗口**照样会弹出来**。`nodesktop` 只是"平时不显示桌面"，不是"禁掉所有窗口"。

### 6.1 三种会话模式，选哪个？

这是配置里最容易选错的一项。

| 模式 | 行为 | 适用场景 |
|------|------|----------|
| `new` | 每次启动**新开一个** MATLAB 会话 | 干净隔离，互不干扰 |
| `auto`（默认） | 先尝试连已有会话，连不上就新开一个 | **绝大多数情况用这个** |
| `existing` | 只连已有会话，连不上就失败 | 需要复用你手动开着的那个 MATLAB |

**`existing` 模式怎么用？** 它需要两步准备工作：

**第一步**，先跑一次设置命令，它会往 MATLAB 里装一个叫 "MATLAB MCP Server Toolbox" 的附加组件：

```bash
"D:\Program Files\MATLAB\R2025b\bin\matlab-mcp-server-windows-x64.exe" --setup-matlab
```

**第二步**，在你手动打开的那个 MATLAB 的命令窗口里，执行：

```matlab
shareMATLABSession()
```

这样 MCP Server 就能连上这个会话了。如果你同时开着好几个 MATLAB，它会连**最近一次执行 `shareMATLABSession()`** 的那个。

嫌每次手动敲麻烦，可以把这行加进 MATLAB 的 `startup.m` 启动脚本里，开机自动共享。

> ⚠️ **`existing` 模式不能和 `--matlab-root`、`--initial-working-folder`、`--matlab-display-mode` 一起用**，会冲突。
>
> **`existing` 模式最大的好处**：工作区变量都在。你手动加载了一个 5GB 的数据集、训练好的模型、或者费了半小时搭好的 Simulink 模型，直接让 Claude 接着操作，不用重新来一遍。这个场景下它比 `new` 模式下效率高得多。

## 七、实战：让 Claude 真的干点活

前面都是配置，从这里开始才是好玩的部分。下面四个案例由浅入深。

### 案例 1：环境体检（最安全的第一步）

> **你的提问：**
> ```
> 帮我看看这台机器的 MATLAB 环境，列出已安装的工具箱和版本号。
> 顺便告诉我有没有装 Simulink 和 Simscape。
> ```

Claude 调用 `detect_matlab_toolboxes`，你会拿到一份真实的工具箱清单。这一步同时起到了**验证链路通不通**的作用。

### 案例 2：用自然语言搭一个 Simulink 模型

这是最能体现价值的一幕。你不需要记任何 API。

> **你的提问：**
> ```
> 帮我新建一个 Simulink 模型，命名为 gain_test：
> 一个 Constant 常量模块接到一个 Gain 增益模块，Gain 接到 Scope 示波器，
> 然后保存为 gain_test.slx，并运行 10 秒仿真。
> ```

Claude 会调用 `evaluate_matlab_code`，背后执行的其实是这套 Simulink API：

```matlab
% 新建模型
h = new_system('gain_test');
open_system(h);

% 添加模块：'库路径/模块名' → '模型名/模块名'
add_block('simulink/Sources/Constant',      'gain_test/Const');
add_block('simulink/Math Operations/Gain',  'gain_test/Gain');
add_block('simulink/Sinks/Scope',           'gain_test/Scope');

% 设置参数（注意：数值也要用字符串传）
set_param('gain_test/Const', 'Value', '5');
set_param('gain_test/Gain',  'Gain',  '3');

% 连线：'模块/输出端口号' → '模块/输入端口号'
add_line('gain_test', 'Const/1', 'Gain/1');
add_line('gain_test', 'Gain/1',  'Scope/1');

% 设置仿真参数并运行
set_param('gain_test', 'StopTime', '10', 'Solver', 'ode45');
out = sim('gain_test');

% 保存
save_system('gain_test', 'gain_test.slx');
```

运行完，你的工作目录下就多了个 `gain_test.slx`。打开一看，模型已经搭好了。

> 💡 **两个 Simulink API 的坑，提前说：**
> - `add_block` 的第一个参数是**库里的模块路径**（`simulink/Sources/Constant`），第二个是**你自己模型的路径**（`gain_test/Const`），别写反了
> - `set_param` 的**所有值都必须是字符串**，`'5'` 而不是 `5`。写成数字会报错，这是新手最常见的错

### 案例 3：批量查找并修改模块参数

模型搭好了要调参，手动一个个点太慢。

> **你的提问：**
> ```
> 把 model_v2 里所有 Inport 输入端口的数据类型统一改成 int16，
> 改之前先列出来有几个、都叫啥。
> ```

对应的 MATLAB 代码：

```matlab
function setBlockTypes(sys)
    % find_system 按条件查找模块，'BlockType' 是模块类型
    blk = find_system(sys, 'BlockType', 'Inport');

    fprintf('找到 %d 个 Inport 模块\n', length(blk));

    for n = 1:length(blk)
        % 先打印再改，出问题能回溯
        fprintf('  修改: %s\n', blk{n});
        set_param(blk{n}, 'OutDataTypeStr', 'int16');
    end
end
```

> 💡 注意函数里那句 `fprintf` —— 让 AI 养成"改之前先记录"的习惯，出问题时有据可查。

### 案例 4：参数扫描 + 自动绘图

这个案例最能体现"闭环"的价值：**AI 跑完仿真，读到数据，自己画图**。

> **你的提问：**
> ```
> 对 myModel 做一个参数扫描，Gain 从 0.1 扫到 2.0，步长 0.1。
> 每次仿真记录最后一个采样点的输出值，最后画一条 Gain-输出 的曲线，
> 标上坐标轴名称，把数据也存成 csv。
> ```

Claude 生成的代码大致是这样：

```matlab
modelName  = 'myModel';
gainValues = 0.1:0.1:2.0;
results    = zeros(numel(gainValues), 2);

load_system(modelName);

for k = 1:numel(gainValues)
    g = gainValues(k);
    set_param([modelName '/Gain'], 'Gain', num2str(g));

    out = sim(modelName);

    % 从 SimulationOutput 里取最后一个采样点
    y = out.yout;                     % 若用 To Workspace 记录
    yEnd = y.Data(end);

    results(k, :) = [g, yEnd];
    fprintf('Gain = %.2f, 输出 = %.4f\n', g, yEnd);
end

% 绘图
fig = figure('Visible', 'off');
plot(results(:,1), results(:,2), '-o', 'LineWidth', 1.5);
xlabel('Gain Value');
ylabel('Output at StopTime');
title('Gain 参数扫描结果');
grid on;
exportgraphics(fig, 'gain_sweep.png', 'Resolution', 150);

% 存 CSV
writematrix(results, 'gain_sweep.csv');

disp('参数扫描完成，已输出 gain_sweep.png 和 gain_sweep.csv');
```

跑完之后，Claude 会告诉你曲线长什么样、有没有单调性、有没有拐点——因为它真的看到了数据。

> 💡 **`figure('Visible', 'off')` 这一手很关键**：把图渲染到文件而不弹窗。适合无人值守跑批，也适合放在服务器上跑。最后用 `exportgraphics` 导出，比老的 `saveas` 清晰得多。

### 案例 5：让 AI 审查自己的代码

这是我最喜欢的一个用法——**让 Claude 写完代码后自己检查一遍**。

> **你的提问：**
> ```
> 你刚才写的那段参数扫描代码，用 check_matlab_code 自己审一遍，
> 有问题就改，改完再跑一次确认。
> ```

这就是"AI 自纠错"的具体形态：写 → 静态分析 → 修 → 重跑验证。比你手动挑刺快得多。

**同样的思路可以用在单元测试上：**

> ```
> 给 pid_controller.m 写一个 MATLAB 单元测试文件 test_pid.m，
> 覆盖正常输入、零输入、NaN 输入三种情况，然后用 run_matlab_test_file 跑一遍。
> ```

## 八、在 VS Code 里的完整工作流

回到上一篇的主题——**我们都是用 VS Code 写代码的**。所以这里说一下 Claude Code + MATLAB MCP 在 VS Code 里怎么用最顺手。

### 8.1 装什么插件

| 插件 | 作用 |
|------|------|
| **Claude Code** | VS Code 里的 Claude Code 面板 |
| **MATLAB** | 官方插件，提供 `.m` 文件语法高亮、代码跳转、断点调试 |
| **MATLAB Interactive Terminal** | 在 VS Code 里开一个 MATLAB 交互终端 |

Claude Code 装好后，VS Code 左侧会出现 Claude 图标，或者用 `Ctrl + Esc` 唤起。

### 8.2 关键点：MCP 配置的共享方式

Claude Code 在 VS Code 里用的是**同一套 MCP 配置**——所以你在终端里 `claude mcp add -s user` 配好的 MATLAB，在 VS Code 面板里直接就能用，不用重配。

如果你想让**整个项目**的人都用上（比如实验室的课题项目），在项目根目录建 `.mcp.json`：

```json
{
  "mcpServers": {
    "matlab": {
      "type": "stdio",
      "command": "C:\\Tools\\matlab-mcp-server\\matlab-mcp-server-windows-x64.exe",
      "args": ["--matlab-session-mode=auto"]
    }
  }
}
```

`.mcp.json` 里的服务器会被标记为「⏸ 待批准」，团队成员首次使用时需要手动批准一次。这是一种安全设计——**防止 clone 一个仓库就自动运行未知的本地程序**。

> ⚠️ 但这里有个许可证问题：MathWorks 明确要求 MCP Server **不能多用户共享**。所以 `.mcp.json` 适合"同一个人的多台机器"，如果是多人团队，更稳妥的做法是每人本地各配一份 `-s user`，不要把二进制路径硬编码进版本库。

### 8.3 一个典型的工作流

```
1. 用 MATLAB 插件打开 .m 文件，看着代码
2. Ctrl + Esc 唤起 Claude Code
3. 用@提及文件：@pid_controller.m 帮我看看这个 PID 实现的积分饱和问题
4. Claude 调 check_matlab_code 分析 → 给出问题清单
5. 你确认后，它直接编辑文件（diff 会实时显示在编辑器里）
6. 说"跑一下验证"，它调 run_matlab_file 执行
7. 结果不对？继续对话，它接着改
```

整个过程中，**代码改动你都能在编辑器里看到 diff**，不是黑盒。这也是 Claude Code 比网页版 AI 更适合工程任务的根本原因。

### 8.4 GitHub Copilot 用户怎么办？

如果你不用 Claude Code 而用 VS Code 里的 GitHub Copilot，MATLAB MCP Server 也支持。在项目里建 `.vscode/mcp.json`：

```json
{
  "servers": {
    "matlab": {
      "type": "stdio",
      "command": "C:\\Tools\\matlab-mcp-server\\matlab-mcp-server-windows-x64.exe",
      "args": []
    }
  }
}
```

注意两者的**格式不一样**：Copilot 用 `servers` 字段，Claude Code 用 `mcpServers`。放在不同文件里，互不冲突。

## 九、避坑指南

这一节是踩过的坑的合集，值得逐条看。

### ❌ 坑 1：漏掉 `--` 分隔符

```bash
# 错误：服务器参数被 Claude Code 吃了
claude mcp add matlab --transport stdio <binary> --matlab-root=D:\MATLAB\R2025b

# 正确
claude mcp add matlab --transport stdio <binary> -- --matlab-root=D:\MATLAB\R2025b
```

### ❌ 坑 2：`--matlab-root` 带了 `/bin`

```bash
# 错误
--matlab-root=D:\Program Files\MATLAB\R2025b\bin

# 正确
--matlab-root=D:\Program Files\MATLAB\R2025b
```

### ❌ 坑 3：路径有空格却没加引号

`Program Files` 里的空格会让命令行把路径切成两段。**Windows 下路径含空格必须加引号**：

```bash
claude mcp add -s user --transport stdio matlab -- "D:\Program Files\MATLAB\R2025b\bin\matlab-mcp-server-windows-x64.exe"
```

### ❌ 坑 4：`set_param` 传了数字而不是字符串

```matlab
% 错误：Simulink 的参数值必须是字符向量
set_param('myModel/Gain', 'Gain', 3);

% 正确
set_param('myModel/Gain', 'Gain', '3');
```

数值转字符串用 `num2str()`，做参数扫描时尤其容易忘。

### ❌ 坑 5：模型没打开就改

```matlab
% 错误：直接 add_block 到一个不存在的模型
add_block('simulink/Sources/Constant', 'newModel/Const');

% 正确：先 new_system 或 load_system
new_system('newModel');
open_system('newModel');
add_block('simulink/Sources/Constant', 'newModel/Const');
```

### ❌ 坑 6：端口名写错

`add_line` 里的端口名写错是最烦的错误，因为报错信息很不直观。**先查再说**：

```matlab
% 查看某个模块有哪些端口
get_param('myModel/Gain', 'Ports')      % 返回 [inports outports ...]
get_param('myModel/Gain', 'PortHandles')
```

> 💡 更好的办法：直接问 Claude "这个模块有哪些端口"，它会调 `evaluate_matlab_code` 帮你查出来再写连线代码。

### ❌ 坑 7：仿真时间设置不当

`StopTime` 和 `MaxStep` 要按物理特性来，不是随便填。

```matlab
% 电机控制这种快动态系统，10 秒可能够，但 MaxStep 太大精度不够
set_param('motorCtrl', 'StopTime', '10', 'MaxStep', '0.001');

% 热管理这种慢动态系统，10 秒可能啥都看不出来，要跑到几小时
set_param('thermalModel', 'StopTime', '3600', 'MaxStep', '1');
```

MaxStep 太大 → 结果不收敛或失真；太小 → 仿真慢到没法用。不确定就先小范围试。

### ❌ 坑 8：以为 `nodesktop` 就不会弹窗

前面提过了，再强调一次：`--matlab-display-mode=nodesktop` **挡不住** `open_system`、`uifigure` 这类命令弹窗。想看模型就得接受它弹出来。

### ❌ 坑 9：`check_matlab_code` 不执行代码，别指望它抓运行时错误

静态分析只看语法和模式，抓不到"除零""数组越界""数据类型不匹配"这类**只有跑起来才知道**的问题。想抓这些，得真的跑：

> ```
> 先用 check_matlab_code 看静态问题，再用 run_matlab_file 跑一遍，
> 把两种方式发现的问题分开列给我。
> ```

## 十、最佳实践

几条从实战里总结出来的习惯。

### ✅ 1. 先验证，后执行

改动仿真模型之前，先用 `check_matlab_code` 过一遍。它是只读的，零风险。

> ```
> 修改之前，先用 check_matlab_code 告诉我这个文件现在有什么问题，
> 列个清单给我确认，我同意了你再动手。
> ```

### ✅ 2. 分段保存中间状态

复杂建模任务别一口气做完。每完成一个阶段就让 AI 存一次盘：

> ```
> 每完成一个模块组的搭建就 save_system 一次，
> 命名带上阶段编号，比如 stage1.slx、stage2.slx。
> ```

这样中间出错也不用从头再来。

### ✅ 3. 关键操作要日志

让 AI 在循环和批量修改里加 `fprintf`。出问题时，日志是唯一的回溯依据。

### ✅ 4. 复用函数要写测试

一旦某个函数要反复用，就让 AI 顺手写个测试文件，用 `run_matlab_test_file` 跑一遍。这比事后调试便宜太多。

### ✅ 5. 关掉遥测（如果需要）

MCP Server 默认会向 MathWorks 上报匿名使用数据。在内网或者对数据敏感的环境里，记得关掉：

```bash
--disable-telemetry=true
```

或者用环境变量：

```bash
set MW_MCP_SERVER_DISABLE_TELEMETRY=true
```

### ✅ 6. 用 `existing` 模式复用重型会话

前面提过，这里再放进最佳实践里强调：**如果你的 MATLAB 会话里有大体积数据或长时间训练好的模型，用 `existing` 模式，别让 AI 每次新开一个空会话。**

`--matlab-session-mode=auto`（默认）也能达到类似效果——它会优先尝试连已有会话。

## 十一、常见问题速查

| 现象 | 可能原因 | 解决 |
|------|----------|------|
| `claude mcp list` 里 matlab 显示 failed | 二进制路径写错 | 用绝对路径，检查文件确实存在 |
| 启动报找不到 MATLAB | MATLAB 不在 PATH，也没给 `--matlab-root` | 加 `--matlab-root=<MATLAB根目录>`（不带 `/bin`） |
| 服务器参数报"未知选项" | 漏了 `--` 分隔符 | 在二进制路径后加 `--` |
| 首次调用工具卡很久 | 默认首次调用才启动 MATLAB，冷启动慢 | 正常现象；可加 `--initialize-matlab-on-startup=true` 提前启动 |
| `existing` 模式连不上 | 没执行 `shareMATLABSession()` 或没跑 `--setup-matlab` | 两步都做一遍 |
| `existing` 模式报参数冲突 | 和 `--matlab-root` 等参数同时用了 | 去掉冲突参数 |
| 想排查具体错误 | 默认日志级别是 `info` | 加 `--log-level=debug`，去 `--log-folder` 看日志 |
| 代码检查报一堆没听过的警告 | MATLAB Code Analyzer 的默认规则 | 让 Claude 按"严重程度"分类，只处理前几类 |
| Windows 下 Codex 用不了 | Codex 不转发 `WINDIR` 环境变量 | 在 Codex 配置的 `[mcp_servers.matlab]` 段加 `env_vars = ["WINDIR"]` |

**查看版本和帮助：**

```bash
"D:\Program Files\MATLAB\R2025b\bin\matlab-mcp-server-windows-x64.exe" --version
"D:\Program Files\MATLAB\R2025b\bin\matlab-mcp-server-windows-x64.exe" --help
```

**移除配置：**

```bash
claude mcp remove matlab
```

## 十二、总结

到这里，你已经拥有一个能直接操作 MATLAB 和 Simulink 的 AI 助手了。回顾整个流程：

1. **环境准备** —— MATLAB R2021a+ 并加入 PATH
2. **拿到二进制** —— 从 GitHub Releases 下载，或 `go install` 构建
3. **接入 Claude Code** —— `claude mcp add -s user --transport stdio matlab -- <binary>`，别忘 `--`
4. **验证** —— `claude mcp list`，或者直接问它"我装了哪些工具箱"
5. **开始干活** —— 用中文描述需求，让它建模、仿真、审查、测试

几个要点再强调一遍：

- **把二进制放进 MATLAB 的 `bin` 目录**，位置稳定、不易误删，是长期使用的推荐做法
- **`--` 分隔符**是配置阶段最容易漏的东西
- **`--matlab-session-mode=existing`** 是重型工作场景的效率关键
- **`check_matlab_code` 是只读的**，拿它当"改动前的安全检查"零风险
- **让它审查自己的代码**——这是 MCP 闭环最被低估的用法

Claude Code + MATLAB MCP 不是要取代工程师，而是把你从"搬砖"里解放出来：搭模型、调参数、跑批处理、写测试这些重复劳动交给 AI，你把精力放在系统设计和判断结果上。

> 📚 **相关链接**
> - MATLAB MCP Server 官方仓库：https://github.com/matlab/matlab-mcp-server
> - Claude Code MCP 文档：https://docs.claude.com/en/docs/claude-code/mcp
> - MATLAB Agentic Toolkit：https://github.com/matlab/matlab-agentic-toolkit
> - Simulink Agentic Toolkit：https://github.com/matlab/simulink-agentic-toolkit
>
> ⚠️ **许可证提示**：MCP Server 仅可按 MathWorks 软件许可协议配合 MATLAB 使用，**不得由多个用户共享**。团队/集中式部署请先联系 MathWorks 咨询授权。

---

*如果这篇教程对你有帮助，欢迎点赞收藏。有配置问题欢迎在评论区留言，我尽量回复。*
