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
import Feedback from '../models/Feedback';

let feedbackId: string;
let token: string;

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/feedpulse_test');

  // Create a real feedback document directly in the DB
  const doc = await Feedback.create({
    title: 'Test status update item',
    description: 'This is a test feedback item with enough characters for validation.',
    category: 'Bug',
    status: 'New',
  });
  feedbackId = doc._id.toString();

  // Log in as admin to get a JWT token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });

  token = loginRes.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('PATCH /api/feedback/:id', () => {
  it('updates feedback status to In Review', async () => {
    const res = await request(app)
      .patch(`/api/feedback/${feedbackId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'In Review' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('In Review');
  });

  it('rejects status update without auth token', async () => {
    const res = await request(app)
      .patch(`/api/feedback/${feedbackId}`)
      .send({ status: 'Resolved' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
