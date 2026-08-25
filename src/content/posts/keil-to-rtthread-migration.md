---
title: 从 Keil + uC/OS-II 迁移到 RT-Thread 实战经验：一个 STM32 固件移植的血泪总结
published: 2026-08-25
tags:
  - RT-Thread
  - STM32
  - 嵌入式
  - uC/OS-II
  - 移植
category: 经验分享
description: 把 Keil MDK + uC/OS-II 的 STM32F10x 工程整体移植到 RT-Thread 5.x 的完整方法与踩坑记录，含时钟迁移、串口冲突、Flash 参数区重叠等致命坑的排查经验。
pin: false
comment: true
image: images/keil-to-rtthread-cover.jpeg
---

# 从 Keil + uC/OS-II 迁移到 RT-Thread 实战经验

> 把一个跑了多年的老 Keil 工程（SPL 标准外设库 + uC/OS-II）整体搬到 RT-Thread 5.x，说起来是"换操作系统"，做起来才发现坑比想象的多得多。这篇文章把我这次移植 AI 红绿灯固件（STM32F103RCT6）的全过程记录下来，重点是那些让人想砸键盘的坑，希望能帮你少走弯路。

## 一、为什么要做这次移植

老工程是 **Keil MDK5 + 标准外设库 SPL + uC/OS-II** 的组合，这套技术栈在十年前是主流，但放到现在有几个明显的问题：

- uC/OS-II 已经停止维护，生态越来越弱
- SPL 标准外设库官方也不再更新，新芯片都没这库了
- 没有现代化的设备驱动框架，每次加外设都要手写寄存器
- 调试手段单一，没有统一的命令行工具

而 **RT-Thread Studio + HAL 库 + RT-Thread 5.x** 这套新组合，有成熟的 BSP 驱动、msh 命令行、丰富的软件包生态。对于需要长期维护的固件来说，早迁早安心。

> 💡 **适用场景**：老工程是 Keil MDK5 + SPL（`stm32f10x.h`）+ uC/OS-II（`includes.h` / `ucos_ii.h`），目标工程是 RT-Thread Studio + HAL（`stm32f1xx_hal.h`）+ RT-Thread 5.x，芯片 STM32F10x 系列。

## 二、先看清差异，再动手

动手前先把这个对照表过一遍，心里有底：

| 维度 | 原（Keil + uC/OS-II） | 新（RT-Thread Studio） |
|------|----------------------|------------------------|
| 头文件 | `stm32f10x.h` | `stm32f1xx_hal.h` |
| OS 头文件 | `includes.h` / `ucos_ii.h` | `<rtthread.h>` |
| 系统时钟 | 36 MHz | **64 MHz** |
| 任务创建 | `OSTaskCreate` + `OSStart` | `rt_thread_init` + `rt_thread_startup` |
| 任务延时 | `OSTimeDly(n)` | `rt_thread_mdelay(ms)` |
| 微秒延时 | `delay_us(x)` | `rt_hw_us_delay(x)` |
| 中断进出 | `OSIntEnter()` / `OSIntExit()` | `rt_interrupt_enter()` / `rt_interrupt_leave()` |

最要命的是**系统时钟从 36M 变成了 64M**，这一步后面会展开讲，因为几乎所有"节拍错乱"的 bug 都源于这里。

## 三、移植的七个步骤

### 步骤 0：先摸清老工程

动手前先回答四个问题，它们直接决定工作量：

1. **时钟多少**？36M 还是 72M？→ 影响所有 `uart_init(pclk, baud)`、`Timer_Init(arr, psc)` 参数
2. **哪些外设用了**？串口几路、定时器几个、看门狗、Flash、RTC → 决定哪些要改、哪些可原样搬
3. **哪些是纯寄存器驱动**？`sys/wdg/stmflash/rtc` 这类直接操作 `GPIOx->ODR`、`TIMx->CR1` 的代码，与 HAL 不冲突，**几乎零改动**
4. **哪些外设会和 RT-Thread BSP 抢**？串口（控制台）、外部中断（PIN 驱动）、SysTick（系统节拍）→ 这些要特别处理

这一步看着是"了解情况"，其实是整个移植的命门。**纯寄存器驱动能原样搬**这一点，会帮你省掉一半以上的工作量。

### 步骤 1：建 RT-Thread Studio 空工程

1. RT-Thread Studio 新建工程，选对芯片型号（如 STM32F103RC）、HAL 库版本
2. 确认生成的工程结构：`rt-thread/`（内核）、`libraries/`（HAL）、`drivers/`（BSP）、`applications/`（应用）
3. **先能编译下载跑通空工程**（msh 控制台出提示符），再开始移植

> ⚠️ 别急着堆代码，先保证空工程能跑通。不然你都不知道问题出在"移植"还是"工程本身"。

### 步骤 2：把老应用源码按功能搬进 applications/

**不要整堆复制**，按功能分子目录：

