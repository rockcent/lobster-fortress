import { getAllAgentCrons } from '../../server/openclawServerStatus';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Only GET is allowed.' } });
  }

  try {
    const crons = await getAllAgentCrons();
    return res.status(200).json({ data: crons });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'cron_summary_failed',
        message: error instanceof Error ? error.message : 'Failed to fetch cron summary.',
      },
    });
  }
}
