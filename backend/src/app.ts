import express, { type Request, type Response } from 'express';
import feedbackRoutes from './routes/feedbackRoutes';
import authRoutes from './routes/authRoutes';
import deadQueueRoutes from './routes/deadQueueRoutes';
import cors from 'cors';
import { geminiBreaker } from './utils/circuitBreaker';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin/dead-queue', deadQueueRoutes);

// Basic testing route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'FeedPulse API is running' });
});

// Health endpoint — circuit breaker status (public)
app.get('/api/health', (req: Request, res: Response) => {
  const status = geminiBreaker.getStatus();
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      gemini: status,
    },
    message: 'Health check OK',
  });
});

export default app;
