---
title: STM32F103 + ILI9341 LCD — 月薪喵 GIF 动画播放器
published: 2026-06-28
description: 基于 STM32F103ZET6 + ILI9341 LCD 的月薪喵 GIF 动画循环播放项目，支持自定义动画，完整源码和工具脚本。
tags: [STM32, LCD, GIF, 动画, 嵌入式]
category: 项目分享
draft: false
image: ./images/yuexinmiao-cover.jpg
---

## 🚀 项目简介

这是一个基于 **STM32F103ZET6** 的趣味小项目 —— 在 **ILI9341 TFT LCD** 屏幕上循环播放**月薪喵 GIF 动画**。

**Gitee 地址：** [260614_STM32F103ZET6_LCD_Yue_Xin_Miao](https://gitee.com/chjx2642/260614_STM32F103ZET6_LCD_Yue_Xin_Miao)

### 演示视频

<div style="max-width: 320px; margin: 0 auto;">
  <video src="/assets/videos/yuexinmiao-demo.mp4" controls style="width: 100%; border-radius: 0.75rem;">
    您的浏览器不支持视频播放。
  </video>
</div>

### 抖音展示

https://v.douyin.com/YTUtUS86jGE/

### 为什么要做这个项目？

有时候学习嵌入式开发需要一些有趣的项目来保持动力。这个项目：

1. **简单有趣**：在 LCD 上播放可爱动画
2. **学习价值**：掌握 LCD 驱动、FSMC 接口、Flash 存储管理
3. **可扩展**：可以更换任何你喜欢的 GIF 动画
4. **硬件要求低**：只需要 STM32 开发板 + LCD 模块

## ✨ 功能特性

- **GIF 动画循环播放**：在 320×240 TFT LCD 屏幕中央
- **动画规格**：100×100 像素，24 帧，25fps 流畅播放
- **自动旋转**：图片旋转 90° 显示（适配竖屏）
- **开机提示**：显示系统信息界面，1.5 秒后自动进入动画
- **可自定义**：提供 Python 工具脚本，轻松更换 GIF 动画

## 🏗️ 硬件平台

| 项目 | 型号 |
|------|------|
| MCU | STM32F103ZET6 (Cortex-M3, 72MHz) |
| LCD | ILI9341 TFT, 320×240, 16-bit RGB565 |
| LCD 接口 | FSMC 16-bit 并行 (Bank1 NE4) |
| Flash | 512 KB |
| RAM | 64 KB |

## 🔧 核心代码解析

### 1. 主程序 — 动画播放逻辑

```c
// main.c
#include "main.h"
#include "lcd.h"
#include "cat_frames.h"

// 动画参数
#define CAT_WIDTH   100
#define CAT_HEIGHT  100
#define CAT_FRAMES  24
#define FRAME_DELAY 40  // 25fps = 40ms/帧

// 居中显示坐标
#define ANIM_CENTER_X  ((320 - CAT_WIDTH) / 2)  // = 110
#define ANIM_CENTER_Y  ((240 - CAT_HEIGHT) / 2) // = 70

int main(void) {
    // 系统初始化
    HAL_Init();
    SystemClock_Config();
    LCD_Init();
    
    // 开机提示界面
    LCD_Clear(WHITE);
    LCD_ShowString(30, 80, "Yue Xin Miao Player", BLACK, WHITE, 16);
    LCD_ShowString(30, 100, "STM32F103ZET6", BLACK, WHITE, 16);
    LCD_ShowString(30, 120, "LCD: 320x240", BLACK, WHITE, 16);
    LCD_ShowString(30, 140, "Loading...", BLACK, WHITE, 16);
    
    HAL_Delay(1500);  // 等待 1.5 秒
    
    // 清屏
    LCD_Clear(WHITE);
    
    // 主循环 - 播放动画
    while (1) {
        for (int frame = 0; frame < CAT_FRAMES; frame++) {
            // 计算当前帧数据地址
            // 每帧大小: 100 * 100 * 2 = 20000 字节 (RGB565)
            uint32_t offset = frame * CAT_WIDTH * CAT_HEIGHT * 2;
            const uint16_t *frame_data = &cat_frames_data[offset];
            
            // 在屏幕中央显示当前帧
            LCD_DrawImage(ANIM_CENTER_X, ANIM_CENTER_Y, 
                         CAT_WIDTH, CAT_HEIGHT, frame_data);
            
            // 帧延迟
            HAL_Delay(FRAME_DELAY);
        }
    }
}
```

### 2. LCD 驱动 — FSMC 接口

使用 FSMC 接口驱动 LCD，速度快且稳定：

```c
// lcd.c
#define LCD_BASE  ((uint32_t)(0x6C000000 | 0x0000007E))  // FSMC Bank1 NE4

void LCD_Init(void) {
    // 初始化 FSMC
    MX_FSMC_Init();
    
    // ILI9341 初始化序列
    LCD_WriteCommand(0x01);  // 软件复位
    HAL_Delay(50);
    
    LCD_WriteCommand(0xCF);  // 电源控制
    LCD_WriteData(0x00);
    LCD_WriteData(0xC1);
    LCD_WriteData(0x30);
    
    LCD_WriteCommand(0xED);  // 电源控制
    LCD_WriteData(0x64);
    LCD_WriteData(0x03);
    LCD_WriteData(0x12);
    LCD_WriteData(0x81);
    
    // ... 更多初始化命令 ...
    
    LCD_WriteCommand(0x11);  // 退出睡眠
    HAL_Delay(120);
    
    LCD_WriteCommand(0x29);  // 显示开
    HAL_Delay(50);
}

void LCD_WriteCommand(uint16_t cmd) {
    *(__IO uint16_t *)LCD_BASE = cmd;
}

void LCD_WriteData(uint16_t data) {
    *(__IO uint16_t *)(LCD_BASE | (1 << 17)) = data;  // RS=1
}

void LCD_DrawImage(uint16_t x, uint16_t y, uint16_t w, uint16_t h, 
                   const uint16_t *data) {
    // 设置窗口
    LCD_SetWindow(x, y, x + w - 1, y + h - 1);
    
    // 写入图像数据
    for (uint32_t i = 0; i < w * h; i++) {
        LCD_WriteData(data[i]);
    }
}

void LCD_SetWindow(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1) {
    LCD_WriteCommand(0x2A);  // 列地址设置
    LCD_WriteData(x0 >> 8);
    LCD_WriteData(x0 & 0xFF);
    LCD_WriteData(x1 >> 8);
    LCD_WriteData(x1 & 0xFF);
    
    LCD_WriteCommand(0x2B);  // 行地址设置
    LCD_WriteData(y0 >> 8);
    LCD_WriteData(y0 & 0xFF);
    LCD_WriteData(y1 >> 8);
    LCD_WriteData(y1 & 0xFF);
    
    LCD_WriteCommand(0x2C);  // 写入显存
}
```

### 3. 动画帧数据 — Flash 存储

动画帧数据存储在 Flash 中，结构如下：

```c
// cat_frames.h
#ifndef __CAT_FRAMES_H
#define __CAT_FRAMES_H

#include <stdint.h>

// 动画参数
#define CAT_WIDTH   100
#define CAT_HEIGHT  100
#define CAT_FRAMES  24

// 每帧大小: 100 * 100 * 2 = 20000 字节 (RGB565)
// 总大小: 20000 * 24 = 480000 字节 ≈ 469 KB

// 动画帧数据 (由 gif_to_c.py 自动生成)
// 顺序: 第0帧、第1帧、...、第23帧
// 每帧内: 从左到右、从上到下
// 颜色格式: RGB565 (16-bit)
extern const uint16_t cat_frames_data[];

#endif
```

### 4. GIF 转 C 数组工具

项目提供了一个 Python 脚本，可以将任意 GIF 转换为 C 数组：

```python
#!/usr/bin/env python3
# tools/gif_to_c.py
"""
GIF 转 C 数组工具
将 GIF 动画转换为 STM32 可用的 RGB565 格式 C 数组
"""

import sys
from PIL import Image

def gif_to_c(input_path, output_path, width, height, rotate=0, max_frames=0):
    """
    转换 GIF 到 C 数组
    
    参数:
        input_path  - 输入 GIF 文件路径
        output_path - 输出 .h 文件路径
        width       - 目标宽度
        height      - 目标高度
        rotate      - 旋转角度 (0/90/180/270)
        max_frames  - 最大帧数 (0=全部)
    """
    # 打开 GIF
    gif = Image.open(input_path)
    
    # 获取帧数
    n_frames = gif.n_frames
    if max_frames > 0:
        n_frames = min(n_frames, max_frames)
    
    print(f"输入: {input_path}")
    print(f"帧数: {n_frames}")
    print(f"尺寸: {width}x{height}")
    print(f"旋转: {rotate}°")
    
    # 生成 C 数组
    c_data = []
    
    for frame_idx in range(n_frames):
        gif.seek(frame_idx)
        frame = gif.convert('RGB')
        
        # 缩放
        frame = frame.resize((width, height), Image.Resampling.LANCZOS)
        
        # 旋转
        if rotate == 90:
            frame = frame.transpose(Image.Transpose.ROTATE_270)
        elif rotate == 180:
            frame = frame.transpose(Image.Transpose.ROTATE_180)
        elif rotate == 270:
            frame = frame.transpose(Image.Transpose.ROTATE_90)
        
        # 转换为 RGB565
        for y in range(height):
            for x in range(width):
                r, g, b = frame.getpixel((x, y))
                # RGB565: RRRRRGGGGGGBBBBB
                rgb565 = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3)
                c_data.append(rgb565)
    
    # 写入 .h 文件
    with open(output_path, 'w') as f:
        f.write("#ifndef __CAT_FRAMES_H\n")
        f.write("#define __CAT_FRAMES_H\n\n")
        f.write("#include <stdint.h>\n\n")
        f.write(f"#define CAT_WIDTH   {width}\n")
        f.write(f"#define CAT_HEIGHT  {height}\n")
        f.write(f"#define CAT_FRAMES  {n_frames}\n\n")
        f.write(f"// 由 gif_to_c.py 自动生成\n")
        f.write(f"// 帧数据大小: {len(c_data) * 2} 字节\n\n")
        f.write("extern const uint16_t cat_frames_data[];\n\n")
        f.write("#endif\n")
        
        # 写入 .c 文件
        c_path = output_path.replace('.h', '.c')
        with open(c_path, 'w') as fc:
            fc.write(f'#include "{output_path.split("/")[-1]}"\n\n')
            fc.write(f"const uint16_t cat_frames_data[] = {{\n")
            
            for i, val in enumerate(c_data):
                if i % 16 == 0:
                    fc.write("    ")
                fc.write(f"0x{val:04X}, ")
                if i % 16 == 15:
                    fc.write("\n")
            
            fc.write("};\n")
    
    print(f"输出: {output_path}")
    print(f"数据大小: {len(c_data) * 2} 字节 ({len(c_data) * 2 / 1024:.1f} KB)")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: python gif_to_c.py <输入.gif> <输出.h> [宽] [高] [旋转] [最大帧数]")
        print("示例: python gif_to_c.py cat.gif cat_frames.h 100 100 90 24")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    width = int(sys.argv[3]) if len(sys.argv) > 3 else 100
    height = int(sys.argv[4]) if len(sys.argv) > 4 else 100
    rotate = int(sys.argv[5]) if len(sys.argv) > 5 else 0
    max_frames = int(sys.argv[6]) if len(sys.argv) > 6 else 0
    
    gif_to_c(input_path, output_path, width, height, rotate, max_frames)
```

## 📦 构建与烧录

### 使用 STM32CubeIDE

1. 用 STM32CubeIDE 打开项目文件夹
2. 构建项目 (Build)
3. 烧录到开发板

### 使用 CMake 命令行

```bash
cmake --preset Debug
cmake --build build/Debug
```

## 🎨 自定义动画

如需更换 GIF 动画，使用 `tools/gif_to_c.py` 转换：

```bash
# 安装依赖
pip install Pillow

# 转换 GIF (参数: 输入 输出 宽 高 旋转角度 最大帧数)
python tools/gif_to_c.py your_cat.gif Core/Inc/cat_frames.h 100 100 90 24
```

**参数说明：**
| 参数 | 说明 |
|------|------|
| `width` | 目标宽度，建议 100（受 512KB Flash 限制） |
| `height` | 目标高度，建议 100 |
| `rotate` | 旋转角度 (0/90/180/270) |
| `max_frames` | 最大帧数，0 表示全部使用 |

**转换后修改居中坐标：**

```c
// Core/Inc/main.h
#define ANIM_CENTER_X  ((320 - CAT_WIDTH) / 2)
#define ANIM_CENTER_Y  ((240 - CAT_HEIGHT) / 2)
```

## 📊 Flash 使用情况

STM32F103ZET6 有 512KB Flash，空间分配如下：

| 区域 | 大小 |
|------|------|
| 代码 + HAL 库 | ~24 KB |
| 字体数据 | ~16 KB |
| 动画帧数据 (24×100×100×2B) | ~469 KB |
| **合计** | **~505 KB / 512 KB** |

> ⚠️ **注意**：动画帧数据占用了大部分 Flash 空间。如果需要更大的动画，可以：
> 1. 减少帧数
> 2. 减小动画尺寸
> 3. 使用外部 Flash 存储

## 💡 使用场景

1. **桌面摆件**：放在桌面上播放可爱动画
2. **嵌入式学习**：掌握 LCD 驱动和 Flash 管理
3. **礼物制作**：定制专属动画送给朋友
4. **技术展示**：展示嵌入式开发能力

## 🛠️ 技术栈

- **C 语言**
- **STM32 HAL 库**
- **FSMC 接口**（LCD 驱动）
- **Python**（GIF 转换工具）

## 📝 总结

这个项目虽然简单，但涵盖了很多嵌入式开发的基础知识：

1. ✅ LCD 驱动开发（FSMC 接口）
2. ✅ Flash 存储管理（大数组存储）
3. ✅ 图像格式处理（RGB565）
4. ✅ 帧率控制和动画播放
5. ✅ 工具链开发（Python 脚本）

最重要的是，它可以播放任何你喜欢的 GIF 动画，让嵌入式开发变得更有趣！

项目开源（MIT 协议），欢迎试用和反馈！

---

*如果你觉得这个项目对你有帮助，欢迎点个 Star 支持一下！*

*Gitee：[260614_STM32F103ZET6_LCD_Yue_Xin_Miao](https://gitee.com/chjx2642/260614_STM32F103ZET6_LCD_Yue_Xin_Miao)*
