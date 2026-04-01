import express, { type Request, type Response } from 'express';
import feedbackRoutes from './routes/feedbackRoutes';
import authRoutes from './routes/authRoutes';
import deadQueueRoutes from './routes/deadQueueRoutes';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { geminiBreaker } from './utils/circuitBreaker';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors()); // Enable CORS for ALL origins in dev
app.use(express.json());

app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin/dead-queue', deadQueueRoutes);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/feedpulse';

// Connect to MongoDB with retry (needed in Docker — Mongo may not be ready yet)
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`, error);
    if (attempt >= MAX_RETRIES) {
      console.error('Could not connect to MongoDB after maximum retries — exiting');
      process.exit(1);
    }
    console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connectWithRetry(attempt + 1);
  }
}

connectWithRetry();

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
