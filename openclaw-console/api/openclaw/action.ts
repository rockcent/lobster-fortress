import { runOpenClawAction } from '../../server/openclawManager';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Only POST is allowed.' } });
  }

  try {
    const action = typeof req.body?.action === 'string' ? req.body.action : undefined;
    const serviceId = typeof req.body?.serviceId === 'string' ? req.body.serviceId : undefined;

    if (!action || !serviceId) {
      return res.status(400).json({ error: { code: 'invalid_request', message: 'serviceId and action are required.' } });
    }

    const result = await runOpenClawAction(serviceId, action);
    return res.status(200).json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed.';
    return res.status(400).json({ error: { code: 'action_failed', message } });
  }
}
