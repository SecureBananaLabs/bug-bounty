import request from 'supertest';
import app from '../src/routes/index';

describe('Error Handler', () => {
  it('should return 400 for malformed JSON request body', async () => {
    const res = await request(app)
      .post('/api/test')
      .set("Content-Type", "application/json")
      .send('Invalid JSON');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Malformed JSON request body');
  });
});