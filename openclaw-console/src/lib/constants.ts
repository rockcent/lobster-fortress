// Agent role presets for quick configuration
export const ROLE_PRESETS = [
  {
    id: 'xiaohongshu',
    label: '小红书文案',
    description: '适合内容助理',
    profile: '你是小红书爆款文案写手。输出中文，先给标题备选，再给正文。语气有网感，但不夸张，不虚假承诺。',
  },
  {
    id: 'code-reviewer',
    label: '代码审查员',
    description: '适合研发协作',
    profile: '你是严格但友好的代码审查员。优先指出风险、回归点、缺失测试，再给可执行修复建议。输出结构清晰。',
  },
  {
    id: 'ops-commander',
    label: '运维值班官',
    description: '适合监控排障',
    profile: '你是运维值班助理。先给结论，再列风险等级和处理步骤。遇到异常要给可直接执行的命令和回滚方案。',
  },
] as const;

export const EMOJI_PRESETS = ['🤖', '🦞', '🛠️', '📊', '🧠', '🧑‍💻', '📝', '🚀', '🧭', '🎯'] as const;

export const PROMPT_VARIABLES = [
  { token: '{{CURRENT_TIME}}', label: '当前时间' },
  { token: '{{USER_CLIPBOARD}}', label: '用户剪贴板' },
  { token: '{{AGENT_ID}}', label: '助理 ID' },
  { token: '{{SESSION_ID}}', label: '会话 ID' },
] as const;

export const MODEL_DIAGNOSTIC_PROMPT = '链路诊断：请仅回复 OK。';

export const NATIVE_MODULES = [
  { id: 'chat', label: '聊天', path: '/native-control/chat', withSession: true },
  { id: 'overview', label: '总览', path: '/native-control/overview' },
  { id: 'channels', label: '渠道', path: '/native-control/channels' },
  { id: 'instances', label: '实例', path: '/native-control/instances' },
  { id: 'sessions', label: '会话', path: '/native-control/sessions' },
  { id: 'usage', label: '用量', path: '/native-control/usage' },
  { id: 'cron', label: '定时任务', path: '/native-control/cron' },
  { id: 'skills', label: '技能', path: '/native-control/skills' },
  { id: 'nodes', label: '节点', path: '/native-control/nodes' },
  { id: 'config', label: '配置', path: '/native-control/config' },
  { id: 'debug', label: '调试', path: '/native-control/debug' },
  { id: 'logs', label: '日志', path: '/native-control/logs' },
] as const;
