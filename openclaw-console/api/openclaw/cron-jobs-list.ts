import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

interface CronJob {
  id: string;
  agentId?: string;
  name?: string;
  description?: string;
  enabled: boolean;
  schedule?: {
    kind?: string;
    expr?: string;
    tz?: string;
  };
  state?: {
    nextRunAtMs?: number | null;
    lastRunAtMs?: number | null;
    lastStatus?: string;
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Only GET is allowed.' } });
  }

  const agentId = req.query.agentId as string | undefined;

  try {
    const cronPath = path.join(process.env.HOME || os.homedir(), '.openclaw/cron/jobs.json');

    if (!fs.existsSync(cronPath)) {
      return res.status(200).json({ data: [], total: 0 });
    }

    const raw = fs.readFileSync(cronPath, 'utf-8');
    const parsed = JSON.parse(raw) as {
      jobs?: CronJob[];
    };

    const jobs = (parsed.jobs || [])
      .filter((job) => !agentId || job.agentId === agentId || job.agentId === undefined)
      .map((job) => ({
        id: job.id,
        agentId: job.agentId || 'unknown',
        name: job.name || job.description || job.id,
        description: job.description || '',
        enabled: job.enabled,
        expression: job.schedule?.expr || '',
        nextRun: job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString() : null,
        lastRun: job.state?.lastRunAtMs ? new Date(job.state.lastRunAtMs).toISOString() : null,
        lastStatus: job.state?.lastStatus || null,
      }));

    return res.status(200).json({ data: jobs, total: jobs.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get cron jobs.';
    return res.status(500).json({ error: { code: 'cron_jobs_failed', message } });
  }
}
