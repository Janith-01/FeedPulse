import express, { type Request, type Response } from 'express';
import feedbackRoutes from './routes/feedbackRoutes';
import authRoutes from './routes/authRoutes';
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

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/feedpulse';

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });

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
