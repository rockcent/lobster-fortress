import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { getOpenClawActivity, getOpenClawAgentRuns, getOpenClawStorePath, updateOpenClawActivity, updateOpenClawAgentRuns } from './openclawStore';

export type ApiErrorCode =
  | 'service_not_found'
  | 'action_not_configured'
  | 'action_failed'
  | 'runtime_action_failed'
  | 'config_save_failed'
  | 'config_invalid'
  | 'agent_command_failed'
  | 'agent_id_required'
  | 'message_required'
  | 'invalid_json'
  | 'shortcut_target_required'
  | 'invalid_url'
  | 'invalid_path'
  | 'remote_path_not_allowed';

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getOpenClawVersion = () => {
  try {
    const output = execSync('openclaw --version', { encoding: 'utf8', timeout: 5000 });
    const match = output.match(/OpenClaw\s+([^\s]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

export type OpenClawAction = 'start' | 'stop' | 'restart' | 'status';
export type OpenClawRuntimeAction = 'repair-watchdog' | 'reload-gateway-config';
type ServiceTone = 'healthy' | 'warning' | 'critical' | 'neutral';

interface OpenClawMetricConfig {
  label: string;
  value: string;
  trend?: string;
}

interface OpenClawPanelConfig {
  id: string;
  title: string;
  path: string;
  description?: string;
}

interface OpenClawServiceConfig {
  id: string;
  name: string;
  description: string;
  workingDirectory?: string;
  logPath?: string;
  commands?: Partial<Record<OpenClawAction, string>>;
  metrics?: OpenClawMetricConfig[];
}

interface OpenClawConfig {
  title: string;
  subtitle: string;
  workspaceRoot: string;
  refreshIntervalMs: number;
  agentIdentity?: Record<string, {
    roleName?: string;
    displayName?: string;
    emoji?: string;
  }>;
  agentConsole?: Record<string, {
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
    [key: string]: unknown;
  }>;
  remote?: {
    mode?: 'local' | 'ssh';
    sshTarget?: string;
    port?: number;
    identityFile?: string;
    gatewayPort?: number;
    stateDirectory?: string;
    tempLogDirectory?: string;
    publicDashboardUrl?: string;
  };
  services: OpenClawServiceConfig[];
  panels: OpenClawPanelConfig[];
  links: Array<{ label: string; href: string }>;
}

type ShortcutKind = 'url' | 'path';

export interface OpenClawServiceSnapshot {
  id: string;
  name: string;
  description: string;
  status: string;
  tone: ServiceTone;
  workingDirectory?: string;
  logPath?: string;
  logTail: string[];
  availableActions: OpenClawAction[];
  statusCommand?: string;
  metrics: OpenClawMetricConfig[];
  lastCheckAt: string;
}

export interface OpenClawAgentSnapshot {
  id: string;
  roleName: string;
  displayName: string;
  emoji?: string;
  model: string;
  workspace: string;
  agentDir: string;
  isDefault: boolean;
  bindings: number;
  routes: string[];
  sessionCount: number;
  activeSessionCount: number;
  status: 'active' | 'warm' | 'idle' | 'offline';
  tone: ServiceTone;
  latestSessionId: string | null;
  latestSessionKey: string | null;
  latestKind: string | null;
  latestModel: string | null;
  latestProvider: string | null;
  latestTokens: number | null;
  latestInputTokens: number | null;
  latestOutputTokens: number | null;
  latestUpdatedAt: string | null;
  latestAgeMs: number | null;
  abortedLastRun: boolean;
}

export interface OpenClawAgentRunRecord {
  id: string;
  agentId: string;
  sessionId: string | null;
  message: string;
  reply: string;
  status: string;
  summary: string;
  durationMs: number | null;
  provider: string | null;
  model: string | null;
  usage: {
    input: number | null;
    output: number | null;
    total: number | null;
  };
  createdAt: string;
}

export interface OpenClawAgentModelOption {
  key: string;
  name: string;
  input?: string;
  contextWindow?: number | null;
  local?: boolean;
  available?: boolean;
  tags: string[];
  missing?: boolean;
}

export interface OpenClawAgentModelSnapshot {
  agentId: string;
  defaultModel: string | null;
  resolvedDefault: string | null;
  effectiveModel: string | null;
  consoleOverrideModel: string | null;
  consoleOverrideProvider: string | null;
  allowed: string[];
  fallbacks: string[];
  models: OpenClawAgentModelOption[];
  updatedAt: string;
}

export type OpenClawAgentCommandStreamEvent =
  | {
      type: 'start';
      agentId: string;
      startedAt: string;
      sessionId: string | null;
    }
  | {
      type: 'delta';
      agentId: string;
      chunk: string;
      reply: string;
    }
  | {
      type: 'done';
      record: OpenClawAgentRunRecord;
    }
  | {
      type: 'error';
      agentId: string;
      message: string;
    };

export interface OpenClawDashboardSnapshot {
  title: string;
  subtitle: string;
  configPath: string;
  refreshIntervalMs: number;
  generatedAt: string;
  environment: {
    hostname: string;
    platform: string;
    nodeVersion: string;
    cwd: string;
  };
  runtime: {
    connectionMode: 'local' | 'ssh';
    connectionTarget: string;
    gatewayPort: number;
    gatewayUrl: string;
    dashboardUrl: string;
    sshTunnelCommand: string | null;
    watchdogLabel: string;
    watchdogLoaded: boolean;
    gatewayListening: boolean;
    gatewayPid: string | null;
    stateDirectory: string;
    tempLogDirectory: string;
  };
  summary: {
    totalServices: number;
    healthyServices: number;
    configurableServices: number;
    logBackedServices: number;
  };
  services: OpenClawServiceSnapshot[];
  panels: Array<{
    id: string;
    title: string;
    description?: string;
    path: string;
    exists: boolean;
    entryCount: number;
    sizeLabel: string;
    lastModifiedAt: string | null;
  }>;
  links: Array<{ label: string; href: string }>;
  shortcuts: Array<{
    id: string;
    label: string;
    target: string;
    kind: ShortcutKind;
    description: string;
  }>;
  diagnostics: Array<{
    id: string;
    title: string;
    command: string;
    summary: string;
    tone: ServiceTone;
    updatedAt: string;
    excerpt: string[];
  }>;
  activity: OpenClawCommandResult[];
  agents: OpenClawAgentSnapshot[];
  agentRuns: OpenClawAgentRunRecord[];
  guidance: string[];
}

export interface OpenClawCommandResult {
  id: string;
  serviceId: string;
  serviceName: string;
  action: OpenClawAction;
  command: string;
  cwd: string;
  ok: boolean;
  code: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  createdAt: string;
}

const MAX_HISTORY = 12;
const MAX_AGENT_RUNS = 20;
const MAX_OUTPUT_LENGTH = 2000;
const DIAGNOSTIC_CACHE_MS = 60000;
const AGENT_CACHE_MS = 15000;
const DEFAULT_CONFIG_PATH = path.resolve(process.cwd(), 'openclaw.config.json');
const WATCHDOG_LABEL = 'com.openclaw.gateway-watchdog';
const WATCHDOG_PLIST_PATH = path.join(os.homedir(), 'Library/LaunchAgents', `${WATCHDOG_LABEL}.plist`);
const GATEWAY_PORT = 18789;
const STATE_DIR = path.join(os.homedir(), '.openclaw');
const TEMP_LOG_DIR = '/tmp/openclaw';
const OPENCLAW_DIST_ENTRY = path.join(os.homedir(), '.npm-global/lib/node_modules/openclaw/dist/index.js');
const DEFAULT_CONFIG: OpenClawConfig = {
  title: 'OpenClaw Local Control',
  subtitle: '把 OpenClaw 的进程、目录和日志放到一个本地图形化面板里。',
  workspaceRoot: process.cwd(),
  refreshIntervalMs: 15000,
  remote: {
    mode: 'local',
    gatewayPort: GATEWAY_PORT,
    stateDirectory: STATE_DIR,
    tempLogDirectory: TEMP_LOG_DIR,
  },
  services: [
    {
      id: 'openclaw-core',
      name: 'OpenClaw Core',
      description: '配置你的主进程状态检测、启动和停止命令。',
      workingDirectory: process.cwd(),
      logPath: path.resolve(process.cwd(), 'logs/openclaw-core.log'),
      commands: {
        status: '',
        start: '',
        stop: '',
        restart: '',
      },
      metrics: [
        { label: 'Owner', value: 'local' },
        { label: 'Mode', value: 'manual binding' },
      ],
    },
  ],
  panels: [
    {
      id: 'workspace',
      title: 'Workspace',
      path: process.cwd(),
      description: '面板根目录',
    },
    {
      id: 'logs',
      title: 'Logs',
      path: path.resolve(process.cwd(), 'logs'),
      description: '服务日志目录',
    },
  ],
  links: [
    { label: 'Config File', href: '/openclaw#config' },
  ],
};

let diagnosticsCache:
  | {
      capturedAt: number;
      items: OpenClawDashboardSnapshot['diagnostics'];
    }
  | null = null;

let agentCache:
  | {
      capturedAt: number;
      items: OpenClawAgentSnapshot[];
    }
  | null = null;

const trimOutput = (value: string) => value.trim().slice(0, MAX_OUTPUT_LENGTH);

const toIso = (timestampMs: number) => new Date(timestampMs).toISOString();

const findLatestNvmBin = () => {
  try {
    const versionsDir = path.join(os.homedir(), '.nvm/versions/node');
    const entries = fs.readdirSync(versionsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^v\d+/.test(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
    const latest = entries.at(-1);
    return latest ? path.join(versionsDir, latest, 'bin') : null;
  } catch {
    return null;
  }
};

const buildShellEnv = () => {
  const pathEntries = [
    findLatestNvmBin(),
    path.join(os.homedir(), '.npm-global/bin'),
    '/opt/homebrew/bin',
    '/usr/local/bin',
    process.env.PATH || '',
  ].filter(Boolean) as string[];

  return {
    ...process.env,
    PATH: pathEntries.join(':'),
  };
};

const quoteShellArg = (value: string) => JSON.stringify(value);

const buildOpenClawCliCommand = (args: string[]) => {
  const latestNvmBin = findLatestNvmBin();
  const nodePath = latestNvmBin ? path.join(latestNvmBin, 'node') : null;
  if (nodePath && fileExists(nodePath) && fileExists(OPENCLAW_DIST_ENTRY)) {
    return `${quoteShellArg(nodePath)} ${quoteShellArg(OPENCLAW_DIST_ENTRY)} ${args.map(quoteShellArg).join(' ')}`;
  }

  return `openclaw ${args.map(quoteShellArg).join(' ')}`;
};

const fileExists = (targetPath: string) => {
  try {
    fs.accessSync(targetPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const humanFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const summarizeDirectory = (targetPath: string) => {
  if (!fileExists(targetPath)) {
    return {
      exists: false,
      entryCount: 0,
      sizeLabel: '0 B',
      lastModifiedAt: null,
    };
  }

  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return {
      exists: true,
      entryCount: 1,
      sizeLabel: humanFileSize(stat.size),
      lastModifiedAt: stat.mtime.toISOString(),
    };
  }

  const entries = fs.readdirSync(targetPath);
  let totalSize = 0;
  for (const entry of entries.slice(0, 200)) {
    try {
      const child = fs.statSync(path.join(targetPath, entry));
      totalSize += child.size;
    } catch {
      continue;
    }
  }

  return {
    exists: true,
    entryCount: entries.length,
    sizeLabel: humanFileSize(totalSize),
    lastModifiedAt: stat.mtime.toISOString(),
  };
};

const readLogTail = (targetPath?: string, lineCount = 10) => {
  if (!targetPath || !fileExists(targetPath)) return [];
  try {
    const content = fs.readFileSync(targetPath, 'utf8');
    return content.split(/\r?\n/).filter(Boolean).slice(-lineCount);
  } catch {
    return [];
  }
};

export const loadConfig = (): { configPath: string; config: OpenClawConfig } => {
  if (!fileExists(DEFAULT_CONFIG_PATH)) {
    return {
      configPath: DEFAULT_CONFIG_PATH,
      config: DEFAULT_CONFIG,
    };
  }

  try {
    const raw = fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<OpenClawConfig>;
    return {
      configPath: DEFAULT_CONFIG_PATH,
      config: {
        ...DEFAULT_CONFIG,
        ...parsed,
        remote: {
          ...DEFAULT_CONFIG.remote,
          ...(parsed.remote || {}),
        },
        services: parsed.services || DEFAULT_CONFIG.services,
        panels: parsed.panels || DEFAULT_CONFIG.panels,
        links: parsed.links || DEFAULT_CONFIG.links,
      },
    };
  } catch {
    return {
      configPath: DEFAULT_CONFIG_PATH,
      config: DEFAULT_CONFIG,
    };
  }
};

const loadRawConfigObject = (): { configPath: string; config: Record<string, unknown> } => {
  if (!fileExists(DEFAULT_CONFIG_PATH)) {
    return {
      configPath: DEFAULT_CONFIG_PATH,
      config: {},
    };
  }

  const raw = fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf8').trim();
  if (!raw) {
    return {
      configPath: DEFAULT_CONFIG_PATH,
      config: {},
    };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ApiError('config_invalid', '配置根节点必须是对象。');
    }
    return {
      configPath: DEFAULT_CONFIG_PATH,
      config: parsed as Record<string, unknown>,
    };
  } catch (error) {
    throw new ApiError('invalid_json', error instanceof Error ? `配置文件 JSON 无效：${error.message}` : '配置文件 JSON 无效。');
  }
};

const extractProviderFromModelKey = (modelKey: string) => {
  const text = modelKey.trim();
  if (!text) return '';
  const separatorIndex = text.indexOf('/');
  if (separatorIndex <= 0) return '';
  return text.slice(0, separatorIndex).trim();
};

const persistAgentModelOverride = (agentId: string, modelKey: string) => {
  const { configPath, config } = loadRawConfigObject();
  const nextConfig: Record<string, unknown> = { ...config };

  const currentConsole = nextConfig.agentConsole;
  const nextConsole = (currentConsole && typeof currentConsole === 'object' && !Array.isArray(currentConsole))
    ? { ...(currentConsole as Record<string, unknown>) }
    : {};

  const rawPreference = nextConsole[agentId];
  const nextPreference = (rawPreference && typeof rawPreference === 'object' && !Array.isArray(rawPreference))
    ? { ...(rawPreference as Record<string, unknown>) }
    : {};

  nextPreference.modelLabelOverride = modelKey;
  const provider = extractProviderFromModelKey(modelKey);
  if (provider) {
    nextPreference.providerLabelOverride = provider;
  } else {
    delete nextPreference.providerLabelOverride;
  }

  nextConsole[agentId] = nextPreference;
  nextConfig.agentConsole = nextConsole;
  fs.writeFileSync(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`, 'utf8');
};

const interpretServiceStatus = (stdout: string, stderr: string, ok: boolean): { status: string; tone: ServiceTone } => {
  const text = `${stdout}\n${stderr}`.toLowerCase();
  if (!text.trim()) {
    return ok
      ? { status: 'running', tone: 'healthy' }
      : { status: 'stopped', tone: 'warning' };
  }
  if (text.includes('healthy') || text.includes('running') || text.includes('active') || text.includes('online')) {
    return { status: 'running', tone: 'healthy' };
  }
  if (text.includes('degraded') || text.includes('warning') || text.includes('slow')) {
    return { status: 'degraded', tone: 'warning' };
  }
  if (text.includes('failed') || text.includes('error') || text.includes('crash')) {
    return { status: 'failed', tone: 'critical' };
  }
  return ok
    ? { status: trimOutput(stdout || stderr) || 'running', tone: 'healthy' }
    : { status: trimOutput(stderr || stdout) || 'stopped', tone: 'warning' };
};

const runShellCommand = async (
  command: string,
  cwd: string,
  maxOutputLength = MAX_OUTPUT_LENGTH,
  remote?: OpenClawConfig['remote'],
) => {
  const startedAt = Date.now();
  return new Promise<{
    ok: boolean;
    code: number | null;
    stdout: string;
    stderr: string;
    durationMs: number;
  }>((resolve) => {
    const child = remote?.mode === 'ssh' && remote.sshTarget
      ? spawn('/usr/bin/ssh', [
        '-o', 'BatchMode=yes',
        '-o', 'ConnectTimeout=5',
        '-o', 'StrictHostKeyChecking=accept-new',
        ...(remote.port ? ['-p', String(remote.port)] : []),
        ...(remote.identityFile ? ['-i', remote.identityFile] : []),
        remote.sshTarget,
        `cd ${quoteShellArg(cwd)} && ${command}`,
      ], {
        cwd: process.cwd(),
        env: buildShellEnv(),
      })
      : spawn('/bin/zsh', ['-lc', command], {
        cwd,
        env: buildShellEnv(),
      });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (payload: { ok: boolean; code: number | null; stdout: string; stderr: string }) => {
      if (settled) return;
      settled = true;
      resolve({
        ...payload,
        durationMs: Date.now() - startedAt,
      });
    };

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      finish({
        ok: false,
        code: null,
        stdout: stdout.trim().slice(0, maxOutputLength),
        stderr: `${stderr}\nCommand timed out after 15s.`.trim().slice(0, maxOutputLength),
      });
    }, 15000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      finish({
        ok: false,
        code: null,
        stdout: stdout.trim().slice(0, maxOutputLength),
        stderr: `${stderr}\n${error.message}`.trim().slice(0, maxOutputLength),
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      finish({
        ok: code === 0,
        code,
        stdout: stdout.trim().slice(0, maxOutputLength),
        stderr: stderr.trim().slice(0, maxOutputLength),
      });
    });
  });
};

const runShellCommandSafe = async (
  command: string,
  cwd: string,
  maxOutputLength = MAX_OUTPUT_LENGTH,
  remote?: OpenClawConfig['remote'],
) => {
  try {
    return await runShellCommand(command, cwd, maxOutputLength, remote);
  } catch (error) {
    return {
      ok: false,
      code: null,
      stdout: '',
      stderr: error instanceof Error ? error.message : '命令执行失败。',
      durationMs: 0,
    };
  }
};

const parseJsonCommandOutput = <T>(output: string): T => {
  // Extract JSON by finding where non-JSON content starts (plugin warnings, etc.)
  // These typically start with [plugins], [wecom], timestamps, etc.
  const trimmed = output.trim();
  
  // Find where JSON ends - look for common warning patterns that come after JSON
  const warningPatterns = ['[plugins]', '[wecom]', 'Node.js v', 'openclaw-console'];
  let jsonEnd = -1;
  
  for (const pattern of warningPatterns) {
    const idx = trimmed.indexOf(pattern);
    if (idx > 0 && (jsonEnd < 0 || idx < jsonEnd)) {
      jsonEnd = idx;
    }
  }
  
  // If no warning found, try bracket tracking
  if (jsonEnd <= 0) {
    let depth = 0, inString = false, escaped = false;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\' && inString) { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{' || ch === '[') { depth++; }
      else if (ch === '}' || ch === ']') { depth--; if (depth === 0) { jsonEnd = i + 1; break; } }
    }
  }
  
  if (jsonEnd <= 0) {
    jsonEnd = trimmed.length;
  }

  const jsonStr = trimmed.substring(0, jsonEnd).trim();
  return JSON.parse(jsonStr) as T;
};

const getRemoteRuntimeDefaults = (config: OpenClawConfig) => {
  const remote = config.remote || DEFAULT_CONFIG.remote!;
  const gatewayPort = remote.gatewayPort || GATEWAY_PORT;
  const connectionMode = remote.mode === 'ssh' ? 'ssh' : 'local';
  const connectionTarget = connectionMode === 'ssh' ? (remote.sshTarget || 'ssh target not set') : 'local machine';
  const dashboardUrl = remote.publicDashboardUrl?.trim()
    || (connectionMode === 'local' ? `http://127.0.0.1:${gatewayPort}/` : `http://127.0.0.1:${gatewayPort}/`);
  const sshTunnelCommand = connectionMode === 'ssh' && remote.sshTarget
    ? `ssh -N -L ${gatewayPort}:127.0.0.1:${gatewayPort} ${remote.sshTarget}`
    : null;

  return {
    remote,
    connectionMode,
    connectionTarget,
    gatewayPort,
    dashboardUrl,
    stateDirectory: remote.stateDirectory || STATE_DIR,
    tempLogDirectory: remote.tempLogDirectory || TEMP_LOG_DIR,
    sshTunnelCommand,
  };
};

export const runOpenClawJsonCommand = async <T>(args: string[], config: OpenClawConfig) => {
  const command = buildOpenClawCliCommand(args);
  const remoteDefaults = getRemoteRuntimeDefaults(config);
  const result = await runShellCommand(command, config.workspaceRoot || process.cwd(), 250000, remoteDefaults.remote);
  const source = result.stdout || result.stderr;
  if (!result.ok && !source) {
    throw new ApiError('agent_command_failed', 'OpenClaw command failed.');
  }

  try {
    return parseJsonCommandOutput<T>(source);
  } catch (error) {
    throw new ApiError('agent_command_failed', error instanceof Error ? error.message : 'OpenClaw JSON 输出解析失败。');
  }
};

const stripAnsiCodes = (value: string) => value.replace(/\u001b\[[0-9;]*m/g, '');

const sanitizeStreamChunk = (value: string) => {
  if (!value) return '';
  const sanitized = stripAnsiCodes(value);
  return sanitized
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith('[plugins]'))
    .join('\n');
};

const getLatestAgentSession = async (agentId: string, config: OpenClawConfig) => {
  try {
    const sessions = await runOpenClawJsonCommand<OpenClawCliSessions>(['sessions', '--all-agents', '--json'], config);
    return sessions.sessions
      .filter((session) => (session.agentId || 'main') === agentId)
      .sort((left, right) => right.updatedAt - left.updatedAt)[0] || null;
  } catch {
    return null;
  }
};

const sanitizeDiagnosticLines = (text: string) => text
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter((line) => Boolean(line.trim()) && !line.startsWith('[plugins]'))
  .slice(0, 120);

const summarizeDiagnostic = (id: string, lines: string[]) => {
  if (id === 'status') {
    return lines.find((line) => line.includes('Gateway')) || lines.find((line) => line.includes('Summary:')) || lines[0] || 'No summary.';
  }
  if (id === 'gateway-status') {
    return lines.find((line) => line.startsWith('Listening:')) || lines.find((line) => line.startsWith('Service:')) || lines[0] || 'No summary.';
  }
  return lines.find((line) => line.startsWith('Telegram:')) || lines.find((line) => line.startsWith('Agents:')) || lines[0] || 'No summary.';
};

const inferDiagnosticTone = (summary: string, lines: string[]): ServiceTone => {
  const text = [summary, ...lines].join('\n').toLowerCase();
  if (text.includes(' not loaded') || text.includes('not installed') || text.includes('missing') || text.includes('warn ')) {
    return 'warning';
  }
  if (text.includes('error') || text.includes('failed') || text.includes('critical')) {
    return 'critical';
  }
  if (text.includes('ok') || text.includes('reachable') || text.includes('configured') || text.includes('listening')) {
    return 'healthy';
  }
  return 'neutral';
};

const getDiagnostics = async (config: OpenClawConfig): Promise<OpenClawDashboardSnapshot['diagnostics']> => {
  if (diagnosticsCache && Date.now() - diagnosticsCache.capturedAt < DIAGNOSTIC_CACHE_MS) {
    return diagnosticsCache.items;
  }

  const commands = [
    { id: 'health', title: 'Health', command: buildOpenClawCliCommand(['health']) },
    { id: 'gateway-status', title: 'Gateway Status', command: buildOpenClawCliCommand(['gateway', 'status']) },
    { id: 'status', title: 'System Status', command: buildOpenClawCliCommand(['status']) },
  ] as const;

  const items = await Promise.all(commands.map(async (item) => {
    const result = await runShellCommandSafe(item.command, config.workspaceRoot || process.cwd(), MAX_OUTPUT_LENGTH, config.remote);
    const lines = sanitizeDiagnosticLines(result.stdout || result.stderr);
    const summary = summarizeDiagnostic(item.id, lines);
    return {
      id: item.id,
      title: item.title,
      command: item.command,
      summary,
      tone: inferDiagnosticTone(summary, lines),
      updatedAt: new Date().toISOString(),
      excerpt: lines.slice(0, 16),
    };
  }));

  diagnosticsCache = {
    capturedAt: Date.now(),
    items,
  };
  return items;
};

type OpenClawCliAgent = {
  id: string;
  name?: string;
  identityName?: string;
  identityEmoji?: string;
  workspace: string;
  agentDir: string;
  model: string;
  bindings: number;
  isDefault: boolean;
  routes?: string[];
};

type OpenClawCliSessions = {
  sessions: Array<{
    key: string;
    updatedAt: number;
    ageMs?: number;
    sessionId?: string;
    abortedLastRun?: boolean;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    model?: string;
    modelProvider?: string;
    agentId?: string;
    kind?: string;
  }>;
};

type OpenClawCliHealth = {
  channels?: Record<string, {
    configured?: boolean;
    running?: boolean;
    probe?: { ok?: boolean } | null;
    accounts?: Record<string, {
      configured?: boolean;
      running?: boolean;
      probe?: { ok?: boolean } | null;
    }>;
  }>;
};

type OpenClawCliModelList = {
  count?: number;
  models?: Array<{
    key?: string;
    name?: string;
    input?: string;
    contextWindow?: number;
    local?: boolean;
    available?: boolean;
    tags?: string[];
    missing?: boolean;
  }>;
};

type OpenClawCliModelStatus = {
  agentId?: string;
  defaultModel?: string;
  resolvedDefault?: string;
  allowed?: string[];
  fallbacks?: string[];
};

const inferAgentStatus = (ageMs: number | null, abortedLastRun: boolean): { status: OpenClawAgentSnapshot['status']; tone: ServiceTone } => {
  if (ageMs === null) return { status: 'offline', tone: 'neutral' };
  if (abortedLastRun) return { status: 'warm', tone: 'warning' };
  if (ageMs < 30 * 60 * 1000) return { status: 'active', tone: 'healthy' };
  if (ageMs < 6 * 60 * 60 * 1000) return { status: 'warm', tone: 'healthy' };
  return { status: 'idle', tone: 'neutral' };
};

const getAgentSnapshots = async (config: OpenClawConfig): Promise<OpenClawAgentSnapshot[]> => {
  if (agentCache && Date.now() - agentCache.capturedAt < AGENT_CACHE_MS) {
    return agentCache.items;
  }

  const [agentsResult, sessionsResult, healthResult] = await Promise.allSettled([
    runOpenClawJsonCommand<OpenClawCliAgent[]>(['agents', 'list', '--json'], config),
    runOpenClawJsonCommand<OpenClawCliSessions>(['sessions', '--all-agents', '--json'], config),
    runOpenClawJsonCommand<OpenClawCliHealth>(['health', '--json'], config),
  ]);

  const agentsPayload = agentsResult.status === 'fulfilled' ? agentsResult.value : [];
  const sessionsPayload = sessionsResult.status === 'fulfilled'
    ? sessionsResult.value
    : { sessions: [] };
  const healthPayload = healthResult.status === 'fulfilled' ? healthResult.value : {};

  const now = Date.now();
  const sessionsByAgent = sessionsPayload.sessions.reduce<Record<string, OpenClawCliSessions['sessions']>>((acc, session) => {
    const agentId = session.agentId || 'main';
    acc[agentId] = acc[agentId] || [];
    acc[agentId].push(session);
    return acc;
  }, {});

  const healthyChannelCount = Object.values(healthPayload.channels || {}).reduce((count, channel) => {
    if (channel.probe?.ok || channel.running) return count + 1;
    const accountOk = Object.values(channel.accounts || {}).some((account) => account.probe?.ok || account.running);
    return count + (accountOk ? 1 : 0);
  }, 0);

  const items = agentsPayload.map((agent) => {
    const override = config.agentIdentity?.[agent.id];
    const roleName = override?.roleName?.trim()
      || agent.id.toUpperCase();
    const displayName = override?.displayName?.trim()
      || agent.identityName
      || agent.name
      || agent.id;
    const sessions = (sessionsByAgent[agent.id] || []).sort((left, right) => right.updatedAt - left.updatedAt);
    const latest = sessions[0];
    const activeSessions = sessions.filter((session) => (session.ageMs ?? Math.max(0, now - session.updatedAt)) < 30 * 60 * 1000);
    const latestAgeMs = latest ? latest.ageMs ?? Math.max(0, now - latest.updatedAt) : null;
    const inferred = inferAgentStatus(latestAgeMs, Boolean(latest?.abortedLastRun));
    return {
      id: agent.id,
      roleName,
      displayName,
      emoji: override?.emoji || agent.identityEmoji,
      model: agent.model,
      workspace: agent.workspace,
      agentDir: agent.agentDir,
      isDefault: agent.isDefault,
      bindings: agent.bindings,
      routes: agent.routes || [],
      sessionCount: sessions.length,
      activeSessionCount: activeSessions.length,
      status: inferred.status,
      tone: healthyChannelCount > 0 ? inferred.tone : 'warning',
      latestSessionId: latest?.sessionId || null,
      latestSessionKey: latest?.key || null,
      latestKind: latest?.kind || null,
      latestModel: latest?.model || null,
      latestProvider: latest?.modelProvider || null,
      latestTokens: latest?.totalTokens ?? null,
      latestInputTokens: latest?.inputTokens ?? null,
      latestOutputTokens: latest?.outputTokens ?? null,
      latestUpdatedAt: latest ? new Date(latest.updatedAt).toISOString() : null,
      latestAgeMs,
      abortedLastRun: Boolean(latest?.abortedLastRun),
    };
  });

  agentCache = {
    capturedAt: Date.now(),
    items,
  };
  return items;
};

const getRuntimeSnapshot = async (config: OpenClawConfig) => {
  const remoteDefaults = getRemoteRuntimeDefaults(config);
  const [watchdogResult, gatewayResult] = await Promise.all([
    runShellCommandSafe(`launchctl list | grep -F "${WATCHDOG_LABEL}"`, config.workspaceRoot || process.cwd(), MAX_OUTPUT_LENGTH, config.remote),
    runShellCommandSafe(`lsof -nP -iTCP:${remoteDefaults.gatewayPort} -sTCP:LISTEN`, config.workspaceRoot || process.cwd(), MAX_OUTPUT_LENGTH, config.remote),
  ]);

  const gatewayLines = gatewayResult.stdout.split(/\r?\n/).filter(Boolean);
  const gatewayPid = gatewayLines[1]?.trim().split(/\s+/)[1] || null;

  return {
    connectionMode: remoteDefaults.connectionMode,
    connectionTarget: remoteDefaults.connectionTarget,
    gatewayPort: remoteDefaults.gatewayPort,
    gatewayUrl: `ws://127.0.0.1:${remoteDefaults.gatewayPort}`,
    dashboardUrl: remoteDefaults.dashboardUrl,
    sshTunnelCommand: remoteDefaults.sshTunnelCommand,
    watchdogLabel: WATCHDOG_LABEL,
    watchdogLoaded: watchdogResult.ok,
    gatewayListening: gatewayResult.ok,
    gatewayPid,
    stateDirectory: remoteDefaults.stateDirectory,
    tempLogDirectory: remoteDefaults.tempLogDirectory,
  };
};

const buildServiceSnapshot = async (service: OpenClawServiceConfig, remote?: OpenClawConfig['remote']): Promise<OpenClawServiceSnapshot> => {
  const cwd = service.workingDirectory || process.cwd();
  const statusCommand = service.commands?.status?.trim();

  if (!statusCommand) {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      status: 'not configured',
      tone: 'neutral',
      workingDirectory: service.workingDirectory,
      logPath: service.logPath,
      logTail: readLogTail(service.logPath),
      availableActions: (['start', 'stop', 'restart'] as OpenClawAction[]).filter((action) => Boolean(service.commands?.[action]?.trim())),
      statusCommand: undefined,
      metrics: service.metrics || [],
      lastCheckAt: new Date().toISOString(),
    };
  }

  const result = await runShellCommand(statusCommand, cwd, MAX_OUTPUT_LENGTH, remote);
  const interpreted = interpretServiceStatus(result.stdout, result.stderr, result.ok);
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    status: interpreted.status,
    tone: interpreted.tone,
    workingDirectory: service.workingDirectory,
    logPath: service.logPath,
    logTail: readLogTail(service.logPath),
    availableActions: (['start', 'stop', 'restart', 'status'] as OpenClawAction[]).filter((action) => Boolean(service.commands?.[action]?.trim())),
    statusCommand,
    metrics: service.metrics || [],
    lastCheckAt: new Date().toISOString(),
  };
};

export const getOpenClawDashboard = async (): Promise<OpenClawDashboardSnapshot> => {
  const { configPath, config } = loadConfig();
  const remoteDefaults = getRemoteRuntimeDefaults(config);
  const [services, runtime, diagnostics, agents] = await Promise.all([
    Promise.all(config.services.map((service) => buildServiceSnapshot(service, config.remote))),
    getRuntimeSnapshot(config),
    getDiagnostics(config),
    getAgentSnapshots(config),
  ]);
  const panels = config.panels.map((panel) => ({
    id: panel.id,
    title: panel.title,
    description: panel.description,
    path: panel.path,
    ...summarizeDirectory(panel.path),
  }));

  return {
    title: config.title,
    subtitle: config.subtitle,
    configPath,
    refreshIntervalMs: config.refreshIntervalMs,
    generatedAt: new Date().toISOString(),
    environment: {
      hostname: os.hostname(),
      platform: `${os.platform()} ${os.release()}`,
      nodeVersion: process.version,
      cwd: process.cwd(),
      openclawVersion: getOpenClawVersion(),
    },
    runtime,
    summary: {
      totalServices: services.length,
      healthyServices: services.filter((service) => service.tone === 'healthy').length,
      configurableServices: config.services.filter((service) => {
        const commands = service.commands || {};
        return Boolean(commands.start || commands.stop || commands.restart || commands.status);
      }).length,
      logBackedServices: services.filter((service) => service.logPath).length,
    },
    services,
    panels,
    links: config.links,
    shortcuts: [
      ...(remoteDefaults.connectionMode === 'local'
        ? [{
          id: 'gateway-dashboard',
          label: 'Open Dashboard',
          target: runtime.dashboardUrl,
          kind: 'url' as const,
          description: '打开 OpenClaw 自带控制台。',
        }, {
          id: 'state-dir',
          label: 'Open State Dir',
          target: runtime.stateDirectory,
          kind: 'path' as const,
          description: '打开 ~/.openclaw 状态目录。',
        }, {
          id: 'temp-log-dir',
          label: 'Open Temp Logs',
          target: runtime.tempLogDirectory,
          kind: 'path' as const,
          description: '打开 /tmp/openclaw 临时日志目录。',
        }]
        : []),
      {
        id: 'config-file',
        label: 'Open Config',
        target: configPath,
        kind: 'path',
        description: '打开当前管理页配置文件。',
      },
    ],
    diagnostics,
    agents,
    activity: getOpenClawActivity(),
    agentRuns: getOpenClawAgentRuns(),
    guidance: [
      fileExists(configPath)
        ? `当前配置文件: ${configPath}`
        : `尚未创建配置文件，使用内置默认值。可在 ${configPath} 填入真实命令。`,
      `执行历史文件: ${getOpenClawStorePath()}`,
      remoteDefaults.connectionMode === 'ssh'
        ? `当前通过 SSH 连接到 ${remoteDefaults.connectionTarget}`
        : '当前直接连接本机 OpenClaw 进程',
      runtime.sshTunnelCommand
        ? `如需打开远端原生 Dashboard，请先执行: ${runtime.sshTunnelCommand}`
        : '当前无需 SSH 隧道',
      runtime.watchdogLoaded
        ? `watchdog 已加载: ${runtime.watchdogLabel}`
        : `watchdog 未加载: ${runtime.watchdogLabel}`,
      runtime.gatewayListening
        ? `Gateway 正在监听 127.0.0.1:${runtime.gatewayPort}`
        : `Gateway 当前未监听 127.0.0.1:${runtime.gatewayPort}`,
      '助理可在 openclaw.config.json 的 agentIdentity / agentConsole 字段按 id 配置岗位名、昵称、emoji、下发偏好与高级扩展项。',
      '建议先给每个服务配置 status/start/stop/restart 命令，再用这个面板执行。',
      '日志读取只展示尾部几行，避免本地大文件拖慢页面。',
    ],
  };
};

export const runOpenClawAction = async (serviceId: string, action: OpenClawAction): Promise<OpenClawCommandResult> => {
  const { config } = loadConfig();
  const service = config.services.find((item) => item.id === serviceId);
  if (!service) {
    throw new ApiError('service_not_found', 'Service not found.');
  }

  const command = service.commands?.[action]?.trim();
  if (!command) {
    throw new ApiError('action_not_configured', `Action "${action}" is not configured for ${service.name}.`);
  }

  const cwd = service.workingDirectory || process.cwd();
  const execution = await runShellCommand(command, cwd, MAX_OUTPUT_LENGTH, config.remote);
  const result: OpenClawCommandResult = {
    id: `${serviceId}-${action}-${Date.now()}`,
    serviceId,
    serviceName: service.name,
    action,
    command,
    cwd,
    ok: execution.ok,
    code: execution.code,
    durationMs: execution.durationMs,
    stdout: execution.stdout,
    stderr: execution.stderr,
    createdAt: toIso(Date.now()),
  };

  updateOpenClawActivity((current) => [result, ...current].slice(0, MAX_HISTORY));
  diagnosticsCache = null;
  agentCache = null;

  return result;
};

export const runOpenClawRuntimeAction = async (action: OpenClawRuntimeAction): Promise<OpenClawCommandResult> => {
  const { config } = loadConfig();
  const cwd = config.workspaceRoot || process.cwd();

  let command = '';
  let serviceName = 'Runtime';
  if (action === 'repair-watchdog') {
    if (!fileExists(WATCHDOG_PLIST_PATH)) {
      throw new ApiError('runtime_action_failed', `Watchdog plist not found: ${WATCHDOG_PLIST_PATH}`);
    }
    command = `launchctl bootstrap gui/$(id -u) ${quoteShellArg(WATCHDOG_PLIST_PATH)} || launchctl kickstart -k gui/$(id -u)/${WATCHDOG_LABEL}`;
    serviceName = 'Watchdog Repair';
  } else {
    const runtime = await getRuntimeSnapshot(config);
    if (!runtime.gatewayPid) {
      throw new ApiError('runtime_action_failed', 'Gateway PID is unavailable, cannot send SIGHUP.');
    }
    command = `kill -HUP ${quoteShellArg(runtime.gatewayPid)}`;
    serviceName = 'Gateway Reload';
  }

  const execution = await runShellCommand(command, cwd, MAX_OUTPUT_LENGTH, config.remote);
  const result: OpenClawCommandResult = {
    id: `runtime-${action}-${Date.now()}`,
    serviceId: 'runtime',
    serviceName,
    action: 'status',
    command,
    cwd,
    ok: execution.ok,
    code: execution.code,
    durationMs: execution.durationMs,
    stdout: execution.stdout,
    stderr: execution.stderr,
    createdAt: toIso(Date.now()),
  };

  updateOpenClawActivity((current) => [result, ...current].slice(0, MAX_HISTORY));
  diagnosticsCache = null;
  agentCache = null;

  return result;
};

export const getOpenClawConfigDocument = () => {
  const { configPath } = loadConfig();
  const content = fileExists(configPath)
    ? fs.readFileSync(configPath, 'utf8')
    : JSON.stringify(DEFAULT_CONFIG, null, 2);

  return {
    configPath,
    content,
  };
};

export const saveOpenClawConfigDocument = async (content: string, reloadGateway = false) => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new ApiError('config_save_failed', 'Config content is empty.');
  }

  try {
    JSON.parse(trimmed);
  } catch (error) {
    throw new ApiError('invalid_json', error instanceof Error ? `JSON 解析失败：${error.message}` : 'JSON 解析失败。');
  }

  const { configPath } = loadConfig();
  fs.writeFileSync(configPath, `${trimmed}\n`, 'utf8');
  diagnosticsCache = null;
  agentCache = null;

  const saved = getOpenClawConfigDocument();
  const reload = reloadGateway ? await runOpenClawRuntimeAction('reload-gateway-config') : undefined;

  return {
    config: saved,
    reload,
  };
};

export const runOpenClawAgentCommand = async (input: {
  agentId: string;
  message: string;
  thinking?: 'off' | 'minimal' | 'low' | 'medium' | 'high';
  sessionId?: string;
}) => {
  const { config } = loadConfig();
  const agentId = input.agentId.trim();
  const message = input.message.trim();
  if (!agentId) {
    throw new ApiError('agent_id_required', 'agentId is required.');
  }
  if (!message) {
    throw new ApiError('message_required', 'message is required.');
  }

  const buildArgs = (sessionId?: string) => {
    const args = ['agent', '--agent', agentId, '--message', message, '--json'];
    if (input.thinking) {
      args.push('--thinking', input.thinking);
    }
    if (sessionId?.trim()) {
      args.push('--session-id', sessionId.trim());
    }
    return args;
  };

  const requestedSessionId = input.sessionId?.trim() || undefined;
  let usedSessionId = requestedSessionId;
  let payload: {
    status?: string;
    summary?: string;
    result?: {
      payloads?: Array<{ text?: string | null }>;
      meta?: {
        durationMs?: number;
        agentMeta?: {
          sessionId?: string;
          provider?: string;
          model?: string;
          usage?: {
            input?: number;
            output?: number;
            total?: number;
          };
        };
      };
    };
  };
  try {
    payload = await runOpenClawJsonCommand(buildArgs(requestedSessionId), config);
  } catch (error) {
    if (!requestedSessionId) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('agent_command_failed', error instanceof Error ? error.message : 'Agent command failed.');
    }
    payload = await runOpenClawJsonCommand(buildArgs(undefined), config);
    usedSessionId = undefined;
  }

  const record: OpenClawAgentRunRecord = {
    id: `${agentId}-${Date.now()}`,
    agentId,
    sessionId: payload.result?.meta?.agentMeta?.sessionId || usedSessionId || null,
    message,
    reply: payload.result?.payloads?.map((item) => item.text || '').filter(Boolean).join('\n\n') || '',
    status: payload.status || 'unknown',
    summary: payload.summary || 'completed',
    durationMs: payload.result?.meta?.durationMs ?? null,
    provider: payload.result?.meta?.agentMeta?.provider || null,
    model: payload.result?.meta?.agentMeta?.model || null,
    usage: {
      input: payload.result?.meta?.agentMeta?.usage?.input ?? null,
      output: payload.result?.meta?.agentMeta?.usage?.output ?? null,
      total: payload.result?.meta?.agentMeta?.usage?.total ?? null,
    },
    createdAt: new Date().toISOString(),
  };

  updateOpenClawAgentRuns((current) => [record, ...current].slice(0, MAX_AGENT_RUNS));
  agentCache = null;
  diagnosticsCache = null;

  return record;
};

export const runOpenClawAgentCommandStream = async (
  input: {
    agentId: string;
    message: string;
    thinking?: 'off' | 'minimal' | 'low' | 'medium' | 'high';
    sessionId?: string;
  },
  onEvent?: (event: OpenClawAgentCommandStreamEvent) => void,
) => {
  const { config } = loadConfig();
  const agentId = input.agentId.trim();
  const message = input.message.trim();
  if (!agentId) {
    throw new ApiError('agent_id_required', 'agentId is required.');
  }
  if (!message) {
    throw new ApiError('message_required', 'message is required.');
  }

  const remoteDefaults = getRemoteRuntimeDefaults(config);
  const cwd = config.workspaceRoot || process.cwd();
  const executeAttempt = async (sessionId?: string) => {
    const args = ['agent', '--agent', agentId, '--message', message];
    if (input.thinking) {
      args.push('--thinking', input.thinking);
    }
    if (sessionId?.trim()) {
      args.push('--session-id', sessionId.trim());
    }
    const command = buildOpenClawCliCommand(args);
    const startedAt = Date.now();
    onEvent?.({
      type: 'start',
      agentId,
      startedAt: toIso(startedAt),
      sessionId: sessionId?.trim() || null,
    });

    const timeoutMs = sessionId?.trim() ? 35000 : 120000;
    const streamed = await new Promise<{
      ok: boolean;
      code: number | null;
      reply: string;
      stderr: string;
      durationMs: number;
    }>((resolve) => {
      const child = remoteDefaults.remote.mode === 'ssh' && remoteDefaults.remote.sshTarget
        ? spawn('/usr/bin/ssh', [
          '-o', 'BatchMode=yes',
          '-o', 'ConnectTimeout=5',
          '-o', 'StrictHostKeyChecking=accept-new',
          ...(remoteDefaults.remote.port ? ['-p', String(remoteDefaults.remote.port)] : []),
          ...(remoteDefaults.remote.identityFile ? ['-i', remoteDefaults.remote.identityFile] : []),
          remoteDefaults.remote.sshTarget,
          `cd ${quoteShellArg(cwd)} && ${command}`,
        ], {
          cwd: process.cwd(),
          env: buildShellEnv(),
        })
        : spawn('/bin/zsh', ['-lc', command], {
          cwd,
          env: buildShellEnv(),
        });

      let stdout = '';
      let stderr = '';
      let settled = false;

      const finish = (payload: { ok: boolean; code: number | null; reply: string; stderr: string }) => {
        if (settled) return;
        settled = true;
        resolve({
          ...payload,
          durationMs: Date.now() - startedAt,
        });
      };

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        finish({
          ok: false,
          code: null,
          reply: stdout.slice(0, 250000),
          stderr: `${stderr}\n命令执行超时（${Math.round(timeoutMs / 1000)}秒）。`.trim().slice(0, 250000),
        });
      }, timeoutMs);

      child.stdout.on('data', (chunk) => {
        const raw = chunk.toString();
        const cleaned = sanitizeStreamChunk(raw);
        if (!cleaned) return;
        stdout += cleaned;
        onEvent?.({
          type: 'delta',
          agentId,
          chunk: cleaned,
          reply: stdout,
        });
      });

      child.stderr.on('data', (chunk) => {
        const cleaned = sanitizeStreamChunk(chunk.toString());
        if (cleaned) {
          stderr += cleaned;
        }
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        finish({
          ok: false,
          code: null,
          reply: stdout.slice(0, 250000),
          stderr: `${stderr}\n${error.message}`.trim().slice(0, 250000),
        });
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        finish({
          ok: code === 0,
          code,
          reply: stdout.slice(0, 250000).trim(),
          stderr: stderr.slice(0, 250000).trim(),
        });
      });
    });

    if (!streamed.ok) {
      const messageText = trimOutput(streamed.stderr || streamed.reply || 'Agent command failed.');
      throw new ApiError('agent_command_failed', messageText);
    }
    return streamed;
  };

  const requestedSessionId = input.sessionId?.trim() || undefined;
  let usedSessionId = requestedSessionId;
  let streamed: Awaited<ReturnType<typeof executeAttempt>>;
  try {
    streamed = await executeAttempt(requestedSessionId);
  } catch (error) {
    if (!requestedSessionId) {
      const messageText = error instanceof Error ? error.message : '助理命令执行失败。';
      onEvent?.({ type: 'error', agentId, message: messageText });
      if (error instanceof ApiError) throw error;
      throw new ApiError('agent_command_failed', messageText);
    }
    try {
      streamed = await executeAttempt(undefined);
      usedSessionId = undefined;
    } catch (retryError) {
      const messageText = retryError instanceof Error ? retryError.message : 'Agent command failed.';
      onEvent?.({ type: 'error', agentId, message: messageText });
      if (retryError instanceof ApiError) throw retryError;
      throw new ApiError('agent_command_failed', messageText);
    }
  }

  const latestSession = await getLatestAgentSession(agentId, config);
  const record: OpenClawAgentRunRecord = {
    id: `${agentId}-${Date.now()}`,
    agentId,
    sessionId: latestSession?.sessionId || usedSessionId || null,
    message,
    reply: streamed.reply,
    status: 'completed',
    summary: 'completed',
    durationMs: streamed.durationMs,
    provider: latestSession?.modelProvider || null,
    model: latestSession?.model || null,
    usage: {
      input: latestSession?.inputTokens ?? null,
      output: latestSession?.outputTokens ?? null,
      total: latestSession?.totalTokens ?? null,
    },
    createdAt: new Date().toISOString(),
  };

  updateOpenClawAgentRuns((current) => [record, ...current].slice(0, MAX_AGENT_RUNS));
  agentCache = null;
  diagnosticsCache = null;
  onEvent?.({ type: 'done', record });
  return record;
};

const uniqueStrings = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

export const getOpenClawAgentModels = async (agentIdRaw: string): Promise<OpenClawAgentModelSnapshot> => {
  const { config } = loadConfig();
  const agentId = agentIdRaw.trim();
  if (!agentId) {
    throw new ApiError('agent_id_required', 'agentId is required.');
  }

  const [statusPayload, listPayload] = await Promise.all([
    runOpenClawJsonCommand<OpenClawCliModelStatus>(['models', '--agent', agentId, 'status', '--json'], config),
    runOpenClawJsonCommand<OpenClawCliModelList>(['models', '--agent', agentId, 'list', '--json'], config),
  ]);

  const models = (listPayload.models || [])
    .map((item) => ({
      key: (item.key || '').trim(),
      name: (item.name || item.key || '').trim(),
      input: item.input,
      contextWindow: typeof item.contextWindow === 'number' ? item.contextWindow : null,
      local: item.local === true,
      available: item.available !== false,
      tags: Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === 'string') : [],
      missing: item.missing === true,
    }))
    .filter((item) => Boolean(item.key));

  const defaultModel = (statusPayload.defaultModel || '').trim() || null;
  const resolvedDefault = (statusPayload.resolvedDefault || '').trim() || null;
  const consolePreference = config.agentConsole?.[agentId];
  const consoleOverrideModel = typeof consolePreference?.modelLabelOverride === 'string'
    ? consolePreference.modelLabelOverride.trim() || null
    : null;
  const consoleOverrideProvider = typeof consolePreference?.providerLabelOverride === 'string'
    ? consolePreference.providerLabelOverride.trim() || null
    : null;
  const effectiveModel = consoleOverrideModel || resolvedDefault || defaultModel;
  const allowed = uniqueStrings((statusPayload.allowed || []).map((item) => item.trim()));
  const fallbacks = uniqueStrings((statusPayload.fallbacks || []).map((item) => item.trim()));
  const existingKeys = new Set(models.map((item) => item.key));

  for (const key of uniqueStrings([
    ...(defaultModel ? [defaultModel] : []),
    ...(resolvedDefault ? [resolvedDefault] : []),
    ...(consoleOverrideModel ? [consoleOverrideModel] : []),
    ...allowed,
    ...fallbacks,
  ])) {
    if (existingKeys.has(key)) continue;
    models.push({
      key,
      name: key,
      input: undefined,
      contextWindow: null,
      local: false,
      available: true,
      tags: [],
      missing: false,
    });
    existingKeys.add(key);
  }

  return {
    agentId: statusPayload.agentId || agentId,
    defaultModel,
    resolvedDefault,
    effectiveModel,
    consoleOverrideModel,
    consoleOverrideProvider,
    allowed,
    fallbacks,
    models,
    updatedAt: new Date().toISOString(),
  };
};

