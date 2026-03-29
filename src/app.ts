import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { successResponse } from './types/response';

const app: Application = express();

// ─── Global Middleware ───────────────────────────────────────────────────────

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Root Endpoint ───────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.status(200).json(successResponse('FeedPulse API running'));
});

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
