import type { IncomingMessage } from 'node:http';
import { getOpenClawDashboard } from '../openclawManager';
import { methodNotAllowed, sendJson, type JsonResponse } from './_types';

export const handleDashboardRequest = async (req: IncomingMessage, res: JsonResponse) => {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }

  const data = await getOpenClawDashboard();
  sendJson(res, 200, { data });
};
