import type { IncomingMessage } from 'node:http';
import { getOpenClawAgentModels, setOpenClawAgentModel } from '../openclawManager';
import { apiError, invalidRequest, methodNotAllowed, readRequestBody, sendJson, type JsonResponse } from './_types';

const handleAgentModelsGet = async (req: IncomingMessage, res: JsonResponse) => {
  const rawUrl = req.url || '';
  const url = new URL(rawUrl.includes('http') ? rawUrl : `http://127.0.0.1${rawUrl}`);
  const agentId = (url.searchParams.get('agentId') || '').trim();
  if (!agentId) {
    invalidRequest(res, 'agentId is required.');
    return;
  }
  try {
    const data = await getOpenClawAgentModels(agentId);
    sendJson(res, 200, { data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load models failed.';
    apiError(res, 'agent_models_failed', message);
  }
};

const handleAgentModelsPost = async (req: IncomingMessage, res: JsonResponse) => {
  try {
    const body = await readRequestBody(req);
    if (typeof body.agentId !== 'string' || typeof body.modelKey !== 'string') {
      invalidRequest(res, 'agentId and modelKey are required.');
      return;
    }

    const data = await setOpenClawAgentModel(body.agentId, body.modelKey);
    sendJson(res, 200, { data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Set model failed.';
    apiError(res, 'set_agent_model_failed', message);
  }
};

export const handleAgentModelsRequest = async (req: IncomingMessage, res: JsonResponse) => {
  if (req.method === 'GET') {
    await handleAgentModelsGet(req, res);
    return;
  }

  if (req.method === 'POST') {
    await handleAgentModelsPost(req, res);
    return;
  }

  methodNotAllowed(res, 'GET, POST');
};
