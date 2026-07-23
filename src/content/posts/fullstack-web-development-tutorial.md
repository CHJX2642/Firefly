---
title: 全栈Web应用开发教程：从零到部署完整指南
published: 2026-07-23
tags:
  - 全栈开发
  - Vue3
  - FastAPI
  - Docker
  - Web开发
category: 技术教程
description: 从零开始构建前后端分离的全栈应用，涵盖开发环境搭建、Vue3+FastAPI项目开发、前后端联调、Docker容器化部署完整流程。
pin: false
comment: true
image: images/fullstack-login.png
---

# 全栈Web应用开发教程：从零到部署完整指南

> 从零开始构建前后端分离的全栈应用，涵盖开发环境搭建、项目构建、接口开发、数据库设计、容器化部署全流程。

**📦 项目源码：** [Gitee - 雄安新区公告通知平台](https://gitee.com/chjx2642/260723_xiong_an_tong_zhi_gong_gao_ping_tai)

### 项目预览

**登录界面**
![登录界面](images/fullstack-login.png)

**管理员后台**
![管理员后台](images/fullstack-admin.png)

**用户界面**
![用户界面](images/fullstack-user.png)

## 📋 目录

1. [技术栈选型](#1-技术栈选型)
2. [开发环境安装](#2-开发环境安装)
3. [后端项目开发](#3-后端项目开发)
4. [前端项目开发](#4-前端项目开发)
5. [前后端联调](#5-前后端联调)
6. [Docker容器化部署](#6-docker容器化部署)
7. [常见问题排查](#7-常见问题排查)

---

## 1. 技术栈选型

### 推荐技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Vue 3 / React | 现代响应式UI框架 |
| **UI组件库** | Element Plus / Ant Design | 快速构建界面 |
| **前端构建** | Vite | 快速开发服务器 |
| **后端框架** | Python FastAPI / Node.js Express | 轻量级REST API |
| **ORM** | SQLAlchemy / TypeORM | 数据库操作 |
| **数据库** | MySQL 8.0 / PostgreSQL | 关系型数据库 |
| **认证** | JWT Token | 无状态身份验证 |
| **部署** | Docker + Nginx | 容器化 + 反向代理 |

### 版本要求

```
Node.js: >= 18.x
Python: >= 3.9
MySQL: >= 8.0
Docker: >= 20.x
```

---

## 2. 开发环境安装

### 2.1 Node.js 安装（前端）

**Windows:**
```bash
# 1. 下载安装包
# 访问 https://nodejs.org 下载 LTS 版本

# 2. 验证安装
node --version    # v18.x.x 或更高
npm --version     # 9.x.x 或更高

# 3. (可选) 配置镜像加速
npm config set registry https://registry.npmmirror.com
```

**macOS:**
```bash
# 使用 Homebrew
brew install node

# 或使用 nvm 版本管理
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2.2 Python 安装（后端）

**Windows:**
```bash
# 1. 下载安装包
# 访问 https://python.org 下载 Python 3.11+

# 2. 安装时勾选 "Add Python to PATH"

# 3. 验证安装
python --version    # Python 3.11.x
pip --version       # 23.x.x

# 4. (可选) 配置镜像加速
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

**macOS/Linux:**
```bash
# 使用 pyenv 版本管理
curl https://pyenv.run | bash
pyenv install 3.11.0
pyenv global 3.11.0

# 验证
python --version
```

### 2.3 MySQL 安装

**Windows:**
```bash
# 1. 下载 MySQL Installer
# 访问 https://dev.mysql.com/downloads/installer/

# 2. 选择 "Developer Default" 安装类型

# 3. 设置 root 密码（建议: 123456 用于开发）

# 4. 验证
mysql -u root -p
```

**macOS:**
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

**Linux:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**或使用 Docker 快速启动：**
```bash
docker run -d \
  --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -p 3306:3306 \
  mysql:8.0
```

### 2.4 Docker 安装

**Windows:**
```bash
# 1. 下载 Docker Desktop
# 访问 https://www.docker.com/products/docker-desktop/

# 2. 安装并重启电脑

# 3. 验证
docker --version
docker-compose --version
```

**macOS:**
```bash
# 下载 Docker Desktop for Mac
# 或使用 brew
brew install --cask docker
```

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2.5 开发工具

| 工具 | 用途 | 下载地址 |
|------|------|----------|
| VS Code | 代码编辑器 | https://code.visualstudio.com/ |
| Postman | API测试 | https://www.postman.com/ |
| Navicat | 数据库管理 | https://navicat.com/ |
| Git | 版本控制 | https://git-scm.com/ |

**VS Code 推荐插件：**
```
- Volar (Vue 3)
- Python
- Pylance
- Docker
- REST Client
- MySQL
```

---

## 3. 后端项目开发

### 3.1 初始化项目

```bash
# 创建项目目录
mkdir my-project-backend
cd my-project-backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 初始化 Git
git init
echo "venv/" > .gitignore
echo "__pycache__/" >> .gitignore
echo "*.pyc" >> .gitignore
```

### 3.2 安装依赖

```bash
# 创建 requirements.txt
cat > requirements.txt << EOF
# Web 框架
fastapi==0.104.1
uvicorn[standard]==0.24.0

# 数据库
sqlalchemy==2.0.23
pymysql==1.1.0

# 数据验证
pydantic==2.5.2

# 认证
python-jose[cryptography]==3.3.0
bcrypt==4.1.1

# CORS
python-multipart==0.0.6

# 环境变量
python-dotenv==1.0.0
EOF

# 安装依赖
pip install -r requirements.txt

# 冻结依赖版本
pip freeze > requirements-lock.txt
```

### 3.3 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # 应用入口
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py         # 配置管理
│   │   ├── database.py       # 数据库连接
│   │   └── security.py       # 认证工具
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py           # 数据模型
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── user.py           # Pydantic 模型
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py           # 认证接口
│   │   └── users.py          # 业务接口
│   └── utils/
│       ├── __init__.py
│       └── deps.py           # 依赖注入
├── requirements.txt
├── .env                      # 环境变量
├── Dockerfile
└── README.md
```

### 3.4 核心代码示例

#### 配置管理 (app/core/config.py)
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 数据库
    DATABASE_URL: str = "mysql+pymysql://root:123456@localhost:3306/mydb"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # CORS
    CORS_ORIGINS: list = ["*"]

settings = Settings()
```

#### 数据库连接 (app/core/database.py)
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### 数据模型 (app/models/user.py)
```python
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True)
    password_hash = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

#### 认证接口 (app/api/auth.py)
```python
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["认证"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@router.post("/login")
def login(username: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not pwd_context.verify(password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="无效的Token")
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user
```

#### 应用入口 (app/main.py)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, users

app = FastAPI(title="API服务")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "API服务运行中"}
```

### 3.5 运行后端

```bash
# 开发模式
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 访问 API 文档
# http://localhost:8000/docs
```

---

## 4. 前端项目开发

### 4.1 初始化项目

```bash
# 使用 Vite 创建项目
npm create vite@latest my-project-frontend -- --template vue

# 进入项目目录
cd my-project-frontend

# 安装依赖
npm install

# 安装额外依赖
npm install element-plus axios vue-router@4 pinia
npm install -D @element-plus/icons-vue
```

### 4.2 项目结构

```
frontend/
├── src/
│   ├── api/                # API 请求
│   │   ├── index.js        # Axios 实例
│   │   └── user.js         # 用户接口
│   ├── assets/             # 静态资源
│   │   └── styles/
│   ├── components/         # 公共组件
│   ├── router/             # 路由配置
│   │   └── index.js
│   ├── stores/             # 状态管理
│   │   └── user.js
│   ├── views/              # 页面组件
│   │   ├── Login.vue
│   │   └── Home.vue
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── public/
├── index.html
├── vite.config.js
├── Dockerfile
├── nginx.conf
└── package.json
```

### 4.3 核心代码示例

#### Axios 封装 (src/api/index.js)
```javascript
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error(error.response?.data?.detail || '请求失败')
    }
    return Promise.reject(error)
  }
)

export default request
```

#### 路由配置 (src/router/index.js)
```javascript
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
```

#### 登录页面 (src/views/Login.vue)
```vue
<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>用户登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" />
        </el-form-item>
        <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/user'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const data = await login(form.value)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 400px;
}
</style>
```

#### Vite 配置 (vite.config.js)
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

### 4.4 运行前端

```bash
npm run dev

# 访问 http://localhost:5173
```

---

## 5. 前后端联调

### 5.1 开发环境配置

```javascript
// vite.config.js 中配置代理
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',  // 后端地址
      changeOrigin: true
    }
  }
}
```

### 5.2 环境变量管理

```bash
# 前端 .env.development
VITE_API_BASE_URL=http://localhost:8000

# 前端 .env.production
VITE_API_BASE_URL=/api
```

```python
# 后端 .env
DATABASE_URL=mysql+pymysql://root:123456@localhost:3306/mydb
SECRET_KEY=your-production-secret-key
```

### 5.3 跨域处理

```python
# 后端 FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 6. Docker容器化部署

### 6.1 后端 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 复制代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 6.2 前端 Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### 6.3 Nginx 配置

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # API 反向代理
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Vue Router history 模式
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 6.4 Docker Compose

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_PASSWORD:-123456}
      MYSQL_DATABASE: ${DB_NAME:-mydb}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    container_name: backend
    environment:
      DATABASE_URL: mysql+pymysql://root:${MYSQL_PASSWORD:-123456}@mysql:3306/${DB_NAME:-mydb}
    ports:
      - "8000:8000"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - app-network

  frontend:
    build: ./frontend
    container_name: frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  mysql_data:

networks:
  app-network:
    driver: bridge
```

### 6.5 部署命令

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除数据
docker-compose down -v
```

### 6.6 一键部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

echo "=== 开始部署 ==="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "错误: 请先安装 Docker"
    exit 1
fi

# 构建并启动
echo "构建并启动容器..."
docker-compose down
docker-compose up -d --build

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "服务状态:"
docker-compose ps

echo ""
echo "=== 部署完成 ==="
echo "前端访问: http://localhost"
echo "API文档: http://localhost:8000/docs"
```

---

## 7. 常见问题排查

### 7.1 端口被占用

```bash
# 查找占用端口的进程 (Windows)
netstat -ano | findstr :5173

# 查找占用端口的进程 (Linux/Mac)
lsof -i :5173

# 杀死进程 (Windows - 使用 PID)
taskkill /PID <PID> /F

# 杀死进程 (Linux/Mac)
kill -9 <PID>
```

### 7.2 MySQL 连接失败

```bash
# 检查 MySQL 是否运行
docker ps | grep mysql

# 检查日志
docker logs mysql

# 测试连接
mysql -h 127.0.0.1 -u root -p
```

### 7.3 前端构建失败

```bash
# 清除缓存
rm -rf node_modules package-lock.json
npm install

# 检查 Node.js 版本
node --version  # 需要 >= 18
```

### 7.4 CORS 错误

```bash
# 确保后端配置了 CORS
# 检查浏览器控制台的错误信息
# 确认前端请求地址正确
```

### 7.5 Docker 镜像拉取慢

```bash
# 配置国内镜像 (Windows: Docker Desktop Settings)
# Linux: /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}

# 重启 Docker
sudo systemctl restart docker
```

---

## 8. 学习资源

| 类型 | 资源 | 链接 |
|------|------|------|
| 文档 | Vue 3 官方文档 | https://vuejs.org/ |
| 文档 | Element Plus | https://element-plus.org/ |
| 文档 | FastAPI 官方文档 | https://fastapi.tiangolo.com/ |
| 文档 | Docker 官方文档 | https://docs.docker.com/ |
| 视频 | B站前端教程 | 搜索 "Vue3 入门" |
| 视频 | B站后端教程 | 搜索 "FastAPI 入门" |

---

## 9. 总结

本教程涵盖了全栈开发的完整流程：

1. **环境搭建** - 安装 Node.js、Python、MySQL、Docker
2. **后端开发** - FastAPI + SQLAlchemy + JWT 认证
3. **前端开发** - Vue 3 + Element Plus + Axios
4. **前后端联调** - 代理配置、跨域处理
5. **容器化部署** - Docker + Docker Compose + Nginx

掌握了这些技能，你就可以独立开发和部署完整的Web应用了！

---

*如果你觉得这篇文章对你有帮助，欢迎点赞、收藏、转发！*

*最后更新: 2026年7月*
