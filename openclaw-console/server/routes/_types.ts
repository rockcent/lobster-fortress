import type { IncomingMessage, ServerResponse } from 'node:http';

export type ApiErrorCode =
  | 'method_not_allowed'
  | 'invalid_request'
  | 'action_failed'
  | 'shortcut_failed'
  | 'agent_command_failed'
  | 'runtime_action_failed'
  | 'config_save_failed'
  | 'agent_models_failed'
  | 'set_agent_model_failed';

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

export type RequestBody = Record<string, unknown>;

export const readRequestBody = async (req: IncomingMessage): Promise<RequestBody> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

export type JsonResponse = ServerResponse & {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (chunk?: unknown) => void;
};

export const sendJson = (
  res: JsonResponse,
  status: number,
  body: unknown,
  headers?: Record<string, string>,
) => {
  res.statusCode = status;
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

export const sendNdjson = (
  res: JsonResponse,
  headers?: Record<string, string>,
) => {
  res.statusCode = 200;
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  }
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
};

export const methodNotAllowed = (res: JsonResponse, allowed: string) => {
  sendJson(res, 405, { error: { code: 'method_not_allowed', message: `Only ${allowed} is allowed.` } }, { Allow: allowed });
};

export const invalidRequest = (res: JsonResponse, message: string) => {
  sendJson(res, 400, { error: { code: 'invalid_request', message } });
};

export const apiError = (res: JsonResponse, code: ApiErrorCode, message: string, status = 400) => {
  sendJson(res, status, { error: { code, message } });
};
