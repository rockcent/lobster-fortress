import type { OpenClawAgentModelSnapshot } from './openclawService';

export const formatDateTime = (value?: string | null) => {
  if (!value) return '暂无';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export const formatAge = (ageMs?: number | null) => {
  if (ageMs === null || ageMs === undefined) return '暂无活动';
  const minutes = Math.round(ageMs / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.round(hours / 24);
  return `${days} 天前`;
};

export const compactText = (value?: string | null, maxLength = 96) => {
  const text = (value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(8, maxLength - 1)).trim()}…`;
};

export const summarizeOutput = (result: { stdout?: string; stderr?: string }) => {
  const text = [result.stdout, result.stderr].filter(Boolean).join('\n');
  return text.trim() || '(empty)';
};

export const percentile = (values: number[], target: number) => {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil((target / 100) * sorted.length) - 1);
  return sorted[Math.max(index, 0)];
};

export const tokenizeRecentUsage = (
  runs: Array<{ usage?: { total?: number | null } | null }>,
  fallback: number | null
) => {
  const series = runs
    .map((run) => run.usage?.total)
    .filter((value): value is number => typeof value === 'number' && value > 0)
    .slice(0, 8)
    .reverse();

  if (!series.length && fallback && fallback > 0) {
    return [fallback];
  }

  return series;
};

export const clampSeries = (values: number[], limit = 16) =>
  values
    .filter((value) => Number.isFinite(value) && value >= 0)
    .slice(-limit);

export const seriesToPoints = (values: number[], width = 180, height = 44) => {
  const series = clampSeries(values);
  if (!series.length) return '';
  const max = Math.max(...series, 1);
  return series
    .map((value, index) => {
      const x = series.length === 1 ? 0 : Math.round((index / (series.length - 1)) * width);
      const y = Math.round(height - ((value / max) * height));
      return `${x},${y}`;
    })
    .join(' ');
};

export const textHash = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const resolveModelFamily = (model?: string | null) => {
  const value = (model || '').toLowerCase();
  if (!value) return 'unknown';
  if (value.includes('minimax')) return 'minimax';
  if (value.includes('openai') || value.includes('gpt')) return 'openai';
  if (value.includes('gemini')) return 'gemini';
  if (value.includes('claude') || value.includes('anthropic')) return 'anthropic';
  const [first] = value.split('/');
  return first || 'unknown';
};

export const normalizeModelLabel = (raw: string) =>
  raw.includes('/') ? raw.split('/').at(-1) || raw : raw;

export const getFriendlyModelLabel = (raw: string, index: number) => {
  const value = raw.toLowerCase();
  if (
    value.includes('flash') ||
    value.includes('lite') ||
    value.includes('highspeed') ||
    value.includes('fast')
  ) {
    return `快速响应型 ${index + 1}（适合日常聊天）`;
  }
  if (
    value.includes('reason') ||
    value.includes('deep') ||
    value.includes('o1') ||
    value.includes('think')
  ) {
    return `深度思考型 ${index + 1}（适合复杂任务）`;
  }
  return `通用平衡型 ${index + 1}（适合多数任务）`;
};

export const estimateTokenCount = (value: string) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return 0;
  return Math.max(1, Math.ceil(normalized.length / 4));
};

export const formatJsonParseError = (raw: string, error: unknown) => {
  const fallback = error instanceof Error ? error.message : 'JSON 解析失败。';
  if (!(error instanceof Error)) return fallback;
  const match = error.message.match(/position\s+(\d+)/i);
  if (!match) return error.message;
  const position = Number(match[1]);
  if (!Number.isFinite(position) || position < 0) return error.message;
  const snippet = raw.slice(0, position);
  const line = snippet.split(/\r?\n/).length;
  const lastBreak = Math.max(snippet.lastIndexOf('\n'), snippet.lastIndexOf('\r'));
  const column = position - (lastBreak + 1) + 1;
  return `${error.message}（第 ${line} 行，第 ${column} 列）`;
};

export const explainModelDiagnosticFailure = (message: string) => {
  const text = message.toLowerCase();
  if (
    text.includes('api route not found') ||
    text.includes('not_found') ||
    text.includes('404')
  ) {
    return '控制台 API 路由未就绪，请重启 openclaw-console 后重试。';
  }
  if (
    text.includes('401') ||
    text.includes('invalid api key') ||
    text.includes('unauthorized')
  ) {
    return '模型提供方鉴权失败，请检查 API Key / Secret。';
  }
  if (
    text.includes('403') ||
    text.includes('forbidden') ||
    text.includes('permission')
  ) {
    return '当前账号没有该模型权限，请更换模型或提升权限。';
  }
  if (
    text.includes('429') ||
    text.includes('quota') ||
    text.includes('rate limit')
  ) {
    return '调用被限流或额度不足，请检查套餐额度与并发限制。';
  }
  if (
    text.includes('timeout') ||
    text.includes('timed out') ||
    text.includes('network')
  ) {
    return '链路超时或网络不可达，请检查网关到模型提供方的网络连通性。';
  }
  if (text.includes('model') && text.includes('not found')) {
    return '当前模型标识不存在，请刷新模型列表并校对标签覆盖。';
  }
  return '链路探测失败，请检查模型配置、网关日志与提供方状态。';
};

export const MODEL_DIAGNOSTIC_PROMPT = '链路诊断：请仅回复 OK。';

export const pickSnapshotModel = (snapshot?: OpenClawAgentModelSnapshot | null) => {
  if (!snapshot) return '';
  return (
    snapshot.effectiveModel ||
    snapshot.consoleOverrideModel ||
    snapshot.resolvedDefault ||
    snapshot.defaultModel ||
    snapshot.models[0]?.key ||
    ''
  );
};
