import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';
import { ZodError } from 'zod';

describe('errorHandler: validation errors return 400 (#13166)', () => {
  it('should return 400 with field details for ZodError via integration', async () => {
    const app = createApp();
    const server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    const { port } = server.address();

    // POST to jobs with invalid body (missing required title) should now be 400 not 500
    const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // missing required 'title'
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Validation failed');

    await new Promise((r) => server.close(() => r()));
  });
});
