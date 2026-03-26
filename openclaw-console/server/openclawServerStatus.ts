import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'path';

export interface ServerHealthStatus {
  id: string;
  label: string;
  description: string;
  status: 'ok' | 'error' | 'idle' | 'offline';
  detail: string;
  lastChecked: string;
}

const runShellCheck = (command: string, timeoutMs = 5000): string => {
  try {
    return execSync(command, {
      encoding: 'utf8',
      timeout: timeoutMs,
      maxBuffer: 64 * 1024,
    }).trim();
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error) {
      const e = error as { status: number; message?: string };
      return `exit:${e.status} ${e.message || ''}`;
    }
    if (error instanceof Error) return `error:${error.message}`;
    return 'error:unknown';
  }
};

const checkJetSeekStatus = (): ServerHealthStatus => {
  const now = new Date().toISOString();
  const jetSeekCheck = runShellCheck('pgrep -fl "jetseek" | grep -v grep || echo "not_running"');
  const isRunning = !jetSeekCheck.startsWith('not_running') && !jetSeekCheck.startsWith('error');

  if (isRunning) {
    const pidMatch = jetSeekCheck.match(/^\s*(\d+)/);
    const pid = pidMatch ? pidMatch[1] : 'unknown';
    return {
      id: 'jetseek',
      label: 'JetSeek',
      description: '本地向量数据库服务',
      status: 'ok',
      detail: `运行中 (PID ${pid})`,
      lastChecked: now,
    };
  }

  return {
    id: 'jetseek',
    label: 'JetSeek',
    description: '本地向量数据库服务',
    status: 'ok',
    detail: '未运行（仅本地开发使用）',
    lastChecked: now,
  };
};

const checkAliyunStatus = (): ServerHealthStatus => {
  const now = new Date().toISOString();
  const HOST = '8.229.39.13';
  const PORT = 22;

  // Check ping first
  const pingResult = runShellCheck(`ping -c 1 -W 3 ${HOST} 2>&1 | head -3`, 5000);
  const isPingOk = pingResult.includes('1 packets transmitted') && pingResult.includes('1 received');

  if (!isPingOk) {
    return {
      id: 'aliyun',
      label: '阿里云服务器',
      description: `SSH ${HOST}`,
      status: 'error',
      detail: '服务器 ping 不通',
      lastChecked: now,
    };
  }

  // Check SSH connectivity
  const sshCheck = runShellCheck(
    `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes rcdeploy@${HOST} echo ok 2>&1`,
    8000,
  );
  const isSshOk = sshCheck.includes('ok');

  if (isSshOk) {
    return {
      id: 'aliyun',
      label: '阿里云服务器',
      description: `SSH ${HOST}`,
      status: 'ok',
      detail: 'SSH 在线',
      lastChecked: now,
    };
  }

  return {
    id: 'aliyun',
    label: '阿里云服务器',
    description: `SSH ${HOST}`,
    status: 'error',
    detail: `SSH 连接失败: ${sshCheck.slice(0, 80)}`,
    lastChecked: now,
  };
};

