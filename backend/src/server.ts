import app from './app';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
