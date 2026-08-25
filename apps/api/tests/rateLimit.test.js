const request = require('supertest');
const app = require('../src/app');

// Helper to wait for rate limit window to reset (for cleanup)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Override rate limiter for testing: 5 requests per 15 seconds
jest.mock('../src/middleware/rateLimit', () => {
  const rateLimit = require('express-rate-limit');
  return {
    apiLimiter: rateLimit({
      windowMs: 15 * 1000, // 15 seconds for faster tests
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: 429,
        error: 'Too many requests, please try again later.'
      }
    }),
    authLimiter: rateLimit({
      windowMs: 15 * 1000,
      max: 3,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: 429,
        error: 'Too many authentication attempts, please try again later.'
      }
    })
  };
});

describe('Rate Limiter - Malformed JSON Handling', () => {
  afterAll(async () => {
    // Wait for rate limit window to reset
    await wait(16000);
  });

  test('should return 429 after exceeding rate limit with malformed JSON', async () => {
    // Send 5 malformed JSON requests (should be allowed)
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{malformed json');
      
      // First 5 should get 400 (malformed body) or other non-429 status
      expect(response.status).not.toBe(429);
    }

    // The 6th request should be rate-limited (429)
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{malformed json');

    expect(response.status).toBe(429);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Too many requests');
  });

  test('should count malformed JSON requests toward the same limit as valid requests', async () => {
    // Send 3 valid requests
    for (let i = 0; i < 3; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      expect(response.status).not.toBe(429);
    }

    // Send 2 malformed requests (total 5, should be allowed)
    for (let i = 0; i < 2; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{malformed');
      expect(response.status).not.toBe(429);
    }

    // 6th request (any type) should be rate-limited
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(429);
  });

  test('should not rate-limit health check endpoint', async () => {
    // Make many requests to health check
    for (let i = 0; i < 10; i++) {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    }
  });

  test('should return appropriate rate limit headers', async () => {
    // Make requests until rate limited
    for (let i = 0; i < 6; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      
      if (i < 5) {
        expect(response.headers['ratelimit-remaining']).toBeDefined();
        expect(response.headers['ratelimit-limit']).toBeDefined();
      } else {
        expect(response.status).toBe(429);
      }
    }
  });
});