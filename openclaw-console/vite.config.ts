import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {
  getOpenClawAgentModels,
  getOpenClawConfigDocument,
  getOpenClawDashboard,
  runOpenClawAction,
  runOpenClawAgentCommand,
  runOpenClawAgentCommandStream,
  runOpenClawRuntimeAction,
  runOpenClawShortcut,
  saveOpenClawConfigDocument,
  setOpenClawAgentModel,
} from './server/openclawManager';
import { handleNativeGatewayUpgrade, handleNativeProxyRequest, isNativeGatewayPath, isNativeProxyPath } from './server/nativeProxy';

const readRequestBody = async (req: NodeJS.ReadableStream) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

const sendJson = (
  res: NodeJS.WritableStream & { statusCode: number; setHeader: (name: string, value: string) => void; end: (chunk?: any) => void },
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

export default defineConfig({
  server: {
    port: 4310,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    {
      name: 'openclaw-console-api',
      configureServer(server) {
        server.httpServer?.on('upgrade', (req, socket, head) => {
          const url = new URL(req.url || '/', 'http://127.0.0.1');
          if (!isNativeGatewayPath(url.pathname)) {
            return;
          }

          handleNativeGatewayUpgrade(req, socket, head);
        });

        server.middlewares.use(async (req, res, next) => {
          if (!req.url) {
            next();
            return;
          }

          const url = new URL(req.url, 'http://127.0.0.1');
          if (!isNativeProxyPath(url.pathname)) {
            next();
            return;
          }

          await handleNativeProxyRequest(req, res, url.pathname, url.search);
        });

        server.middlewares.use('/api/openclaw/dashboard', async (req, res) => {
          if (req.method !== 'GET') {
            sendJson(res, 405, { error: { code: 'method_not_allowed', message: 'Only GET is allowed.' } }, { Allow: 'GET' });
            return;
          }

          const data = await getOpenClawDashboard();
          sendJson(res, 200, { data });
        });

        server.middlewares.use('/api/openclaw/action', async (req, res) => {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: { code: 'method_not_allowed', message: 'Only POST is allowed.' } }, { Allow: 'POST' });
            return;
          }

          try {
            const body = await readRequestBody(req);
            if (typeof body.serviceId !== 'string' || typeof body.action !== 'string') {
              sendJson(res, 400, { error: { code: 'invalid_request', message: 'serviceId and action are required.' } });
              return;
            }

            const data = await runOpenClawAction(body.serviceId, body.action);
            sendJson(res, 200, { data });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Action failed.';
            sendJson(res, 400, { error: { code: 'action_failed', message } });
          }
        });

        server.middlewares.use('/api/openclaw/shortcut', async (req, res) => {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: { code: 'method_not_allowed', message: 'Only POST is allowed.' } }, { Allow: 'POST' });
            return;
          }

          try {
            const body = await readRequestBody(req);
            if (typeof body.kind !== 'string' || typeof body.target !== 'string') {
              sendJson(res, 400, { error: { code: 'invalid_request', message: 'kind and target are required.' } });
              return;
            }

            const data = await runOpenClawShortcut(body.kind, body.target);
            sendJson(res, 200, { data });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Shortcut failed.';
            sendJson(res, 400, { error: { code: 'shortcut_failed', message } });
          }
        });

        server.middlewares.use('/api/openclaw/agent-command', async (req, res) => {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: { code: 'method_not_allowed', message: 'Only POST is allowed.' } }, { Allow: 'POST' });
            return;
          }

          try {
            const body = await readRequestBody(req);
            if (typeof body.agentId !== 'string' || typeof body.message !== 'string') {
              sendJson(res, 400, { error: { code: 'invalid_request', message: 'agentId and message are required.' } });
              return;
            }

            const data = await runOpenClawAgentCommand({
              agentId: body.agentId,
              message: body.message,
              thinking: body.thinking,
              sessionId: body.sessionId,
            });
            sendJson(res, 200, { data });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Agent command failed.';
            sendJson(res, 400, { error: { code: 'agent_command_failed', message } });
          }
        });

        server.middlewares.use('/api/openclaw/agent-command-stream', async (req, res) => {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: { code: 'method_not_allowed', message: 'Only POST is allowed.' } }, { Allow: 'POST' });
            return;
          }

          try {
            const body = await readRequestBody(req);
            if (typeof body.agentId !== 'string' || typeof body.message !== 'string') {
              sendJson(res, 400, { error: { code: 'invalid_request', message: 'agentId and message are required.' } });
              return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');

            await runOpenClawAgentCommandStream({
              agentId: body.agentId,
              message: body.message,
              thinking: body.thinking,
              sessionId: body.sessionId,
            }, (event) => {
              res.write(`${JSON.stringify(event)}\n`);
            });
            res.end();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Agent command failed.';
            res.write(`${JSON.stringify({ type: 'error', agentId: 'unknown', message })}\n`);
            res.end();
          }
        });

        server.middlewares.use('/api/openclaw/runtime-action', async (req, res) => {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: { code: 'method_not_allowed', message: 'Only POST is allowed.' } }, { Allow: 'POST' });
            return;
          }

          try {
            const body = await readRequestBody(req);
            if (typeof body.action !== 'string') {
              sendJson(res, 400, { error: { code: 'invalid_request', message: 'action is required.' } });
              return;
            }

            const data = await runOpenClawRuntimeAction(body.action);
            sendJson(res, 200, { data });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Runtime action failed.';
            sendJson(res, 400, { error: { code: 'runtime_action_failed', message } });
          }
        });

        server.middlewares.use('/api/openclaw/config', async (req, res) => {
          if (req.method === 'GET') {
            const data = getOpenClawConfigDocument();
            sendJson(res, 200, { data });
            return;
          }
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: { code: 'method_not_allowed', message: 'Only GET and POST are allowed.' } }, { Allow: 'GET, POST' });
            return;
          }

          try {
            const body = await readRequestBody(req);
            if (typeof body.content !== 'string') {
              sendJson(res, 400, { error: { code: 'invalid_request', message: 'content is required.' } });
              return;
            }

            const data = await saveOpenClawConfigDocument(body.content, body.reloadGateway === true);
            sendJson(res, 200, { data });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Config save failed.';
            sendJson(res, 400, { error: { code: 'config_save_failed', message } });
          }
        });

        const handleAgentModelsRequest = async (req: any, res: any) => {
          if (req.method === 'GET') {
            const rawUrl = req.url || '';
            const url = new URL(rawUrl.includes('http') ? rawUrl : `http://127.0.0.1${rawUrl}`);
            const agentId = (url.searchParams.get('agentId') || '').trim();
            if (!agentId) {
              sendJson(res, 400, { error: { code: 'invalid_request', message: 'agentId is required.' } });
              return;
            }
            try {
              const data = await getOpenClawAgentModels(agentId);
              sendJson(res, 200, { data });
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Load models failed.';
              sendJson(res, 400, { error: { code: 'agent_models_failed', message } });
            }
            return;
          }

          if (req.method !== 'POST') {
            sendJson(res, 405, { error: { code: 'method_not_allowed', message: 'Only GET and POST are allowed.' } }, { Allow: 'GET, POST' });
            return;
          }

          try {
            const body = await readRequestBody(req);
            if (typeof body.agentId !== 'string' || typeof body.modelKey !== 'string') {
              sendJson(res, 400, { error: { code: 'invalid_request', message: 'agentId and modelKey are required.' } });
              return;
            }

            const data = await setOpenClawAgentModel(body.agentId, body.modelKey);
            sendJson(res, 200, { data });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Set model failed.';
            sendJson(res, 400, { error: { code: 'set_agent_model_failed', message } });
          }
        };

        server.middlewares.use('/api/openclaw/agent-models', handleAgentModelsRequest);
        server.middlewares.use('/api/openclaw/models', handleAgentModelsRequest);
      },
    },
  ],
});
