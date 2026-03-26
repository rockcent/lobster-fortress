import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from '../../server/openclawManager';

function findSessionFile(sessionKey: string): { agentId: string; sessionId: string; filePath: string } | null {
  const parts = sessionKey.split(':');
  if (parts.length < 2) return null;
  if (parts[0] !== 'agent') return null;
  const agentId = parts[1];

  const home = process.env.HOME || '/Users/rock';
  const sessionsDir = path.join(home, '.openclaw', 'agents', agentId, 'sessions');

  if (!fs.existsSync(sessionsDir)) return null;

  // sessionKey format: agent:<agentId>:<sessionId>
  // <sessionId> is everything after the second colon, e.g. "telegram:group:-1003554539108"
  const sessionId = parts.slice(2).join(':');
  if (sessionId) {
    // Try direct file lookup first (sessionId maps directly to a .jsonl file)
    const directPath = path.join(sessionsDir, `${sessionId}.jsonl`);
    if (fs.existsSync(directPath)) {
      return { agentId, sessionId, filePath: directPath };
    }
  }

  // Fallback: scan files for a match (for edge cases where sessionId isn't the filename)
  try {
    const files = fs.readdirSync(sessionsDir).filter((f) => f.endsWith('.jsonl'));
    for (const file of files) {
      const filePath = path.join(sessionsDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            const msgObj = obj.message || obj;
            if (msgObj.sessionKey === sessionKey || msgObj.key === sessionKey) {
              const sid = file.replace('.jsonl', '');
              return { agentId, sessionId: sid, filePath };
            }
          } catch {
            // skip
          }
        }
      } catch {
        // skip
      }
    }
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { sessionKey } = req.query;
  if (!sessionKey) {
    return res.status(400).json({ error: { message: 'sessionKey is required' } });
  }

  try {
    // Find the session file
    const found = findSessionFile(sessionKey as string);
    if (!found) {
      return res.status(404).json({ error: { message: 'Session not found' } });
    }

    const { agentId, sessionId, filePath } = found;

    // Read and parse the JSONL file
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    const messages: any[] = [];

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'message') {
          const msg = obj.message || {};
          const role = msg.role || 'unknown';
          let text = '';
          let parts: any[] = [];

          const content = msg.content || [];
          if (typeof content === 'string') {
            text = content;
          } else if (Array.isArray(content)) {
            parts = content.map((part: any) => {
              if (part.type === 'text') {
                text += part.text || '';
              }
              return part;
            });
          }

          messages.push({
            id: obj.id || null,
            role,
            content: text,
            parts,
            createdAt: msg.createdAt || null,
          });
        }
      } catch {
        // skip malformed lines
      }
    }

    return res.status(200).json({
      data: {
        sessionKey,
        agentId,
        sessionId,
        messages,
        total: messages.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get session messages.';
    return res.status(500).json({ error: { message } });
  }
}
