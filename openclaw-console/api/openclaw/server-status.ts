import { getServerHealthStatuses } from '../../server/openclawServerStatus';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Only GET is allowed.' } });
  }

  try {
    const statuses = await getServerHealthStatuses();
    return res.status(200).json({ data: statuses });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'server_status_failed',
        message: error instanceof Error ? error.message : 'Failed to check server status.',
      },
    });
  }
}
