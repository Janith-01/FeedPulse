// Mock the Google Generative AI SDK before any imports that use it
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              category: 'Feature Request',
              sentiment: 'Positive',
              priority_score: 6,
              summary: 'User wants dark mode in dashboard settings',
              tags: ['UI', 'Settings', 'Dashboard'],
            }),
        },
      }),
    }),
  })),
}));

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/feedpulse_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('JWT authentication', () => {
  it('rejects GET /api/feedback with no token', async () => {
    const res = await request(app).get('/api/feedback');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects GET /api/feedback with a fake token', async () => {
    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', 'Bearer thisisacompletelyfaketoken123');

    // Auth middleware returns 403 for an invalid/expired token
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('Gemini service parsing', () => {
  it('parses response into correct fields', async () => {
    // Import after the mock is in place
    const { analyzeFeedback } = await import('../services/gemini.service');

    const result = await analyzeFeedback(
      'Add dark mode',
      'It would be amazing to have a dark mode option in the dashboard settings panel for night usage.',
    );

    expect(result).not.toBeNull();
    expect(result!.sentiment).toBe('Positive');
    expect(result!.priority_score).toBe(6);
    expect(Array.isArray(result!.tags)).toBe(true);
    expect(result!.tags.length).toBeGreaterThan(0);
  });
});
