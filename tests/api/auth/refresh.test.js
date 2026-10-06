const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { ACCESS_SECRET } = require('../../src/api/config');

describe('POST /api/auth/refresh', () => {
  const validPayload = { sub: 'usr123', roles: ['user'] };
  const validToken = jwt.sign(validPayload, ACCESS_SECRET, { expiresIn: '1h' });

  test('should reject request without authorization header', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .expect(401);
    expect(response.body.error).toMatch(/Missing or invalid authorization header/);
  });

  test('should reject request with malformed authorization header', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', 'Basic invalid')
      .expect(401);
    expect(response.body.error).toMatch(/Missing or invalid authorization header/);
  });

  test('should reject request with invalid token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${'invalid.token.here'}`)
      .expect(401);
    expect(response.body.error).toMatch(/Invalid token/);
  });

  test('should reject request with expired token', async () => {
    const expiredToken = jwt.sign(validPayload, ACCESS_SECRET, { expiresIn: '0ms' });
    await new Promise(resolve => setTimeout(resolve, 10)); // Ensure token is expired

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
    expect(response.body.error).toMatch(/Token expired/);
  });

  test('should issue new token with valid request', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('token');
    const newToken = response.body.token;
    const decoded = jwt.verify(newToken, ACCESS_SECRET);
    
    expect(decoded.sub).toBe(validPayload.sub);
    expect(decoded.roles).toEqual(validPayload.roles);
    expect(decoded).not.toHaveProperty('iat'); // Should not copy old claims
    expect(decoded).not.toHaveProperty('exp'); // Should not copy old claims
  });
});