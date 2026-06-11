import request from 'supertest';
import express from 'express';
import { generateToken } from '../utils/jwt';

// Mock before importing app
const mockFindUnique = jest.fn();
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 400 when token is missing', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 when token is empty string', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ token: '' });

      expect(res.status).toBe(400);
    });

    it('should return 401 when token is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ token: 'invalid-token' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid or expired token');
    });

    it('should return new access token for valid token', async () => {
      const validToken = generateToken('usr_existing', 'freelancer');
      
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ token: validToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      
      // Verify the new token has the same sub and role
      const newTokenPayload = JSON.parse(Buffer.from(res.body.accessToken.split('.')[1], 'base64').toString());
      expect(newTokenPayload.sub).toBe('usr_existing');
      expect(newTokenPayload.role).toBe('freelancer');
    });
  });
});