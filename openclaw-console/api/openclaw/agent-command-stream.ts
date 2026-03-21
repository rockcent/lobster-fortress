import { OpenClawAgentCommandStreamEvent, runOpenClawAgentCommandStream } from '../../server/openclawManager';

const writeEvent = (res: any, event: OpenClawAgentCommandStreamEvent) => {
  if (res.writableEnded) return;
  res.write(`${JSON.stringify(event)}\n`);
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Only POST is allowed.' } });
  }

  const agentId = typeof req.body?.agentId === 'string' ? req.body.agentId : undefined;
  const message = typeof req.body?.message === 'string' ? req.body.message : undefined;
  const thinking = typeof req.body?.thinking === 'string' ? req.body.thinking : undefined;
  const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : undefined;

  if (!agentId || !message) {
    return res.status(400).json({ error: { code: 'invalid_request', message: 'agentId and message are required.' } });
  }

  res
    .status(200)
    .setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
    .setHeader('Cache-Control', 'no-cache, no-transform')
    .setHeader('Connection', 'keep-alive')
    .setHeader('X-Accel-Buffering', 'no')
    .flushHeaders();

  try {
    await runOpenClawAgentCommandStream({
      agentId,
      message,
      thinking: thinking as any,
      sessionId,
    }, (event) => {
      writeEvent(res, event);
    });
    if (!res.writableEnded) {
      res.end();
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Agent command failed.';
    writeEvent(res, {
      type: 'error',
      agentId,
      message: messageText,
    });
    if (!res.writableEnded) {
      res.end();
    }
  }
}
