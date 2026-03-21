import { IncomingMessage, ServerResponse } from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

const NATIVE_ORIGIN = process.env.OPENCLAW_NATIVE_ORIGIN || 'http://127.0.0.1:18789';
const NATIVE_BASE_PATH = '/native-control';
const NATIVE_GATEWAY_PATH = '/native-gateway';
const NATIVE_SETTINGS_KEY = 'openclaw.control.settings.v1';
const NATIVE_TOKEN_KEY = 'openclaw.control.token.v1';
const NATIVE_TOKEN_PREFIX = `${NATIVE_TOKEN_KEY}:`;
const NATIVE_LOCALE_KEY = 'openclaw.i18n.locale';
const UPSTREAM_GATEWAY_HOST = '127.0.0.1';
const UPSTREAM_GATEWAY_PORT = 18789;
const OPENCLAW_JSON_PATH = process.env.OPENCLAW_JSON_PATH || path.join(process.env.HOME || '', '.openclaw', 'openclaw.json');
const NATIVE_MODULES = [
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

const buildGatewayProxyUrl = (req: IncomingMessage) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = typeof forwardedProto === 'string'
    ? forwardedProto
    : req.socket.encrypted ? 'https' : 'http';
  const wsProto = proto === 'https' ? 'wss' : 'ws';
  const host = req.headers.host || `127.0.0.1:${UPSTREAM_GATEWAY_PORT}`;
  return `${wsProto}://${host}${NATIVE_GATEWAY_PATH}`;
};

const buildRequestOrigin = (req: IncomingMessage) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = typeof forwardedProto === 'string'
    ? forwardedProto
    : req.socket.encrypted ? 'https' : 'http';
  const host = req.headers.host || '127.0.0.1:3180';
  return `${proto}://${host}`;
};

const copyHeader = (res: ServerResponse, name: string, value: string) => {
  const normalized = name.toLowerCase();
  if (['content-length', 'content-security-policy', 'x-frame-options', 'content-encoding'].includes(normalized)) {
    return;
  }
  res.setHeader(name, value);
};

const buildUpstreamUrl = (pathname: string, search: string) => {
  const upstreamPath = pathname === NATIVE_BASE_PATH
    ? '/'
    : pathname.startsWith(`${NATIVE_BASE_PATH}/`)
      ? pathname.slice(NATIVE_BASE_PATH.length)
      : pathname;
  return new URL(`${upstreamPath || '/'}${search}`, NATIVE_ORIGIN);
};

const getGatewayBootstrapToken = () => {
  try {
    if (!OPENCLAW_JSON_PATH || !fs.existsSync(OPENCLAW_JSON_PATH)) return '';
    const raw = fs.readFileSync(OPENCLAW_JSON_PATH, 'utf8');
    const parsed = JSON.parse(raw) as { gateway?: { auth?: { mode?: string; token?: string } } };
    const mode = parsed?.gateway?.auth?.mode;
    const token = parsed?.gateway?.auth?.token;
    if (mode !== 'token' || typeof token !== 'string') return '';
    return token.trim();
  } catch {
    return '';
  }
};

