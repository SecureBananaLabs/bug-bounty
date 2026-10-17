import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';

describe('uploadRoute: missing file returns 400 (#13164)', () => {
  it('should return 400 when no file is uploaded', async () => {
    const app = createApp();
    const server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    const { port } = server.address();

    const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('file');

    await new Promise((r) => server.close(() => r()));
  });
});
