import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Proposal Routes - Authentication', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('should reject unauthenticated proposal creation', async () => {
    const res = await request(app)
      .post('/api/proposals')
      .send({ title: 'Test Proposal' });
    
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('should allow authenticated proposal creation', async () => {
    const res = await request(app)
      .post('/api/proposals')
      .set('Authorization', 'Bearer valid_token')
      .send({ title: 'Test Proposal' });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});