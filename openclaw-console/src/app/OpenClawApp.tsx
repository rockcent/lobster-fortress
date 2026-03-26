import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Bot, ChevronsLeft, ChevronsRight, FolderKanban, MessageSquare, RefreshCw, SendHorizontal, ShieldCheck, SquareTerminal, Stethoscope, Zap } from 'lucide-react';
import './openclaw.css';
import { OpenClawAction, OpenClawAgentModelSnapshot, OpenClawAgentRunRecord, OpenClawAgentStreamEvent, OpenClawCommandResult, OpenClawDashboard, OpenClawRuntimeAction, openclawService } from '../lib/openclawService';
import { compactText, estimateTokenCount, explainModelDiagnosticFailure, formatAge, formatDateTime, formatJsonParseError, getFriendlyModelLabel, normalizeModelLabel, percentile, pickSnapshotModel, resolveModelFamily, seriesToPoints, textHash, tokenizeRecentUsage, clampSeries } from '../lib/utils';
import { EMOJI_PRESETS, MODEL_DIAGNOSTIC_PROMPT, NATIVE_MODULES, PROMPT_VARIABLES, ROLE_PRESETS } from '../lib/constants';

const toneLabel: Record<OpenClawDashboard['services'][number]['tone'], string> = {
  healthy: '运行正常',
  warning: '需要关注',
  critical: '故障',
  neutral: '待检查',
};

const agentStatusLabel: Record<OpenClawDashboard['agents'][number]['status'], string> = {
  active: '工作中',
  warm: '预热中',
  idle: '空闲',
  offline: '离线',
};

const actionLabel: Record<OpenClawAction, string> = {
  start: '启动',
  stop: '停止',
  restart: '重启',
  status: '检查',
};

const serviceStatusLabel: Record<string, string> = {
  running: '运行中',
  stopped: '已停止',
  stopped_waiting: '等待中',
  running_waiting: '运行中',
  exited: '已退出',
  restarting: '重启中',
  dead: '已终止',
  created: '已创建',
  removing: '移除中',
  paused: '已暂停',
};

const summarizeOutput = (result: OpenClawCommandResult) => {
  const text = [result.stdout, result.stderr].filter(Boolean).join('\n');
  return text.trim() || '（空）';
};

const getAgentGlyph = (id: string, displayName: string, emoji?: string) => {
  if (emoji) return emoji;
  const source = displayName || id;
  const chars = Array.from(source.replace(/\s+/g, ''));
  return chars.slice(0, 2).join('').toUpperCase() || id.slice(0, 2).toUpperCase();
};

type DashboardAgent = OpenClawDashboard['agents'][number];

const getRoleName = (agent: DashboardAgent) => (
  (agent.roleName || agent.id.toUpperCase()).trim() || agent.id.toUpperCase()
);

const getNickname = (agent: DashboardAgent) => {
  const nickname = (agent.displayName || '').trim();
  if (!nickname) return '未设置昵称';
  const role = getRoleName(agent).toLowerCase();
  const normalized = nickname.toLowerCase();
  if (normalized === role || normalized === agent.id.toLowerCase()) {
    return '未设置昵称';
  }
  return nickname;
};

const getPreferredName = (agent: DashboardAgent) => {
  const nickname = getNickname(agent);
  return nickname === '未设置昵称' ? getRoleName(agent) : nickname;
};

type AgentIdentityOverride = { roleName?: string; displayName?: string; emoji?: string };
type AgentConsolePreference = {
  thinking?: 'minimal' | 'low' | 'medium' | 'high';
  reuseLatestSession?: boolean;
  promptPrefix?: string;
  promptSuffix?: string;
  defaultMessageTemplate?: string;
  quickTasks?: string[];
  modelLabelOverride?: string;
  providerLabelOverride?: string;
  workspaceOverride?: string;
  routesOverride?: string[];
  priority?: number;
  disabled?: boolean;
} & Record<string, unknown>;

const parseThinkingPreference = (value: unknown): AgentConsolePreference['thinking'] => (
  value === 'minimal' || value === 'low' || value === 'medium' || value === 'high'
    ? value
    : undefined
);

const AGENT_CONSOLE_KNOWN_KEYS = new Set([
  'thinking',
  'reuseLatestSession',
  'promptPrefix',
  'promptSuffix',
  'defaultMessageTemplate',
  'quickTasks',
  'modelLabelOverride',
  'providerLabelOverride',
  'workspaceOverride',
  'routesOverride',
  'priority',
  'disabled',
]);

const normalizeStringArray = (value: unknown): string[] => (
  Array.isArray(value)
    ? value
      .map((item) => typeof item === 'string' ? item.trim() : '')
      .filter(Boolean)
    : []
);

type PromptInsertTarget = 'defaultTemplate' | 'promptPrefix' | 'promptSuffix';

type AgentModelDiagnosis = {
  tone: 'healthy' | 'warning' | 'critical';
  title: string;
  details: string[];
  checkedAt: string;
};

