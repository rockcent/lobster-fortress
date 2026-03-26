import fs from 'node:fs';
import path from 'node:path';
import { IncomingMessage, ServerResponse, createServer } from 'node:http';
import { URL } from 'node:url';
import dashboardHandler from '../api/openclaw/dashboard';
import actionHandler from '../api/openclaw/action';
import shortcutHandler from '../api/openclaw/shortcut';
import agentCommandHandler from '../api/openclaw/agent-command';
import agentCommandStreamHandler from '../api/openclaw/agent-command-stream';
import agentModelsHandler from '../api/openclaw/agent-models';
import runtimeActionHandler from '../api/openclaw/runtime-action';
import configHandler from '../api/openclaw/config';
import upgradeStatusHandler from '../api/openclaw/upgrade-status';
import agentCronsHandler from '../api/openclaw/agent-crons';
import serverStatusHandler from '../api/openclaw/server-status';
import cronSummaryHandler from '../api/openclaw/cron-summary';
import cronJobsListHandler from '../api/openclaw/cron-jobs-list';
import sessionsListHandler from '../api/sessions/list';
import sessionsDeleteHandler from '../api/sessions/delete';
import sessionsMessagesHandler from '../api/sessions/messages';
import { handleNativeGatewayUpgrade, handleNativeProxyRequest, isNativeGatewayPath, isNativeProxyPath } from './nativeProxy';

type ApiHandler = (req: any, res: any) => Promise<void> | void;

const port = Number(process.env.PORT || 13180);
const rootDir = path.resolve(process.cwd());
const distDir = path.join(rootDir, 'dist');

const API_ROUTES = new Map<string, ApiHandler>([
  ['GET /api/openclaw/dashboard', dashboardHandler],
  ['POST /api/openclaw/action', actionHandler],
  ['POST /api/openclaw/shortcut', shortcutHandler],
  ['POST /api/openclaw/agent-command', agentCommandHandler],
  ['POST /api/openclaw/agent-command-stream', agentCommandStreamHandler],
  ['GET /api/openclaw/agent-models', agentModelsHandler],
  ['POST /api/openclaw/agent-models', agentModelsHandler],
  ['GET /api/openclaw/models', agentModelsHandler],
  ['POST /api/openclaw/models', agentModelsHandler],
  ['POST /api/openclaw/runtime-action', runtimeActionHandler],
  ['GET /api/openclaw/config', configHandler],
  ['POST /api/openclaw/config', configHandler],
  ['GET /api/upgrade/status', upgradeStatusHandler],
  ['GET /api/openclaw/agent-crons', agentCronsHandler],
  ['GET /api/openclaw/server-status', serverStatusHandler],
  ['GET /api/openclaw/cron-jobs-list', cronJobsListHandler],
  ['GET /api/openclaw/cron-summary', cronSummaryHandler],
  ['GET /api/sessions', sessionsListHandler],
  ['DELETE /api/sessions', sessionsDeleteHandler],
  ['GET /api/sessions/messages', sessionsMessagesHandler],
]);

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const createQueryObject = (url: URL) => {
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
};

const readJsonBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

const createApiResponse = (res: ServerResponse) => ({
  status(code: number) {
    res.statusCode = code;
    return this;
  },
  setHeader(name: string, value: string) {
    res.setHeader(name, value);
    return this;
  },
  json(payload: unknown) {
    if (!res.hasHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(payload));
    return this;
  },
  write(chunk: string | Buffer) {
    res.write(chunk);
    return this;
  },
  end(chunk?: string | Buffer) {
    res.end(chunk);
    return this;
  },
  flushHeaders() {
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }
    return this;
  },
  get writableEnded() {
    return res.writableEnded;
  },
});

const sendJson = (res: ServerResponse, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const isStaticAssetRequest = (pathname: string) => path.extname(pathname) !== '';

const getStaticFilePath = (pathname: string) => {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const normalized = path.normalize(safePath).replace(/^(\.\.[/\\])+/, '');
  return path.join(distDir, normalized);
};

const serveFile = (filePath: string, res: ServerResponse) => {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[extension] || 'application/octet-stream';

  res.statusCode = 200;
  res.setHeader('Content-Type', mimeType);
  if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'no-cache');
  }

  fs.createReadStream(filePath).pipe(res);
};

const serveSpa = (res: ServerResponse) => {
  const indexFile = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexFile)) {
    sendJson(res, 500, {
      error: {
        code: 'missing_build',
        message: 'dist/index.html is missing. Run "npm run build" before starting the server.',
      },
    });
    return;
  }

  serveFile(indexFile, res);
};

const handleApiRequest = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
  const routeKey = `${req.method || 'GET'} ${url.pathname}`;
  const handler = API_ROUTES.get(routeKey);

  if (!handler) {
    sendJson(res, 404, { error: { code: 'not_found', message: 'API 路由不存在。' } });
    return;
  }

  const request = Object.assign(req, {
    query: createQueryObject(url),
    body: ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method || 'GET') ? await readJsonBody(req) : undefined,
  });

  const response = createApiResponse(res);
  try {
    await handler(request, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器内部错误。';
    sendJson(res, 500, { error: { code: 'internal_error', message } });
  }
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/healthz') {
    sendJson(res, 200, { ok: true, service: 'openclaw-console', timestamp: new Date().toISOString() });
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    await handleApiRequest(req, res, url);
    return;
  }

  if (isNativeProxyPath(url.pathname)) {
    await handleNativeProxyRequest(req, res, url.pathname, url.search);
    return;
  }

  const filePath = getStaticFilePath(url.pathname);
  if (isStaticAssetRequest(url.pathname) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(filePath, res);
    return;
  }

  serveSpa(res);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`OpenClaw console listening on http://0.0.0.0:${port}`);
});

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (!isNativeGatewayPath(url.pathname)) {
    socket.destroy();
    return;
  }

  handleNativeGatewayUpgrade(req, socket, head);
});
