import type { IncomingMessage } from 'node:http';
import { runOpenClawAgentCommandStream } from '../openclawManager';
import { apiError, invalidRequest, methodNotAllowed, readRequestBody, sendNdjson, type JsonResponse } from './_types';

export const handleAgentCommandStreamRequest = async (req: IncomingMessage, res: JsonResponse) => {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }

  try {
    const body = await readRequestBody(req);
    if (typeof body.agentId !== 'string' || typeof body.message !== 'string') {
      invalidRequest(res, 'agentId and message are required.');
      return;
    }

    sendNdjson(res);

    await runOpenClawAgentCommandStream(
      {
        agentId: body.agentId,
        message: body.message,
        thinking: body.thinking as 'off' | 'minimal' | 'low' | 'medium' | 'high' | undefined,
        sessionId: body.sessionId as string | undefined,
      },
      (event) => {
        res.write(`${JSON.stringify(event)}\n`);
      },
    );
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agent command failed.';
    res.write(`${JSON.stringify({ type: 'error', agentId: 'unknown', message })}\n`);
    res.end();
  }
};
