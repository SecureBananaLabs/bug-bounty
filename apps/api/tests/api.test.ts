import request from 'supertest';
import app from '../app';

describe('API Error Handling', () => {
  it('should return 400 for Zod validation errors', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .send({ title: 'Invalid job' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation error');
    expect(response.body.issues).toBeDefined();
  });

  it('should return 500 for non-validation errors', async () => {
    const response = await request(app)
      .get('/api/non-existent-route');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Internal server error');
  });
});