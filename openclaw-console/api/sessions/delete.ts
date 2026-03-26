import { loadConfig, runOpenClawJsonCommand } from '../../server/openclawManager';

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { sessionKey } = req.query;

  if (!sessionKey) {
    return res.status(400).json({ error: { message: 'sessionKey is required' } });
  }

  try {
    const { config } = loadConfig();

    const result = await runOpenClawJsonCommand<{ ok: boolean }>(
      ['sessions', 'delete', sessionKey],
      config,
    );

    return res.status(200).json({
      data: { ok: result.ok ?? true, sessionKey },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete session.';
    return res.status(500).json({ error: { message } });
  }
}
