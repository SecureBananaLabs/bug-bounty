import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';

describe('uploadRoutes: reject requests without file', () => {
  it('should return 400 when no file is uploaded', async () => {
    const app = createApp();
    const server = app.listen(0);

    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address();

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('file');

    await new Promise((resolve) => server.close(() => resolve()));
  });
});
