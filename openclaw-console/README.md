# OpenClaw Console

中文本地控制台，用于在 Mac mini 本机管理正在运行的 OpenClaw，并提供原生工作台代理。

## 功能

- **助理管理**：查看所有助理状态，下发任务，配置助理参数
- **服务控制**：管理网关、模型配置、LaunchAgent 自启动
- **会话管理**：管理与代理的对话历史
- **配置中心**：编辑 openclaw.config.json，热重载网关
- **原生工作台**：直接跳转到 OpenClaw 原生模块

## 技术栈

- React 19 + TypeScript
- Vite 6
- Lucide React 图标
- OpenClaw API (本地网关)

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动后端服务（独立）
npm run start
```

## 目录结构

```
openclaw-console/
├── src/
│   ├── app/
│   │   └── OpenClawApp.tsx   # 主应用组件（3633行）
│   ├── lib/
│   │   └── openclawService.ts # API服务层
│   ├── main.tsx               # 入口
│   └── app/openclaw.css       # 样式
├── server/
│   └── server.ts              # Express API服务
├── api/                       # API路由
├── dist/                      # 构建输出
└── openclaw.config.json       # 配置文件
```

## 配置

编辑 `openclaw.config.json` 或通过控制台界面修改配置。网关默认监听 `127.0.0.1:18789`。

## 访问

开发模式：`http://localhost:5173`
生产模式：`http://localhost:3000`