```
applications/
├── app/       入口 main.c + 全局数据头
├── screen/    界面相关（大彩屏/按键/界面任务）
├── traffic/   核心业务（数据收发/主任务/动作任务）
├── comm/      串口通信
├── driver/    底层驱动（timer/wdg/exti/sys/delay）
├── storage/   存储与时钟（flash/rtc）
└── diag/      诊断测试代码（默认全注释）
```

> 🔧 **一个隐蔽的坑**：Eclipse CDT 托管构建实际读 `.cproject` 的 sourceEntry（工程根自动递归发现 `.c`），SConscript 只在"重新生成工程"时用。**两边都要改到位**，否则新加的源文件不会被编译。

### 步骤 3：头文件与 API 替换

这一步是机械操作，照着改就行：

```c
// 头文件替换
#include "stm32f10x.h"                              → #include "stm32f1xx_hal.h"
#include "includes.h" / "ucos_ii.h" / "app_cfg.h"   → #include <rtthread.h>

// 中断进出
OSIntEnter();   → rt_interrupt_enter();   // 中断函数开头
OSIntExit();    → rt_interrupt_leave();   // 中断函数结尾
```

任务创建的替换见文末速查表，参数顺序完全不同，务必查 RT-Thread 头文件确认签名。

### 步骤 4：时钟迁移（最容易出 bug 的一步）

老工程 36M、新工程 64M，**所有依赖时钟的参数都要重算**，核心原则是"保持业务节拍不变"：

- 老：`Timer2_Init(499, 3599)` → 36M 下 TIM2 计数时钟 10KHz、周期 50ms
- 新：`Timer2_Init(499, 6399)` → 64M 下 TIM2 计数时钟仍 10KHz、周期仍 50ms

```
定时器计数时钟 = 系统时钟 / (psc + 1)
周期 = (arr + 1) / 计数时钟
```

串口波特率同理，`uart_init(pclk, baud)` 里的 pclk 要改成新时钟（APB1=32M、APB2=64M）。

### 步骤 5：处理"和 RT-Thread 抢资源"的外设

这是和普通裸机迁移最大的区别，RT-Thread 会占用一些资源：

- **控制台串口**：RT-Thread 用 `RT_CONSOLE_DEVICE_NAME` 指定一个 UART 做 msh 控制台。业务代码**不得再初始化这个串口、不得重定义它的中断**。若原工程用了它，就换一路串口或暂时禁用。
- **SysTick**：uC/OS 和 RT-Thread 都用 SysTick 做节拍，但 RT-Thread 的 `RT_TICK_PER_SECOND` 默认 1000（1ms），老代码"按 tick 延时"要换算成毫秒。
- **外部中断**：RT-Thread 有 PIN 驱动（`rt_pin_attach_irq`），若老代码自己写 `EXTIx_IRQHandler` 会冲突，冲突的部分 `#if 0` 禁用。

### 步骤 6：编码与构建配置

1. 中文注释编码：`.cproject` 加 `-finput-charset=UTF-8 -fexec-charset=GBK`
2. 空闲线程栈：若 main 线程退出时栈溢出，把 `IDLE_THREAD_STACK_SIZE` 从 256 调到 1024
3. 头文件搜索路径：`.cproject` 的 -I 要加 applications 及其所有子目录

### 步骤 7：验证

msh 控制台（115200）上电应出 RT-Thread 版本横幅 + 自己的启动打印，然后：

```bash
ps      # 看线程列表，确认业务线程都在、无 stack overflow
free    # 看堆内存
```

再逐项物理验证业务功能（串口收发、动作、掉电保持、RTC）。

## 四、uC/OS-II ↔ RT-Thread 对照速查表

| uC/OS-II | RT-Thread | 说明 |
|----------|-----------|------|
| `OSTaskCreate(...)` | `rt_thread_init(&tid, name, entry, param, stack, stack_size, prio, tick)` | 静态栈，避免动态碎片 |
| `OSStart()` | `rt_thread_startup(&tid)` | RT-Thread 无全局启动，逐个 start |
| `OSTimeDly(2)` | `rt_thread_mdelay(100)` | 老 1 tick=50ms，2 tick=100ms |
| `OSTimeDlyHMSM(...)` | `rt_thread_mdelay(ms)` | 直接给毫秒 |
| `OSIntEnter()` | `rt_interrupt_enter()` | 中断开头 |
| `OSIntExit()` | `rt_interrupt_leave()` | 中断结尾 |
| `OS_ENTER_CRITICAL()` | `rt_enter_critical()` | 关中断临界区 |
| `OS_EXIT_CRITICAL()` | `rt_exit_critical()` | 开中断 |
| 消息邮箱 `OSMbox` | `rt_mq_send` / `rt_mq_recv` | 语义类似，API 不同 |
| 信号量 `OSSemPend` | `rt_sem_take` | |

> 本项目只用了任务 + 延时 + 中断进出，未用邮箱/信号量；若老工程用了，按上表对应替换，注意参数顺序完全不同。

## 五、踩坑记录（这才是本文的重点）

### 坑 1：串口没反应，先查硬件再查软件

**现象**：移植完串口收发没反应，一开始以为是软件问题，查了半天代码。

