import request from 'supertest';
import app from '../app';
import { prisma } from '../services/prisma.service';

describe('Message API', () => {
  it('should ignore client-controlled id field', async () => {
    const response = await request(app)
      .post('/api/messages')
      .send({ id: 'client-controlled-id', content: 'Hello', recipientId: 'usr_123' });

    expect(response.status).toBe(201);
    expect(response.body.id).not.toBe('client-controlled-id');
  });
});