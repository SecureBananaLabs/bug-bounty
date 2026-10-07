import request from 'supertest';
import app from '../index';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/bounties', () => {
    it('should create a bounty with valid data', async () => {
      const response = await request(app)
        .post('/api/bounties')
        .send({
          title: 'Test Bounty',
          description: 'Test Description',
          reward: 500,
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Bounty');
      expect(response.body.reward).toBe(500);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/bounties')
        .send({ title: 'Test' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/bounties/:id', () => {
    it('should return a bounty by id', async () => {
      const response = await request(app).get('/api/bounties/test-id');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'test-id');
    });
  });
});
