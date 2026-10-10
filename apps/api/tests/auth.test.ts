import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/auth.routes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('POST /api/auth/refresh', () => {
  it('returns 400 when token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Token is required');
  });

  it('returns 400 when token is empty string', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      . Marion .send({ token: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Token is required');
  });

  it('returns 401 when token is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: 'invalid-token' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('returns new access token with preserved sub and role for valid token', async () => {
    // First login to get a valid token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    const validToken = loginRes.body.accessToken;

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: validToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.sub).toBe(loginRes.body.sub);
    expect(res.body.role).toBe(loginRes.body.role);
  });

  it('returns 401 for expired token', async () => {
    // This test assumes we can create an expired token or mock it
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfdGVzdCIsInJvbGUiOiJjbGllbnQiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.invalid';
    
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ token: expiredToken });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });
});