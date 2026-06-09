import request from 'supertest';
import app from '../../app';

describe('Messages API', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await request(app).post('/api/messages');
    expect(response.status).toBe(401);
  });

  it('should create message for authenticated requests', async () => {
    const token = 'valid-token';
    const response = await request(app)
      .post('/api/messages')
      .set("Authorization", `Bearer ${token}`)
      .send({ text: 'Hello World' });
    expect(response.status).toBe(201);
  });
});