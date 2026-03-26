import { spawn } from 'node:child_process';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const timeoutMs = 15000;

  return new Promise<void>((resolve) => {
    const proc = spawn('openclaw', ['update', '--status'], {
      timeout: timeoutMs,
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);

      if (code === 0) {
        const lines = stdout.split('\n').filter(Boolean);
        const result: Record<string, string> = {};
        for (const line of lines) {
          const [key, ...rest] = line.split(':');
          if (key && rest.length) {
            result[key.trim()] = rest.join(':').trim();
          }
        }

        return res.status(200).json({
          data: {
            currentVersion: result['Current Version'] || result['Version'] || 'unknown',
            targetVersion: result['Target Version'] || result['Latest'] || 'unknown',
            upToDate: (result['Up to Date'] || result['Status'] || '').toLowerCase() === 'true',
            channel: result['Channel'] || 'stable',
            raw: stdout,
          },
        });
      } else {
        return res.status(200).json({
          data: {
            currentVersion: 'unknown',
            targetVersion: 'unknown',
            upToDate: true,
            channel: 'unknown',
            raw: stderr || stdout,
          },
        });
      }
      resolve();
    });

    proc.on('error', () => {
      clearTimeout(timer);
      return res.status(200).json({
        data: {
          currentVersion: 'unknown',
          targetVersion: 'unknown',
          upToDate: true,
          channel: 'unknown',
          raw: '',
        },
      });
      resolve();
    });
  });
}
