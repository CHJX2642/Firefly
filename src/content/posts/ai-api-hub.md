---
title: AI API Hub — 本地大模型 API 管理平台
published: 2026-06-23
description: 一个纯自定义的本地 AI 大模型 API 信息管理工具 + API 转接代理服务器，支持多家提供商、多协议自动转换，可打包为 EXE。
tags: [AI, API, 大模型, Python, 工具]
category: 项目分享
draft: false
image: ./images/ai-api-hub-cover.png
---

## 🚀 项目简介

**AI API Hub** 是一个本地 AI 大模型 API 管理平台，集成了 API 信息管理和转接代理两大核心功能。所有提供商、模型、密钥均由用户自行添加，无预置数据，完全自定义。

**Gitee 地址：** [AI-API-Hub](https://gitee.com/chjx2642/ai-api-hub)

### 为什么要做这个项目？

在日常使用 AI 工具的过程中，我遇到了以下痛点：

1. **多客户端管理混乱**：Cherry Studio、OpenCat、Claude Code、Codex CLI 等不同客户端需要分别配置 API Key
2. **多提供商切换麻烦**：OpenAI、Anthropic、DeepSeek、智谱等不同厂商的 API 格式不统一
3. **安全隐患**：直接把厂商 API Key 填入各种第三方客户端，存在泄露风险
4. **协议不兼容**：不同客户端支持的协议格式不同（OpenAI vs Anthropic），需要手动转换

于是，我开发了 **AI API Hub**，一个统一的管理平台来解决这些问题。

## ✨ 功能特性

### 📋 管理功能

- **完全自定义**：无预置数据，按需添加你的 API 提供商和模型
- **AI 智能解析**：粘贴 API 文档、上传文件或输入 URL，AI 自动识别提供商和模型信息并一键导入
- **提供商管理**：添加、编辑、删除 API 提供商（支持分类：国外主流/国内主流/其他）
- **模型管理**：记录模型 ID、Token 限制、多模态支持、函数调用、定价等信息
- **灵活计费**：支持按量计费（tokens）和按次收费两种定价方式
- **密钥管理**：集中管理 API 密钥，脱敏显示，一键复制，本地安全存储

### 🔄 API 转接/代理功能

这个功能是项目的核心亮点，支持多种协议的自动转换：

**三种协议端点：**
- `POST /v1/chat/completions` — OpenAI Chat Completions 格式（适配 Cherry Studio、OpenCat 等）
- `POST /v1/responses` — OpenAI Responses API 格式（适配 Codex CLI）
- `POST /v1/messages` — Anthropic Messages 格式（适配 Claude Code）

**核心特性：**
- **三 Key 分协议方案**：三把独立的 API Key，每把绑定一个输出协议，不同客户端软件用不同 Key 互不干扰
- **自动协议转换**：9 种组合全支持（3 种客户端协议 × 3 种厂商协议），自动翻译请求和响应格式
- **模型自动路由**：根据请求中的 model 名自动查找对应厂商、密钥和 API 地址
- **思考/推理内容支持**：DeepSeek-R1、Mimo 等 reasoning 模型的思考过程正确映射到各协议格式
- **流式输出**：支持 SSE 流式响应，三种协议均支持 streaming

## 🏗️ 项目架构

```
ai-api-hub/
├── run.py              # 程序入口
├── build.py            # PyInstaller 打包脚本
├── requirements.txt    # Python 依赖
├── app/
│   ├── __init__.py     # Flask 应用初始化
│   ├── routes.py       # API 路由定义
│   ├── proxy.py        # 核心代理转换逻辑
│   ├── models.py       # 数据模型定义
│   └── static/         # 前端静态资源
│       ├── index.html
│       ├── style.css
│       └── app.js
└── data/               # 本地数据存储
    └── config.json     # 用户配置文件
```

## 🔧 核心代码解析

### 1. Flask 应用初始化

项目使用 Flask 作为 Web 框架，启动时会自动打开浏览器：

```python
# run.py
from flask import Flask
from app import create_app

app = create_app()

if __name__ == '__main__':
    import webbrowser
    import threading
    
    # 自动打开浏览器
    threading.Timer(1.5, lambda: webbrowser.open('http://localhost:5000')).start()
    
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### 2. 多协议路由设计

项目的核心是支持三种不同的 API 协议端点：

```python
# app/routes.py
from flask import Blueprint, request, jsonify
from app.proxy import ProxyHandler

api = Blueprint('api', __name__)
proxy = ProxyHandler()

@api.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """OpenAI Chat Completions 格式端点"""
    return proxy.handle_openai_chat(request)

@api.route('/v1/responses', methods=['POST'])
def responses():
    """OpenAI Responses API 格式端点"""
    return proxy.handle_openai_responses(request)

@api.route('/v1/messages', methods=['POST'])
def messages():
    """Anthropic Messages 格式端点"""
    return proxy.handle_anthropic(request)

@api.route('/v1/models', methods=['GET'])
def list_models():
    """获取模型列表（OpenAI 格式）"""
    models = proxy.get_all_models()
    return jsonify({"data": models})
```

### 3. 协议转换核心逻辑

这是项目最核心的部分，负责将不同协议格式相互转换：

```python
# app/proxy.py
import json
import requests
from typing import Dict, Any, Generator

class ProxyHandler:
    def __init__(self):
        self.providers = self._load_providers()
        self.keys = self._load_keys()
    
    def handle_openai_chat(self, request) -> Dict[str, Any]:
        """处理 OpenAI Chat Completions 格式请求"""
        data = request.get_json()
        model_name = data.get('model')
        
        # 1. 根据模型名查找对应的厂商和密钥
        provider, api_key, api_url = self._route_model(model_name)
        
        # 2. 根据厂商协议格式转换请求
        if provider['protocol'] == 'openai':
            # 厂商本身就是 OpenAI 格式，直接转发
            target_data = data
        elif provider['protocol'] == 'anthropic':
            # 转换为 Anthropic 格式
            target_data = self._openai_to_anthropic(data)
        
        # 3. 转发请求到厂商 API
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            api_url,
            headers=headers,
            json=target_data,
            stream=data.get('stream', False)
        )
        
        # 4. 将响应转换回 OpenAI 格式
        if provider['protocol'] == 'anthropic':
            return self._anthropic_to_openai(response)
        
        return response.json()
    
    def _route_model(self, model_name: str) -> tuple:
        """根据模型名自动路由到对应的厂商"""
        for provider in self.providers:
            for model in provider.get('models', []):
                if model['id'] == model_name:
                    return (
                        provider,
                        self._get_api_key(provider['id']),
                        provider['api_url']
                    )
        raise ValueError(f"未找到模型: {model_name}")
    
    def _openai_to_anthropic(self, data: Dict) -> Dict:
        """将 OpenAI 格式转换为 Anthropic 格式"""
        messages = data.get('messages', [])
        
        # OpenAI 的 system 消息需要单独提取
        system_msg = None
        user_messages = []
        
        for msg in messages:
            if msg['role'] == 'system':
                system_msg = msg['content']
            else:
                user_messages.append(msg)
        
        anthropic_data = {
            'model': data['model'],
            'messages': user_messages,
            'max_tokens': data.get('max_tokens', 4096),
        }
        
        if system_msg:
            anthropic_data['system'] = system_msg
        
        if data.get('temperature'):
            anthropic_data['temperature'] = data['temperature']
        
        return anthropic_data
    
    def _anthropic_to_openai(self, response) -> Dict:
        """将 Anthropic 格式响应转换为 OpenAI 格式"""
        anthropic_resp = response.json()
        
        openai_resp = {
            'id': anthropic_resp.get('id', ''),
            'object': 'chat.completion',
            'created': int(anthropic_resp.get('created_at', 0)),
            'model': anthropic_resp.get('model', ''),
            'choices': [{
                'index': 0,
                'message': {
                    'role': 'assistant',
                    'content': anthropic_resp.get('content', [{}])[0].get('text', '')
                },
                'finish_reason': anthropic_resp.get('stop_reason', 'stop')
            }],
            'usage': {
                'prompt_tokens': anthropic_resp.get('usage', {}).get('input_tokens', 0),
                'completion_tokens': anthropic_resp.get('usage', {}).get('output_tokens', 0),
                'total_tokens': 0
            }
        }
        
        # 计算 total_tokens
        openai_resp['usage']['total_tokens'] = (
            openai_resp['usage']['prompt_tokens'] + 
            openai_resp['usage']['completion_tokens']
        )
        
        return openai_resp
