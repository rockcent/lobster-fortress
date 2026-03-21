import { runOpenClawRuntimeAction } from '../../server/openclawManager';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Only POST is allowed.' } });
  }

  try {
    const action = typeof req.body?.action === 'string' ? req.body.action : undefined;
    if (!action) {
      return res.status(400).json({ error: { code: 'invalid_request', message: 'action is required.' } });
    }

    const result = await runOpenClawRuntimeAction(action);
    return res.status(200).json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Runtime action failed.';
    return res.status(400).json({ error: { code: 'runtime_action_failed', message } });
  }
}
