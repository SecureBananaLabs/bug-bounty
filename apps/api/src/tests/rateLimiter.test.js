import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import rateLimiter from "../middleware/rateLimiter.js";
import { performance } from 'node:perf_hooks';

describe('rateLimiter middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      ip: '192.168.1.1',
      connection: { remoteAddress: '192.168.1.1' }
    };
    res = {
      headers: {},
      statusCode: 200,
      setHeader(name, val) {
        this.headers[name] = val;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };
    next = mock.fn();
  });

  it('allows requests within limit', () => {
    const limiter = rateLimiter({ windowMs: 1000, max: 2 });
    limiter(req, res, next);
    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.headers['X-RateLimit-Limit'], 2);
    assert.equal(res.headers['X-RateLimit-Remaining'], 1);
    limiter.stop();
  });

  it('blocks requests exceeding limit with 429', () => {
    const limiter = rateLimiter({ windowMs: 1000, max: 2 });
    limiter(req, res, next);
    limiter(req, res, next);
    assert.equal(next.mock.callCount(), 2);

    limiter(req, res, next);
    assert.equal(next.mock.callCount(), 2);
    assert.equal(res.statusCode, 429);
    assert.deepEqual(res.body, { error: 'Too many requests, please try again later.' });
    assert.notEqual(res.headers['Retry-After'], undefined);
    limiter.stop();
  });

  it('resets correctly on limiter.reset()', () => {
    const limiter = rateLimiter({ windowMs: 1000, max: 1 });
    limiter(req, res, next);
    limiter(req, res, next);
    assert.equal(res.statusCode, 429);

    limiter.reset();
    limiter(req, res, next);
    assert.equal(next.mock.callCount(), 2);
    limiter.stop();
  });

  it('recovers exactly at sliding-window expiry despite wall-clock changes', (t) => {
    let elapsed = 0;
    t.mock.method(performance, 'now', () => elapsed);
    let wallTime = 100_000;
    t.mock.method(Date, 'now', () => wallTime);
    const limiter = rateLimiter({ windowMs: 1000, max: 1 });
    t.after(() => limiter.stop());
    limiter(req, res, next);
    wallTime += 3_600_000;
    elapsed = 999;
    limiter(req, res, next);
    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.statusCode, 429);
    elapsed = 1000;
    limiter(req, res, next);
    assert.equal(next.mock.callCount(), 2);
    assert.equal(res.headers['X-RateLimit-Remaining'], 0);
  });

  it('isolates clients and reports the first request expiry', (t) => {
    let elapsed = 0;
    t.mock.method(performance, 'now', () => elapsed);
    t.mock.method(Date, 'now', () => 100_000 + elapsed);
    const limiter = rateLimiter({ windowMs: 2000, max: 2 });
    t.after(() => limiter.stop());
    limiter(req, res, next);
    elapsed = 500;
    limiter(req, res, next);
    assert.equal(res.headers['X-RateLimit-Reset'], 102);
    limiter(req, res, next);
    assert.equal(res.statusCode, 429);
    limiter({ ip: '192.168.1.2' }, res, next);
    assert.equal(next.mock.callCount(), 3);
  });
});
