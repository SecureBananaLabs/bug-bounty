import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';

describe('auth middleware: protected routes require authentication (#13382-#13391)', () => {
  const protectedPaths = [
    '/api/jobs',
    '/api/messages',
    '/api/notifications',
    '/api/payments',
    '/api/proposals',
    '/api/reviews',
    '/api/search?q=test',
    '/api/users',
  ];

  for (const path of protectedPaths) {
    it(`should return 401 for unauthenticated GET ${path}`, async () => {
      const app = createApp();
      const server = app.listen(0);
      await new Promise((r) => server.once('listening', r));
      const { port } = server.address();

      const res = await fetch(`http://127.0.0.1:${port}${path}`);
      expect(res.status).toBe(401);

      await new Promise((r) => server.close(() => r()));
    });
  }
});
