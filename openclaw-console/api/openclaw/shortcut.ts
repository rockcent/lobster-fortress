import { runOpenClawShortcut } from '../../server/openclawManager';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Only POST is allowed.' } });
  }

  try {
    const kind = typeof req.body?.kind === 'string' ? req.body.kind : undefined;
    const target = typeof req.body?.target === 'string' ? req.body.target : undefined;

    if (!kind || !target) {
      return res.status(400).json({ error: { code: 'invalid_request', message: 'kind and target are required.' } });
    }

    const data = await runOpenClawShortcut(kind as 'url' | 'path', target);
    return res.status(200).json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Shortcut failed.';
    return res.status(400).json({ error: { code: 'shortcut_failed', message } });
  }
}
