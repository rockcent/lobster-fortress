import type { IncomingMessage } from 'node:http';
import { runOpenClawAction } from '../openclawManager';
import { apiError, invalidRequest, methodNotAllowed, readRequestBody, sendJson, type JsonResponse } from './_types';

export const handleActionRequest = async (req: IncomingMessage, res: JsonResponse) => {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }

  try {
    const body = await readRequestBody(req);
    if (typeof body.serviceId !== 'string' || typeof body.action !== 'string') {
      invalidRequest(res, 'serviceId and action are required.');
      return;
    }

    const data = await runOpenClawAction(body.serviceId, body.action);
    sendJson(res, 200, { data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed.';
    apiError(res, 'action_failed', message);
  }
};
