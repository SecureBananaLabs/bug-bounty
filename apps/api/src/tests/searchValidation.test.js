import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';

describe('search: query validation (#13309)', () => {
  it('should reject queries over 200 characters', async () => {
    const app = createApp();
    const server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    const { port } = server.address();

    const longQuery = 'a'.repeat(201);
    const res = await fetch(`http://127.0.0.1:${port}/api/search?q=${longQuery}`);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain('200');

    await new Promise((r) => server.close(() => r()));
  });

  it('should return 200 for valid query', async () => {
    const app = createApp();
    const server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    const { port } = server.address();

    const res = await fetch(`http://127.0.0.1:${port}/api/search?q=test`);
    expect(res.status).toBe(200);

    await new Promise((r) => server.close(() => r()));
  });

  it('should trim whitespace from query', async () => {
    const app = createApp();
    const server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    const { port } = server.address();

    const res = await fetch(`http://127.0.0.1:${port}/api/search?q=%20%20`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.jobs).toHaveLength(0);

    await new Promise((r) => server.close(() => r()));
  });
});
