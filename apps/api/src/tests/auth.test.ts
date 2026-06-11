import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    expect(res.body).toHaveProperty('accessToken');
  });
});

describe('POST /api/auth/refresh', () => {
  it('should return 400 when token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Token is required');
  });

  it('should return 401 when token is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: 'invalid-token' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid or expired token');
  });

  it('should return a new access token for a valid token', async () => {
    const validToken = generateToken('usr_test_123', 'freelancer');
    
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: validToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    
    // Verify the new token works by checking it contains the same sub/role
    const newToken = res.body.accessToken;
    const decoded = JSON.parse(Buffer.from(newToken.split('.')[1], 'base64').toString());
    expect(decoded.sub).toBe('usr_test_123');
    expect(decoded.role).toBe('freelancer');
  });
});