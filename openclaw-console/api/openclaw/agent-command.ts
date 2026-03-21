import { runOpenClawAgentCommand } from '../../server/openclawManager';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Only POST is allowed.' } });
  }

  try {
    const agentId = typeof req.body?.agentId === 'string' ? req.body.agentId : undefined;
    const message = typeof req.body?.message === 'string' ? req.body.message : undefined;
    const thinking = typeof req.body?.thinking === 'string' ? req.body.thinking : undefined;
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : undefined;

    if (!agentId || !message) {
      return res.status(400).json({ error: { code: 'invalid_request', message: 'agentId and message are required.' } });
    }

    const data = await runOpenClawAgentCommand({ agentId, message, thinking: thinking as any, sessionId });
    return res.status(200).json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agent command failed.';
    return res.status(400).json({ error: { code: 'agent_command_failed', message } });
  }
}
