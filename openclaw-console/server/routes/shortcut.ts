import type { IncomingMessage } from 'node:http';
import { runOpenClawShortcut } from '../openclawManager';
import { apiError, invalidRequest, methodNotAllowed, readRequestBody, sendJson, type JsonResponse } from './_types';

export const handleShortcutRequest = async (req: IncomingMessage, res: JsonResponse) => {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }

  try {
    const body = await readRequestBody(req);
    if (typeof body.kind !== 'string' || typeof body.target !== 'string') {
      invalidRequest(res, 'kind and target are required.');
      return;
    }

    const data = await runOpenClawShortcut(body.kind, body.target);
    sendJson(res, 200, { data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Shortcut failed.';
    apiError(res, 'shortcut_failed', message);
  }
};
