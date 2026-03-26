import type { ViteDevServer } from 'vite';
import { handleNativeGatewayUpgrade, handleNativeProxyRequest, isNativeGatewayPath, isNativeProxyPath } from '../nativeProxy';
import { handleDashboardRequest } from './dashboard';
import { handleActionRequest } from './action';
import { handleShortcutRequest } from './shortcut';
import { handleAgentCommandRequest } from './agentCommand';
import { handleAgentCommandStreamRequest } from './agentCommandStream';
import { handleRuntimeActionRequest } from './runtimeAction';
import { handleConfigRequest } from './config';
import { handleAgentModelsRequest } from './agentModels';

export const registerRoutes = (server: ViteDevServer) => {
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

  server.middlewares.use('/api/openclaw/dashboard', handleDashboardRequest);
  server.middlewares.use('/api/openclaw/action', handleActionRequest);
  server.middlewares.use('/api/openclaw/shortcut', handleShortcutRequest);
  server.middlewares.use('/api/openclaw/agent-command', handleAgentCommandRequest);
  server.middlewares.use('/api/openclaw/agent-command-stream', handleAgentCommandStreamRequest);
  server.middlewares.use('/api/openclaw/runtime-action', handleRuntimeActionRequest);
  server.middlewares.use('/api/openclaw/config', handleConfigRequest);
  server.middlewares.use('/api/openclaw/agent-models', handleAgentModelsRequest);
  server.middlewares.use('/api/openclaw/models', handleAgentModelsRequest);
};