export const OpenClawApp: React.FC = () => {
  const [dashboard, setDashboard] = useState<OpenClawDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [gatewayRestarting, setGatewayRestarting] = useState(false);
  const [healthRepairing, setHealthRepairing] = useState(false);
  const [lastResult, setLastResult] = useState<OpenClawCommandResult | null>(null);
  const [lastAgentRun, setLastAgentRun] = useState<OpenClawAgentRunRecord | null>(null);
  const [logQuery, setLogQuery] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [commandMessage, setCommandMessage] = useState('');
  const [thinking, setThinking] = useState<'minimal' | 'low' | 'medium' | 'high'>('medium');
  const [reuseLatestSession, setReuseLatestSession] = useState(true);
  const [sendingCommand, setSendingCommand] = useState(false);
  const [streamingReply, setStreamingReply] = useState('');
  const [streamingStartedAt, setStreamingStartedAt] = useState<string | null>(null);
  const [streamingError, setStreamingError] = useState('');
  const [agentModelSnapshots, setAgentModelSnapshots] = useState<Record<string, OpenClawAgentModelSnapshot>>({});
  const [agentModelLoadError, setAgentModelLoadError] = useState('');
  const [agentModelLoading, setAgentModelLoading] = useState(false);
  const [agentModelSwitching, setAgentModelSwitching] = useState(false);
  const [agentModelSelection, setAgentModelSelection] = useState('');
  const [cronJobs, setCronJobs] = useState<Record<string, any>[]>([]);
  const [activeSection, setActiveSection] = useState<'overview' | 'agents' | 'services' | 'logs' | 'native' | 'sessions'>('overview');
  const [expandedDiagnostics, setExpandedDiagnostics] = useState<string[]>([]);
  const [highlightedServiceId, setHighlightedServiceId] = useState<string>('');
  const [runningRuntimeAction, setRunningRuntimeAction] = useState<OpenClawRuntimeAction | null>(null);
  const [configDraft, setConfigDraft] = useState('');
  const [configPath, setConfigPath] = useState('');
  const [configDirty, setConfigDirty] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configEditorOpen, setConfigEditorOpen] = useState(false);
  const [agentConfigTargetId, setAgentConfigTargetId] = useState('');
  const [agentConfigRoleName, setAgentConfigRoleName] = useState('');
  const [agentConfigName, setAgentConfigName] = useState('');
  const [agentConfigEmoji, setAgentConfigEmoji] = useState('');
  const [agentConfigThinking, setAgentConfigThinking] = useState<'minimal' | 'low' | 'medium' | 'high'>('medium');
  const [agentConfigReuseSession, setAgentConfigReuseSession] = useState(true);
  const [agentConfigPromptPrefix, setAgentConfigPromptPrefix] = useState('');
  const [agentConfigPromptSuffix, setAgentConfigPromptSuffix] = useState('');
  const [agentConfigDefaultTemplate, setAgentConfigDefaultTemplate] = useState('');
  const [agentConfigQuickTasks, setAgentConfigQuickTasks] = useState('');
  const [agentConfigModelOverride, setAgentConfigModelOverride] = useState('');
  const [agentConfigProviderOverride, setAgentConfigProviderOverride] = useState('');
  const [agentConfigWorkspaceOverride, setAgentConfigWorkspaceOverride] = useState('');
  const [agentConfigRoutesOverride, setAgentConfigRoutesOverride] = useState('');
  const [agentConfigPriority, setAgentConfigPriority] = useState('');
  const [agentConfigDisabled, setAgentConfigDisabled] = useState(false);
  const [agentConfigExtraJson, setAgentConfigExtraJson] = useState('{}');

  // Telegram Bot configuration
  type TelegramGroupConfig = { name: string; agentId: string; enabled: boolean };
  type TelegramBotConfig = { name: string; enabled: boolean; defaultAgentId: string; groups: Record<string, TelegramGroupConfig> };
  const [telegramBots, setTelegramBots] = useState<Record<string, TelegramBotConfig>>({});
  const [agentConfigTelegramBot, setAgentConfigTelegramBot] = useState('');
  const [telegramBotPanelOpen, setTelegramBotPanelOpen] = useState(false);
  const [newTelegramBotToken, setNewTelegramBotToken] = useState('');
  const [newTelegramBotName, setNewTelegramBotName] = useState('');
  const [expandedBotGroups, setExpandedBotGroups] = useState<Record<string, boolean>>({});
  const [newGroupId, setNewGroupId] = useState<Record<string, string>>({});
  const [newGroupName, setNewGroupName] = useState<Record<string, string>>({});
  const [agentConfigExtraJsonError, setAgentConfigExtraJsonError] = useState('');
  const [agentConfigNotice, setAgentConfigNotice] = useState<{ tone: 'healthy' | 'warning' | 'critical'; message: string } | null>(null);
  const [agentConfigAdvancedOpen, setAgentConfigAdvancedOpen] = useState(false);
  const [agentConfigCorePrompt, setAgentConfigCorePrompt] = useState('');
  const [selectedRolePresetId, setSelectedRolePresetId] = useState(ROLE_PRESETS[0].id);
  const [agentConfigDirty, setAgentConfigDirty] = useState(false);
  const [agentConfigSaving, setAgentConfigSaving] = useState(false);
  const [agentConfigModalOpen, setAgentConfigModalOpen] = useState(false);
  const [agentModelDiagnosing, setAgentModelDiagnosing] = useState(false);
  const [agentModelDiagnosis, setAgentModelDiagnosis] = useState<AgentModelDiagnosis | null>(null);
  const [promptInsertTarget, setPromptInsertTarget] = useState<PromptInsertTarget>('defaultTemplate');
  const [promptVariableSelection, setPromptVariableSelection] = useState(PROMPT_VARIABLES[0].token);
  const [studioDialogOpen, setStudioDialogOpen] = useState(false);
  const [selectedNativeModuleId, setSelectedNativeModuleId] = useState<string>('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [agentViewSort, setAgentViewSort] = useState<'heat' | 'status' | 'name'>('heat');
  const [collapseIdleAgents, setCollapseIdleAgents] = useState(true);
  const [latencyAlertThreshold, setLatencyAlertThreshold] = useState(5000);
  const [configSandboxMessage, setConfigSandboxMessage] = useState('');
  const [configSandboxReply, setConfigSandboxReply] = useState('');
  const [configSandboxError, setConfigSandboxError] = useState('');
  const [configSandboxLoading, setConfigSandboxLoading] = useState(false);
  const [configSandboxStartedAt, setConfigSandboxStartedAt] = useState<string | null>(null);
  const [configSandboxLastRun, setConfigSandboxLastRun] = useState<OpenClawAgentRunRecord | null>(null);
  const [upgradeStatusOpen, setUpgradeStatusOpen] = useState(false);
  const [upgradeStatusData, setUpgradeStatusData] = useState<{currentVersion: string; targetVersion: string; upToDate: boolean; channel: string} | null>(null);
  const [upgradeStatusLoading, setUpgradeStatusLoading] = useState(false);
  // Phase 4: Quick task dispatch state
  const [quickTaskInput, setQuickTaskInput] = useState('');
  const [quickTaskTarget, setQuickTaskTarget] = useState<string>('');
  const agentDefaultTemplateRef = useRef<HTMLTextAreaElement | null>(null);
  const agentPromptPrefixRef = useRef<HTMLTextAreaElement | null>(null);
  const agentPromptSuffixRef = useRef<HTMLTextAreaElement | null>(null);
  const isMounted = useRef(false);

  const loadDashboard = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const nextDashboard = await openclawService.getDashboard();
      setDashboard(nextDashboard);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '加载控制台失败。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(true);
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem('openclaw-agent-view-settings');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        sort?: 'heat' | 'status' | 'name';
        collapseIdle?: boolean;
        latencyAlertThreshold?: number;
      };
      if (parsed.sort === 'heat' || parsed.sort === 'status' || parsed.sort === 'name') {
        setAgentViewSort(parsed.sort);
      }
      if (typeof parsed.collapseIdle === 'boolean') {
        setCollapseIdleAgents(parsed.collapseIdle);
      }
      if (typeof parsed.latencyAlertThreshold === 'number' && Number.isFinite(parsed.latencyAlertThreshold)) {
        setLatencyAlertThreshold(Math.max(500, Math.round(parsed.latencyAlertThreshold)));
      }
    } catch {
      // ignore corrupted persisted settings
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('openclaw-agent-view-settings', JSON.stringify({
      sort: agentViewSort,
      collapseIdle: collapseIdleAgents,
      latencyAlertThreshold,
    }));
  }, [agentViewSort, collapseIdleAgents, latencyAlertThreshold]);

  useEffect(() => {
    if (!agentConfigNotice) return undefined;
    const timer = window.setTimeout(() => setAgentConfigNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [agentConfigNotice]);

  useEffect(() => {
    if (!dashboard?.refreshIntervalMs) return undefined;
    const timer = window.setInterval(() => {
      loadDashboard(false);
    }, dashboard.refreshIntervalMs);
    return () => window.clearInterval(timer);
  }, [dashboard?.refreshIntervalMs]);

  useEffect(() => {
    fetch('/api/openclaw/cron-jobs-list')
      .then((r) => r.json())
      .then((d) => setCronJobs(d.data || []))
      .catch(() => setCronJobs([]));
  }, []);

  // Auto-dismiss generic error after 8 seconds so it doesn't persist forever
  useEffect(() => {
    if (!error) return undefined;
    const timer = window.setTimeout(() => setError(''), 8000);
    return () => window.clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!dashboard?.agents.length) return;
    if (selectedAgentId && dashboard.agents.some((agent) => agent.id === selectedAgentId)) return;
    setSelectedAgentId(dashboard.agents[0].id);
  }, [dashboard?.agents, selectedAgentId]);

  useEffect(() => {
    setStreamingReply('');
    setStreamingStartedAt(null);
    setStreamingError('');
  }, [selectedAgentId]);

  useEffect(() => {
    if (!selectedAgentId) {
      setAgentModelSelection('');
      setAgentModelLoadError('');
      return;
    }
    const snapshot = agentModelSnapshots[selectedAgentId];
    if (!snapshot) return;
    const defaultKey = pickSnapshotModel(snapshot);
    if (!agentModelSelection || !snapshot.models.some((model) => model.key === agentModelSelection)) {
      setAgentModelSelection(defaultKey);
    }
  }, [selectedAgentId, agentModelSnapshots, agentModelSelection]);

  useEffect(() => {
    if (!['services', 'agents'].includes(activeSection) || configDraft) return;
    setConfigLoading(true);
    openclawService.getConfig()
      .then((document) => {
        setConfigDraft(document.content);
        setConfigPath(document.configPath);
        setConfigDirty(false);
      })
      .catch((configError) => {
        setError(configError instanceof Error ? configError.message : '加载配置文件失败。');
      })
      .finally(() => {
        setConfigLoading(false);
      });
  }, [activeSection, configDraft]);

  useEffect(() => {
    if (!highlightedServiceId) return undefined;
    const timer = window.setTimeout(() => setHighlightedServiceId(''), 8000);
    return () => window.clearTimeout(timer);
  }, [highlightedServiceId]);

  useEffect(() => {
    if (activeSection === 'agents') return;
    setAgentConfigModalOpen(false);
    setStudioDialogOpen(false);
  }, [activeSection]);

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    if (activeSection === 'agents') return;
    setActiveSection('agents');
  }, [activeSection]);

  useEffect(() => {
    if (!agentConfigModalOpen && !studioDialogOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAgentConfigModalOpen(false);
        setStudioDialogOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [agentConfigModalOpen, studioDialogOpen]);

  useEffect(() => {
    if (agentConfigModalOpen) return;
    setAgentConfigNotice(null);
    setAgentConfigExtraJsonError('');
    setAgentModelDiagnosis(null);
    setAgentConfigAdvancedOpen(false);
    setAgentConfigCorePrompt('');
    setConfigSandboxMessage('');
    setConfigSandboxReply('');
    setConfigSandboxError('');
    setConfigSandboxLoading(false);
    setConfigSandboxStartedAt(null);
    setConfigSandboxLastRun(null);
  }, [agentConfigModalOpen]);

  useEffect(() => {
    if (!dashboard?.agents.length) return;
    if (agentConfigTargetId && dashboard.agents.some((agent) => agent.id === agentConfigTargetId)) return;
    setAgentConfigTargetId(selectedAgentId || dashboard.agents[0].id);
  }, [dashboard?.agents, selectedAgentId, agentConfigTargetId]);

  const healthRatio = useMemo(() => {
    if (!dashboard || dashboard.summary.totalServices === 0) return 0;
    return Math.round((dashboard.summary.healthyServices / dashboard.summary.totalServices) * 100);
  }, [dashboard]);

  const activeAgentCount = useMemo(
    () => dashboard?.agents.filter((agent) => agent.status === 'active').length || 0,
    [dashboard],
  );

  const selectedAgent = useMemo(
    () => dashboard?.agents.find((agent) => agent.id === selectedAgentId) || null,
    [dashboard, selectedAgentId],
  );
  const agentConfigTarget = useMemo(
    () => dashboard?.agents.find((agent) => agent.id === agentConfigTargetId) || null,
    [dashboard, agentConfigTargetId],
  );
  const selectedAgentModelSnapshot = selectedAgent ? agentModelSnapshots[selectedAgent.id] : undefined;
  const configAgentModelSnapshot = agentConfigTarget ? agentModelSnapshots[agentConfigTarget.id] : undefined;
  const promptTokenEstimates = useMemo(() => ({
    defaultTemplate: estimateTokenCount(agentConfigDefaultTemplate),
    promptPrefix: estimateTokenCount(agentConfigPromptPrefix),
    promptSuffix: estimateTokenCount(agentConfigPromptSuffix),
  }), [agentConfigDefaultTemplate, agentConfigPromptPrefix, agentConfigPromptSuffix]);
  const promptTokenTotal = promptTokenEstimates.defaultTemplate + promptTokenEstimates.promptPrefix + promptTokenEstimates.promptSuffix;
  const friendlyModelError = useMemo(
    () => (agentModelLoadError ? explainModelDiagnosticFailure(agentModelLoadError) : ''),
    [agentModelLoadError],
  );
  const recommendedModelKey = useMemo(() => {
    const models = configAgentModelSnapshot?.models || [];
    const preferred = models.find((model) => model.available !== false && model.missing !== true && model.key !== agentModelSelection);
    return preferred?.key || models[0]?.key || '';
  }, [configAgentModelSnapshot?.models, agentModelSelection]);

  const parsedConfig = useMemo(() => {
    if (!configDraft.trim()) return null;
    try {
      return JSON.parse(configDraft) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [configDraft]);

  const agentIdentityOverrides = useMemo(() => {
    if (!parsedConfig || typeof parsedConfig.agentIdentity !== 'object' || !parsedConfig.agentIdentity || Array.isArray(parsedConfig.agentIdentity)) {
      return {} as Record<string, AgentIdentityOverride>;
    }
    return parsedConfig.agentIdentity as Record<string, AgentIdentityOverride>;
  }, [parsedConfig]);

  const agentConsolePreferences = useMemo(() => {
    if (!parsedConfig || typeof parsedConfig.agentConsole !== 'object' || !parsedConfig.agentConsole || Array.isArray(parsedConfig.agentConsole)) {
      return {} as Record<string, AgentConsolePreference>;
    }
    return parsedConfig.agentConsole as Record<string, AgentConsolePreference>;
  }, [parsedConfig]);

  const telegramBotsFromConfig = useMemo(() => {
    if (!parsedConfig || typeof parsedConfig.telegramBots !== 'object' || !parsedConfig.telegramBots || Array.isArray(parsedConfig.telegramBots)) {
      return {} as Record<string, TelegramBotConfig>;
    }
    return parsedConfig.telegramBots as Record<string, TelegramBotConfig>;
  }, [parsedConfig]);

  useEffect(() => {
    if (!agentConfigTarget || agentConfigDirty) return;
    const override = agentIdentityOverrides[agentConfigTarget.id];
    const consolePreference = agentConsolePreferences[agentConfigTarget.id] || {};
    const roleName = (override?.roleName || agentConfigTarget.roleName || agentConfigTarget.id.toUpperCase()).trim();
    const rawDisplayName = (override?.displayName || agentConfigTarget.displayName || '').trim();
    const normalizedDisplayName = rawDisplayName.toLowerCase();
    const keepDisplayName = Boolean(
      rawDisplayName
      && normalizedDisplayName !== roleName.toLowerCase()
      && normalizedDisplayName !== agentConfigTarget.id.toLowerCase(),
    );
    const quickTasks = normalizeStringArray(consolePreference.quickTasks);
    const routesOverride = normalizeStringArray(consolePreference.routesOverride);
    const priorityValue = typeof consolePreference.priority === 'number'
      ? String(consolePreference.priority)
      : '';
    const extraPreference = Object.fromEntries(
      Object.entries(consolePreference).filter(([key]) => !AGENT_CONSOLE_KNOWN_KEYS.has(key)),
    );
    setAgentConfigRoleName(roleName);
    setAgentConfigName(keepDisplayName ? rawDisplayName : '');
    setAgentConfigEmoji((override?.emoji || agentConfigTarget.emoji || '').trim());
    setAgentConfigThinking(parseThinkingPreference(consolePreference?.thinking) || 'medium');
    setAgentConfigReuseSession(
      typeof consolePreference?.reuseLatestSession === 'boolean'
        ? consolePreference.reuseLatestSession
        : agentConfigTarget.id === 'main',
    );
    setAgentConfigPromptPrefix(typeof consolePreference.promptPrefix === 'string' ? consolePreference.promptPrefix : '');
    setAgentConfigPromptSuffix(typeof consolePreference.promptSuffix === 'string' ? consolePreference.promptSuffix : '');
    setAgentConfigDefaultTemplate(typeof consolePreference.defaultMessageTemplate === 'string' ? consolePreference.defaultMessageTemplate : '');
    setAgentConfigQuickTasks(quickTasks.join('\n'));
    setAgentConfigModelOverride(typeof consolePreference.modelLabelOverride === 'string' ? consolePreference.modelLabelOverride : '');
    setAgentConfigProviderOverride(typeof consolePreference.providerLabelOverride === 'string' ? consolePreference.providerLabelOverride : '');
    setAgentConfigWorkspaceOverride(typeof consolePreference.workspaceOverride === 'string' ? consolePreference.workspaceOverride : '');
    setAgentConfigRoutesOverride(routesOverride.join(', '));
    setAgentConfigPriority(priorityValue);
    setAgentConfigDisabled(consolePreference.disabled === true);
    setAgentConfigExtraJson(`${JSON.stringify(extraPreference, null, 2)}\n`);
    const promptPrefix = typeof consolePreference.promptPrefix === 'string' ? consolePreference.promptPrefix.trim() : '';
    const defaultTemplate = typeof consolePreference.defaultMessageTemplate === 'string' ? consolePreference.defaultMessageTemplate.trim() : '';
    const promptSuffix = typeof consolePreference.promptSuffix === 'string' ? consolePreference.promptSuffix.trim() : '';
    setAgentConfigCorePrompt([promptPrefix, defaultTemplate, promptSuffix].filter(Boolean).join('\n\n'));
    setAgentConfigExtraJsonError('');
    setAgentModelDiagnosis(null);
    setAgentConfigNotice(null);
    setSelectedRolePresetId(ROLE_PRESETS[0].id);
    // Set Telegram bot based on current agent (check defaultAgentId or groups)
    const currentBotEntry = Object.entries(telegramBotsFromConfig).find(([, bot]) => {
      if (bot.defaultAgentId === agentConfigTarget.id) return true;
      return Object.values(bot.groups || {}).some(g => g.agentId === agentConfigTarget.id);
    });
    setAgentConfigTelegramBot(currentBotEntry ? currentBotEntry[0] : '');
    setTelegramBots(telegramBotsFromConfig);
    setConfigSandboxMessage(defaultTemplate || '请用一句话介绍你能如何帮助我。');
    setConfigSandboxReply('');
    setConfigSandboxError('');
    setConfigSandboxLoading(false);
    setConfigSandboxStartedAt(null);
    setConfigSandboxLastRun(null);
  }, [agentConfigTarget, agentIdentityOverrides, agentConsolePreferences, agentConfigDirty, telegramBotsFromConfig]);

  const sectionMeta: Record<typeof activeSection, { label: string; description: string }> = {
    overview: { label: '运行总览', description: '核心运营指标、运行时状态与快捷入口。' },
    agents: { label: '助理管理', description: '查看每个助理状态，点击下发任务可弹出独立对话窗口。' },
    services: { label: '服务控制', description: '管理网关、模型配置、文件目录与服务动作历史。' },
    logs: { label: '诊断日志', description: '查看诊断输出与筛选服务日志。' },
    native: { label: '原生功能', description: '直达 OpenClaw 原生模块，按需跳转聊天/渠道/日志等页面。' },
    sessions: { label: '会话管理', description: '管理与代理的对话历史，新建话题避免上下文污染。' },
  };

  const navigationItems = [
    { id: 'agents' as const, label: '助理管理', badge: dashboard ? `${dashboard.agents.length}` : '--', icon: Bot },
    { id: 'sessions' as const, label: '会话管理', badge: undefined, icon: MessageSquare },
  ];

  const isNavigationItemActive = (item: typeof navigationItems[number]) => {
    return activeSection === item.id;
  };

  const handleNavigationItemClick = (item: typeof navigationItems[number]) => {
    setActiveSection(item.id);
  };

  const filteredLogs = useMemo(() => {
    if (!dashboard) return [];
    const keyword = logQuery.trim().toLowerCase();
    return dashboard.services
      .filter((service) => selectedServiceId === 'all' || service.id === selectedServiceId)
      .map((service) => {
        const lines = service.logTail.filter((line) => !keyword || line.toLowerCase().includes(keyword));
        return { ...service, lines };
      })
      .filter((service) => service.lines.length > 0 || !keyword);
  }, [dashboard, logQuery, selectedServiceId]);

  const runtimeCards = dashboard ? [
    {
      id: 'gateway',
      title: '网关端口',
      value: dashboard.runtime.gatewayListening ? `127.0.0.1:${dashboard.runtime.gatewayPort}` : '离线',
      meta: `${dashboard.runtime.connectionMode === 'local' ? '本地' : 'SSH'} · ${dashboard.runtime.connectionTarget}`,
      ok: dashboard.runtime.gatewayListening,
    },
    {
      id: 'watchdog',
      title: '守护进程',
      value: dashboard.runtime.watchdogLoaded ? '已加载' : '未加载',
      meta: dashboard.runtime.watchdogLabel,
      ok: dashboard.runtime.watchdogLoaded,
    },
    {
      id: 'agents',
      title: '活跃助理',
      value: `${activeAgentCount}/${dashboard.agents.length}`,
      meta: '最近有活动的助理',
      ok: activeAgentCount > 0,
    },
    {
      id: 'state',
      title: '状态目录',
      value: dashboard.runtime.stateDirectory,
      meta: `更新于 ${formatDateTime(dashboard.panels.find((panel) => panel.id === 'workspace')?.lastModifiedAt)}`,
      ok: true,
    },
  ] : [];

  const spotlightAgents = useMemo(() => {
    if (!dashboard) return [];
    return [...dashboard.agents]
      .sort((left, right) => {
        const statusScore = { active: 0, warm: 1, idle: 2, offline: 3 };
        const scoreDiff = statusScore[left.status] - statusScore[right.status];
        if (scoreDiff !== 0) return scoreDiff;
        return (left.latestAgeMs ?? Number.MAX_SAFE_INTEGER) - (right.latestAgeMs ?? Number.MAX_SAFE_INTEGER);
      })
      .slice(0, 4);
  }, [dashboard]);

  const agentAnalytics = useMemo(() => {
    const byAgent = new Map<string, OpenClawAgentRunRecord[]>();
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);

    dashboard?.agentRuns.forEach((run) => {
      const createdAt = new Date(run.createdAt).getTime();
      if (Number.isNaN(createdAt) || createdAt < cutoff) return;
      const existing = byAgent.get(run.agentId) || [];
      existing.push(run);
      byAgent.set(run.agentId, existing);
    });

    return new Map((dashboard?.agents || []).map((agent) => {
      const runs = (byAgent.get(agent.id) || []).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
      const durations = runs.map((run) => run.durationMs).filter((value): value is number => typeof value === 'number' && value > 0);
      const latencySeries = runs
        .map((run) => run.durationMs)
        .filter((value): value is number => typeof value === 'number' && value > 0)
        .slice(0, 12)
        .reverse();
      const baseHeat = agent.status === 'active' ? 82 : agent.status === 'warm' ? 58 : agent.status === 'idle' ? 30 : 8;
      const sessionBoost = Math.min(18, agent.activeSessionCount * 6);
      const recencyBoost = agent.latestAgeMs === null ? 0 : Math.max(0, 18 - Math.floor(agent.latestAgeMs / (30 * 60 * 1000)));
      const heatScore = Math.min(100, baseHeat + sessionBoost + recencyBoost);
      return [agent.id, {
        tokenSeries: tokenizeRecentUsage(runs, agent.latestTokens),
        latencySeries,
        latencyP99: percentile(durations, 99),
        heatScore,
        runCount24h: runs.length,
      }];
    }));
  }, [dashboard]);

  const selectedAgentRuns = useMemo(() => {
    const runs = (dashboard?.agentRuns || []).filter((run) => run.agentId === selectedAgentId);
    if (runs.length) return runs;
    if (lastAgentRun && lastAgentRun.agentId === selectedAgentId) {
      return [lastAgentRun];
    }
    return [];
  }, [dashboard?.agentRuns, selectedAgentId, lastAgentRun]);
  const latestRunByAgent = useMemo(() => {
    const map = new Map<string, OpenClawAgentRunRecord>();
    (dashboard?.agentRuns || []).forEach((run) => {
      const current = map.get(run.agentId);
      if (!current) {
        map.set(run.agentId, run);
        return;
      }
      const currentTime = new Date(current.createdAt).getTime();
      const nextTime = new Date(run.createdAt).getTime();
      if (Number.isNaN(currentTime) || (!Number.isNaN(nextTime) && nextTime > currentTime)) {
        map.set(run.agentId, run);
      }
    });
    if (lastAgentRun) {
      const current = map.get(lastAgentRun.agentId);
      const currentTime = current ? new Date(current.createdAt).getTime() : 0;
      const latestTime = new Date(lastAgentRun.createdAt).getTime();
      if (!current || Number.isNaN(currentTime) || latestTime > currentTime) {
        map.set(lastAgentRun.agentId, lastAgentRun);
      }
    }
    return map;
  }, [dashboard?.agentRuns, lastAgentRun]);

  const cronJobsByAgent = useMemo(() => {
    const map = new Map<string, Record<string, any>[]>();
    cronJobs.forEach((job) => {
      const aid = job.agentId || 'unknown';
      if (!map.has(aid)) map.set(aid, []);
      map.get(aid)!.push(job);
    });
    return map;
  }, [cronJobs]);

  const getAgentPreference = (agentId: string): AgentConsolePreference => (
    agentConsolePreferences[agentId] || {}
  );

  const getAgentEffectiveMeta = (agent: OpenClawDashboard['agents'][number]) => {
    const preference = getAgentPreference(agent.id);
    const model = typeof preference.modelLabelOverride === 'string' && preference.modelLabelOverride.trim()
      ? preference.modelLabelOverride.trim()
      : agent.model;
    const workspace = typeof preference.workspaceOverride === 'string' && preference.workspaceOverride.trim()
      ? preference.workspaceOverride.trim()
      : agent.workspace;
    const provider = typeof preference.providerLabelOverride === 'string' && preference.providerLabelOverride.trim()
      ? preference.providerLabelOverride.trim()
      : (agent.latestProvider || '暂无提供方');
    const routes = normalizeStringArray(preference.routesOverride).length
      ? normalizeStringArray(preference.routesOverride)
      : agent.routes;
    const quickTasks = normalizeStringArray(preference.quickTasks);
    const defaultMessageTemplate = typeof preference.defaultMessageTemplate === 'string'
      ? preference.defaultMessageTemplate
      : '';
    return {
      model,
      workspace,
      provider,
      routes,
      quickTasks,
      defaultMessageTemplate,
      promptPrefix: typeof preference.promptPrefix === 'string' ? preference.promptPrefix : '',
      promptSuffix: typeof preference.promptSuffix === 'string' ? preference.promptSuffix : '',
      disabled: preference.disabled === true,
    };
  };
  const selectedAgentEffective = selectedAgent ? getAgentEffectiveMeta(selectedAgent) : null;
  const getNativeModuleUrl = (moduleId: string) => {
    const module = NATIVE_MODULES.find((item) => item.id === moduleId) || NATIVE_MODULES[0];
    if (!module) return '/native-control/';
    return module.withSession
      ? `${module.path}?session=${encodeURIComponent(selectedAgentId || 'main')}`
      : module.path;
  };
  const openNativeModule = (moduleId: string) => {
    setSelectedNativeModuleId(moduleId);
    if (typeof window === 'undefined') return;
    window.location.assign(getNativeModuleUrl(moduleId));
  };
  const visibleAgents = useMemo(() => {
    const items = [...(dashboard?.agents || [])];
    const statusScore = { active: 0, warm: 1, idle: 2, offline: 3 };
    items.sort((left, right) => {
      const leftHeat = agentAnalytics.get(left.id)?.heatScore ?? 0;
      const rightHeat = agentAnalytics.get(right.id)?.heatScore ?? 0;
      if (agentViewSort === 'name') {
        return getPreferredName(left).localeCompare(getPreferredName(right), 'zh-Hans-CN');
      }
      if (agentViewSort === 'status') {
        const statusDiff = statusScore[left.status] - statusScore[right.status];
        if (statusDiff !== 0) return statusDiff;
        if (rightHeat !== leftHeat) return rightHeat - leftHeat;
      } else if (rightHeat !== leftHeat) {
        return rightHeat - leftHeat;
      }
      const priorityDiff = (agentConsolePreferences[left.id]?.priority ?? Number.MAX_SAFE_INTEGER)
        - (agentConsolePreferences[right.id]?.priority ?? Number.MAX_SAFE_INTEGER);
      if (priorityDiff !== 0) return priorityDiff;
      return (left.latestAgeMs ?? Number.MAX_SAFE_INTEGER) - (right.latestAgeMs ?? Number.MAX_SAFE_INTEGER);
    });
    if (!collapseIdleAgents) return items;
    return items.filter((agent) => {
      if (agent.id === selectedAgentId) return true;
      const analytics = agentAnalytics.get(agent.id);
      const heat = analytics?.heatScore ?? 0;
      return agent.status !== 'idle' || (analytics?.runCount24h ?? 0) > 0 || heat >= 35;
    });
  }, [
    dashboard?.agents,
    agentAnalytics,
    agentViewSort,
    collapseIdleAgents,
    selectedAgentId,
    agentConsolePreferences,
  ]);
  const loadBalancingAlerts = useMemo(() => {
    const agents = dashboard?.agents || [];
    return agents
      .map((agent) => {
        const analytics = agentAnalytics.get(agent.id);
        const p99 = analytics?.latencyP99 ?? 0;
        const heat = analytics?.heatScore ?? 0;
        const overloaded = p99 >= latencyAlertThreshold || heat >= 90;
        if (!overloaded) return null;
        const sourceMeta = getAgentEffectiveMeta(agent);
        const sourceFamily = resolveModelFamily(sourceMeta.model || agent.model);
        const targets = agents
          .filter((target) => target.id !== agent.id)
          .map((target) => ({
            agent: target,
            analytics: agentAnalytics.get(target.id),
            effectiveMeta: getAgentEffectiveMeta(target),
          }))
          .filter(({ agent: target, analytics: targetAnalytics, effectiveMeta }) => (
            effectiveMeta.disabled !== true
            && (target.status === 'idle' || target.status === 'warm')
            && (targetAnalytics?.heatScore ?? 0) <= 60
            && resolveModelFamily(effectiveMeta.model || target.model) === sourceFamily
          ))
          .sort((left, right) => (left.analytics?.heatScore ?? 0) - (right.analytics?.heatScore ?? 0))
          .slice(0, 3);
        return {
          agent,
          analytics,
          targets,
          sourceFamily,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((left, right) => {
        const leftScore = Math.max(left.analytics?.heatScore ?? 0, left.analytics?.latencyP99 ?? 0);
        const rightScore = Math.max(right.analytics?.heatScore ?? 0, right.analytics?.latencyP99 ?? 0);
        return rightScore - leftScore;
      });
  }, [dashboard?.agents, agentAnalytics, latencyAlertThreshold, agentConsolePreferences]);

  const statCardTones = {
    agents: activeAgentCount > 0 ? 'healthy' : 'warning',
    health: healthRatio >= 90 ? 'healthy' : healthRatio >= 50 ? 'warning' : 'critical',
    gateway: dashboard?.runtime.gatewayListening ? 'healthy' : 'critical',
    environment: 'neutral',
  } as const;
  const isAgentFocusedView = activeSection === 'agents';
  const priorityMetrics = [
    {
      id: 'gateway',
      label: '网关',
      value: dashboard?.runtime.gatewayListening ? '在线' : '离线',
      meta: dashboard?.runtime.gatewayListening ? `127.0.0.1:${dashboard?.runtime.gatewayPort}` : '请检查网关',
      tone: statCardTones.gateway,
    },
    {
      id: 'health',
      label: '服务健康',
      value: dashboard ? `${healthRatio}%` : '--',
      meta: dashboard ? `${dashboard.summary.healthyServices}/${dashboard.summary.totalServices} 正常` : '等待数据',
      tone: statCardTones.health,
    },
    {
      id: 'agents',
      label: '活跃助理',
      value: dashboard ? `${activeAgentCount}/${dashboard.agents.length}` : '--',
      meta: selectedAgent ? `当前: ${getPreferredName(selectedAgent)}` : '请选择助理',
      tone: statCardTones.agents,
    },
    {
      id: 'sync',
      label: '最近同步',
      value: dashboard?.generatedAt ? formatDateTime(dashboard.generatedAt) : '--',
      meta: sectionMeta[activeSection].label,
      tone: 'neutral' as const,
    },
  ];
  const commanderInsights = useMemo(() => {
    const agents = dashboard?.agents || [];
    const runs = dashboard?.agentRuns || [];
    const totalAgents = agents.length;
    const syncWindowMs = 2 * 60 * 60 * 1000;
    const syncedAgents = agents.filter((agent) => agent.latestAgeMs !== null && agent.latestAgeMs <= syncWindowMs).length;
    const syncRate = totalAgents ? Math.round((syncedAgents / totalAgents) * 100) : 0;

    const bucketCount = 12;
    const now = Date.now();
    const start = now - (24 * 60 * 60 * 1000);
    const bucketMs = (24 * 60 * 60 * 1000) / bucketCount;
    const tokenBuckets = new Array(bucketCount).fill(0);
    const latencyBuckets = new Array(bucketCount).fill(0).map(() => [] as number[]);

    runs.forEach((run) => {
      const timestamp = new Date(run.createdAt).getTime();
      if (Number.isNaN(timestamp) || timestamp < start || timestamp > now) return;
      const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((timestamp - start) / bucketMs)));
      const token = typeof run.usage.total === 'number' && run.usage.total > 0 ? run.usage.total : 0;
      tokenBuckets[index] += token;
      if (typeof run.durationMs === 'number' && run.durationMs > 0) {
        latencyBuckets[index].push(run.durationMs);
      }
    });

    const latencyTrend = latencyBuckets.map((bucket) => {
      if (!bucket.length) return 0;
      return Math.round(bucket.reduce((sum, value) => sum + value, 0) / bucket.length);
    });

    const activeChain = [...agents]
      .filter((agent) => agent.status === 'active' || agent.status === 'warm')
      .filter((agent) => agent.id !== 'main' && agent.id !== 'brand-cjd')
      .sort((left, right) => (left.latestAgeMs ?? Number.MAX_SAFE_INTEGER) - (right.latestAgeMs ?? Number.MAX_SAFE_INTEGER))
      .slice(0, 5);

    const commLinks = activeChain.slice(0, -1).map((from, index) => {
      const to = activeChain[index + 1];
      return {
        id: `${from.id}-${to.id}`,
        from: from.emoji ? `${from.emoji} ${getPreferredName(from)}` : getPreferredName(from),
        to: to.emoji ? `${to.emoji} ${getPreferredName(to)}` : getPreferredName(to),
      };
    });

    const totalToken24h = runs.reduce((sum, run) => sum + (typeof run.usage.total === 'number' && run.usage.total > 0 ? run.usage.total : 0), 0);
    return {
      syncRate,
      syncedAgents,
      totalAgents,
      tokenBuckets,
      latencyTrend,
      commLinks,
      totalToken24h,
    };
  }, [dashboard]);

  const validateAgentExtraJson = (rawValue: string) => {
    const raw = rawValue.trim();
    if (!raw) return '';
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return '扩展配置 JSON 必须是对象。';
      }
      return '';
    } catch (jsonError) {
      return `扩展配置 JSON 无效：${formatJsonParseError(rawValue, jsonError)}`;
    }
  };

  const insertPromptVariable = (token: string) => {
    const fieldMap: Record<PromptInsertTarget, {
      value: string;
      ref: React.RefObject<HTMLTextAreaElement | null>;
      setter: React.Dispatch<React.SetStateAction<string>>;
    }> = {
      defaultTemplate: {
        value: agentConfigDefaultTemplate,
        ref: agentDefaultTemplateRef,
        setter: setAgentConfigDefaultTemplate,
      },
      promptPrefix: {
        value: agentConfigPromptPrefix,
        ref: agentPromptPrefixRef,
        setter: setAgentConfigPromptPrefix,
      },
      promptSuffix: {
        value: agentConfigPromptSuffix,
        ref: agentPromptSuffixRef,
        setter: setAgentConfigPromptSuffix,
      },
    };

    const target = fieldMap[promptInsertTarget];
    if (!target) return;

    const input = target.ref.current;
    if (input) {
      const start = input.selectionStart ?? target.value.length;
      const end = input.selectionEnd ?? target.value.length;
      const nextValue = `${target.value.slice(0, start)}${token}${target.value.slice(end)}`;
      target.setter(nextValue);
      setAgentConfigDirty(true);
      window.requestAnimationFrame(() => {
        input.focus();
        const cursor = start + token.length;
        input.setSelectionRange(cursor, cursor);
      });
      return;
    }

    const separator = target.value && !target.value.endsWith('\n') ? '\n' : '';
    target.setter(`${target.value}${separator}${token}`);
    setAgentConfigDirty(true);
  };

  const handleDiagnoseAgentModel = async (agentId: string) => {
    if (!agentId) return;
    setAgentModelDiagnosing(true);
    setAgentModelDiagnosis(null);
    setAgentModelLoadError('');
    try {
      const snapshot = await openclawService.getAgentModels(agentId);
      setAgentModelSnapshots((current) => ({ ...current, [agentId]: snapshot }));
      const selectedModel = (agentModelSelection || pickSnapshotModel(snapshot)).trim();
      const currentModel = pickSnapshotModel(snapshot).trim();

      if (!selectedModel) {
        setAgentModelDiagnosis({
          tone: 'warning',
          title: '未找到可诊断模型',
          details: ['当前助理没有可用模型。请先点击“刷新模型”或检查模型权限。'],
          checkedAt: new Date().toISOString(),
        });
        return;
      }

      if (!snapshot.models.some((model) => model.key === selectedModel)) {
        setAgentModelDiagnosis({
          tone: 'critical',
          title: '模型配置异常',
          details: [
            `模型 ${selectedModel} 不在可用列表中。`,
            '请刷新模型列表，并核对模型标签覆盖 / 提供方标签覆盖。',
          ],
          checkedAt: new Date().toISOString(),
        });
        return;
      }

      const hints: string[] = [];
      if (snapshot.allowed.length && !snapshot.allowed.includes(selectedModel)) {
        hints.push(`模型 ${selectedModel} 不在 allowed 列表，网关可能拒绝调用。`);
      }
      if (currentModel && currentModel !== selectedModel) {
        hints.push(`当前生效模型是 ${currentModel}，你选择的是 ${selectedModel}。建议先点“应用模型”。`);
      }
      if (agentConfigModelOverride.trim()) {
        hints.push(`模型标签覆盖：${agentConfigModelOverride.trim()}`);
      }
      if (agentConfigProviderOverride.trim()) {
        hints.push(`提供方标签覆盖：${agentConfigProviderOverride.trim()}`);
      }

      const startedAt = Date.now();
      try {
        await openclawService.runAgent({
          agentId,
          message: MODEL_DIAGNOSTIC_PROMPT,
          thinking: 'minimal',
        });
        const elapsedMs = Math.max(1, Date.now() - startedAt);
        setAgentModelDiagnosis({
          tone: hints.length ? 'warning' : 'healthy',
          title: hints.length ? '链路可用（存在配置提示）' : '链路诊断通过',
          details: [`RPC probe: ok (${elapsedMs}ms)`, ...hints],
          checkedAt: new Date().toISOString(),
        });
        void loadDashboard(false);
      } catch (probeError) {
        const rawMessage = probeError instanceof Error ? probeError.message : '模型链路探测失败。';
        setAgentModelDiagnosis({
          tone: 'critical',
          title: '链路诊断失败',
          details: [explainModelDiagnosticFailure(rawMessage), `原始错误：${rawMessage}`],
          checkedAt: new Date().toISOString(),
        });
      }
    } catch (diagnosisError) {
      const message = diagnosisError instanceof Error ? diagnosisError.message : '读取模型信息失败。';
      setAgentModelDiagnosis({
        tone: 'critical',
        title: '诊断初始化失败',
        details: [message],
        checkedAt: new Date().toISOString(),
      });
      setAgentModelLoadError(message);
    } finally {
      setAgentModelDiagnosing(false);
    }
  };

  const applyRolePreset = (presetId: string) => {
    const preset = ROLE_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setSelectedRolePresetId(preset.id);
    setAgentConfigCorePrompt(preset.profile);
    setAgentConfigPromptPrefix(preset.profile);
    setAgentConfigDefaultTemplate('');
    setAgentConfigPromptSuffix('');
    setAgentConfigDirty(true);
  };

  const handleConfigSandboxRun = async () => {
    if (!agentConfigTarget || !configSandboxMessage.trim() || configSandboxLoading) return;
    setConfigSandboxLoading(true);
    setConfigSandboxReply('');
    setConfigSandboxError('');
    setConfigSandboxStartedAt(new Date().toISOString());
    try {
      const finalMessage = [
        (agentConfigCorePrompt.trim() || agentConfigPromptPrefix.trim()),
        configSandboxMessage.trim(),
        agentConfigPromptSuffix.trim(),
      ].filter(Boolean).join('\n\n');
      const result = await openclawService.runAgentStream({
        agentId: agentConfigTarget.id,
        message: finalMessage,
        thinking: agentConfigThinking,
        sessionId: agentConfigReuseSession ? agentConfigTarget.latestSessionId || undefined : undefined,
      }, {
        onStart: (event) => {
          setConfigSandboxStartedAt(event.startedAt);
          setConfigSandboxError('');
        },
        onDelta: (event) => {
          setConfigSandboxReply(event.reply);
        },
        onError: (event) => {
          setConfigSandboxError(event.message);
        },
      });
      setConfigSandboxLastRun(result);
      setConfigSandboxReply('');
      setConfigSandboxStartedAt(null);
      void loadDashboard(false);
    } catch (sandboxError) {
      const message = sandboxError instanceof Error ? sandboxError.message : '沙盒测试失败。';
      setConfigSandboxError(message);
    } finally {
      setConfigSandboxLoading(false);
    }
  };

  const handleAction = async (serviceId: string, action: OpenClawAction) => {
    const actionKey = `${serviceId}:${action}`;
    setRunningAction(actionKey);
    try {
      const result = await openclawService.runAction(serviceId, action);
      setLastResult(result);
      await loadDashboard(false);
      if (action === 'restart') {
        setSelectedServiceId(serviceId);
        setHighlightedServiceId(serviceId);
        setSelectedNativeModuleId('logs');
        setActiveSection('agents');
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '服务动作执行失败。');
    } finally {
      setRunningAction(null);
    }
  };

  const handleRuntimeAction = async (action: OpenClawRuntimeAction) => {
    setRunningRuntimeAction(action);
    try {
      const result = await openclawService.runRuntimeAction(action);
      setLastResult(result);
      await loadDashboard(false);
      if (action === 'repair-watchdog') {
        setActiveSection('agents');
      }
    } catch (runtimeError) {
      setError(runtimeError instanceof Error ? runtimeError.message : '运行时修复失败。');
    } finally {
      setRunningRuntimeAction(null);
    }
  };

  const handleCheckUpgradeStatus = async () => {
    setUpgradeStatusOpen(true);
    if (upgradeStatusData) return; // already loaded
    setUpgradeStatusLoading(true);
    try {
      const res = await fetch('/api/openclaw/upgrade-status');
      const data = await res.json();
      setUpgradeStatusData(data.data || null);
    } catch {
      setUpgradeStatusData(null);
    } finally {
      setUpgradeStatusLoading(false);
    }
  };

  const handleShortcut = async (kind: 'url' | 'path', target: string) => {
    try {
      await openclawService.runShortcut(kind, target);
      setError('');
    } catch (shortcutError) {
      setError(shortcutError instanceof Error ? shortcutError.message : '快捷操作执行失败。');
    }
  };

  const loadAgentModels = async (agentId: string, force = false) => {
    if (!agentId) return;
    if (!force && agentModelSnapshots[agentId]) {
      const cached = agentModelSnapshots[agentId];
      const cachedDefault = pickSnapshotModel(cached);
      if (cachedDefault) setAgentModelSelection(cachedDefault);
      return;
    }
    setAgentModelLoading(true);
    try {
      const snapshot = await openclawService.getAgentModels(agentId);
      setAgentModelSnapshots((current) => ({ ...current, [agentId]: snapshot }));
      const defaultKey = pickSnapshotModel(snapshot);
      setAgentModelSelection(defaultKey);
      setAgentModelLoadError('');
      setAgentModelDiagnosis(null);
    } catch (modelError) {
      setAgentModelLoadError(modelError instanceof Error ? modelError.message : '读取模型列表失败。');
    } finally {
      setAgentModelLoading(false);
    }
  };

  const handleSwitchAgentModel = async (agentId: string, nextModelKey?: string) => {
    const modelKey = (nextModelKey || agentModelSelection).trim();
    if (!agentId || !modelKey) return;
    setAgentModelSwitching(true);
    setAgentModelDiagnosis(null);
    try {
      const snapshot = await openclawService.setAgentModel(agentId, modelKey);
      setAgentModelSnapshots((current) => ({ ...current, [agentId]: snapshot }));
      setAgentModelSelection(pickSnapshotModel(snapshot) || modelKey);
      setAgentModelLoadError('');
      setError('');
      void loadDashboard(false);
    } catch (switchError) {
      const message = switchError instanceof Error ? switchError.message : '模型切换失败。';
      setAgentModelLoadError(message);
      setError(message);
    } finally {
      setAgentModelSwitching(false);
    }
  };

  const applyAgentConsoleDefaults = (agentId: string) => {
    const preference = agentConsolePreferences[agentId];
    if (!preference) {
      setThinking('medium');
      setReuseLatestSession(agentId === 'main');
      return;
    }
    setThinking(parseThinkingPreference(preference.thinking) || 'medium');
    setReuseLatestSession(typeof preference.reuseLatestSession === 'boolean' ? preference.reuseLatestSession : agentId === 'main');
  };

  const openAgentConfigModal = (agentId: string) => {
    setSelectedAgentId(agentId);
    setAgentConfigTargetId(agentId);
    setAgentConfigDirty(false);
    setAgentConfigNotice(null);
    setAgentConfigExtraJsonError('');
    setAgentModelDiagnosis(null);
    setAgentConfigAdvancedOpen(false);
    setAgentConfigModalOpen(true);
    void loadAgentModels(agentId);
  };

  const openStudioForAgent = (agentId: string, presetMessage?: string) => {
    const targetAgent = dashboard?.agents.find((agent) => agent.id === agentId);
    if (!targetAgent) return;
    const effective = getAgentEffectiveMeta(targetAgent);
    if (effective.disabled) {
      setError(`助理 ${getPreferredName(targetAgent)} 已在配置中心禁用任务下发。`);
      return;
    }
    setSelectedAgentId(agentId);
    applyAgentConsoleDefaults(agentId);
    const quickText = presetMessage?.trim();
    setCommandMessage(quickText || effective.defaultMessageTemplate || '');
    setStreamingReply('');
    setStreamingStartedAt(null);
    setStreamingError('');
    setError('');
    setActiveSection('agents');
    setStudioDialogOpen(true);
    void loadAgentModels(agentId);
  };

  const handleSendCommand = async () => {
    if (!selectedAgent || !commandMessage.trim()) return;
    const effective = getAgentEffectiveMeta(selectedAgent);
    if (effective.disabled) {
      setError(`助理 ${getPreferredName(selectedAgent)} 已在配置中心禁用任务下发。`);
      return;
    }
    const finalMessage = [
      effective.promptPrefix.trim(),
      commandMessage.trim(),
      effective.promptSuffix.trim(),
    ].filter(Boolean).join('\n\n');
    setSendingCommand(true);
    setStreamingReply('');
    setStreamingStartedAt(new Date().toISOString());
    setStreamingError('');
    try {
      const baseInput = {
        agentId: selectedAgent.id,
        message: finalMessage,
        thinking,
      } as const;
      const streamHandlers = {
        onStart: (event: Extract<OpenClawAgentStreamEvent, { type: 'start' }>) => {
          setStreamingStartedAt(event.startedAt);
          setStreamingError('');
        },
        onDelta: (event: Extract<OpenClawAgentStreamEvent, { type: 'delta' }>) => {
          setStreamingReply(event.reply);
        },
        onError: (event: Extract<OpenClawAgentStreamEvent, { type: 'error' }>) => {
          setStreamingError(event.message);
        },
      };
      const sessionIsFresh = typeof selectedAgent.latestAgeMs === 'number'
        ? selectedAgent.latestAgeMs <= (2 * 60 * 60 * 1000)
        : false;
      const allowSessionReuse = reuseLatestSession && Boolean(selectedAgent.latestSessionId)
        && (selectedAgent.id === 'main' || sessionIsFresh);
      const withSessionId = allowSessionReuse ? selectedAgent.latestSessionId || undefined : undefined;
      let run: OpenClawAgentRunRecord | undefined;
      let usedFallback = false;
      try {
        run = await openclawService.runAgentStream({
          ...baseInput,
          sessionId: withSessionId,
        }, streamHandlers);
      } catch (streamError) {
        const streamMessage = streamError instanceof Error ? streamError.message : '流式任务失败。';
        const canRetryWithoutSession = Boolean(withSessionId);
        if (canRetryWithoutSession) {
          setStreamingError(`复用会话失败，已自动切换新会话重试：${streamMessage}`);
          try {
            run = await openclawService.runAgentStream(baseInput, streamHandlers);
          } catch (retryError) {
            const retryMessage = retryError instanceof Error ? retryError.message : '重试失败。';
            setStreamingError(`流式重试失败，切换普通模式执行：${retryMessage}`);
            run = await openclawService.runAgent(baseInput);
            usedFallback = true;
          }
        } else {
          setStreamingError(`流式执行异常，切换普通模式执行：${streamMessage}`);
          run = await openclawService.runAgent(baseInput);
          usedFallback = true;
        }
      }
      if (run) {
        setLastAgentRun(run);
        if (usedFallback) {
          // Non-streaming fallback: show the reply since streamingReply won't update
          setStreamingReply(run.reply || run.summary || '');
        }
      }
      setCommandMessage('');
      setStreamingReply('');
      setStreamingStartedAt(null);
      setStreamingError('');
      void loadDashboard(false);
    } catch (commandError) {
      setError(commandError instanceof Error ? commandError.message : '助理指令执行失败。');
      if (commandError instanceof Error) {
        setStreamingError(commandError.message);
      }
    } finally {
      setSendingCommand(false);
    }
  };

  const handleSaveConfig = async (reloadGateway: boolean) => {
    setConfigSaving(true);
    try {
      const result = await openclawService.saveConfig(configDraft, reloadGateway);
      setConfigDraft(result.config.content);
      setConfigPath(result.config.configPath);
      setConfigDirty(false);
      if (result.reload) {
        setLastResult(result.reload);
      }
      await loadDashboard(false);
    } catch (configError) {
      setError(configError instanceof Error ? configError.message : '配置保存失败。');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSaveAgentConfig = async (clear = false, reloadGateway = false) => {
    if (!agentConfigTargetId) return;

    const extraJsonError = clear ? '' : validateAgentExtraJson(agentConfigExtraJson);
    if (extraJsonError) {
      setAgentConfigExtraJsonError(extraJsonError);
      setAgentConfigNotice({
        tone: 'critical',
        message: extraJsonError,
      });
      setError(extraJsonError);
      return;
    }
    setAgentConfigExtraJsonError('');

    let baseConfig: Record<string, unknown> = {};
    if (configDraft.trim()) {
      try {
        baseConfig = JSON.parse(configDraft) as Record<string, unknown>;
      } catch {
        setError('当前配置文件 JSON 无效，请先在配置页修复。');
        return;
      }
    }

    const existingIdentity = baseConfig.agentIdentity && typeof baseConfig.agentIdentity === 'object' && !Array.isArray(baseConfig.agentIdentity)
      ? { ...(baseConfig.agentIdentity as Record<string, { roleName?: string; displayName?: string; emoji?: string }>) }
      : {};
    const existingConsole = baseConfig.agentConsole && typeof baseConfig.agentConsole === 'object' && !Array.isArray(baseConfig.agentConsole)
      ? { ...(baseConfig.agentConsole as Record<string, AgentConsolePreference>) }
      : {};

    const nextIdentity = { ...existingIdentity };
    const nextConsole = { ...existingConsole };
    const nextRoleName = agentConfigRoleName.trim();
    const nextName = agentConfigName.trim();
    const nextEmoji = agentConfigEmoji.trim();
    let extraPreference: Record<string, unknown> = {};
    if (!clear) {
      const rawExtra = agentConfigExtraJson.trim();
      if (rawExtra) {
        extraPreference = JSON.parse(rawExtra) as Record<string, unknown>;
      }
    }
    if (clear || (!nextRoleName && !nextName && !nextEmoji)) {
      delete nextIdentity[agentConfigTargetId];
    } else {
      nextIdentity[agentConfigTargetId] = {
        ...(nextRoleName ? { roleName: nextRoleName } : {}),
        ...(nextName ? { displayName: nextName } : {}),
        ...(nextEmoji ? { emoji: nextEmoji } : {}),
      };
    }
    if (clear) {
      delete nextConsole[agentConfigTargetId];
    } else {
      const preference: AgentConsolePreference = { ...extraPreference };
      if (agentConfigThinking !== 'medium') {
        preference.thinking = agentConfigThinking;
      }
      if (agentConfigReuseSession === false) {
        preference.reuseLatestSession = false;
      }
      const promptPrefix = (agentConfigCorePrompt.trim() || agentConfigPromptPrefix.trim());
      const promptSuffix = agentConfigPromptSuffix.trim();
      const defaultTemplate = agentConfigDefaultTemplate.trim();
      const modelOverride = agentConfigModelOverride.trim();
      const providerOverride = agentConfigProviderOverride.trim();
      const workspaceOverride = agentConfigWorkspaceOverride.trim();
      const quickTasks = agentConfigQuickTasks
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      const routesOverride = agentConfigRoutesOverride
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
      const priority = agentConfigPriority.trim();
      if (promptPrefix) {
        preference.promptPrefix = promptPrefix;
      }
      if (promptSuffix) {
        preference.promptSuffix = promptSuffix;
      }
      if (defaultTemplate) {
        preference.defaultMessageTemplate = defaultTemplate;
      }
      if (modelOverride) {
        preference.modelLabelOverride = modelOverride;
      }
      if (providerOverride) {
        preference.providerLabelOverride = providerOverride;
      }
      if (workspaceOverride) {
        preference.workspaceOverride = workspaceOverride;
      }
      if (quickTasks.length) {
        preference.quickTasks = quickTasks;
      }
      if (routesOverride.length) {
        preference.routesOverride = routesOverride;
      }
      if (priority) {
        const parsedPriority = Number(priority);
        if (!Number.isNaN(parsedPriority) && Number.isFinite(parsedPriority)) {
          preference.priority = parsedPriority;
        }
      }
      if (agentConfigDisabled) {
        preference.disabled = true;
      }
      if (Object.keys(preference).length) {
        nextConsole[agentConfigTargetId] = preference;
      } else {
        delete nextConsole[agentConfigTargetId];
      }
    }

    const nextConfig: Record<string, unknown> = { ...baseConfig };
    if (Object.keys(nextIdentity).length) {
      nextConfig.agentIdentity = nextIdentity;
    } else {
      delete nextConfig.agentIdentity;
    }
    if (Object.keys(nextConsole).length) {
      nextConfig.agentConsole = nextConsole;
    } else {
      delete nextConfig.agentConsole;
    }

    // Handle Telegram Bot association
    const currentTelegramBots = { ...telegramBots };
    // First, clear any existing association for this agent
    Object.keys(currentTelegramBots).forEach((token) => {
      if (currentTelegramBots[token].agentId === agentConfigTargetId) {
        delete currentTelegramBots[token];
      }
    });
    // Then set the new association if selected
    if (agentConfigTelegramBot) {
      currentTelegramBots[agentConfigTelegramBot] = {
        name: telegramBots[agentConfigTelegramBot]?.name || agentConfigTelegramBot,
        agentId: agentConfigTargetId,
        enabled: telegramBots[agentConfigTelegramBot]?.enabled ?? true,
      };
    }
    if (Object.keys(currentTelegramBots).length) {
      nextConfig.telegramBots = currentTelegramBots;
    } else {
      delete nextConfig.telegramBots;
    }

    const nextContent = `${JSON.stringify(nextConfig, null, 2)}\n`;
    setAgentConfigSaving(true);
    setAgentConfigNotice(null);
    try {
      const result = await openclawService.saveConfig(nextContent, reloadGateway);
      setConfigDraft(result.config.content);
      setConfigPath(result.config.configPath);
      setConfigDirty(false);
      setAgentConfigDirty(false);
      if (result.reload) {
        setLastResult(result.reload);
      }
      applyAgentConsoleDefaults(agentConfigTargetId);
      await loadDashboard(false);
      setError('');
      if (result.reload) {
        setAgentConfigNotice({
          tone: result.reload.ok ? 'healthy' : 'warning',
          message: result.reload.ok
            ? '配置已保存并热重载网关。'
            : `配置已保存，但热重载失败：${compactText(result.reload.stderr || result.reload.stdout, 120)}`,
        });
      } else {
        setAgentConfigNotice({
          tone: 'healthy',
          message: '配置已保存。当前仅写入配置文件，若未自动生效可在服务控制页重载网关。',
        });
      }
    } catch (agentConfigError) {
      const message = agentConfigError instanceof Error ? agentConfigError.message : '助理配置保存失败。';
      setError(message);
      setAgentConfigNotice({
        tone: 'critical',
        message,
      });
    } finally {
      setAgentConfigSaving(false);
    }
  };

  return (
    <div className="openclaw-shell">
      <div className="openclaw-backdrop" />
      <main className="openclaw-layout">
        <section className={`openclaw-hero ${isAgentFocusedView ? 'is-compact' : ''}`}>
          <div className="openclaw-hero-top">
            <div className="openclaw-hero-copy">
              <p className="openclaw-kicker">OpenClaw 中文控制台</p>
              <h1>{dashboard?.title || 'OpenClaw 控制台'}</h1>
              <div className="openclaw-hero-tags">
                <span className="openclaw-hero-tag">当前只保留助理管理主视角</span>
                <span className="openclaw-hero-tag">原生工作台通过右上角入口直达</span>
              </div>
            </div>
            <div className="openclaw-hero-actions">
              <button className="openclaw-primary-btn" onClick={() => loadDashboard(true)} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
                刷新
              </button>
              <a className="openclaw-secondary-btn" href={getNativeModuleUrl('chat')} target="_blank" rel="noreferrer">
                原生工作台
              </a>
            </div>
          </div>
          <div className="openclaw-priority-strip openclaw-hero-priority">
            {priorityMetrics.map((metric) => (
              <article key={`hero-${metric.id}`} className={`openclaw-priority-card tone-${metric.tone}`}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.meta}</small>
              </article>
            ))}
          </div>

          {/* ── Commander Header Strip ── */}
          <div className="openclaw-commander-strip">
            {/* KPI cluster with SVG gauge */}
            <div className="openclaw-commander-strip-kpis">
              {/* Sync rate with arc gauge */}
              <div className={`openclaw-commander-strip-kpi has-gauge ${commanderInsights.syncRate >= 50 ? 'tone-healthy' : commanderInsights.syncRate >= 20 ? 'tone-warning' : 'tone-critical'}`}>
                <svg className="openclaw-gauge-ring" viewBox="0 0 28 28" aria-hidden="true">
                  <circle className="track" cx="14" cy="14" r="10" />
                  <circle
                    className={`fill ${commanderInsights.syncRate >= 50 ? 'tone-healthy' : commanderInsights.syncRate >= 20 ? 'tone-warning' : 'tone-critical'}`}
                    cx="14" cy="14" r="10"
                    strokeDasharray={`${2 * Math.PI * 10}`}
                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - commanderInsights.syncRate / 100)}`}
                  />
                </svg>
                <span>同步率</span>
                <strong>{commanderInsights.syncRate}%</strong>
              </div>
              <div className="openclaw-commander-strip-divider" />
              <div className="openclaw-commander-strip-kpi tone-healthy">
                <span>在线联动</span>
                <strong>{commanderInsights.commLinks.length}</strong>
              </div>
              <div className="openclaw-commander-strip-divider" />
              <div className="openclaw-commander-strip-kpi tone-healthy">
                <span>同步助理</span>
                <strong>{commanderInsights.syncedAgents}/{commanderInsights.totalAgents || 0}</strong>
              </div>
              <div className="openclaw-commander-strip-divider" />
              <div className="openclaw-commander-strip-kpi">
                <span>24h Token</span>
                <strong>{commanderInsights.totalToken24h ? commanderInsights.totalToken24h.toLocaleString() : '--'}</strong>
              </div>
            </div>

            {/* Charts */}
            <div className="openclaw-commander-strip-charts">
              <div className="openclaw-commander-strip-chart">
                <span>Token 曲线（24h）</span>
                <svg viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true">
                  <polyline points={seriesToPoints(commanderInsights.tokenBuckets, 120, 32)} />
                </svg>
              </div>
              <div className="openclaw-commander-strip-chart pink">
                <span>延迟趋势（24h）</span>
                <svg viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true">
                  <polyline points={seriesToPoints(commanderInsights.latencyTrend, 120, 32)} />
                </svg>
              </div>
            </div>

            {/* Comm links - two-column pairs */}
            <div className="openclaw-commander-strip-links two-col">
              {commanderInsights.commLinks.length ? commanderInsights.commLinks.map((link, index) => (
                <div key={link.id} className={`openclaw-commander-strip-link ${index % 2 === 1 ? 'centered' : ''}`}>
                  <span>{link.from}</span>
                  <i />
                  <strong>{link.to}</strong>
                </div>
              )) : (
                <div className="openclaw-commander-strip-link">
                  <span style={{ color: 'var(--openclaw-muted)', fontSize: 12 }}>暂无活跃联动链路</span>
                </div>
              )}
            </div>

            {/* Phase 4: Real-time agent status + Cron strip */}
            <div className="openclaw-realtime-panel">
              <div className="openclaw-realtime-panel-header">
                <strong>实时状态</strong>
                <i className="openclaw-realtime-pulse" />
              </div>
              {(dashboard?.agents || []).slice(0, 6).map((agent) => {
                const latestRun = latestRunByAgent.get(agent.id);
                const taskPreview = compactText(latestRun?.message || '空闲', 20);
                return (
                  <div key={`rt-${agent.id}`} className="openclaw-realtime-agent-row">
                    <i className={`openclaw-realtime-agent-dot status-${agent.status}`} />
                    <span className="openclaw-realtime-agent-name" title={agent.id}>
                      {agent.emoji ? `${agent.emoji} ${getPreferredName(agent)}` : getPreferredName(agent)}
                    </span>
                    <span className="openclaw-realtime-agent-task">{taskPreview}</span>
                  </div>
                );
              })}
              {/* Cron status strip */}
              {(() => {
                const runningCrons = cronJobs.filter((j: any) => j.enabled && j.nextRunAtMs && j.nextRunAtMs > Date.now());
                const pendingCronCount = runningCrons.length;
                return (
                  <div className="openclaw-cron-status-strip">
                    <i className={`dot ${pendingCronCount > 0 ? 'running' : 'none'}`} />
                    <span>Cron</span>
                    <strong>{pendingCronCount} 个待执行</strong>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Phase 4: Quick task inline dispatch bar */}
          <div className="openclaw-quick-task-inline">
            <input
              type="text"
              placeholder="快速派发任务…"
              value={quickTaskInput}
              onChange={(e) => setQuickTaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && quickTaskInput.trim() && quickTaskTarget) {
                  openStudioForAgent(quickTaskTarget, quickTaskInput.trim());
                  setQuickTaskInput('');
                }
              }}
            />
            <select
              className="openclaw-input"
              style={{ width: 120, fontSize: 12, padding: '4px 8px' }}
              value={quickTaskTarget}
              onChange={(e) => setQuickTaskTarget(e.target.value)}
            >
              <option value="">选择助理</option>
              {(dashboard?.agents || []).map((agent) => (
                <option key={`qt-${agent.id}`} value={agent.id}>
                  {agent.emoji ? `${agent.emoji} ${getPreferredName(agent)}` : getPreferredName(agent)}
                </option>
              ))}
            </select>
            <button
              className="openclaw-primary-btn"
              style={{ fontSize: 12, padding: '4px 12px' }}
              disabled={!quickTaskInput.trim() || !quickTaskTarget}
              onClick={() => {
                if (quickTaskInput.trim() && quickTaskTarget) {
                  openStudioForAgent(quickTaskTarget, quickTaskInput.trim());
                  setQuickTaskInput('');
                }
              }}
            >
              派发
            </button>
          </div>

          {/* Always-visible action buttons */}
          <div className="openclaw-hero-action-buttons">
            <button
              className="openclaw-action-btn"
              onClick={() => handleRuntimeAction('repair-watchdog')}
              disabled={runningRuntimeAction === 'repair-watchdog'}
              title="修复 Watchdog 守护进程"
            >
              {runningRuntimeAction === 'repair-watchdog' ? '修复中…' : '🔧 修复系统'}
            </button>
            <button
              className="openclaw-action-btn"
              onClick={() => {
                if (!gatewayRestarting && dashboard?.runtime.gatewayListening) {
                  setGatewayRestarting(true);
                  openclawService.runAction('openclaw-gateway', 'restart').finally(() => {
                    setGatewayRestarting(false);
                    loadDashboard(false);
                  });
                }
              }}
              disabled={gatewayRestarting || !dashboard?.runtime.gatewayListening}
              title="重启 OpenClaw Gateway"
            >
              {gatewayRestarting ? '重启中…' : '🔄 重启网关'}
            </button>
            <button
              className="openclaw-action-btn"
              onClick={handleCheckUpgradeStatus}
              title="检查 OpenClaw 更新"
            >
              ⬆️ 升级系统
            </button>
          </div>
        </section>

        {error ? <section className="openclaw-error">{error}</section> : null}

        {upgradeStatusOpen ? (
          <section className="openclaw-agent-dialog-backdrop" onClick={() => setUpgradeStatusOpen(false)}>
            <div className="openclaw-agent-dialog" role="dialog" aria-modal="true" aria-label="升级检查" onClick={(e) => e.stopPropagation()}>
              <div className="openclaw-agent-dialog-head">
                <div>
                  <p className="openclaw-section-kicker"><Zap size={16} /> 系统升级</p>
                  <h2>OpenClaw 升级检查</h2>
                </div>
                <button type="button" className="openclaw-inline-toggle" onClick={() => setUpgradeStatusOpen(false)}>关闭</button>
              </div>
              {upgradeStatusLoading ? (
                <p style={{ color: 'var(--openclaw-muted)', padding: '16px 0' }}>正在检查升级状态...</p>
              ) : upgradeStatusData ? (
                <div className="openclaw-channel-assist">
                  <div className={`openclaw-channel-assist-card ${upgradeStatusData.upToDate ? 'is-ok' : 'is-warning'}`}>
                    <small>当前版本</small>
                    <strong>{upgradeStatusData.currentVersion}</strong>
                  </div>
                  <div className="openclaw-channel-assist-card is-ok">
                    <small>目标版本</small>
                    <strong>{upgradeStatusData.targetVersion}</strong>
                  </div>
                  <div className={`openclaw-channel-assist-card ${upgradeStatusData.upToDate ? 'is-ok' : 'is-warning'}`}>
                    <small>升级通道</small>
                    <strong>{upgradeStatusData.channel}</strong>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--openclaw-muted)', padding: '16px 0' }}>无法获取升级状态，请检查 openclaw update 命令是否可用。</p>
              )}
            </div>
          </section>
        ) : null}

        <section className="openclaw-dashboard-shell">
          <aside
            className={`openclaw-main-sidebar openclaw-main-sidebar-resizable ${sidebarCollapsed ? 'is-collapsed' : ''}`}
            style={sidebarCollapsed ? undefined : { width: `${sidebarWidth}px` }}
          >
            <div className="openclaw-main-sidebar-top">
              {!sidebarCollapsed ? (
                <p className="openclaw-section-kicker"><Activity size={16} /> 控制台菜单</p>
              ) : <span className="openclaw-main-sidebar-dot" />}
              <button
                type="button"
                className="openclaw-inline-toggle openclaw-main-sidebar-toggle"
                onClick={() => setSidebarCollapsed((value) => !value)}
                aria-label={sidebarCollapsed ? '展开左侧菜单' : '收起左侧菜单'}
              >
                {sidebarCollapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
              </button>
            </div>
            {!sidebarCollapsed ? (
              <div className="openclaw-main-sidebar-resize">
                <span>菜单宽度</span>
                <input
                  type="range"
                  min={220}
                  max={360}
                  step={4}
                  value={sidebarWidth}
                  onChange={(event) => setSidebarWidth(Number(event.target.value))}
                />
              </div>
            ) : null}
            <nav className={`openclaw-main-nav ${sidebarCollapsed ? 'is-collapsed' : ''}`} aria-label="OpenClaw 控制台菜单">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`openclaw-main-nav-item ${isNavigationItemActive(item) ? 'is-active' : ''}`}
                    onClick={() => handleNavigationItemClick(item)}
                    title={item.label}
                  >
                    <span className="openclaw-main-nav-icon"><Icon size={16} /></span>
                    {!sidebarCollapsed ? (
                      <>
                        <span className="openclaw-main-nav-copy">
                          <strong>{item.label}</strong>
                          <small>{sectionMeta[item.id].description}</small>
                        </span>
                        {item.badge ? <span className="openclaw-main-nav-badge">{item.badge}</span> : null}
                      </>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {/* Phase 4: Quick action shortcuts for each agent in sidebar */}
            {!sidebarCollapsed ? (
              <div className="openclaw-sidebar-quick-section">
                <p className="openclaw-sidebar-quick-title">快捷派发</p>
                <div className="openclaw-sidebar-quick-list">
                  {(dashboard?.agents || []).slice(0, 8).map((agent) => {
                    const effective = getAgentEffectiveMeta(agent);
                    return (
                      <button
                        key={`qa-${agent.id}`}
                        type="button"
                        className="openclaw-sidebar-quick-btn"
                        onClick={() => openStudioForAgent(agent.id)}
                        disabled={effective.disabled}
                        title={`向 ${getPreferredName(agent)} 派发任务`}
                      >
                        <span
                          className={`openclaw-sidebar-quick-glyph status-${agent.status}`}
                        >
                          {agent.emoji || getAgentGlyph(agent.id, agent.displayName || '', undefined)}
                        </span>
                        <span className="openclaw-sidebar-quick-label">{getPreferredName(agent)}</span>
                        <span className={`openclaw-sidebar-quick-status status-${agent.status}`}>
                          {agentStatusLabel[agent.status]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </aside>
          <div className="openclaw-main-content">
            {!isAgentFocusedView ? <>
              <section className="openclaw-stat-grid">
              <article className={`openclaw-stat-card tone-${statCardTones.agents}`}>
                <span>助理数</span>
                <strong>{dashboard?.agents.length || 0}</strong>
                <small>{activeAgentCount} 个正在工作</small>
              </article>
              <article
                className={`openclaw-stat-card tone-${statCardTones.health} ${healthRepairing ? 'is-loading' : ''}`}
                onClick={() => {
                  if (!healthRepairing && healthRatio < 100) {
                    setHealthRepairing(true);
                    openclawService.runRuntimeAction('repair-watchdog').then(() => {
                      loadDashboard(false);
                    }).finally(() => {
                      setHealthRepairing(false);
                    });
                  }
                }}
                style={{ cursor: healthRatio < 100 ? 'pointer' : 'default' }}
                title={healthRatio < 100 ? '点击修复' : '所有服务正常'}
              >
                <span>服务健康度</span>
                <strong>{healthRepairing ? '修复中...' : (dashboard ? `${healthRatio}%` : '--')}</strong>
                <small>{dashboard ? `${dashboard.summary.healthyServices}/${dashboard.summary.totalServices} 项正常` : '等待数据'}</small>
                {healthRatio < 100 ? (
                  <small className="openclaw-stat-action">点击修复</small>
                ) : null}
              </article>
              <article
                className={`openclaw-stat-card tone-${statCardTones.gateway} ${gatewayRestarting ? 'is-loading' : ''}`}
                onClick={() => {
                  if (!gatewayRestarting && dashboard?.runtime.gatewayListening) {
                    setGatewayRestarting(true);
                    openclawService.runAction('openclaw-gateway', 'restart').then(() => {
                      loadDashboard(false);
                    }).finally(() => {
                      setGatewayRestarting(false);
                    });
                  }
                }}
                style={{ cursor: dashboard?.runtime.gatewayListening ? 'pointer' : 'default' }}
                title={dashboard?.runtime.gatewayListening ? '点击重启网关' : '网关离线中'}
              >
                <span>网关</span>
                <strong>{gatewayRestarting ? '重启中...' : (dashboard?.runtime.gatewayListening ? '在线' : '离线')}</strong>
                <small>{dashboard?.runtime.dashboardUrl || '等待数据'}</small>
                {dashboard?.runtime.gatewayListening ? (
                  <small className="openclaw-stat-action">点击重启</small>
                ) : null}
              </article>
              <article className={`openclaw-stat-card tone-${statCardTones.environment}`}>
                <span>运行环境</span>
                <strong>{dashboard?.environment.platform || '--'}</strong>
                <small>{dashboard?.environment.hostname || '本机'}</small>
                {dashboard?.environment.openclawVersion ? (
                  <small className="openclaw-version-tag">OpenClaw {dashboard.environment.openclawVersion}</small>
                ) : null}
              </article>
            </section>
            </>
            : null}

            {!isAgentFocusedView ? <section className="openclaw-section openclaw-command-bridge">
              <div className="openclaw-section-head">
                <div>
                  <p className="openclaw-section-kicker"><SendHorizontal size={16} /> 指挥席</p>
                  <h2>当前重点助理</h2>
                </div>
                <small>上次同步：{formatDateTime(dashboard?.generatedAt)}</small>
              </div>
                <div className="openclaw-command-bridge-grid">
                  <div className="openclaw-command-bridge-primary">
                  <strong>{selectedAgent ? (selectedAgent.emoji ? `${selectedAgent.emoji} ${getPreferredName(selectedAgent)}` : getPreferredName(selectedAgent)) : '未选择助理'}</strong>
                  <p>{selectedAgent ? agentStatusLabel[selectedAgent.status] : '先从左侧菜单选择功能，再选中助理。'}</p>
                  <small>{selectedAgent ? `${getRoleName(selectedAgent)} · ${selectedAgentEffective?.model || selectedAgent.model} · 最近 ${formatAge(selectedAgent.latestAgeMs)}` : '当前没有可用助理数据。'}</small>
                  </div>
                <div className="openclaw-command-bridge-meta">
                  <span>会话 {selectedAgent?.sessionCount ?? '--'}</span>
                  <span>Token {selectedAgent?.latestTokens ?? '--'}</span>
                  <span>{selectedAgent ? (selectedAgentEffective?.workspace || selectedAgent.workspace) : '暂无工作区'}</span>
                </div>
                <div className="openclaw-command-bridge-actions">
                  <button
                    className="openclaw-primary-btn"
                    onClick={() => {
                      if (!selectedAgent) return;
                      openStudioForAgent(selectedAgent.id);
                    }}
                    disabled={!selectedAgent}
                  >
                    立即派单
                  </button>
                  <button className="openclaw-secondary-btn" onClick={() => setActiveSection('agents')}>
                    查看所有助理
                  </button>
                </div>
              </div>
            </section> : null}

            {activeSection === 'overview' ? (
              <>
                <section className="openclaw-two-column openclaw-top-grid">
                  <article className="openclaw-section">
                    <div className="openclaw-section-head">
                      <div>
                        <p className="openclaw-section-kicker"><ShieldCheck size={16} /> 运行时</p>
                        <h2>健康总览</h2>
                      </div>
                      <div className="openclaw-inline-actions">
                        {!dashboard?.runtime.watchdogLoaded ? (
                          <button
                            className="openclaw-action-btn"
                            onClick={() => handleRuntimeAction('repair-watchdog')}
                            disabled={runningRuntimeAction === 'repair-watchdog'}
                          >
                            {runningRuntimeAction === 'repair-watchdog' ? '修复中...' : '尝试修复 watchdog'}
                          </button>
                        ) : null}
                        <small>关注网关、守护进程、状态目录和活跃助理。</small>
                      </div>
                    </div>
                    <div className="openclaw-runtime-grid">
                      {runtimeCards.map((card) => (
                        <div className={`openclaw-runtime-card ${card.ok ? 'is-ok' : 'is-off'}`} key={card.id}>
                          <span className="openclaw-runtime-dot" />
                          <strong>{card.title}</strong>
                          <p>{card.value}</p>
                          <small>{card.meta}</small>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="openclaw-section">
                    <div className="openclaw-section-head">
                      <div>
                        <p className="openclaw-section-kicker"><Bot size={16} /> 前线助理</p>
                        <h2>高优先级观察</h2>
                      </div>
                      <small>优先显示工作中和最近有活动的助理。</small>
                    </div>
                    <div className="openclaw-spotlight-list">
                      {spotlightAgents.map((agent) => {
                        const analytics = agentAnalytics.get(agent.id);
                        return (
                        <button
                          key={agent.id}
                          type="button"
                          className={`openclaw-spotlight-item tone-${agent.tone}`}
                          onClick={() => openStudioForAgent(agent.id)}
                        >
                          <strong>{agent.emoji ? `${agent.emoji} ${getPreferredName(agent)}` : getPreferredName(agent)}</strong>
                          <span>{agentStatusLabel[agent.status]} · {formatAge(agent.latestAgeMs)}</span>
                          <small>{agent.latestSessionKey || agent.workspace}</small>
                          <div className="openclaw-mini-analytics">
                            <span>热度 {analytics?.heatScore ?? 0}</span>
                            <span>P99 {analytics?.latencyP99 ? `${analytics.latencyP99}ms` : '--'}</span>
                          </div>
                        </button>
                        );
                      })}
                    </div>
                  </article>
                </section>

                <section className="openclaw-section">
                  <div className="openclaw-section-head">
                    <div>
                      <p className="openclaw-section-kicker"><Zap size={16} /> 快捷操作</p>
                      <h2>常用入口</h2>
                    </div>
                  </div>
                  <div className="openclaw-shortcut-list">
                    {dashboard?.shortcuts.map((shortcut) => (
                      <button
                        key={shortcut.id}
                        className="openclaw-shortcut-btn"
                        onClick={() => handleShortcut(shortcut.kind, shortcut.target)}
                      >
                        <strong>{shortcut.label}</strong>
                        <span>{shortcut.description}</span>
                        <small>{shortcut.target}</small>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

            {activeSection === 'agents' ? (
              <section className="openclaw-section">
                <div className="openclaw-section-head">
                  <div>
                    <p className="openclaw-section-kicker"><Bot size={16} /> 助理</p>
                    <h2>助理工作状态</h2>
                  </div>
                  <small>点击助理卡片弹出配置页；点击下发任务会弹出独立对话窗口。</small>
                </div>
                <div className="openclaw-agent-toolbar">
                  <label className="openclaw-agent-toolbar-field">
                    <span>排序模式</span>
                    <select
                      className="openclaw-input"
                      value={agentViewSort}
                      onChange={(event) => setAgentViewSort(event.target.value as 'heat' | 'status' | 'name')}
                    >
                      <option value="heat">按繁忙热度</option>
                      <option value="status">按状态优先级</option>
                      <option value="name">按名称</option>
                    </select>
                  </label>
                  <label className="openclaw-agent-toolbar-field">
                    <span>P99 告警阈值（ms）</span>
                    <input
                      className="openclaw-input"
                      type="number"
                      min={500}
                      step={100}
                      value={latencyAlertThreshold}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        if (!Number.isFinite(nextValue)) return;
                        setLatencyAlertThreshold(Math.max(500, Math.round(nextValue)));
                      }}
                    />
                  </label>
                  <label className="openclaw-agent-filter-toggle">
                    <input
                      type="checkbox"
                      checked={collapseIdleAgents}
                      onChange={(event) => setCollapseIdleAgents(event.target.checked)}
                    />
                    折叠空闲助理
                  </label>
                </div>
                {loadBalancingAlerts.length ? (
                  <div className="openclaw-alert-grid">
                    {loadBalancingAlerts.map((alert) => (
                      <article className="openclaw-alert-card" key={`alert-${alert.agent.id}`}>
                        <div>
                          <strong>
                            {alert.agent.emoji ? `${alert.agent.emoji} ${getPreferredName(alert.agent)}` : getPreferredName(alert.agent)}
                          </strong>
                          <p>
                            P99 {alert.analytics?.latencyP99 ? `${alert.analytics.latencyP99}ms` : '--'} · 热度 {alert.analytics?.heatScore ?? 0}/100
                          </p>
                          <small>建议将非核心任务分流到同模型家族（{alert.sourceFamily.toUpperCase()}）空闲助理。</small>
                        </div>
                        <div className="openclaw-alert-actions">
                          {alert.targets.length ? alert.targets.map(({ agent: target }) => (
                            <button
                              key={`shift-${alert.agent.id}-${target.id}`}
                              type="button"
                              className="openclaw-inline-toggle"
                              onClick={() => openStudioForAgent(
                                target.id,
                                `请接管来自 ${getPreferredName(alert.agent)} 的非核心任务，并汇总执行进度。`,
                              )}
                            >
                              分流到 {getPreferredName(target)}
                            </button>
                          )) : (
                            <span className="openclaw-alert-empty">暂无同模型空闲助理可分流</span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
                <div className="openclaw-commander-grid">
                  <article className="openclaw-commander-card">
                    <div className="openclaw-commander-head">
                      <strong>指挥官视图</strong>
                      <span>同步率 {commanderInsights.syncRate}%</span>
                    </div>
                    <div className="openclaw-commander-matrix">
                      <div className="openclaw-commander-kpi">
                        <span>同步助理</span>
                        <strong>{commanderInsights.syncedAgents}/{commanderInsights.totalAgents || 0}</strong>
                      </div>
                      <div className="openclaw-commander-kpi">
                        <span>24h 总 Token</span>
                        <strong>{commanderInsights.totalToken24h || '--'}</strong>
                      </div>
                    </div>
                    <div className="openclaw-wave-stack">
                      <div className="openclaw-wave-panel">
                        <span>Token 聚合曲线（24h）</span>
                        <svg viewBox="0 0 180 44" preserveAspectRatio="none" aria-hidden="true">
                          <polyline points={seriesToPoints(commanderInsights.tokenBuckets)} />
                        </svg>
                      </div>
                      <div className="openclaw-wave-panel">
                        <span>延迟趋势（24h）</span>
                        <svg viewBox="0 0 180 44" preserveAspectRatio="none" aria-hidden="true">
                          <polyline points={seriesToPoints(commanderInsights.latencyTrend)} />
                        </svg>
                      </div>
                    </div>
                  </article>
                  <article className="openclaw-commander-card">
                    <div className="openclaw-commander-head">
                      <strong>通讯链路</strong>
                      <span>{commanderInsights.commLinks.length} 条在线联动</span>
                    </div>
                    <div className="openclaw-comms-links">
                      {commanderInsights.commLinks.length ? commanderInsights.commLinks.map((link) => (
                        <div key={link.id} className="openclaw-comms-link">
                          <span>{link.from}</span>
                          <i />
                          <strong>{link.to}</strong>
                        </div>
                      )) : <div className="openclaw-empty">当前没有活跃联动链路。</div>}
                    </div>
                  </article>
                </div>
                <div className="openclaw-agent-grid">
                  {visibleAgents.map((agent) => {
                    const analytics = agentAnalytics.get(agent.id);
                    const tokenSeries = analytics?.tokenSeries || [];
                    const latencySeries = analytics?.latencySeries || [];
                    const hasLatencyWave = latencySeries.length > 0;
                    const hasTokenWave = tokenSeries.length > 0;
                    const hasWaveData = hasLatencyWave || hasTokenWave;
                    const loadScore = analytics?.heatScore ?? 0;
                    const effectiveMeta = getAgentEffectiveMeta(agent);
                    const latestRun = latestRunByAgent.get(agent.id);
                    const latestReplyPreview = compactText(latestRun?.reply || latestRun?.summary, 88) || '暂无最近回复';
                    const quickDispatchTasks = effectiveMeta.quickTasks.slice(0, 3);
                    const latencyAlert = (analytics?.latencyP99 || 0) >= latencyAlertThreshold;
                    const latencyWarning = (analytics?.latencyP99 || 0) >= Math.max(1200, Math.round(latencyAlertThreshold * 0.6));
                    const heatAlert = loadScore >= 90;
                    const heatWarning = loadScore >= 80;
                    const latencyToneClass = latencyAlert ? 'critical' : latencyWarning ? 'warning' : 'healthy';
                    const heatToneClass = heatAlert ? 'critical' : heatWarning ? 'warning' : 'healthy';
                    const latestSession = agent.latestSessionKey || '暂无最近会话';
                    const providerModel = `${effectiveMeta.provider} · ${agent.latestModel || effectiveMeta.model}`;
                    const glyphHue = 180 + (textHash(agent.id) % 160);
                    const glyphStyle = { ['--glyph-hue' as const]: `${glyphHue}deg` } as React.CSSProperties;
                    const energyStyle = { ['--load' as const]: `${loadScore}` } as React.CSSProperties;
                    const agentRoleName = getRoleName(agent);
                    const agentNickname = getNickname(agent);
                    return (
                      <article
                        key={agent.id}
                        className={`openclaw-agent-card tone-${agent.tone} ${selectedAgentId === agent.id ? 'is-selected' : ''} ${effectiveMeta.disabled ? 'is-disabled' : ''} ${latencyAlert ? 'is-glitch' : ''} latency-${latencyToneClass} heat-${heatToneClass}`}
                        onClick={() => openAgentConfigModal(agent.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openAgentConfigModal(agent.id);
                          }
                        }}
                      >
                        <header>
                          <div className="openclaw-agent-identity">
                            <span className="openclaw-agent-glyph" style={glyphStyle}>
                              {getAgentGlyph(agent.id, agent.displayName, agent.emoji)}
                            </span>
                            <div>
                              <p>{agentRoleName}</p>
                              <h3>{agentNickname}</h3>
                            </div>
                          </div>
                          <div className="openclaw-agent-status-matrix">
                            <span className={`openclaw-status-ring status-${agent.status}`} />
                            <span className={`openclaw-status-pill status-${agent.status}`}>{agentStatusLabel[agent.status]}</span>
                            <small>{formatAge(agent.latestAgeMs)}</small>
                            <div className="openclaw-agent-card-actions is-top">
                              <button
                                type="button"
                                className="openclaw-mini-btn"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  openAgentConfigModal(agent.id);
                                }}
                              >
                                配置
                              </button>
                              <button
                                type="button"
                                className="openclaw-mini-btn is-primary"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  openStudioForAgent(agent.id);
                                }}
                                disabled={effectiveMeta.disabled}
                              >
                                {effectiveMeta.disabled ? '已禁用' : '下发任务'}
                              </button>
                            </div>
                          </div>
                        </header>
                        <div className="openclaw-agent-kpi-row">
                          <span className="openclaw-agent-kpi-pill">活跃会话 {agent.activeSessionCount}</span>
                          <span className="openclaw-agent-kpi-pill">最近 {formatAge(agent.latestAgeMs)}</span>
                          <span className="openclaw-agent-kpi-pill">24h 调用 {analytics?.runCount24h ?? 0}</span>
                        </div>
                        <div className="openclaw-agent-heat">
                          <div className="openclaw-agent-energy-ring" style={energyStyle}>
                            <strong>{loadScore}%</strong>
                            <span>负载</span>
                          </div>
                          <div className="openclaw-agent-heat-bar">
                            <span style={{ width: `${loadScore}%` }} />
                          </div>
                          <small>繁忙热度 {loadScore}/100</small>
                        </div>
                        <div className="openclaw-agent-meta-grid">
                          <div>
                            <span>模型</span>
                            <strong>{effectiveMeta.model}</strong>
                          </div>
                          <div>
                            <span>最近工作</span>
                            <strong>{formatAge(agent.latestAgeMs)}</strong>
                          </div>
                          <div>
                            <span>会话数</span>
                            <strong>{agent.sessionCount}</strong>
                          </div>
                          <div>
                            <span>P99 延迟</span>
                            <strong className={`openclaw-agent-latency-value tone-${latencyToneClass}`}>{analytics?.latencyP99 ? `${analytics.latencyP99}ms` : '--'}</strong>
                          </div>
                        </div>
                        <div className="openclaw-agent-task-section">
                          <div className="openclaw-agent-task-current">
                            <span>🕐 正在执行 / 最近任务</span>
                            <strong title={latestRun?.message}>{compactText(latestRun?.message || '暂无执行记录', 120) || '暂无执行记录'}</strong>
                          </div>
                          {(() => {
                            const jobs = cronJobsByAgent.get(agent.id) || [];
                            const pending = jobs.filter((j: any) => j.enabled && j.nextRunAtMs && j.nextRunAtMs > Date.now());
                            const upcoming = pending.slice(0, 5);
                            if (!upcoming.length) return null;
                            return (
                              <div className="openclaw-agent-task-queue">
                                <span>📋 待执行任务队列（{pending.length} 条）</span>
                                {upcoming.map((job: any) => (
                                  <div key={job.id} className="openclaw-agent-task-queue-item">
                                    <strong>{compactText(job.name || job.id, 30)}</strong>
                                    <small>{job.schedule}</small>
                                  </div>
                                ))}
                                {pending.length > 5 ? (
                                  <small className="openclaw-agent-task-queue-more">还有 {pending.length - 5} 条任务…</small>
                                ) : null}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="openclaw-agent-meta-inline">
                          <span title={latestSession}>会话：{compactText(latestSession, 28) || '--'}</span>
                          <span title={providerModel}>模型链路：{compactText(providerModel, 34) || '--'}</span>
                        </div>
                        <details
                          className="openclaw-agent-debug-details"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <summary>展开调试信息</summary>
                          <div className="openclaw-agent-debug-grid">
                            <span title={latestSession}>内部会话键：{latestSession}</span>
                            <span title={effectiveMeta.workspace}>工作区：{effectiveMeta.workspace}</span>
                            <span title={effectiveMeta.routes.join(', ')}>路由：{effectiveMeta.routes.length ? effectiveMeta.routes.join(', ') : '--'}</span>
                            {effectiveMeta.disabled ? <span>任务下发：已禁用</span> : null}
                          </div>
                        </details>
                        {quickDispatchTasks.length ? (
                          <div className="openclaw-agent-quick-dispatch">
                            {quickDispatchTasks.map((task) => (
                              <button
                                key={`${agent.id}-quick-${task}`}
                                type="button"
                                className="openclaw-inline-toggle"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  openStudioForAgent(agent.id, task);
                                }}
                                disabled={effectiveMeta.disabled}
                              >
                                {compactText(task, 22)}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {activeSection === 'agents' && agentConfigModalOpen && agentConfigTarget ? (
              <div
                className="openclaw-agent-config-modal-backdrop"
                onClick={() => setAgentConfigModalOpen(false)}
              >
                <section
                  className="openclaw-agent-config-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-label="助理配置页"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="openclaw-agent-config-modal-head">
                    <div>
                      <p className="openclaw-section-kicker"><Bot size={16} /> 助理配置页</p>
                      <h2>{agentConfigTarget.emoji ? `${agentConfigTarget.emoji} ${getPreferredName(agentConfigTarget)}` : getPreferredName(agentConfigTarget)}</h2>
                      <small>{getRoleName(agentConfigTarget)}（岗位） · {getNickname(agentConfigTarget)}（昵称） · {agentConfigTarget.model}</small>
                    </div>
                    <button
                      type="button"
                      className="openclaw-inline-toggle"
                      onClick={() => setAgentConfigModalOpen(false)}
                    >
                      关闭
                    </button>
                  </div>
                  <div className="openclaw-agent-config-mode-switch">
                    <small>默认只展示新手必填项；复杂参数已收纳到“高级选项（极客模式）”。</small>
                  </div>
                  <div className="openclaw-agent-config-layout">
                    <div className="openclaw-agent-config-main">
                      <div className="openclaw-agent-config-modal-grid">
                        <label className="openclaw-agent-config-field">
                          <span>岗位名称（英文）</span>
                          <input
                            className="openclaw-input"
                            placeholder="例如：MAIN / COMMUNITY / CANMOU"
                            value={agentConfigRoleName}
                            onChange={(event) => {
                              setAgentConfigRoleName(event.target.value);
                              setAgentConfigDirty(true);
                            }}
                          />
                        </label>
                        <label className="openclaw-agent-config-field">
                          <span>给助理起个名字（中文昵称）</span>
                          <input
                            className="openclaw-input"
                            placeholder="例如：椒盐逼疯龙虾"
                            value={agentConfigName}
                            onChange={(event) => {
                              setAgentConfigName(event.target.value);
                              setAgentConfigDirty(true);
                            }}
                          />
                          {agentConfigRoleName.trim()
                          && agentConfigName.trim()
                          && agentConfigRoleName.trim().toLowerCase() === agentConfigName.trim().toLowerCase() ? (
                            <small className="openclaw-token-hint">建议中文昵称与英文岗位名区分开，便于运营识别。</small>
                          ) : null}
                        </label>
                        <label className="openclaw-agent-config-field">
                          <span>选择一个专属表情包</span>
                          <input
                            className="openclaw-input"
                            placeholder="例如：🦞"
                            value={agentConfigEmoji}
                            onChange={(event) => {
                              setAgentConfigEmoji(event.target.value);
                              setAgentConfigDirty(true);
                            }}
                          />
                          <div className="openclaw-model-quick-list">
                            {EMOJI_PRESETS.map((emoji) => (
                              <button
                                key={`emoji-${emoji}`}
                                type="button"
                                className={`openclaw-inline-toggle ${agentConfigEmoji === emoji ? 'is-active' : ''}`}
                                onClick={() => {
                                  setAgentConfigEmoji(emoji);
                                  setAgentConfigDirty(true);
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </label>
                        <label className="openclaw-agent-config-field">
                          <span>关联 Telegram Bot</span>
                          <select
                            className="openclaw-input"
                            value={agentConfigTelegramBot}
                            onChange={(event) => {
                              setAgentConfigTelegramBot(event.target.value);
                              setAgentConfigDirty(true);
                            }}
                          >
                            <option value="">不关联</option>
                            {Object.entries(telegramBots).map(([token, bot]) => (
                              <option key={token} value={token}>
                                {(bot as TelegramBotConfig).name || token} ({(bot as TelegramBotConfig).enabled ? '已启用' : '已禁用'})
                              </option>
                            ))}
                          </select>
                          <small>选择该助理对应的 Telegram Bot，不选则不关联</small>
                        </label>
                        <div className="openclaw-agent-config-field openclaw-agent-config-field-wide">
                          <span>选择 AI 的聪明程度</span>
                          <div className="openclaw-agent-model-switch-row">
                            <select
                              className="openclaw-input"
                              value={agentModelSelection}
                              onChange={(event) => {
                                setAgentModelSelection(event.target.value);
                                setAgentModelDiagnosis(null);
                              }}
                              disabled={agentModelLoading || agentModelSwitching}
                            >
                              {(configAgentModelSnapshot?.models || []).map((model, index) => (
                                <option key={`${agentConfigTarget.id}-${model.key}`} value={model.key} title={model.name || model.key}>
                                  {getFriendlyModelLabel(model.name || model.key, index)}
                                </option>
                              ))}
                              {!configAgentModelSnapshot?.models.length ? <option value="">暂无可用模型</option> : null}
                            </select>
                            <button
                              type="button"
                              className="openclaw-action-btn"
                              onClick={() => void loadAgentModels(agentConfigTarget.id, true)}
                              disabled={agentModelLoading || agentModelSwitching}
                            >
                              {agentModelLoading ? '读取中...' : '刷新模型'}
                            </button>
                            <button
                              type="button"
                              className="openclaw-primary-btn"
                              onClick={() => void handleSwitchAgentModel(agentConfigTarget.id)}
                              disabled={agentModelLoading || agentModelSwitching || agentModelDiagnosing || !agentModelSelection}
                            >
                              {agentModelSwitching ? '切换中...' : '应用模型'}
                            </button>
                            <button
                              type="button"
                              className="openclaw-action-btn"
                              onClick={() => void handleDiagnoseAgentModel(agentConfigTarget.id)}
                              disabled={agentModelLoading || agentModelSwitching || agentModelDiagnosing || !agentModelSelection}
                            >
                              {agentModelDiagnosing ? '诊断中...' : '连接检测'}
                            </button>
                          </div>
                          <small>
                            当前引擎：{normalizeModelLabel(pickSnapshotModel(configAgentModelSnapshot) || agentConfigTarget.model || '未知')}
                            {configAgentModelSnapshot?.consoleOverrideModel ? '（已写入助理覆盖）' : ''}
                          </small>
                          {agentModelLoadError ? (
                            <article className="openclaw-model-guidance">
                              <strong>模型还没有连通成功</strong>
                              <p>{friendlyModelError || '请检查模型密钥与网关连接。'}</p>
                              <div className="openclaw-model-guidance-actions">
                                <button
                                  type="button"
                                  className="openclaw-inline-toggle"
                                  onClick={() => {
                                    setAgentConfigModalOpen(false);
                                    openNativeModule('config');
                                  }}
                                >
                                  去配置模型密钥
                                </button>
                                <button
                                  type="button"
                                  className="openclaw-inline-toggle"
                                  disabled={!recommendedModelKey || agentModelSwitching || agentModelLoading}
                                  onClick={() => {
                                    if (!recommendedModelKey) return;
                                    setAgentModelSelection(recommendedModelKey);
                                    void handleSwitchAgentModel(agentConfigTarget.id, recommendedModelKey);
                                  }}
                                >
                                  一键切到可用模型
                                </button>
                              </div>
                              <small>原始错误：{compactText(agentModelLoadError, 140)}</small>
                            </article>
                          ) : null}
                          {agentModelDiagnosis ? (
                            <article className={`openclaw-model-diagnosis tone-${agentModelDiagnosis.tone}`}>
                              <strong>{agentModelDiagnosis.title}</strong>
                              <small>{formatDateTime(agentModelDiagnosis.checkedAt)}</small>
                              <div>
                                {agentModelDiagnosis.details.map((line) => (
                                  <p key={`diag-${line}`}>{line}</p>
                                ))}
                              </div>
                            </article>
                          ) : null}
                        </div>
                        <label className="openclaw-agent-config-field openclaw-agent-config-field-wide">
                          <span>设定助理的性格与工作职责</span>
                          <textarea
                            className="openclaw-textarea openclaw-agent-config-textarea"
                            placeholder="请描述希望它怎么帮您。例如：你是一位专业心理咨询师，请用温柔耐心的语气回答。"
                            value={agentConfigCorePrompt}
                            onChange={(event) => {
                              setAgentConfigCorePrompt(event.target.value);
                              setAgentConfigPromptPrefix(event.target.value);
                              setAgentConfigDefaultTemplate('');
                              setAgentConfigPromptSuffix('');
                              setAgentConfigDirty(true);
                            }}
                          />
                          <small>这一项会直接作为默认系统指令，适合新手快速上手。</small>
                        </label>
                        <div className="openclaw-agent-config-field openclaw-agent-config-field-wide">
                          <span>灵感模板库（做选择题，不用从零写）</span>
                          <div className="openclaw-agent-config-helper-row is-basic">
                            <select
                              className="openclaw-input"
                              value={selectedRolePresetId}
                              onChange={(event) => setSelectedRolePresetId(event.target.value)}
                            >
                              {ROLE_PRESETS.map((preset) => (
                                <option key={preset.id} value={preset.id}>
                                  {preset.label} · {preset.description}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="openclaw-action-btn"
                              onClick={() => applyRolePreset(selectedRolePresetId)}
                            >
                              一键套用模板
                            </button>
                          </div>
                        </div>
                        {agentConfigAdvancedOpen ? (
                          <>
                            <div className="openclaw-agent-config-field openclaw-agent-config-field-wide">
                              <button
                                type="button"
                                className="openclaw-inline-toggle"
                                onClick={() => setAgentConfigAdvancedOpen(false)}
                              >
                                收起高级选项
                              </button>
                            </div>
                            <label className="openclaw-agent-config-field">
                              <span>优先级（数字，越小越优先）</span>
                              <input
                                className="openclaw-input"
                                placeholder="例如：1"
                                value={agentConfigPriority}
                                onChange={(event) => {
                                  setAgentConfigPriority(event.target.value);
                                  setAgentConfigDirty(true);
                                }}
                              />
                            </label>
                            <label className="openclaw-agent-config-field">
                              <span>默认思考级别</span>
                              <select
                                className="openclaw-input"
                                value={agentConfigThinking}
                                onChange={(event) => {
                                  setAgentConfigThinking(event.target.value as 'minimal' | 'low' | 'medium' | 'high');
                                  setAgentConfigDirty(true);
                                }}
                              >
                                <option value="minimal">最少</option>
                                <option value="low">低</option>
                                <option value="medium">中（默认）</option>
                                <option value="high">高</option>
                              </select>
                            </label>
                            <label className="openclaw-agent-config-field">
                              <span>模型标签覆盖</span>
                              <input
                                className="openclaw-input"
                                placeholder="例如：minimax-portal/MiniMax-M2.5-highspeed"
                                value={agentConfigModelOverride}
                                onChange={(event) => {
                                  setAgentConfigModelOverride(event.target.value);
                                  setAgentConfigDirty(true);
                                }}
                              />
                            </label>
                            <label className="openclaw-agent-config-field">
                              <span>提供方标签覆盖</span>
                              <input
                                className="openclaw-input"
                                placeholder="例如：minimax-portal"
                                value={agentConfigProviderOverride}
                                onChange={(event) => {
                                  setAgentConfigProviderOverride(event.target.value);
                                  setAgentConfigDirty(true);
                                }}
                              />
                            </label>
                            <label className="openclaw-agent-config-field">
                              <span>工作区覆盖</span>
                              <input
                                className="openclaw-input"
                                placeholder="例如：/Users/rock/.openclaw/workspace"
                                value={agentConfigWorkspaceOverride}
                                onChange={(event) => {
                                  setAgentConfigWorkspaceOverride(event.target.value);
                                  setAgentConfigDirty(true);
                                }}
                              />
                            </label>
                            <label className="openclaw-agent-config-field">
                              <span>路由覆盖（逗号分隔）</span>
                              <input
                                className="openclaw-input"
                                placeholder="例如：cron, scheduler, social"
                                value={agentConfigRoutesOverride}
                                onChange={(event) => {
                                  setAgentConfigRoutesOverride(event.target.value);
                                  setAgentConfigDirty(true);
                                }}
                              />
                            </label>
                            <div className="openclaw-agent-config-field openclaw-agent-config-field-wide">
                              <span>提示词工程面板（变量注入 + Token 估算）</span>
                              <div className="openclaw-agent-config-helper-row">
                                <select
                                  className="openclaw-input"
                                  value={promptInsertTarget}
                                  onChange={(event) => setPromptInsertTarget(event.target.value as PromptInsertTarget)}
                                >
                                  <option value="defaultTemplate">插入到任务模板</option>
                                  <option value="promptPrefix">插入到指令前缀</option>
                                  <option value="promptSuffix">插入到指令后缀</option>
                                </select>
                                <select
                                  className="openclaw-input"
                                  value={promptVariableSelection}
                                  onChange={(event) => setPromptVariableSelection(event.target.value)}
                                >
                                  {PROMPT_VARIABLES.map((item) => (
                                    <option key={item.token} value={item.token}>{item.label} · {item.token}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  className="openclaw-action-btn"
                                  onClick={() => insertPromptVariable(promptVariableSelection)}
                                >
                                  插入变量
                                </button>
                                <small>预估总 Token：~{promptTokenTotal}</small>
                              </div>
                              <div className="openclaw-model-quick-list">
                                {PROMPT_VARIABLES.map((item) => (
                                  <button
                                    key={`prompt-var-${item.token}`}
                                    type="button"
                                    className="openclaw-inline-toggle"
                                    onClick={() => insertPromptVariable(item.token)}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <label className="openclaw-agent-config-field openclaw-agent-config-field-wide">
                              <span>任务模板（高级）</span>
                              <textarea
                                ref={agentDefaultTemplateRef}
                                className="openclaw-textarea openclaw-agent-config-textarea"
                                placeholder="例如：先总结今天全部任务状态，再给出优先级建议。"
                                value={agentConfigDefaultTemplate}
                                onChange={(event) => {
                                  setAgentConfigDefaultTemplate(event.target.value);
                                  setAgentConfigDirty(true);
                                }}
                              />
                              <small className="openclaw-token-hint">预估 Token：~{promptTokenEstimates.defaultTemplate}</small>
                            </label>
                            <label className="openclaw-agent-config-field openclaw-agent-config-field-wide">
                              <span>指令前缀（高级）</span>
                              <textarea
                                ref={agentPromptPrefixRef}
                                className="openclaw-textarea openclaw-agent-config-textarea"
                                placeholder="例如：你是该助理的值班模式，请用简体中文回答。"
                                value={agentConfigPromptPrefix}
                                onChange={(event) => {
                                  setAgentConfigPromptPrefix(event.target.value);
                                  setAgentConfigCorePrompt(event.target.value);
                                  setAgentConfigDirty(true);
                                }}
                              />
                              <small className="openclaw-token-hint">预估 Token：~{promptTokenEstimates.promptPrefix}</small>
                            </label>
                            <label className="openclaw-agent-config-field openclaw-agent-config-field-wide">
                              <span>指令后缀（高级）</span>
                              <textarea
                                ref={agentPromptSuffixRef}
                                className="openclaw-textarea openclaw-agent-config-textarea"
                                placeholder="例如：输出请分为「结论 / 风险 / 下一步」三段。"
                                value={agentConfigPromptSuffix}
                                onChange={(event) => {
                                  setAgentConfigPromptSuffix(event.target.value);
                                  setAgentConfigDirty(true);
                                }}
                              />
                              <small className="openclaw-token-hint">预估 Token：~{promptTokenEstimates.promptSuffix}</small>
                            </label>
                            <label className="openclaw-agent-config-field openclaw-agent-config-field-wide">
                              <span>快捷指令列表（每行一条）</span>
                              <textarea
                                className="openclaw-textarea openclaw-agent-config-textarea"
                                placeholder="例如：\\n总结今日运行状态\\n列出失败任务和原因\\n给出修复优先级"
                                value={agentConfigQuickTasks}
                                onChange={(event) => {
                                  setAgentConfigQuickTasks(event.target.value);
                                  setAgentConfigDirty(true);
                                }}
                              />
                            </label>
                            <div className="openclaw-agent-config-field openclaw-agent-config-field-checkbox">
                              <span>默认延续最近会话</span>
                              <label className="openclaw-checkbox">
                                <input
                                  type="checkbox"
                                  checked={agentConfigReuseSession}
                                  onChange={(event) => {
                                    setAgentConfigReuseSession(event.target.checked);
                                    setAgentConfigDirty(true);
                                  }}
                                />
                                勾选后，下发任务默认复用最近会话
                              </label>
                            </div>
                            <div className="openclaw-agent-config-field openclaw-agent-config-field-checkbox">
                              <span>禁用该助理任务下发</span>
                              <label className="openclaw-checkbox">
                                <input
                                  type="checkbox"
                                  checked={agentConfigDisabled}
                                  onChange={(event) => {
                                    setAgentConfigDisabled(event.target.checked);
                                    setAgentConfigDirty(true);
                                  }}
                                />
                                勾选后，助理卡片仍可查看状态，但无法下发任务
                              </label>
                            </div>
                            <label className="openclaw-agent-config-field openclaw-agent-config-field-wide">
                              <span>扩展配置 JSON（高级）</span>
                              <textarea
                                className={`openclaw-textarea openclaw-agent-config-textarea ${agentConfigExtraJsonError ? 'is-invalid' : ''}`}
                                placeholder='例如：{"customTag":"night-shift","maxParallelTasks":2}'
                                value={agentConfigExtraJson}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  setAgentConfigExtraJson(nextValue);
                                  setAgentConfigExtraJsonError(validateAgentExtraJson(nextValue));
                                  setAgentConfigDirty(true);
                                }}
                              />
                              {agentConfigExtraJsonError ? <small className="openclaw-error-inline">{agentConfigExtraJsonError}</small> : null}
                            </label>
                          </>
                        ) : (
                          <div className="openclaw-agent-config-field openclaw-agent-config-field-wide">
                            <button
                              type="button"
                              className="openclaw-inline-toggle"
                              onClick={() => setAgentConfigAdvancedOpen(true)}
                            >
                              ⚙️ 高级选项（极客模式）
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="openclaw-guidance">
                        <p>工作区：{agentConfigTarget.workspace}</p>
                        <p>最近会话：{agentConfigTarget.latestSessionId || '无'} · {formatAge(agentConfigTarget.latestAgeMs)}</p>
                        <p>配置保存路径：{configPath || dashboard?.configPath || 'openclaw.config.json'}</p>
                      </div>
                    </div>
                    <aside className="openclaw-agent-config-sandbox">
                      <div className="openclaw-section-head">
                        <div>
                          <p className="openclaw-section-kicker"><SendHorizontal size={16} /> 沙盒预览</p>
                          <h3>配置效果即时测试</h3>
                        </div>
                        <small>{configSandboxStartedAt ? formatDateTime(configSandboxStartedAt) : '随改随测'}</small>
                      </div>
                      <textarea
                        className="openclaw-textarea openclaw-agent-config-textarea"
                        placeholder="在这里输入一条测试任务，右侧会直接返回助理回复。"
                        value={configSandboxMessage}
                        onChange={(event) => setConfigSandboxMessage(event.target.value)}
                      />
                      <button
                        type="button"
                        className="openclaw-primary-btn"
                        onClick={() => void handleConfigSandboxRun()}
                        disabled={configSandboxLoading || !configSandboxMessage.trim()}
                      >
                        {configSandboxLoading ? '测试中...' : '发送测试'}
                      </button>
                      <div className="openclaw-agent-config-sandbox-output">
                        <pre className="openclaw-log-box">
                          {configSandboxReply
                            || (configSandboxLoading ? '正在等待回复...' : configSandboxLastRun?.reply || '这里显示最新测试回复。')}
                        </pre>
                        {configSandboxError ? <small className="openclaw-error-inline">{configSandboxError}</small> : null}
                        {configSandboxLastRun ? (
                          <div className="openclaw-meta">
                            <span>{configSandboxLastRun.model || '未知模型'} · {configSandboxLastRun.provider || '未知提供方'}</span>
                            <span>{configSandboxLastRun.durationMs ?? '--'}ms · 总计 {configSandboxLastRun.usage.total ?? '--'} Token</span>
                          </div>
                        ) : null}
                      </div>
                    </aside>
                  </div>
                  <div className="openclaw-agent-config-modal-actions">
                    {agentConfigNotice ? (
                      <p className={`openclaw-agent-config-notice tone-${agentConfigNotice.tone}`}>
                        {agentConfigNotice.message}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className="openclaw-primary-btn"
                      onClick={() => handleSaveAgentConfig(false, false)}
                      disabled={agentConfigSaving || configLoading || !agentConfigTargetId || Boolean(agentConfigExtraJsonError)}
                    >
                      {agentConfigSaving ? '保存中...' : '保存配置'}
                    </button>
                    <button
                      type="button"
                      className="openclaw-secondary-btn"
                      onClick={() => handleSaveAgentConfig(false, true)}
                      disabled={agentConfigSaving || configLoading || !agentConfigTargetId || Boolean(agentConfigExtraJsonError)}
                    >
                      保存并热重载
                    </button>
                    <button
                      type="button"
                      className="openclaw-secondary-btn"
                      onClick={() => handleSaveAgentConfig(true, false)}
                      disabled={agentConfigSaving || configLoading || !agentConfigTargetId}
                    >
                      清除覆盖
                    </button>
                    <button
                      type="button"
                      className="openclaw-action-btn"
                      onClick={() => {
                        openStudioForAgent(agentConfigTarget.id);
                        setAgentConfigModalOpen(false);
                      }}
                    >
                      进入任务下发
                    </button>
                  </div>
                </section>
              </div>
            ) : null}

            {activeSection === 'agents' && studioDialogOpen && selectedAgent ? (
              <div
                className="openclaw-agent-dialog-backdrop"
                onClick={() => setStudioDialogOpen(false)}
              >
                <section
                  className="openclaw-agent-dialog"
                  role="dialog"
                  aria-modal="true"
                  aria-label="任务下发对话窗口"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="openclaw-agent-dialog-head">
                    <div>
                      <p className="openclaw-section-kicker"><SendHorizontal size={16} /> 任务下发对话</p>
                      <h2>{selectedAgent.emoji ? `${selectedAgent.emoji} ${getPreferredName(selectedAgent)}` : getPreferredName(selectedAgent)}</h2>
                      <small>{getRoleName(selectedAgent)} · {selectedAgent.id} · {selectedAgentEffective?.model || selectedAgent.model}</small>
                    </div>
                    <button
                      type="button"
                      className="openclaw-inline-toggle"
                      onClick={() => setStudioDialogOpen(false)}
                    >
                      关闭
                    </button>
                  </div>
                  <div className="openclaw-agent-dialog-grid">
                    <article className="openclaw-agent-dialog-card">
                      <div className="openclaw-command-form">
                        <div className="openclaw-command-toolbar">
                          <div className="openclaw-command-toolbar-primary">
                            <strong>{selectedAgent.emoji ? `${selectedAgent.emoji} ${getPreferredName(selectedAgent)}` : getPreferredName(selectedAgent)}</strong>
                            <small>{getRoleName(selectedAgent)} · {selectedAgent.id} · {selectedAgentEffective?.model || selectedAgent.model}</small>
                          </div>
                          <select value={thinking} onChange={(event) => setThinking(event.target.value as 'minimal' | 'low' | 'medium' | 'high')} className="openclaw-input">
                            <option value="minimal">最少</option>
                            <option value="low">低</option>
                            <option value="medium">中</option>
                            <option value="high">高</option>
                          </select>
                        </div>
                        <div className="openclaw-agent-model-switch-row">
                          <select
                            className="openclaw-input"
                            value={agentModelSelection}
                            onChange={(event) => setAgentModelSelection(event.target.value)}
                            disabled={agentModelLoading || agentModelSwitching}
                          >
                            {(selectedAgentModelSnapshot?.models || []).map((model) => (
                              <option key={`${selectedAgent.id}-${model.key}`} value={model.key}>
                                {model.name || model.key}
                              </option>
                            ))}
                            {!selectedAgentModelSnapshot?.models.length ? <option value="">暂无可用模型</option> : null}
                          </select>
                          <button
                            type="button"
                            className="openclaw-action-btn"
                            onClick={() => void loadAgentModels(selectedAgent.id, true)}
                            disabled={agentModelLoading || agentModelSwitching}
                          >
                            {agentModelLoading ? '读取中...' : '刷新模型'}
                          </button>
                          <button
                            type="button"
                            className="openclaw-primary-btn"
                            onClick={() => void handleSwitchAgentModel(selectedAgent.id)}
                            disabled={agentModelLoading || agentModelSwitching || !agentModelSelection}
                          >
                            {agentModelSwitching ? '切换中...' : '应用模型'}
                          </button>
                        </div>
                        {selectedAgentModelSnapshot?.models.length ? (
                          <div className="openclaw-model-quick-list">
                            {selectedAgentModelSnapshot.models.slice(0, 6).map((model) => (
                              <button
                                key={`quick-dialog-${selectedAgent.id}-${model.key}`}
                                type="button"
                                className={`openclaw-inline-toggle ${agentModelSelection === model.key ? 'is-active' : ''}`}
                                onClick={() => {
                                  setAgentModelSelection(model.key);
                                  void handleSwitchAgentModel(selectedAgent.id, model.key);
                                }}
                                disabled={agentModelSwitching}
                                title={model.key}
                              >
                                {model.name || model.key}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        <small>
                          当前模型：{pickSnapshotModel(selectedAgentModelSnapshot) || selectedAgent.model}
                          {selectedAgentModelSnapshot?.consoleOverrideModel ? '（已写入助理覆盖）' : ''}
                        </small>
                        {agentModelLoadError ? <small className="openclaw-error-inline">{agentModelLoadError}</small> : null}
                        <label className="openclaw-checkbox">
                          <input type="checkbox" checked={reuseLatestSession} onChange={(event) => setReuseLatestSession(event.target.checked)} />
                          延续最近会话
                        </label>
                        {selectedAgentEffective?.quickTasks.length ? (
                          <div className="openclaw-quick-task-list">
                            {selectedAgentEffective.quickTasks.map((task) => (
                              <button
                                key={`${selectedAgent.id}-${task}`}
                                type="button"
                                className="openclaw-inline-toggle"
                                onClick={() => setCommandMessage((current) => current.trim() ? `${current.trim()}\n${task}` : task)}
                              >
                                {task}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        <textarea
                          className="openclaw-textarea"
                          placeholder="给助理下达明确任务，例如：总结今天所有 cron 任务状态，并列出失败项。"
                          value={commandMessage}
                          onChange={(event) => setCommandMessage(event.target.value)}
                        />
                        <button className="openclaw-primary-btn" disabled={sendingCommand || !commandMessage.trim()} onClick={handleSendCommand}>
                          <SendHorizontal size={16} />
                          {sendingCommand ? '发送中...' : '执行指令'}
                        </button>
                      </div>
                      <div className="openclaw-guidance">
                        <p>最近会话：{selectedAgent.latestSessionId || '无'} · {formatAge(selectedAgent.latestAgeMs)}</p>
                        <p>模型链路：P99 {agentAnalytics.get(selectedAgent.id)?.latencyP99 ? `${agentAnalytics.get(selectedAgent.id)?.latencyP99}ms` : '--'} · 24h {agentAnalytics.get(selectedAgent.id)?.runCount24h ?? 0} 次调用</p>
                        <p>工作区：{selectedAgentEffective?.workspace || selectedAgent.workspace}</p>
                        <p>提供方：{selectedAgentEffective?.provider || selectedAgent.latestProvider || '暂无提供方'}</p>
                        <p>{selectedAgentEffective?.routes.length ? `路由：${selectedAgentEffective.routes.join(', ')}` : '路由：--'}</p>
                        {dashboard?.runtime.sshTunnelCommand ? <p>隧道命令：{dashboard.runtime.sshTunnelCommand}</p> : null}
                      </div>
                    </article>

                    <article className="openclaw-agent-dialog-card">
                      <div className="openclaw-section-head">
                        <div>
                          <p className="openclaw-section-kicker"><Activity size={16} /> 回复</p>
                          <h2>最近助理回复</h2>
                        </div>
                      </div>
                      <div className="openclaw-agent-run-list">
                        {(sendingCommand || streamingReply || streamingError) ? (
                          <div className="openclaw-agent-run-card is-streaming">
                            <header>
                              <strong>{selectedAgent.roleName || selectedAgent.id.toUpperCase()}</strong>
                              <small>{streamingStartedAt ? formatDateTime(streamingStartedAt) : '刚刚'}</small>
                            </header>
                            <p className="openclaw-agent-run-prompt">{commandMessage || '任务处理中...'}</p>
                            <pre className="openclaw-log-box">
                              {streamingReply || (sendingCommand ? '正在等待助理首条回复...' : '任务已结束。')}
                            </pre>
                            <div className="openclaw-meta">
                              <span>{sendingCommand ? '流式输出中...' : '流式输出已停止'}</span>
                              <span>{streamingError || '请等待最终结果落盘到历史记录。'}</span>
                            </div>
                          </div>
                        ) : null}
                        {selectedAgentRuns.map((run) => (
                          <div className="openclaw-agent-run-card" key={run.id}>
                            <header>
                              <strong>{run.agentId}</strong>
                              <small>{formatDateTime(run.createdAt)}</small>
                            </header>
                            <p className="openclaw-agent-run-prompt">{run.message}</p>
                            <pre className="openclaw-log-box">{run.reply || '（空回复）'}</pre>
                            <div className="openclaw-meta">
                              <span>{run.model || '未知模型'} · {run.provider || '未知提供方'}</span>
                              <span>{run.durationMs ?? '--'}ms · 总计 {run.usage.total ?? '--'} Token</span>
                            </div>
                          </div>
                        ))}
                        {!selectedAgentRuns.length ? (
                          <div className="openclaw-empty">这里会显示当前助理的最近指令与回复。</div>
                        ) : null}
                      </div>
                    </article>
                  </div>
                </section>
              </div>
            ) : null}

            {activeSection === 'services' ? (
              <>
                <section className="openclaw-section">
                  <div className="openclaw-section-head">
                    <div>
                      <p className="openclaw-section-kicker"><Bot size={16} /> 服务</p>
                      <h2>网关与服务控制</h2>
                    </div>
                  </div>
                  <div className="openclaw-service-grid">
                    {dashboard?.services.map((service) => (
                      <article className={`openclaw-service-card tone-${service.tone} ${highlightedServiceId === service.id ? 'is-highlighted' : ''}`} key={service.id}>
                        <header>
                          <div>
                            <p>{service.name}</p>
                            <h3>{toneLabel[service.tone]}</h3>
                          </div>
                          <span className="openclaw-status-pill">{serviceStatusLabel[service.status] || service.status}</span>
                        </header>
                        <p className="openclaw-service-desc">{service.description}</p>
                        <div className="openclaw-metrics">
                          {(service.metrics.length ? service.metrics : [{ label: '目录', value: service.workingDirectory || '未设置' }]).map((metric) => (
                            <div key={`${service.id}-${metric.label}`}>
                              <span>{metric.label}</span>
                              <strong>{metric.value}</strong>
                              {metric.trend ? <small>{metric.trend}</small> : null}
                            </div>
                          ))}
                        </div>
                        <div className="openclaw-action-row">
                          {service.availableActions.map((action) => {
                            const actionKey = `${service.id}:${action}`;
                            return (
                              <button
                                key={action}
                                className="openclaw-action-btn"
                                disabled={runningAction === actionKey}
                                onClick={() => handleAction(service.id, action)}
                              >
                                {runningAction === actionKey ? '执行中...' : actionLabel[action]}
                              </button>
                            );
                          })}
                        </div>
                        <div className="openclaw-meta">
                          <span>检查时间：{formatDateTime(service.lastCheckAt)}</span>
                          <span>{service.logPath || '未绑定日志文件'}</span>
                        </div>
                        <pre className="openclaw-log-box">
                          {service.logTail.length ? service.logTail.join('\n') : '暂无日志输出。'}
                        </pre>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="openclaw-two-column">
                  <article className="openclaw-section">
                    <div className="openclaw-section-head">
                      <div>
                        <p className="openclaw-section-kicker"><FolderKanban size={16} /> 文件</p>
                        <h2>目录观察</h2>
                      </div>
                    </div>
                    <div className="openclaw-panel-list">
                      {dashboard?.panels.map((panel) => (
                        <div className="openclaw-panel-item" key={panel.id}>
                          <div>
                            <strong>{panel.title}</strong>
                            <p>{panel.description || panel.path}</p>
                            <small>{panel.path}</small>
                          </div>
                          <div className="openclaw-panel-meta">
                            <span>{panel.exists ? `${panel.entryCount} 项` : '缺失'}</span>
                            <span>{panel.sizeLabel}</span>
                            <span>{formatDateTime(panel.lastModifiedAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="openclaw-section">
                    <div className="openclaw-section-head">
                      <div>
                        <p className="openclaw-section-kicker"><Activity size={16} /> 活动</p>
                        <h2>服务动作历史</h2>
                      </div>
                    </div>
                    <div className="openclaw-activity-list">
                      {(dashboard?.activity.length ? dashboard.activity : lastResult ? [lastResult] : []).map((item) => (
                        <div className="openclaw-activity-item" key={item.id}>
                          <div>
                            <strong>{item.serviceName}</strong>
                            <p>{item.action} · {item.ok ? '成功' : '失败'} · {item.durationMs}ms</p>
                            <small>{summarizeOutput(item)}</small>
                          </div>
                          <small>{formatDateTime(item.createdAt)}</small>
                        </div>
                      ))}
                      {!dashboard?.activity.length && !lastResult ? (
                        <div className="openclaw-empty">首次执行服务动作后，这里会展示历史。</div>
                      ) : null}
                    </div>
                    <div className="openclaw-activity-footnote">历史已落盘到本地 `.data/openclaw-store.json`。</div>
                  </article>
                </section>

                <section className="openclaw-section" id="config">
                  <div className="openclaw-section-head">
                    <div>
                      <p className="openclaw-section-kicker"><SquareTerminal size={16} /> 配置</p>
                      <h2>绑定方式</h2>
                    </div>
                  </div>
                  <div className="openclaw-config-grid">
                    <div className="openclaw-config-card">
                      <strong>配置文件</strong>
                      <p>{configPath || dashboard?.configPath || '加载中...'}</p>
                      <small>这里定义了服务动作与本地管理行为。</small>
                    </div>
                    <div className="openclaw-config-card">
                      <strong>网关地址</strong>
                      <p>{dashboard?.runtime.gatewayUrl || '加载中...'}</p>
                      <small>最新版 OpenClaw 本地网关地址。</small>
                    </div>
                    <div className="openclaw-config-card">
                      <strong>数据存储</strong>
                      <p>/Volumes/rock2/codex/openclaw-console/.data/openclaw-store.json</p>
                      <small>保存服务历史与助理指令历史。</small>
                    </div>
                  </div>
                  <div className="openclaw-section-head openclaw-config-editor-head">
                    <div>
                      <p className="openclaw-section-kicker"><SquareTerminal size={16} /> 在线编辑</p>
                      <h2>配置热更新</h2>
                    </div>
                    <div className="openclaw-inline-actions">
                      <button className="openclaw-action-btn" onClick={() => setConfigEditorOpen((value) => !value)}>
                        {configEditorOpen ? '收起编辑器' : '展开编辑器'}
                      </button>
                      <button className="openclaw-action-btn" onClick={() => handleSaveConfig(false)} disabled={configSaving || configLoading || !configDirty}>
                        {configSaving ? '保存中...' : '保存配置'}
                      </button>
                      <button className="openclaw-primary-btn" onClick={() => handleSaveConfig(true)} disabled={configSaving || configLoading || !configDirty}>
                        {configSaving ? '热更新中...' : '保存并发送 SIGHUP'}
                      </button>
                    </div>
                  </div>
                  {configEditorOpen ? (
                    <div className="openclaw-config-editor">
                      <textarea
                        className="openclaw-textarea openclaw-config-textarea"
                        value={configDraft}
                        onChange={(event) => {
                          setConfigDraft(event.target.value);
                          setConfigDirty(true);
                        }}
                        placeholder={configLoading ? '配置加载中...' : '在这里编辑 openclaw.config.json'}
                      />
                      <small className="openclaw-guidance">保存时会先校验 JSON；选择“保存并发送 SIGHUP”会尝试让网关热重载。</small>
                    </div>
                  ) : null}
                  <div className="openclaw-guidance">
                    {dashboard?.guidance.map((item) => <p key={item}>{item}</p>)}
                  </div>
                </section>
              </>
            ) : null}

            {activeSection === 'sessions' ? (
              <section className="openclaw-section">
                <div className="openclaw-section-head">
                  <div>
                    <p className="openclaw-section-kicker"><MessageSquare size={16} /> 会话管理</p>
                    <h2>管理与代理的对话历史</h2>
                  </div>
                  <small>新建话题可避免上下文污染，每个话题独立积累上下文。</small>
                </div>
                <div className="openclaw-session-grid">
                  {dashboard?.agents.map((agent) => (
                    <article key={agent.id} className="openclaw-session-card">
                      <header>
                        <div className="openclaw-session-agent-info">
                          <span className="openclaw-session-emoji">{agent.emoji || '🤖'}</span>
                          <div>
                            <strong>{agent.displayName || agent.id}</strong>
                            <small>{agent.roleName || agent.id}</small>
                          </div>
                        </div>
                        <span className={`openclaw-status-pill tone-${agent.tone}`}>{agentStatusLabel[agent.status]}</span>
                      </header>
                      <div className="openclaw-session-stats">
                        <div className="openclaw-session-stat">
                          <span>总会话数</span>
                          <strong>{agent.sessionCount}</strong>
                        </div>
                        <div className="openclaw-session-stat">
                          <span>活跃会话</span>
                          <strong>{agent.activeSessionCount}</strong>
                        </div>
                        <div className="openclaw-session-stat">
                          <span>最近活动</span>
                          <strong>{formatAge(agent.latestAgeMs)}</strong>
                        </div>
                      </div>
                      {agent.latestSessionKey ? (
                        <div className="openclaw-session-recent">
                          <small>最近话题：{compactText(agent.latestSessionKey, 30) || '暂无'}</small>
                        </div>
                      ) : null}
                      <div className="openclaw-session-actions">
                        <button
                          className="openclaw-action-btn"
                          onClick={() => {
                            setSelectedAgentId(agent.id);
                            setCommandMessage('');
                            setThinking('medium');
                            setActiveSection('agents');
                          }}
                        >
                          新建对话
                        </button>
                        <button
                          className="openclaw-inline-toggle"
                          onClick={() => {
                            setSelectedAgentId(agent.id);
                            openStudioForAgent(agent.id);
                          }}
                        >
                          继续最近
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {activeSection === 'native' ? (
              <section className="openclaw-native-shell">
                <div className="openclaw-native-head">
                  <div>
                    <p className="openclaw-section-kicker"><SquareTerminal size={16} /> 原生功能工作台</p>
                    <h2>原生模块已并入左侧菜单</h2>
                    <p className="openclaw-native-subtitle">
                      当前模式为非内嵌直达：点击左侧“原生 · 模块”会直接打开对应原生页面，功能与原生工作台完全一致。
                    </p>
                  </div>
                </div>
                <div className="openclaw-native-status-row">
                  <p className="openclaw-native-current">选择原生模块后将直接跳转，不再通过 iframe 内嵌。</p>
                </div>
                <div className="openclaw-native-module-tabs">
                  {NATIVE_MODULES.map((module) => (
                    <button
                      key={`native-tab-${module.id}`}
                      type="button"
                      className="openclaw-inline-toggle"
                      onClick={() => openNativeModule(module.id)}
                    >
                      打开 · {module.label}
                    </button>
                  ))}
                </div>
                <div className="openclaw-guidance">
                  <p>迁移策略：原生模块改为同页直达，避免嵌套导致的跨域、安全上下文与菜单重复问题。</p>
                  <p>接口一致性：所有原生路由均走 /native-control 反向代理，能力与原生工作台保持 1:1。</p>
                </div>
              </section>
            ) : null}

            {activeSection === 'services' ? (
              <>
                <section className="openclaw-section">
                  <div className="openclaw-section-head">
                    <div>
                      <p className="openclaw-section-kicker"><Bot size={16} /> Telegram</p>
                      <h2>Bot 与助理关联配置</h2>
                    </div>
                    <button
                      className="openclaw-inline-toggle"
                      onClick={() => setTelegramBotPanelOpen((v) => !v)}
                    >
                      {telegramBotPanelOpen ? '收起' : '展开'}
                    </button>
                  </div>
                  {telegramBotPanelOpen ? (
                    <div className="openclaw-telegram-bot-panel">
                      <div className="openclaw-telegram-bot-add">
                        <h4>添加新 Bot</h4>
                        <div className="openclaw-form-row">
                          <label>
                            <span>Bot Token</span>
                            <input
                              className="openclaw-input"
                              placeholder="例如：123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                              value={newTelegramBotToken}
                              onChange={(e) => setNewTelegramBotToken(e.target.value)}
                            />
                          </label>
                          <label>
                            <span>名称（方便识别）</span>
                            <input
                              className="openclaw-input"
                              placeholder="例如：主Bot / 客服Bot"
                              value={newTelegramBotName}
                              onChange={(e) => setNewTelegramBotName(e.target.value)}
                            />
                          </label>
                          <button
                            className="openclaw-action-btn"
                            disabled={!newTelegramBotToken.trim()}
                            onClick={() => {
                              if (newTelegramBotToken.trim()) {
                                const updated = {
                                  ...telegramBots,
                                  [newTelegramBotToken.trim()]: {
                                    name: newTelegramBotName.trim() || newTelegramBotToken.trim().slice(0, 20),
                                    agentId: '',
                                    enabled: true,
                                  },
                                };
                                setTelegramBots(updated);
                                setNewTelegramBotToken('');
                                setNewTelegramBotName('');
                                setAgentConfigDirty(true);
                              }
                            }}
                          >
                            添加
                          </button>
                        </div>
                      </div>
                      <div className="openclaw-telegram-bot-list">
                        <h4>已配置的 Bot</h4>
                        {Object.keys(telegramBots).length === 0 ? (
                          <div className="openclaw-empty">暂无配置的 Bot</div>
                        ) : (
                          Object.entries(telegramBots).map(([token, bot]) => {
                            const typedBot = bot as TelegramBotConfig;
                            const botGroups = typedBot.groups || {};
                            return (
                            <div className="openclaw-telegram-bot-item" key={token}>
                              <div className="openclaw-telegram-bot-header">
                                <div className="openclaw-telegram-bot-info">
                                  <strong>{typedBot.name || token.slice(0, 20)}</strong>
                                  <small>{token.slice(0, 20)}...</small>
                                </div>
                                <div className="openclaw-telegram-bot-actions">
                                  <button
                                    className={`openclaw-inline-toggle ${typedBot.enabled ? 'is-active' : ''}`}
                                    onClick={() => {
                                      const updated = {
                                        ...telegramBots,
                                        [token]: { ...typedBot, enabled: !typedBot.enabled },
                                      };
                                      setTelegramBots(updated as Record<string, TelegramBotConfig>);
                                      setAgentConfigDirty(true);
                                    }}
                                  >
                                    {typedBot.enabled ? '已启用' : '已禁用'}
                                  </button>
                                  <button
                                    className="openclaw-action-btn"
                                    onClick={() => {
                                      const updated = { ...telegramBots };
                                      delete updated[token];
                                      setTelegramBots(updated as Record<string, TelegramBotConfig>);
                                      setAgentConfigDirty(true);
                                    }}
                                  >
                                    删除
                                  </button>
                                </div>
                              </div>
                              <div className="openclaw-telegram-bot-default">
                                <label>
                                  <span>默认助理</span>
                                  <select
                                    className="openclaw-input"
                                    value={typedBot.defaultAgentId}
                                    onChange={(e) => {
                                      const updated = {
                                        ...telegramBots,
                                        [token]: { ...typedBot, defaultAgentId: e.target.value },
                                      };
                                      setTelegramBots(updated as Record<string, TelegramBotConfig>);
                                      setAgentConfigDirty(true);
                                    }}
                                  >
                                    <option value="">不关联</option>
                                    {dashboard?.agents.map((agent) => (
                                      <option key={agent.id} value={agent.id}>
                                        {agent.displayName || agent.id}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                              <div className="openclaw-telegram-bot-groups">
                                <div className="openclaw-telegram-group-header">
                                  <span>群组配置</span>
                                  <button
                                    className="openclaw-inline-toggle"
                                    onClick={() => setExpandedBotGroups(prev => ({ ...prev, [token]: !prev[token] }))}
                                  >
                                    {expandedBotGroups[token] ? '收起' : `展开 (${Object.keys(botGroups).length})`}
                                  </button>
                                </div>
                                {expandedBotGroups[token] ? (
                                  <div className="openclaw-telegram-groups-list">
                                    {Object.entries(botGroups).map(([groupId, group]) => (
                                      <div className="openclaw-telegram-group-item" key={groupId}>
                                        <div className="openclaw-telegram-group-info">
                                          <strong>{group.name || groupId}</strong>
                                          <small>{groupId}</small>
                                        </div>
                                        <select
                                          className="openclaw-input"
                                          value={group.agentId}
                                          onChange={(e) => {
                                            const updated = {
                                              ...telegramBots,
                                              [token]: {
                                                ...typedBot,
                                                groups: {
                                                  ...typedBot.groups,
                                                  [groupId]: { ...group, agentId: e.target.value },
                                                },
                                              },
                                            };
                                            setTelegramBots(updated as Record<string, TelegramBotConfig>);
                                            setAgentConfigDirty(true);
                                          }}
                                        >
                                          <option value="">使用默认</option>
                                          {dashboard?.agents.map((agent) => (
                                            <option key={agent.id} value={agent.id}>
                                              {agent.displayName || agent.id}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          className="openclaw-inline-toggle"
                                          onClick={() => {
                                            const newGroups = { ...typedBot.groups };
                                            delete newGroups[groupId];
                                            const updated = {
                                              ...telegramBots,
                                              [token]: { ...typedBot, groups: newGroups },
                                            };
                                            setTelegramBots(updated as Record<string, TelegramBotConfig>);
                                            setAgentConfigDirty(true);
                                          }}
                                        >
                                          删除
                                        </button>
                                      </div>
                                    ))}
                                    <div className="openclaw-telegram-group-add">
                                      <input
                                        className="openclaw-input"
                                        placeholder="群组ID (如 -1001234567890)"
                                        value={newGroupId[token] || ''}
                                        onChange={(e) => setNewGroupId(prev => ({ ...prev, [token]: e.target.value }))}
                                      />
                                      <input
                                        className="openclaw-input"
                                        placeholder="群组名称"
                                        value={newGroupName[token] || ''}
                                        onChange={(e) => setNewGroupName(prev => ({ ...prev, [token]: e.target.value }))}
                                      />
                                      <button
                                        className="openclaw-action-btn"
                                        disabled={!newGroupId[token]?.trim()}
                                        onClick={() => {
                                          if (newGroupId[token]?.trim()) {
                                            const gid = newGroupId[token].trim();
                                            const updated = {
                                              ...telegramBots,
                                              [token]: {
                                                ...typedBot,
                                                groups: {
                                                  ...(typedBot.groups || {}),
                                                  [gid]: { name: newGroupName[token]?.trim() || gid, agentId: typedBot.defaultAgentId, enabled: true },
                                                },
                                              },
                                            };
                                            setTelegramBots(updated as Record<string, TelegramBotConfig>);
                                            setNewGroupId(prev => ({ ...prev, [token]: '' }));
                                            setNewGroupName(prev => ({ ...prev, [token]: '' }));
                                            setAgentConfigDirty(true);
                                          }
                                        }}
                                      >
                                        添加群组
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            );
                          }
                        )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="openclaw-empty">
                      已配置 {Object.keys(telegramBots).length} 个 Bot，点击展开查看详情
                    </div>
                  )}
                </section>
              </>
            ) : null}

            {activeSection === 'logs' ? (
              <>
                <section className="openclaw-section">
                  <div className="openclaw-section-head">
                    <div>
                      <p className="openclaw-section-kicker"><Stethoscope size={16} /> 诊断</p>
                      <h2>命令诊断</h2>
                    </div>
                    <small>这些卡片来自最新版 CLI 的 `health/status` 命令。</small>
                  </div>
                  <div className="openclaw-diagnostic-grid">
                    {dashboard?.diagnostics.map((item) => (
                      <article className={`openclaw-diagnostic-card tone-${item.tone}`} key={item.id}>
                        <header>
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.summary}</p>
                          </div>
                          <div className="openclaw-diagnostic-head-actions">
                            <small>{formatDateTime(item.updatedAt)}</small>
                            <button
                              type="button"
                              className="openclaw-inline-toggle"
                              onClick={() => setExpandedDiagnostics((current) => current.includes(item.id) ? current.filter((value) => value !== item.id) : [...current, item.id])}
                            >
                              {expandedDiagnostics.includes(item.id) ? '收起原始输出' : '展开原始输出'}
                            </button>
                          </div>
                        </header>
                        {expandedDiagnostics.includes(item.id) ? (
                          <>
                            <div className="openclaw-meta">
                              <span>{item.command}</span>
                            </div>
                            <pre className="openclaw-log-box">{item.excerpt.join('\n')}</pre>
                          </>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>

                <section className="openclaw-section">
                  <div className="openclaw-section-head">
                    <div>
                      <p className="openclaw-section-kicker"><SquareTerminal size={16} /> 日志</p>
                      <h2>日志筛选</h2>
                    </div>
                  </div>
                  <div className="openclaw-log-toolbar">
                    <select value={selectedServiceId} onChange={(event) => setSelectedServiceId(event.target.value)} className="openclaw-input">
                      <option value="all">全部服务</option>
                      {dashboard?.services.map((service) => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </select>
                    <input
                      className="openclaw-input"
                      placeholder="按关键字筛选日志"
                      value={logQuery}
                      onChange={(event) => setLogQuery(event.target.value)}
                    />
                  </div>
                  <div className="openclaw-filtered-log-grid">
                    {filteredLogs.map((service) => (
                      <article className={`openclaw-log-panel ${highlightedServiceId === service.id ? 'is-highlighted' : ''}`} key={service.id}>
                        <header>
                          <strong>{service.name}</strong>
                          <small>{service.logPath || '未绑定日志文件'}</small>
                        </header>
                        <pre className="openclaw-log-box">
                          {service.lines.length ? service.lines.join('\n') : '没有匹配的日志行。'}
                        </pre>
                      </article>
                    ))}
                    {filteredLogs.length === 0 ? <div className="openclaw-empty">没有匹配到日志行。</div> : null}
                  </div>
                </section>
              </>
            ) : null}

          </div>
        </section>
      </main>
    </div>
  );
};
