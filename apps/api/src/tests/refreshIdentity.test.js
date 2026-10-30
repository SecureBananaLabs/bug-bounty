import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';

describe('auth: refresh uses caller identity (#13162)', () => {
  it('should return 401 when no token provided', async () => {
    const app = createApp();
    const server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    const { port } = server.address();

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: 'POST',
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);

    await new Promise((r) => server.close(() => r()));
  });

  it('should return a valid token with the same sub when given a valid token', async () => {
    const { signAccessToken } = await import('../utils/jwt.js');
    const app = createApp();
    const server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    const { port } = server.address();

    const originalToken = signAccessToken({ sub: 'usr_test123', role: 'client' });

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${originalToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();

    // Decode and verify sub matches
    const payload = JSON.parse(atob(body.data.token.split('.')[1]));
    expect(payload.sub).toBe('usr_test123');

    await new Promise((r) => server.close(() => r()));
  });
});
