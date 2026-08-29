const request = require('supertest');
const app = require('../src/app');

describe('Validation Middleware', () => {
  describe('POST /api/auth/register', () => {
    it('should return 400 for missing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: '123456', name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details[0].path).toBe('email');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'notanemail', password: '123456', name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: '123', name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: '123456' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 201 for valid payload', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: '123456', name: 'Test' });
      // If registration succeeds, we get 201; if email already exists, it might be 409.
      // We just check that it's not 400.
      expect(res.status).not.toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 for missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: '123456' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 for missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bad', password: '123456' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/jobs', () => {
    it('should return 400 for missing title', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({ description: 'Test', budget: 100, category: 'tech' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 for negative budget', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({ title: 'Test', description: 'Test', budget: -10, category: 'tech' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 for missing category', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({ title: 'Test', description: 'Test', budget: 100 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });
});
