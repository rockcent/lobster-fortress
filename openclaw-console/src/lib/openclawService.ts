export type OpenClawAction = 'start' | 'stop' | 'restart' | 'status';
export type OpenClawRuntimeAction = 'repair-watchdog' | 'reload-gateway-config';

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
  tone: 'healthy' | 'warning' | 'critical' | 'neutral';
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

export interface OpenClawDashboard {
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
    openclawVersion: string | null;
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
  services: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    tone: 'healthy' | 'warning' | 'critical' | 'neutral';
    workingDirectory?: string;
    logPath?: string;
    logTail: string[];
    availableActions: OpenClawAction[];
    statusCommand?: string;
    metrics: Array<{ label: string; value: string; trend?: string }>;
    lastCheckAt: string;
  }>;
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
    kind: 'url' | 'path';
    description: string;
  }>;
  diagnostics: Array<{
    id: string;
    title: string;
    command: string;
    summary: string;
    tone: 'healthy' | 'warning' | 'critical' | 'neutral';
    updatedAt: string;
    excerpt: string[];
  }>;
  activity: OpenClawCommandResult[];
  agents: OpenClawAgentSnapshot[];
  agentRuns: OpenClawAgentRunRecord[];
  guidance: string[];
}

export interface OpenClawConfigDocument {
  configPath: string;
  content: string;
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

export type OpenClawAgentStreamEvent =
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

interface OpenClawRunAgentInput {
  agentId: string;
  message: string;
  thinking?: 'off' | 'minimal' | 'low' | 'medium' | 'high';
  sessionId?: string;
}

type ErrorResponse = { error: { message: string } };

const readJson = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json()) as T | ErrorResponse;
  if (!response.ok) {
    throw new Error(
      typeof payload === 'object'
      && payload !== null
      && 'error' in payload
      && payload.error
      && typeof payload.error === 'object'
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
        ? payload.error.message
        : 'Request failed.',
    );
  }
  return payload as T;
};

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json() as ErrorResponse;
    if (payload?.error?.message) {
      return payload.error.message;
    }
  } catch {
    return 'Request failed.';
  }
  return 'Request failed.';
};

export const openclawService = {
  async getDashboard() {
    const response = await fetch('/api/openclaw/dashboard');
    const payload = await readJson<{ data: OpenClawDashboard }>(response);
    return payload.data;
  },

  async runAction(serviceId: string, action: OpenClawAction) {
    const response = await fetch('/api/openclaw/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serviceId, action }),
    });
    const payload = await readJson<{ data: OpenClawCommandResult }>(response);
    return payload.data;
  },

  async runRuntimeAction(action: OpenClawRuntimeAction) {
    const response = await fetch('/api/openclaw/runtime-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });
    const payload = await readJson<{ data: OpenClawCommandResult }>(response);
    return payload.data;
  },

  async runShortcut(kind: 'url' | 'path', target: string) {
    const response = await fetch('/api/openclaw/shortcut', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ kind, target }),
    });
    const payload = await readJson<{ data: { ok: boolean; target: string; kind: 'url' | 'path' } }>(response);
    return payload.data;
  },

  async runAgent(input: OpenClawRunAgentInput) {
    const response = await fetch('/api/openclaw/agent-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    const payload = await readJson<{ data: OpenClawAgentRunRecord }>(response);
    return payload.data;
  },

  async runAgentStream(
    input: OpenClawRunAgentInput,
    handlers?: {
      onStart?: (event: Extract<OpenClawAgentStreamEvent, { type: 'start' }>) => void;
      onDelta?: (event: Extract<OpenClawAgentStreamEvent, { type: 'delta' }>) => void;
      onDone?: (event: Extract<OpenClawAgentStreamEvent, { type: 'done' }>) => void;
      onError?: (event: Extract<OpenClawAgentStreamEvent, { type: 'error' }>) => void;
    },
  ) {
    const response = await fetch('/api/openclaw/agent-command-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }
    if (!response.body) {
      throw new Error('流式通道未建立。');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let record: OpenClawAgentRunRecord | null = null;

    const handleLine = (line: string) => {
      if (!line.trim()) return;
      const event = JSON.parse(line) as OpenClawAgentStreamEvent;
      if (event.type === 'start') {
        handlers?.onStart?.(event);
        return;
      }
      if (event.type === 'delta') {
        handlers?.onDelta?.(event);
        return;
      }
      if (event.type === 'done') {
        record = event.record;
        handlers?.onDone?.(event);
        return;
      }
      if (event.type === 'error') {
        handlers?.onError?.(event);
        throw new Error(event.message || '流式任务失败。');
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let lineBreak = buffer.indexOf('\n');
      while (lineBreak >= 0) {
        const line = buffer.slice(0, lineBreak);
        buffer = buffer.slice(lineBreak + 1);
        handleLine(line);
        lineBreak = buffer.indexOf('\n');
      }
    }

    const tail = buffer.trim();
    if (tail) {
      handleLine(tail);
    }

    if (!record) {
      throw new Error('流式任务已结束，但没有返回最终结果。');
    }

    return record;
  },

  async getAgentModels(agentId: string) {
    const endpoints = [
      `/api/openclaw/agent-models?agentId=${encodeURIComponent(agentId)}`,
      `/api/openclaw/models?agentId=${encodeURIComponent(agentId)}`,
    ];
    let lastError: unknown = null;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        const payload = await readJson<{ data: OpenClawAgentModelSnapshot }>(response);
        return payload.data;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('读取模型列表失败。');
  },

  async setAgentModel(agentId: string, modelKey: string) {
    const requestBody = JSON.stringify({ agentId, modelKey });
    const endpoints = ['/api/openclaw/agent-models', '/api/openclaw/models'];
    let lastError: unknown = null;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
        });
        const payload = await readJson<{ data: OpenClawAgentModelSnapshot }>(response);
        return payload.data;
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new Error('切换模型失败。');
  },

  async getConfig() {
    const response = await fetch('/api/openclaw/config');
    const payload = await readJson<{ data: OpenClawConfigDocument }>(response);
    return payload.data;
  },

  async saveConfig(content: string, reloadGateway = false) {
    const response = await fetch('/api/openclaw/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, reloadGateway }),
    });
    const payload = await readJson<{ data: { config: OpenClawConfigDocument; reload?: OpenClawCommandResult } }>(response);
    return payload.data;
  },
};
