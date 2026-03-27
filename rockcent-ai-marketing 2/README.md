<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Rockcent AI Marketing Cloud

络享云 - AI 跨界营销智能撮合平台。

## 快速开始

**前提条件：** Node.js 18+

1. 安装依赖：
   ```bash
   npm install
   ```

2. 复制环境变量配置：
   ```bash
   cp .env.example .env
   ```
   （`.env` 已包含火山方舟 API Key，可直接使用）

3. 一键启动（前后端同时运行）：
   ```bash
   npm start
   ```
   - 前端：http://localhost:3000
   - AI 代理 API：http://localhost:3001

4. 单独启动：
   - 后端 AI 代理：`npm run server`
   - 前端开发服务器：`npm run dev`

## 部署说明

### 架构

```
[浏览器] --→ [Vite Frontend:3000] --→ [Express Proxy:3001] --→ [火山方舟 API]
                                        ↑
                              火山方舟Key存储在此
                              不暴露给前端
```

### 生产环境构建

```bash
npm run build   # 构建前端静态资源到 dist/
npm run server  # 启动 AI 代理服务（保持运行）
```

### Nginx 配置

生产环境推荐使用 Nginx 反向代理：

```nginx
server {
    listen 443 ssl;
    server_name ai.rockcent.com;

    # 前端静态文件
    root /path/to/rockcent-ai-marketing/dist;
    index index.html;

    # AI API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 前端路由（SPA）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VOLCANO_API_KEY` | 火山方舟 API Key | （必填，已配置）|
| `VOLCANO_ARK_API_URL` | API Endpoint | `https://ark.cn-beijing.volces.com/api/v3/chat/completions` |
| `AI_MODEL` | 使用的模型 | `doubao-1-5-thinking-pro-32k` |
| `PORT` | AI 代理服务端口 | `3001` |
| `APP_URL` | 前端访问地址 | `https://ai.rockcent.com` |

## 技术栈

- **前端框架：** React 19 + TypeScript
- **构建工具：** Vite 6
- **UI 框架：** Tailwind CSS 4
- **动画：** Motion
- **图表：** Recharts
- **AI 模型：** 字节豆包（doubao-1-5-thinking-pro-32k）via 火山方舟
- **后端代理：** Express（纯 API 代理，API Key 不暴露给前端）
