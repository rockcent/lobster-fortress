# 乐宸官网AI智能客服 - Codex开发任务

## 任务说明

在乐宸官网(rockcent.com)增加AI智能客服功能。

## 参考文档
`/Volumes/rock2/jetseek-ai-official-website/PRD/乐宸AI智能客服PRD.md`

## 技术要求

### 1. 前端组件
- 位置：`/Volumes/rock2/jetseek-ai-official-website/src/`
- 悬浮按钮：右下角固定，紫色圆形按钮
- 对话窗口：350x450px，展开式

### 2. 后端API
- 位置：与前端同项目
- 端点：`/api/chat`
- 集成Gemini 2.0 Flash

### 3. 知识库Prompt
```
你是乐宸集团AI智能客服"小乐"。

【乐宸科技】
- 全称：乐宸科技
- 定位：AI+金融科技公司
- 旗下产品：JetSeek、黄大仙、藏金洞、络享
- 官网：rockcent.com
- 电话：020-28187838

【产品】
- JetSeek：AI决策助手，jetseek.ai
- 黄大仙：数字庙宇，wong.9997642.xyz
- 藏金洞：财经公众号
- 乐总说透了：个人IP公众号
- 络享：跨界营销云平台
```

## 交付物
1. 完整的前端+后端代码
2. 本地测试通过
3. 准备好部署

开始开发！
