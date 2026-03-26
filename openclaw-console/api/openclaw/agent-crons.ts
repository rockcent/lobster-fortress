import fs from 'node:fs';
import path from 'node:path';

interface CronJob {
  id: string;
  agentId: string;
  expression: string;
  description: string;
  enabled: boolean;
  nextRun: string | null;
}

function parseCronFile(cronPath: string, agentId: string): CronJob[] {
  if (!fs.existsSync(cronPath)) return [];

  try {
    const raw = fs.readFileSync(cronPath, 'utf-8');
    const lines = raw.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
    const jobs: CronJob[] = [];

    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 4) {
        jobs.push({
          id: parts[0].trim(),
          agentId: parts[1].trim(),
          expression: parts[2].trim(),
          description: parts[3].trim(),
          enabled: parts[4]?.trim() !== 'disabled',
          nextRun: null,
        });
      }
    }

    return jobs.filter((j) => j.agentId === agentId || agentId === 'all');
  } catch {
    return [];
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const agentId = req.query.agentId as string || 'all';

  try {
    const workspaceRoot = '/Users/rock/.openclaw/workspace';
    const cronPath = path.join(workspaceRoot, 'data', 'cron.yaml');
    const crons = parseCronFile(cronPath, agentId);

    return res.status(200).json({ data: crons });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get cron jobs.';
    return res.status(500).json({ error: { message } });
  }
}
