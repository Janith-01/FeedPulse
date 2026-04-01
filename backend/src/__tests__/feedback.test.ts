jest.mock('../services/gemini.service', () => ({
  analyzeFeedback: jest.fn().mockResolvedValue({
    category: 'Bug',
    sentiment: 'Negative',
    priority_score: 8,
    summary: 'Login button broken on mobile Safari',
    tags: ['Login', 'Mobile', 'Safari'],
  }),
  generateThemeSummary: jest.fn().mockResolvedValue({ themes: [] }),
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

describe('POST /api/feedback', () => {
  it('saves valid feedback and returns 201', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        title: 'Login button broken on mobile Safari',
        description:
          'When I tap the login button on iPhone Safari nothing happens at all. I have tried clearing cache but the issue persists every single time I attempt to log in.',
        category: 'Bug',
        submitterName: 'Ashan Perera',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Login button broken on mobile Safari');
  });

  it('rejects submission with empty title and returns 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        title: '',
        description:
          'This description is definitely long enough to pass the minimum character validation check without issues.',
        category: 'Bug',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
