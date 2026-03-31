# 络享云 / AI营销云 — 开发文档

## 项目概述
络享云是一个AI驱动的跨界营销云平台，核心功能包括：
- 品牌营销需求分析（AI提取结构化信息）
- 跨界营销资源撮合（智能匹配推荐）
- 合作方案生成（Pitch Deck / MoU / 时间线）
- BD谈判模拟器（AI驱动的商务谈判）

## 技术栈
- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS v4 (@tailwindcss/vite)
- **图标**: lucide-react
- **动画**: motion
- **图表**: recharts
- **Markdown**: react-markdown
- **AI集成**: Google Gemini API (@google/genai)
- **后端**: Express 5（API代理，保护API Key）

## 环境变量
服务器端 `/opt/rockcent-ai-marketing/.env` 管理：
```bash
ARK_API_KEY=your_volcano_ark_api_key_here
PORT=3001  # 后端服务端口
```
前端无需任何 API Key 配置，所有 AI 调用经由后端 `/api/ai` 代理。

## 开发
```bash
npm install
npm run dev      # 前端开发服务器
npm run server   # 后端API服务器
npm run build    # 构建生产版本
```

## 部署流程
1. GitHub Actions 自动构建
2. 构建产物同步到阿里云 `/usr/share/nginx/ai-marketing/`
3. 后端服务运行在 `localhost:3001`

## 域名
- 前端: ai.rockcent.com
- 后端API: 通过nginx代理到 :3001
