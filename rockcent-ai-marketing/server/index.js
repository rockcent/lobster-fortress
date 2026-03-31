import express from 'express';
import cors from 'cors';
import { arkRouter } from './routes/ark.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// AI Routes
app.use('/api/ai', arkRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rockcent-ai-proxy' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Rockcent AI Proxy server running on port ${PORT}`);
});
