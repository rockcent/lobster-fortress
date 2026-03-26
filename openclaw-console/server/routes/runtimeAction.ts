import type { IncomingMessage } from 'node:http';
import { runOpenClawRuntimeAction } from '../openclawManager';
import { apiError, invalidRequest, methodNotAllowed, readRequestBody, sendJson, type JsonResponse } from './_types';

export const handleRuntimeActionRequest = async (req: IncomingMessage, res: JsonResponse) => {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }

  try {
    const body = await readRequestBody(req);
    if (typeof body.action !== 'string') {
      invalidRequest(res, 'action is required.');
      return;
    }

    const data = await runOpenClawRuntimeAction(body.action);
    sendJson(res, 200, { data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Runtime action failed.';
    apiError(res, 'runtime_action_failed', message);
  }
};
