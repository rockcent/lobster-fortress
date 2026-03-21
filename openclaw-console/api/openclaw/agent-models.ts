import { getOpenClawAgentModels, setOpenClawAgentModel } from '../../server/openclawManager';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const agentId = typeof req.query?.agentId === 'string' ? req.query.agentId : '';
      if (!agentId.trim()) {
        return res.status(400).json({ error: { code: 'invalid_request', message: 'agentId is required.' } });
      }
      const data = await getOpenClawAgentModels(agentId);
      return res.status(200).json({ data });
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取模型列表失败。';
      return res.status(400).json({ error: { code: 'agent_models_failed', message } });
    }
  }

  if (req.method === 'POST') {
    try {
      const agentId = typeof req.body?.agentId === 'string' ? req.body.agentId : '';
      const modelKey = typeof req.body?.modelKey === 'string' ? req.body.modelKey : '';
      if (!agentId.trim() || !modelKey.trim()) {
        return res.status(400).json({ error: { code: 'invalid_request', message: 'agentId and modelKey are required.' } });
      }
      const data = await setOpenClawAgentModel(agentId, modelKey);
      return res.status(200).json({ data });
    } catch (error) {
      const message = error instanceof Error ? error.message : '切换模型失败。';
      return res.status(400).json({ error: { code: 'set_agent_model_failed', message } });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Only GET and POST are allowed.' } });
}