```

### 4. 三 Key 分协议方案

为了让不同客户端使用不同的协议，项目设计了三 Key 分协议方案：

```python
# app/proxy.py - 密钥验证部分
def verify_client_key(self, request) -> str:
    """验证客户端密钥，返回目标协议类型"""
    auth_header = request.headers.get('Authorization', '')
    client_key = auth_header.replace('Bearer ', '')
    
    # 三把 Key 分别绑定三种协议
    key_mapping = {
        'sk-openai-xxx': 'openai_chat',      # 适配 Cherry Studio
        'sk-responses-xxx': 'openai_responses',  # 适配 Codex CLI  
        'sk-anthropic-xxx': 'anthropic',     # 适配 Claude Code
    }
    
    if client_key not in key_mapping:
        raise ValueError("无效的 API Key")
    
    return key_mapping[client_key]
```

### 5. 流式响应处理

支持 SSE（Server-Sent Events）流式输出，这是 AI 对话体验的关键：

```python
# app/proxy.py - 流式响应处理
def _stream_openai_to_anthropic(self, response) -> Generator:
    """将 Anthropic 流式响应转换为 OpenAI 格式"""
    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                data = line[6:]
                if data == '[DONE]':
                    yield 'data: [DONE]\n\n'
                    break
                
                anthropic_chunk = json.loads(data)
                openai_chunk = self._convert_chunk(anthropic_chunk)
                yield f'data: {json.dumps(openai_chunk)}\n\n'

