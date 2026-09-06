import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

describe('env configuration', () => {
  let originalEnv;
  let originalWarn;

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalWarn = console.warn;
  });

  afterEach(() => {
    process.env = originalEnv;
    console.warn = originalWarn;
  });

  test('uses default port 4000 when PORT is undefined', async () => {
    process.env.PORT = '';
    delete process.env.PORT;
    const { env } = await import('../config/env.js?update=' + Date.now());
    assert.strictEqual(env.port, 4000);
  });

  test('uses provided numeric PORT', async () => {
    process.env.PORT = '5000';
    const { env } = await import('../config/env.js?update=' + Date.now());
    assert.strictEqual(env.port, 5000);
  });

  test('falls back to default 4000 when PORT is non-numeric string', async () => {
    process.env.PORT = 'invalid';
    let warningMessage = '';
    console.warn = (msg) => { warningMessage = msg; };
    const { env } = await import('../config/env.js?update=' + Date.now());
    assert.strictEqual(env.port, 4000);
    assert.strictEqual(warningMessage, 'Warning: Invalid PORT value "invalid". Falling back to default port 4000.');
  });
});