const checkHuangdaxianStatus = (): ServerHealthStatus => {
  const now = new Date().toISOString();
  const LABEL = 'com.rockcent.www';

  const checkResult = runShellCheck(
    `launchctl list | grep -F "${LABEL}" | head -3`,
  );

  if (checkResult.includes('"PID"') || /\d+\s+$/.test(checkResult)) {
    const pidMatch = checkResult.match(/"PID"\s+(\d+)/) || checkResult.match(/(\d+)\s+\(/);
    const pid = pidMatch ? pidMatch[1] : '?';
    return {
      id: 'huangdaxian',
      label: '黄大仙服务',
      description: 'LaunchAgent: com.rockcent.www',
      status: 'ok',
      detail: `运行中 (PID ${pid})`,
      lastChecked: now,
    };
  }

  if (!checkResult.trim()) {
    return {
      id: 'huangdaxian',
      label: '黄大仙服务',
      description: 'LaunchAgent: com.rockcent.www',
      status: 'idle',
      detail: 'LaunchAgent 未加载',
      lastChecked: now,
    };
  }

  return {
    id: 'huangdaxian',
    label: '黄大仙服务',
    description: 'LaunchAgent: com.rockcent.www',
    status: 'error',
    detail: checkResult.slice(0, 100),
    lastChecked: now,
  };
};

const checkOpenClawGatewayStatus = (): ServerHealthStatus => {
  const now = new Date().toISOString();
  const PORT = 18789;

  const lsofResult = runShellCheck(`lsof -nP -iTCP:${PORT} -sTCP:LISTEN 2>&1 | head -5`);
  const isListening = lsofResult.includes('LISTEN');

  if (isListening) {
    const pidMatch = lsofResult.match(/\S+\s+(\d+)\s+\w+/);
    const pid = pidMatch ? pidMatch[1] : '?';
    return {
      id: 'openclaw-gateway',
      label: 'OpenClaw Gateway',
      description: `本地网关 :${PORT}`,
      status: 'ok',
      detail: `监听中 (PID ${pid})`,
      lastChecked: now,
    };
  }

  return {
    id: 'openclaw-gateway',
    label: 'OpenClaw Gateway',
    description: `本地网关 :${PORT}`,
    status: 'error',
    detail: 'Gateway 未监听端口',
    lastChecked: now,
  };
};

export const getServerHealthStatuses = async (): Promise<ServerHealthStatus[]> => {
  return [
    checkOpenClawGatewayStatus(),
    checkJetSeekStatus(),
    checkAliyunStatus(),
    checkHuangdaxianStatus(),
  ];
};

export interface CronJobSummary {
  agentId: string;
  expression: string;
  description: string;
  enabled: boolean;
  nextRun: string | null;
  status: 'ok' | 'error' | 'idle' | 'disabled';
  lastRunAt: string | null;
}

const runOpenClawCommand = (args: string[], timeoutMs = 10000): string => {
  try {
    const output = execSync(`openclaw ${args.join(' ')}`, {
      encoding: 'utf8',
      timeout: timeoutMs,
      maxBuffer: 128 * 1024,
    });
    return output.trim();
  } catch (error: unknown) {
    if (error instanceof Error) return `error:${error.message}`;
    return 'error:unknown';
  }
};

const extractJsonFromOutput = (output: string): string => {
  const trimmed = output.trim();
  // Find where the JSON actually starts (skip plugin warnings like [plugins], [wecom])
  // Approach: find the first { that is NOT preceded by warning text content
  // Simple heuristic: find the first occurrence of '{"' or '{"' after any warning patterns
  const jsonStartMatch = trimmed.match(/\{[\s\S]*?"/);
  if (jsonStartMatch) {
    const startIdx = jsonStartMatch.index!;
    // Verify this is a real JSON start (not inside a warning line)
    const beforeSlice = trimmed.slice(Math.max(0, startIdx - 20), startIdx);
    if (!beforeSlice.includes('[plugins]') && !beforeSlice.includes('[wecom]')) {
      // Find the matching closing bracket
      let depth = 0, inString = false, escaped = false;
      for (let i = startIdx; i < trimmed.length; i++) {
        const ch = trimmed[i];
        if (escaped) { escaped = false; continue; }
        if (ch === '\\' && inString) { escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{' || ch === '[') { depth++; }
        else if (ch === '}' || ch === ']') { depth--; if (depth === 0) return trimmed.slice(startIdx, i + 1); }
      }
      // Fallback
      return trimmed.slice(startIdx);
    }
  }
  // Fallback: try to find any { that starts JSON
  const braceIdx = trimmed.indexOf('{');
  if (braceIdx >= 0) {
    let depth = 0, inString = false, escaped = false;
    for (let i = braceIdx; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\' && inString) { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{' || ch === '[') { depth++; }
      else if (ch === '}' || ch === ']') { depth--; if (depth === 0) return trimmed.slice(braceIdx, i + 1); }
    }
    return trimmed.slice(braceIdx);
  }
  return trimmed;
};

export const getAllAgentCrons = async (): Promise<CronJobSummary[]> => {
  const output = runOpenClawCommand(['cron', 'list', '--json']);

  if (output.startsWith('error:')) {
    return [];
  }

  let jsonStr: string;
  try {
    jsonStr = extractJsonFromOutput(output);
    if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
      throw new Error('No JSON found in output');
    }
  } catch {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonStr) as {
      crons?: Array<{
        id?: string;
        agentId?: string;
        expression?: string;
        description?: string;
        enabled?: boolean;
        nextRun?: string | number | null;
        lastRunAt?: string | number | null;
      }>;
      items?: Array<{
        id?: string;
        agentId?: string;
        expression?: string;
        description?: string;
        enabled?: boolean;
        nextRun?: string | number | null;
        lastRunAt?: string | number | null;
      }>;
      agents?: Record<string, {
        crons?: Array<{
          id?: string;
          expression?: string;
          description?: string;
          enabled?: boolean;
          nextRun?: string | number | null;
          lastRunAt?: string | number | null;
        }>;
      }>;
    };

    const jobs: CronJobSummary[] = [];

    if (Array.isArray(parsed.crons)) {
      for (const cron of parsed.crons) {
        jobs.push(mapCronJob(cron.agentId || 'unknown', cron));
      }
    }

    // Handle openclaw cron list --json format: { jobs: [...] }
    if (Array.isArray((parsed as any).jobs)) {
      for (const job of (parsed as any).jobs) {
        // Flatten nested state/schedule fields for mapCronJob
        const flat: Record<string, unknown> = { ...job };
        if (job.schedule && typeof job.schedule === 'object') {
          flat.expression = (job.schedule as any).expr;
        }
        if (job.state && typeof job.state === 'object') {
          flat.nextRun = (job.state as any).nextRunAtMs;
          flat.lastRunAt = (job.state as any).lastRunAtMs;
        }
        jobs.push(mapCronJob(job.agentId || 'unknown', flat));
      }
    }

    if (Array.isArray(parsed.items)) {
      for (const item of parsed.items) {
        jobs.push(mapCronJob(item.agentId || 'unknown', item));
      }
    }

    if (parsed.agents && typeof parsed.agents === 'object') {
      for (const [agentId, agentData] of Object.entries(parsed.agents)) {
        if (agentData && typeof agentData === 'object' && 'crons' in agentData) {
          const crons = (agentData as { crons?: unknown[] }).crons;
          if (Array.isArray(crons)) {
            for (const cron of crons) {
              jobs.push(mapCronJob(agentId, cron as Record<string, unknown>));
            }
          }
        }
      }
    }

    return jobs;
  } catch {
    return [];
  }
};

const mapCronJob = (agentId: string, raw: Record<string, unknown>): CronJobSummary => {
  const enabled = raw.enabled !== false;
  const nextRun = raw.nextRun;
  const lastRunAt = raw.lastRunAt;

  let status: CronJobSummary['status'] = 'idle';
  if (!enabled) {
    status = 'disabled';
  } else if (nextRun === null || nextRun === undefined) {
    status = 'idle';
  } else {
    const nextMs = typeof nextRun === 'number' ? nextRun : Date.now();
    const now = Date.now();
    if (nextMs < now - 3600000) {
      status = 'error';
    } else if (nextMs < now + 86400000) {
      status = 'ok';
    } else {
      status = 'idle';
    }
  }

  return {
    agentId,
    expression: String(raw.expression || ''),
    description: String(raw.description || ''),
    enabled,
    nextRun: nextRun !== undefined && nextRun !== null
      ? (typeof nextRun === 'number' ? new Date(nextRun).toISOString() : String(nextRun))
      : null,
    lastRunAt: lastRunAt !== undefined && lastRunAt !== null
      ? (typeof lastRunAt === 'number' ? new Date(lastRunAt).toISOString() : String(lastRunAt))
      : null,
    status,
  };
};