export const setOpenClawAgentModel = async (agentIdRaw: string, modelKeyRaw: string): Promise<OpenClawAgentModelSnapshot> => {
  const { config } = loadConfig();
  const agentId = agentIdRaw.trim();
  const modelKey = modelKeyRaw.trim();
  if (!agentId || !modelKey) {
    throw new ApiError('agent_models_failed', 'agentId and modelKey are required.');
  }

  const command = buildOpenClawCliCommand(['models', '--agent', agentId, 'set', modelKey]);
  const result = await runShellCommand(command, config.workspaceRoot || process.cwd(), 250000, config.remote);
  if (!result.ok) {
    throw new ApiError('set_agent_model_failed', trimOutput(result.stderr || result.stdout || '切换模型失败。'));
  }

  // Keep console-side override aligned with the CLI switch, so UI and actual runtime stay in sync.
  persistAgentModelOverride(agentId, modelKey);
  agentCache = null;
  diagnosticsCache = null;
  return getOpenClawAgentModels(agentId);
};

export const runOpenClawShortcut = async (kind: ShortcutKind, target: string) => {
  const { config } = loadConfig();
  const remoteDefaults = getRemoteRuntimeDefaults(config);
  const trimmedTarget = target.trim();
  if (!trimmedTarget) {
    throw new ApiError('shortcut_target_required', 'Shortcut target is required.');
  }

  if (kind === 'url') {
    if (!/^https?:\/\//.test(trimmedTarget)) {
      throw new ApiError('invalid_url', 'Only http/https URLs are allowed.');
    }
  } else if (!path.isAbsolute(trimmedTarget)) {
    throw new ApiError('invalid_path', 'Only absolute paths are allowed.');
  }

  if (remoteDefaults.connectionMode === 'ssh' && kind === 'path' && trimmedTarget !== DEFAULT_CONFIG_PATH) {
    throw new ApiError('remote_path_not_allowed', 'Remote mode cannot open Mac mini paths directly. Use SSH or tunnel first.');
  }

  const command = kind === 'url'
    ? `open ${JSON.stringify(trimmedTarget)}`
    : `open ${JSON.stringify(trimmedTarget)}`;
  const execution = await runShellCommand(command, process.cwd());
  if (!execution.ok) {
    throw new ApiError('shortcut_failed', execution.stderr || execution.stdout || 'Shortcut action failed.');
  }

  return {
    ok: true,
    target: trimmedTarget,
    kind,
  };
};
