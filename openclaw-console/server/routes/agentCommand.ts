import type { IncomingMessage } from 'node:http';
import { runOpenClawAgentCommand } from '../openclawManager';
import { apiError, invalidRequest, methodNotAllowed, readRequestBody, sendJson, type JsonResponse } from './_types';

export const handleAgentCommandRequest = async (req: IncomingMessage, res: JsonResponse) => {
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

    const data = await runOpenClawAgentCommand({
      agentId: body.agentId,
      message: body.message,
      thinking: body.thinking as 'off' | 'minimal' | 'low' | 'medium' | 'high' | undefined,
      sessionId: body.sessionId as string | undefined,
    });
    sendJson(res, 200, { data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agent command failed.';
    apiError(res, 'agent_command_failed', message);
  }
};