const injectNativeShell = (html: string, gatewayUrl: string, currentPath: string, gatewayToken?: string) => {
  const safeGatewayUrl = gatewayUrl
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
  const safeCurrentPath = currentPath
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
  const safeGatewayToken = (gatewayToken || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
  const injection = `
    <script>
      window.__OPENCLAW_CONTROL_UI_BASE_PATH__ = '${NATIVE_BASE_PATH}/';
      (function () {
        var key = '${NATIVE_SETTINGS_KEY}';
        var tokenKey = '${NATIVE_TOKEN_KEY}';
        var tokenPrefix = '${NATIVE_TOKEN_PREFIX}';
        var existing = {};
        var normalizeGatewayUrl = function (url) {
          var text = (url || '').trim();
          if (!text) return 'default';
          try {
            var base = (typeof location !== 'undefined')
              ? (location.protocol + '//' + location.host + (location.pathname || '/'))
              : undefined;
            var parsed = base ? new URL(text, base) : new URL(text);
            var pathname = parsed.pathname === '/' ? '' : (parsed.pathname.replace(/\\/+$/, '') || parsed.pathname);
            return parsed.protocol + '//' + parsed.host + pathname;
          } catch (_error) {
            return text;
          }
        };
        var tokenStorageKey = function (url) {
          return tokenPrefix + normalizeGatewayUrl(url);
        };
        try {
          existing = JSON.parse(window.localStorage.getItem(key) || '{}') || {};
        } catch (_error) {
          existing = {};
        }
        var bootToken = '${safeGatewayToken}';
        var normalizedBootToken = (bootToken && String(bootToken).trim()) ? String(bootToken).trim() : '';
        var nextGatewayUrl = '${safeGatewayUrl}';
        if (normalizedBootToken) {
          try {
            if (window.sessionStorage) {
              window.sessionStorage.removeItem(tokenKey);
              if (existing.gatewayUrl && String(existing.gatewayUrl).trim()) {
                window.sessionStorage.setItem(tokenStorageKey(String(existing.gatewayUrl).trim()), normalizedBootToken);
              }
              window.sessionStorage.setItem(tokenStorageKey(nextGatewayUrl), normalizedBootToken);
            }
          } catch (_error) {}
        }
        var next = Object.assign({}, existing, {
          gatewayUrl: nextGatewayUrl,
          sessionKey: existing.sessionKey || 'main',
          lastActiveSessionKey: existing.lastActiveSessionKey || existing.sessionKey || 'main',
          locale: 'zh-CN'
        });
        if (Object.prototype.hasOwnProperty.call(next, 'token')) {
          delete next.token;
        }
        window.localStorage.setItem(key, JSON.stringify(next));
        window.localStorage.setItem('${NATIVE_LOCALE_KEY}', 'zh-CN');
        window.__OPENCLAW_PROXY_PATH__ = '${safeCurrentPath}';
      }());
    </script>
  `;

  if (html.includes('</head>')) {
    return html.replace('</head>', `${injection}\n</head>`);
  }

  return `${injection}\n${html}`;
};

export const isNativeProxyPath = (pathname: string) =>
  pathname === NATIVE_BASE_PATH || pathname.startsWith(`${NATIVE_BASE_PATH}/`);

export const isNativeGatewayPath = (pathname: string) =>
  pathname === NATIVE_GATEWAY_PATH || pathname.startsWith(`${NATIVE_GATEWAY_PATH}?`);

export const handleNativeProxyRequest = async (req: IncomingMessage, res: ServerResponse, pathname: string, search: string) => {
  const upstreamUrl = buildUpstreamUrl(pathname, search);
  const method = req.method || 'GET';

  if (!['GET', 'HEAD'].includes(method)) {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: { code: 'method_not_allowed', message: 'Only GET and HEAD are supported.' } }));
    return;
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method,
      headers: {
        accept: req.headers.accept || '*/*',
      },
    });

    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => copyHeader(res, key, value));
    res.setHeader('Cache-Control', pathname.includes('/assets/') ? 'public, max-age=600' : 'no-cache');

    if (method === 'HEAD') {
      res.end();
      return;
    }

    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const html = await upstream.text();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(injectNativeShell(html, buildGatewayProxyUrl(req), pathname, getGatewayBootstrapToken()));
      return;
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    res.end(body);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      error: {
        code: 'native_proxy_failed',
        message: error instanceof Error ? error.message : 'Failed to reach native OpenClaw control UI.',
      },
    }));
  }
};

const buildUpgradeRequest = (req: IncomingMessage, upstreamPath = '/') => {
  const lines = [`GET ${upstreamPath} HTTP/1.1`];
  const requestOrigin = buildRequestOrigin(req);

  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    const headerName = req.rawHeaders[i];
    const headerValue = req.rawHeaders[i + 1];
    if (!headerName || headerValue === undefined) continue;
    const normalized = headerName.toLowerCase();
    if (normalized === 'host') {
      lines.push(`Host: ${UPSTREAM_GATEWAY_HOST}:${UPSTREAM_GATEWAY_PORT}`);
      continue;
    }
    if (normalized === 'origin') {
      lines.push(`Origin: ${requestOrigin}`);
      continue;
    }
    lines.push(`${headerName}: ${headerValue}`);
  }

  if (!req.headers.origin) {
    lines.push(`Origin: ${requestOrigin}`);
  }

  lines.push('', '');
  return lines.join('\r\n');
};

export const handleNativeGatewayUpgrade = (req: IncomingMessage, clientSocket: net.Socket, head: Buffer) => {
  const upstreamSocket = net.createConnection({
    host: UPSTREAM_GATEWAY_HOST,
    port: UPSTREAM_GATEWAY_PORT,
  });

  const destroyBoth = () => {
    if (!clientSocket.destroyed) clientSocket.destroy();
    if (!upstreamSocket.destroyed) upstreamSocket.destroy();
  };

  upstreamSocket.on('connect', () => {
    upstreamSocket.write(buildUpgradeRequest(req, '/'));
    if (head.length > 0) {
      upstreamSocket.write(head);
    }
    clientSocket.pipe(upstreamSocket).pipe(clientSocket);
  });

  upstreamSocket.on('error', destroyBoth);
  clientSocket.on('error', destroyBoth);
  clientSocket.on('close', () => {
    if (!upstreamSocket.destroyed) upstreamSocket.end();
  });
  upstreamSocket.on('close', () => {
    if (!clientSocket.destroyed) clientSocket.end();
  });
};
