import { getOpenClawDashboard } from '../../server/openclawManager';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Only GET is allowed.' } });
  }

  const data = await getOpenClawDashboard();
  return res.status(200).json({ data });
}