def _convert_chunk(self, chunk: Dict) -> Dict:
    """转换单个流式数据块"""
    return {
        'id': chunk.get('id', ''),
        'object': 'chat.completion.chunk',
        'created': int(chunk.get('created_at', 0)),
        'model': chunk.get('model', ''),
        'choices': [{
            'index': 0,
            'delta': {
                'content': chunk.get('delta', {}).get('text', '')
            },
            'finish_reason': None
        }]
    }
```

### 6. 前端管理界面

前端使用纯 HTML/CSS/JavaScript 构建，无需任何框架：

```javascript
// app/static/app.js - 提供商管理
class ProviderManager {
    constructor() {
        this.providers = [];
        this.init();
    }
    
    async init() {
        this.providers = await this.loadProviders();
        this.render();
    }
    
    async loadProviders() {
        const response = await fetch('/api/providers');
        return await response.json();
    }
    
    async addProvider(provider) {
        const response = await fetch('/api/providers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(provider)
        });
        
        if (response.ok) {
            this.providers.push(await response.json());
            this.render();
        }
    }
    
    render() {
        const container = document.getElementById('providers-grid');
        container.innerHTML = this.providers.map(p => `
            <div class="provider-card">
                <h3>${p.name}</h3>
                <p>${p.description || ''}</p>
                <span class="category">${p.category}</span>
                <div class="actions">
                    <button onclick="editProvider('${p.id}')">编辑</button>
                    <button onclick="deleteProvider('${p.id}')">删除</button>
                </div>
            </div>
        `).join('');
    }
}
```

### 7. AI 智能解析功能

这是一个很实用的功能，可以通过 AI 自动解析 API 文档：

```python
# app/routes.py - AI 解析端点
@api.route('/api/parse-doc', methods=['POST'])
def parse_api_doc():
    """使用 AI 解析 API 文档"""
    data = request.get_json()
    doc_content = data.get('content', '')
    
    # 调用 AI 模型解析文档
    prompt = f"""
    请分析以下 API 文档，提取以下信息：
    1. 提供商名称
    2. API Base URL
    3. 支持的模型列表
    4. 计费方式
    
    文档内容：
    {doc_content}
    
    请以 JSON 格式返回结果。
    """
    
    # 使用本地或远程 AI 模型进行解析
    result = call_ai_model(prompt)
    
    return jsonify(json.loads(result))
