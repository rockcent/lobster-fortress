import type { IncomingMessage } from 'node:http';
import { getOpenClawConfigDocument, saveOpenClawConfigDocument } from '../openclawManager';
import { apiError, invalidRequest, methodNotAllowed, readRequestBody, sendJson, type JsonResponse } from './_types';

export const handleConfigRequest = async (req: IncomingMessage, res: JsonResponse) => {
  if (req.method === 'GET') {
    const data = getOpenClawConfigDocument();
    sendJson(res, 200, { data });
    return;
  }

  if (req.method !== 'POST') {
    methodNotAllowed(res, 'GET, POST');
    return;
  }

  try {
    const body = await readRequestBody(req);
    if (typeof body.content !== 'string') {
      invalidRequest(res, 'content is required.');
      return;
    }

    const data = await saveOpenClawConfigDocument(body.content, body.reloadGateway === true);
    sendJson(res, 200, { data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Config save failed.';
    apiError(res, 'config_save_failed', message);
  }
};
