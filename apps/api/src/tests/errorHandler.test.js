import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../middleware/errorHandler.js';

function createMocks() {
  const res = {
    headersSent: false,
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
  const next = vi.fn();
  return { res, next };
}

describe('errorHandler', () => {
  it('should return 400 for entity.parse.failed (malformed JSON)', () => {
    const { res, next } = createMocks();
    const err = { type: 'entity.parse.failed' };
    errorHandler(err, {}, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Invalid request body. Please check your JSON syntax.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 for entity.not.json', () => {
    const { res, next } = createMocks();
    errorHandler({ type: 'entity.not.json' }, {}, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 500 for unexpected errors', () => {
    const { res, next } = createMocks();
    const err = new Error('something broke');
    errorHandler(err, {}, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: 'Unexpected server error',
    });
  });

  it('should call next if headers already sent', () => {
    const { res, next } = createMocks();
    res.headersSent = true;
    errorHandler(new Error('test'), {}, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should not echo malformed request contents in message', () => {
    const { res, next } = createMocks();
    errorHandler({ type: 'entity.parse.failed' }, {}, res, next);
    // Message should be generic, not contain user input
    expect(res.body.message).not.toContain('{');
    expect(res.body.message).not.toContain('undefined');
  });
});
