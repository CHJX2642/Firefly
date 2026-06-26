---
title: Modbus TCP Python PLC — 基于 Python 的 PLC 数据采集方案
published: 2026-06-26
description: 使用 Python 通过 Modbus TCP 协议采集西门子 PLC 数据，支持多种数据类型，自动保存 CSV 文件，断线自动重连。
tags: [Python, PLC, Modbus, 工业自动化, 数据采集]
category: 项目分享
draft: false
image: ./images/modbus-cover.png
---

## 🚀 项目简介

**Modbus TCP Python PLC** 是一个基于 Python 的工业数据采集程序，通过 Modbus TCP 协议与西门子 PLC 通信，实时采集数据并保存到 CSV 文件。

**Gitee 地址：** [Modbus-TCP-Python-PLC](https://gitee.com/chjx2642/Modbus-TCP-Python-PLC)

### 为什么要做这个项目？

在工业自动化领域，PLC（可编程逻辑控制器）是核心控制设备。但 PLC 本身不便于数据分析和可视化，我们需要：

1. **实时采集 PLC 数据**：温度、压力、运行状态等
2. **数据持久化**：保存到文件便于后续分析
3. **灵活配置**：不同项目变量不同，需要快速适配
4. **稳定可靠**：工业场景要求长时间稳定运行

## ✨ 功能特性

- **自动读取变量表**：解析 TIA Portal 导出的 Excel 文件，无需手动配置地址
- **多种数据类型**：支持 `Int`、`Word`、`DInt`、`DWord`、`Real`、`Bool`
- **实时显示**：终端表格实时刷新采集数据
- **自动保存 CSV**：按配置自动分文件保存，旧文件自动清理
- **断线重连**：网络异常时自动重新连接
- **零代码适配**：修改 Excel 即可适配新项目

## 🏗️ 项目架构

```
modbus-tcp-python-plc/
├── main.py                # 配置中心 + 启动入口
├── data_acquisition.py    # 数据采集逻辑封装
├── modbus_client.py       # Modbus TCP 通讯封装
├── data_converter.py      # 数据类型转换
├── excel_reader.py        # Excel 变量表读取
├── csv_manager.py         # CSV 文件管理
├── display.py             # 终端表格显示
├── Modbus_Map.xlsx        # 变量表（TIA Portal 导出格式）
└── requirements.txt       # Python 依赖
```

## 🔧 核心代码解析

### 1. Modbus TCP 通讯封装

项目使用 `pymodbus` 库实现 Modbus TCP 通讯，封装了常用的功能码：

```python
# modbus_client.py
from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ModbusIOException

class ModbusClient:
    def __init__(self, host: str, port: int = 502, unit_id: int = 1):
        self.host = host
        self.port = port
        self.unit_id = unit_id
        self.client = None
        self.connected = False
    
    def connect(self) -> bool:
        """建立连接"""
        try:
            self.client = ModbusTcpClient(
                host=self.host,
                port=self.port,
                timeout=3
            )
            self.connected = self.client.connect()
            return self.connected
        except Exception as e:
            print(f"连接失败: {e}")
            return False
    
    def read_holding_registers(self, address: int, count: int) -> list:
        """读取保持寄存器（FC03）"""
        if not self.connected:
            return []
        
        try:
            result = self.client.read_holding_registers(
                address=address,
                count=count,
                unit=self.unit_id
            )
            if result.isError():
                return []
            return result.registers
        except ModbusIOException:
            self.connected = False
            return []
    
    def read_coils(self, address: int, count: int) -> list:
        """读取线圈（FC01）"""
        if not self.connected:
            return []
        
        try:
            result = self.client.read_coils(
                address=address,
                count=count,
                unit=self.unit_id
            )
            if result.isError():
                return []
            return result.bits[:count]
        except ModbusIOException:
            self.connected = False
            return []
```

### 2. 数据类型转换

不同数据类型在 PLC 中的存储方式不同，需要正确解析：

```python
# data_converter.py
import struct
from typing import Any

class DataConverter:
    """数据类型转换器"""
    
    @staticmethod
    def registers_to_int(registers: list) -> int:
        """将两个寄存器转换为 Int（16位有符号整数）"""
        if len(registers) < 1:
            return 0
        # 直接使用 16 位有符号整数
        value = registers[0]
        if value > 32767:
            value -= 65536
        return value
    
    @staticmethod
    def registers_to_dint(registers: list) -> int:
        """将两个寄存器转换为 DInt（32位有符号整数）"""
        if len(registers) < 2:
            return 0
        # 高字在前，低字在后
        raw = (registers[0] << 16) | registers[1]
        # 转换为有符号整数
        if raw > 2147483647:
            raw -= 4294967296
        return raw
    
    @staticmethod
    def registers_to_real(registers: list) -> float:
        """将两个寄存器转换为 Real（32位浮点数）"""
        if len(registers) < 2:
            return 0.0
        # 高字在前，低字在后
        raw = (registers[0] << 16) | registers[1]
        # 使用 struct 解包为浮点数
        return struct.unpack('!f', struct.pack('!I', raw))[0]
    
    @staticmethod
    def registers_to_bool(registers: list, bit: int = 0) -> bool:
        """从寄存器中提取指定位作为 Bool"""
        if len(registers) < 1:
            return False
        return bool((registers[0] >> bit) & 1)
    
    @staticmethod
    def convert(data_type: str, registers: list, bit: int = 0) -> Any:
        """根据数据类型自动转换"""
        converters = {
            'Int': lambda r: DataConverter.registers_to_int(r),
            'Word': lambda r: r[0] if r else 0,
            'DInt': lambda r: DataConverter.registers_to_dint(r),
            'DWord': lambda r: (r[0] << 16) | r[1] if len(r) >= 2 else 0,
            'Real': lambda r: DataConverter.registers_to_real(r),
            'Bool': lambda r: DataConverter.registers_to_bool(r, bit),
        }
        
        converter = converters.get(data_type)
        if converter:
            return converter(registers)
        return None
```

### 3. Excel 变量表解析

从 TIA Portal 导出的变量表可以自动解析，无需手动配置：

```python
# excel_reader.py
import openpyxl
from typing import List, Dict

class ExcelReader:
    """读取 TIA Portal 导出的变量表"""
    
    # 数据类型到 Modbus 寄存器数量的映射
    TYPE_REGISTER_COUNT = {
        'Int': 1,
        'Word': 1,
        'DInt': 2,
        'DWord': 2,
        'Real': 2,
        'Bool': 1,
    }
    
    def read_variable_map(self, file_path: str) -> List[Dict]:
        """
        读取变量表
        
        Excel 格式：
        | 变量名 | 数据类型 | 字节偏移 |
        |--------|---------|---------|
        | 温度传感器 | Real | 0 |
        | 压力传感器 | Real | 4 |
        | 运行状态 | Bool | 8.1 |
        """
        wb = openpyxl.load_workbook(file_path, read_only=True)
        ws = wb.active
        
        variables = []
        max_address = 0
        
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row[0]:
                continue
            
            name = str(row[0]).strip()
            data_type = str(row[1]).strip()
            offset_str = str(row[2]).strip()
            
            # 解析字节偏移（支持位寻址，如 8.1）
            byte_offset, bit = self._parse_offset(offset_str)
            
            # 计算 Modbus 地址
            modbus_address = byte_offset // 2
            register_count = self.TYPE_REGISTER_COUNT.get(data_type, 1)
            
            variable = {
                'name': name,
                'data_type': data_type,
                'byte_offset': byte_offset,
                'bit': bit,
                'modbus_address': modbus_address,
                'register_count': register_count,
            }
            variables.append(variable)
            
            # 更新最大地址
            end_address = modbus_address + register_count
            if end_address > max_address:
                max_address = end_address
        
        wb.close()
        return variables, max_address
    
    def _parse_offset(self, offset_str: str) -> tuple:
        """解析字节偏移，支持位寻址"""
        if '.' in offset_str:
            parts = offset_str.split('.')
            return int(parts[0]), int(parts[1])
        return int(offset_str), 0
```

### 4. 数据采集逻辑

核心的采集循环，支持断线重连：

```python
# data_acquisition.py
import time
import threading
from typing import Callable, List, Dict

class DataAcquisition:
    """数据采集管理器"""
    
    def __init__(self, modbus_client, variables: List[Dict], max_address: int):
        self.client = modbus_client
        self.variables = variables
        self.max_address = max_address
        self.running = False
        self.data_callback = None
    
    def start(self, interval_ms: int = 1000, callback: Callable = None):
        """开始采集"""
        self.running = True
        self.data_callback = callback
        
        # 在后台线程中运行采集循环
        self.thread = threading.Thread(target=self._采集循环, daemon=True)
        self.thread.start()
    
    def stop(self):
        """停止采集"""
        self.running = False
    
    def _采集循环(self):
        """采集主循环"""
        while self.running:
            try:
                # 检查连接
                if not self.client.connected:
                    print("尝试重新连接...")
                    if not self.client.connect():
                        print("重连失败，3秒后重试")
                        time.sleep(3)
                        continue
                    print("重连成功!")
                
                # 读取所有寄存器
                registers = self.client.read_holding_registers(
                    address=0,
                    count=self.max_address
                )
                
                if not registers:
                    print("读取失败")
                    time.sleep(1)
                    continue
                
                # 解析每个变量
                results = []
                for var in self.variables:
                    start = var['modbus_address']
                    count = var['register_count']
                    
                    # 提取对应的寄存器
                    var_registers = registers[start:start + count]
                    
                    # 转换数据类型
                    value = DataConverter.convert(
                        var['data_type'],
                        var_registers,
                        var['bit']
                    )
                    
                    results.append({
                        'name': var['name'],
                        'offset': var['byte_offset'],
                        'bit': var['bit'],
                        'type': var['data_type'],
                        'value': value,
                    })
                
                # 回调通知
                if self.data_callback:
                    self.data_callback(results)
                
            except Exception as e:
                print(f"采集异常: {e}")
                self.client.connected = False
            
            # 等待下一次采集
            time.sleep(interval_ms / 1000)
```

### 5. 配置中心

所有配置集中在 `main.py` 顶部，修改方便：

```python
# main.py
from modbus_client import ModbusClient
from data_acquisition import DataAcquisition
from excel_reader import ExcelReader
from csv_manager import CSVManager
from display import Display

# ========== 配置区 ==========
PLC_IP = "192.168.0.1"           # PLC 的 IP 地址
PLC_PORT = 502                   # Modbus TCP 端口
UNIT_ID = 1                      # 从站 ID
TIMEOUT = 3                      # 超时时间（秒）
SAMPLE_INTERVAL_MS = 1000        # 采集间隔（毫秒）
MAP_FILE = "Modbus_Map.xlsx"     # 变量表文件名
ROWS_PER_FILE = 30               # 每个 CSV 保存的数据行数
MAX_CSV_FILES = 6                # 最多保留的 CSV 文件数量
# ==============================

def main():
    # 1. 读取变量表
    reader = ExcelReader()
    variables, max_address = reader.read_variable_map(MAP_FILE)
    print(f"变量表: {MAP_FILE}（{len(variables)} 个变量）")
    print(f"读取范围: 地址 0~{max_address}")
    
    # 2. 创建 Modbus 客户端
    client = ModbusClient(
        host=PLC_IP,
        port=PLC_PORT,
        unit_id=UNIT_ID
    )
    
    # 3. 连接 PLC
    if not client.connect():
        print("无法连接到 PLC")
        return
    
    print(f"已连接到 {PLC_IP}:{PLC_PORT}")
    
    # 4. 创建 CSV 管理器
    csv_manager = CSVManager(
        rows_per_file=ROWS_PER_FILE,
        max_files=MAX_CSV_FILES
    )
    
    # 5. 创建显示器
    display = Display(variables)
    
    # 6. 定义数据回调
    def on_data(results):
        display.show(results)
        csv_manager.save(results)
    
    # 7. 启动采集
    acquirer = DataAcquisition(client, variables, max_address)
    acquirer.start(
        interval_ms=SAMPLE_INTERVAL_MS,
        callback=on_data
    )
    
    print(f"采集间隔: {SAMPLE_INTERVAL_MS}ms")
    print("按 Ctrl+C 停止")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        acquirer.stop()
        client.disconnect()
        print("\n采集已停止")

if __name__ == "__main__":
    main()
```

## 📦 快速开始

### 方式一：直接运行 Python

#### 1. 安装依赖

```bash
pip install -r requirements.txt
```

#### 2. 准备变量表

从 TIA Portal 导出 DB 块变量表为 Excel 文件：

| 变量名 | 数据类型 | 字节偏移 |
|--------|---------|---------|
| 温度传感器 | Real | 0 |
| 压力传感器 | Real | 4 |
| 运行状态 | Bool | 8.1 |

将文件命名为 `Modbus_Map.xlsx` 放在程序同目录下。

#### 3. 修改配置

打开 `main.py`，修改 PLC 的 IP 地址等配置。

#### 4. 运行

```bash
python main.py
```

### 方式二：打包成 EXE（推荐）

如果你不熟悉 Python 环境，可以直接使用打包好的 EXE 程序：

#### 1. 下载打包版

从 Gitee 仓库的 Release 页面下载最新版本的 `Modbus_TCP_DataCollector.exe`。

#### 2. 准备变量表

将 TIA Portal 导出的 `Modbus_Map.xlsx` 放在 EXE 同目录下。

#### 3. 修改配置

打开 `config.ini` 文件（首次运行会自动创建），修改 PLC 的 IP 地址等配置：

```ini
[PLC]
ip = 192.168.0.1
port = 502
unit_id = 1

[采集]
interval_ms = 1000
timeout = 3

[CSV]
rows_per_file = 30
max_files = 6
```

#### 4. 运行

双击 `Modbus_TCP_DataCollector.exe` 即可运行，无需安装 Python 环境。

> 💡 **提示**：打包版程序会自动读取同目录下的 `Modbus_Map.xlsx` 和 `config.ini`，修改 Excel 或配置文件即可适配不同项目，无需修改代码。

## 🔌 PLC 端配置要求

西门子 S7-1200/1500 需在 TIA Portal 中配置 `MB_SERVER` 功能块：

1. **IP_PORT**：502
2. **MB_HOLD_REG**：指向 DB 块，覆盖所有需要读取的变量区域
3. **S7_Optimized_Access**：DB 块必须**关闭**优化访问
4. DB 块大小需覆盖到最大字节偏移

## 📊 地址换算规则

TIA Portal DB 块中的字节偏移与 Modbus 地址的关系：

```
Modbus 地址 = DB 字节偏移 ÷ 2
```

| DB 字节偏移 | 数据类型 | Modbus 地址 | 说明 |
|------------|---------|------------|------|
| 0 | Int（2字节） | 0 | 占 1 个寄存器 |
| 4 | Real（4字节） | 2 | 占 2 个寄存器 |
| 8.1 | Bool（1位） | 4.01 | 位寻址 |

## 💡 使用场景

1. **工业数据监控**：实时监控生产线数据
2. **数据采集与存储**：保存历史数据用于分析
3. **SCADA 系统集成**：作为数据采集前端
4. **工业物联网（IIoT）**：将 PLC 数据上传到云平台

## 🛠️ 技术栈

- **Python 3.10+**
- **pymodbus**：Modbus TCP 通讯
- **openpyxl**：Excel 文件读取
- **csv**：数据持久化

## 📝 总结

Modbus TCP Python PLC 解决了工业场景下 PLC 数据采集的痛点：

1. ✅ 自动解析变量表，无需手动配置地址
2. ✅ 支持多种数据类型
3. ✅ 断线自动重连，稳定可靠
4. ✅ 自动保存 CSV，便于数据分析
5. ✅ 修改 Excel 即可适配新项目

项目开源（MIT 协议），欢迎试用和反馈！

---

*如果你觉得这个项目对你有帮助，欢迎点个 Star 支持一下！*

*Gitee：[Modbus-TCP-Python-PLC](https://gitee.com/chjx2642/Modbus-TCP-Python-PLC)*