**真相**：用"回发测试"（收到啥回啥）+ "心跳测试"（每秒发固定字节）二分定位，最后确认是**接收线硬件问题**，根本不是软件。

**教训**：别一上来就怀疑自己代码，先用最小测试隔离出"硬件"还是"软件"。

### 坑 2：定时器节拍算错

时钟从 36M 改 64M 后忘记重算 `psc`，导致业务节拍翻倍或减半。这是最隐蔽的坑，因为程序能跑，但所有时序全乱了。

### 坑 3：控制台串口冲突

业务又去初始化控制台用的 UART，导致 msh 死掉或数据错乱。**控制台串口是 RT-Thread 的私有领地，别碰**。

### 坑 4：中断重定义

`EXTIx_IRQHandler` 和 PIN 驱动重复定义，链接报 `multiple definition`。改法就是冲突的那部分 `#if 0` 禁用。

### 坑 5：位带操作的"假 bug"

`PBin(n)` 返回的是 32 位 0/1，`~IO_PO7` 会得到 `0xFFFFFFFE`/`0xFFFFFFFF`，截断成字节就是 `FE`/`FF`。**这是正常的**，别当 bug 改掉——老固件和上位机就是按 FE/FF 判定的。

### 坑 6：中文乱码

源码 UTF-8 但运行输出要 GBK，编译参数没加 `-fexec-charset=GBK` 就会乱码。

### 坑 7：参数存储区与固件重叠（致命坑，本次实踩）

这是最惨的一个坑，专门拿出来讲。

**现象**：上电亮 → 约 1 秒灭 → 再亮，循环往复；屏幕无信号、按键无反应。

**根因**：Flash 参数区地址通常是照旧固件体积预留的，新 RT-Thread 固件往往更大（本例约 130KB），一旦覆盖参数区（本例原 `QJH_STMFLASH_ADD=0x08019000` 在 100KB 处），开机初始化 `CS_Init()` 写默认参数时会**整页擦除该扇区，把正在运行的程序代码擦掉**，导致 HardFault 死机 + 看门狗反复复位。

**排查方法**：
```bash
arm-none-eabi-size rtthread.elf   # 看 text 段
ls -l rtthread.bin                 # 看总映像体积
```

**判断标准**：参数区偏移地址 > 固件体积。

**稳妥做法**：把参数区放到芯片 Flash 最后一个 2KB 扇区，如 256KB 芯片用 `0x0803F800`。

> ⚠️ 这个坑最恶心的地方在于：**现象是"反复复位"，但根因是"固件把参数区覆盖了"**，两个问题叠在一起，很难定位。移植完一定要核对参数区地址在固件之后。

## 六、诊断测试方法（可复用模板）

把临时测试代码集中放一个 `diag/diag_test.c`，**默认全注释**，需要哪个取消注释哪个，用完全注释回来，保证交付时代码干净。

- **回发测试**：串口收到字节原样发回 → 验证收发链路通不通
- **心跳测试**：定时每秒发 `AA 55` → 验证串口号/波特率/发送路
- **继电器开机标志**：在 `Gpio_Set()` 末尾点亮一路继电器，上电看它亮不亮 → 判断程序有没有跑到 GPIO 初始化
- **继电器心跳**：在任务主循环里每 100ms 翻转一路继电器，肉眼看到快速闪烁 → 该任务在跑、调度器正常；完全不闪 → 死机在更早处
- **喂狗挪进中断**：把 IWDG 喂狗从任务循环临时挪到定时器中断，二分定位死机点

> 💡 这些方法特别适合**没有示波器、没有串口、只能看灯、听继电器咔咔声**的现场调试场景。

## 七、交付前检查清单

- [ ] 所有临时测试代码已集中到 `diag/` 并全部注释
- [ ] 无残留的 `// ★诊断` 或调试打印
- [ ] 参数区地址在固件之后（text 段 < 参数区偏移地址）
- [ ] README 更新（目录结构、线程模型、初始化流程、移植改动、构建要点、验证方法）
- [ ] msh 控制台 `ps` 无栈溢出、`free` 无泄漏
- [ ] 中文注释编码正确、屏幕显示正常
- [ ] SConscript 与 .cproject 源码收集一致

## 八、总结

这次迁移最深的体会是：

1. **先摸清老工程再动手**，纯寄存器驱动能原样搬，能省一半工作量
2. **时钟迁移是最大的雷区**，所有依赖时钟的参数都要重算
3. **RT-Thread 会占用资源**，控制台串口、SysTick、外部中断都要特别注意
4. **参数区地址要核对**，这是最容易被忽略、后果最严重的坑
5. **诊断方法要成体系**，二分定位比瞎猜高效得多

从 uC/OS-II 到 RT-Thread，本质上是一次技术栈的现代化升级。过程虽然踩了不少坑，但迁移完成后，RT-Thread 的 msh 命令行、BSP 驱动、软件包生态带来的开发效率提升，是值得的。

希望这篇经验分享能帮你在这条路上少踩几个坑。

---

*如果你觉得这篇文章对你有帮助，欢迎点赞、收藏、转发！*
