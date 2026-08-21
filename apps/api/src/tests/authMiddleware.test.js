/** @jest-environment node */
const http = require('http');
const express = require('express');

jest.mock('../utils/jwt', () => ({ verifyToken: jest.fn() }));

const authMiddleware = require('../middleware/auth');
const { verifyToken } = require('../utils/jwt');

describe('protected route bearer scheme parsing', () => {
  let server;

  beforeAll((done) => {
    const app = express();
    app.get('/protected', authMiddleware, (req, res) => {
      res.status(200).json({ ok: true, user: req.user });
    });
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    verifyToken.mockResolvedValue({ id: 'user-123', email: 'user@example.com' });
  });

  const requestProtected = (authorization) => new Promise((resolve, reject) => {
    const headers = authorization === undefined ? {} : { authorization };
    const { port } = server.address();
    const req = http.get({ hostname: '127.0.0.1', port, path: '/protected', headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let parsed = body;
        try { parsed = body ? JSON.parse(body) : null; } catch (error) {}
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
  });

  test.each(['Bearer', 'bearer', 'BEARER'])('accepts %s scheme', async (scheme) => {
    const response = await requestProtected(`${scheme} valid-token`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, user: { id: 'user-123', email: 'user@example.com' } });
    expect(verifyToken).toHaveBeenCalledTimes(1);
    expect(verifyToken).toHaveBeenCalledWith('valid-token');
  });

  test('rejects non-Bearer scheme before token verification', async () => {
    const response = await requestProtected('Basic dXNlcjpwYXNzd29yZA==');
    expect(response.status).toBe(401);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  test('rejects missing Authorization header', async () => {
    const response = await requestProtected(undefined);
    expect(response.status).toBe(401);
    expect(verifyToken).not.toHaveBeenCalled();
  });
});
