import { loadConfig, runOpenClawJsonCommand } from '../../server/openclawManager';

interface CliSession {
  key: string;
  agentId: string;
  updatedAt: number;
  ageMs: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  model?: string;
  modelProvider?: string;
  kind?: string;
  sessionId?: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { agentId, limit = '20', offset = '0' } = req.query;

  try {
    const { config } = loadConfig();

    const result = await runOpenClawJsonCommand<{ sessions: CliSession[] }>(
      ['sessions', '--all-agents', '--json'],
      config,
    );

    // Sessions are at result.sessions (top-level array)
    const allSessions: CliSession[] = [];
    if (result && typeof result === 'object' && 'sessions' in result && Array.isArray((result as any).sessions)) {
      allSessions.push(...(result as any).sessions);
    }

    // Sort by updatedAt descending
    allSessions.sort((a, b) => b.updatedAt - a.updatedAt);

    // Filter by agentId
    let filtered = agentId
      ? allSessions.filter((s) => (s.agentId || 'main') === agentId)
      : allSessions;

    const total = filtered.length;
    const start = Number(offset);
    const end = start + Number(limit);
    const paged = filtered.slice(start, end);

    // Map to frontend-expected shape
    const sessions = paged.map((s) => ({
      sessionKey: s.key,
      agentId: s.agentId || 'main',
      label: s.key.split(':').pop() || s.key,
      updatedAt: s.updatedAt,
      messageCount: null, // not available from CLI
      model: s.model || null,
      kind: s.kind || null,
      sessionId: s.sessionId || null,
      ageMs: s.ageMs || null,
    }));

    return res.status(200).json({
      data: { sessions, total, limit: Number(limit), offset: Number(offset) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list sessions.';
    return res.status(500).json({ error: { message } });
  }
}
