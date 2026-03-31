import express from 'express';

const router = express.Router();

// 火山方舟 API 配置
const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

// 转发所有 AI 请求到火山方舟
router.post('/chat', async (req, res) => {
  try {
    const { messages, model = 'doubao-pro-32k', ...config } = req.body;
    
    const response = await fetch(`${ARK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        ...config,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Ark API error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/completions', async (req, res) => {
  try {
    const { prompt, model = 'doubao-pro-32k', ...config } = req.body;
    
    const response = await fetch(`${ARK_BASE_URL}/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        ...config,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Ark API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 流式响应
router.post('/stream', async (req, res) => {
  try {
    const { messages, model = 'doubao-pro-32k', ...config } = req.body;
    
    const response = await fetch(`${ARK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        ...config,
      }),
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    response.body.pipe(res);
  } catch (error) {
    console.error('Ark API stream error:', error);
    res.status(500).json({ error: error.message });
  }
});

export const arkRouter = router;