```

## 📦 快速开始

### 方式一：直接运行 Python

```bash
# 克隆项目
git clone https://gitee.com/chjx2642/ai-api-hub.git
cd ai-api-hub

# 安装依赖
pip install -r requirements.txt

# 运行程序
python run.py
```

程序会自动打开浏览器访问 `http://localhost:5000`

### 方式二：打包成 EXE

```bash
# 安装打包依赖
pip install pyinstaller

# 运行打包脚本
python build.py
```

在 `dist` 目录找到生成的 `AI-API-Hub.exe`，双击即可运行，无需安装 Python 环境。

## 💡 使用场景

### 场景一：统一管理多个客户端

你可能同时在用多个 AI 客户端：

| 客户端 | 用途 | 推荐协议 |
|--------|------|----------|
| Cherry Studio | 日常对话 | OpenAI Chat |
| Claude Code | 代码编程 | Anthropic Messages |
| Codex CLI | 命令行编程 | OpenAI Responses |

使用 AI API Hub，你只需要配置一次厂商 API Key，然后为每个客户端分配不同的转接 Key 即可。

### 场景二：安全地使用第三方客户端

把厂商 API Key 直接填入第三方客户端存在风险。使用 AI API Hub：

1. 厂商 API Key 只存储在本地
2. 第三方客户端只获得转接 Key
3. 即使转接 Key 泄露，也无法获取厂商原始 Key

### 场景三：混合使用多家厂商

同时使用 OpenAI、Anthropic、DeepSeek 等多家厂商的模型，AI API Hub 会根据请求中的模型名自动路由到对应的厂商。

## 🔒 安全特性

- **本地存储**：所有数据存储在本地 `data/config.json`，不上传任何服务器
- **Key 隔离**：厂商 API Key 永远不暴露给客户端
- **XSS 防护**：所有用户输入均经过 HTML 转义处理
- **内容校验**：转发前自动校验参数合法性（max_tokens、temperature、top_p 等）

## 📊 支持的厂商和协议

| 厂商 | 协议格式 | 支持模型 |
|------|----------|----------|
| OpenAI | OpenAI | GPT-4o, GPT-4, GPT-3.5-turbo 等 |
| Anthropic | Anthropic | Claude 3.5 Sonnet, Claude 3 Opus 等 |
| DeepSeek | OpenAI | DeepSeek-V3, DeepSeek-R1 等 |
| 智谱 | OpenAI | GLM-4, GLM-4-Flash 等 |
| Moonshot | OpenAI | moonshot-v1-8k 等 |

## 🛠️ 技术栈

- **后端**：Python 3.10+ + Flask
- **前端**：HTML5 + CSS3 + JavaScript（原生）
- **存储**：JSON 文件本地存储
- **打包**：PyInstaller（支持打包为 EXE）

## 📝 总结

AI API Hub 解决了多提供商、多客户端场景下的 API 管理痛点：

1. ✅ 统一管理所有 API 密钥
2. ✅ 自动转换不同协议格式
3. ✅ 厂商 Key 安全隔离
4. ✅ 支持流式响应
5. ✅ 可打包为 EXE，开箱即用

项目开源（MIT 协议），欢迎试用和反馈！

---

*如果你觉得这个项目对你有帮助，欢迎点个 Star 支持一下！*

*GitHub/Gitee：[AI-API-Hub](https://gitee.com/chjx2642/ai-api-hub)*
