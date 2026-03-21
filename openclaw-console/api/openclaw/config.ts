import { getOpenClawConfigDocument, saveOpenClawConfigDocument } from '../../server/openclawManager';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json({ data: getOpenClawConfigDocument() });
  }

  if (req.method === 'POST') {
    try {
      const content = typeof req.body?.content === 'string' ? req.body.content : '';
      const reloadGateway = Boolean(req.body?.reloadGateway);
      const result = await saveOpenClawConfigDocument(content, reloadGateway);
      return res.status(200).json({ data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed.';
      return res.status(400).json({ error: { code: 'config_save_failed', message } });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Only GET and POST are allowed.' } });
}
