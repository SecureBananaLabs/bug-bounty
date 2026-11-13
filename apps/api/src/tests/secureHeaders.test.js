import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import secureHeaders from "../middleware/secureHeaders.js";

describe('secureHeaders middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      headers: {},
      setHeader(name, val) {
        this.headers[name] = val;
      }
    };
    next = mock.fn();
  });

  it('sets standard defensive security headers by default', () => {
    const middleware = secureHeaders();
    middleware(req, res, next);

    assert.equal(next.mock.callCount(), 1);
    assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
    assert.equal(res.headers['X-Frame-Options'], 'DENY');
    assert.equal(res.headers['X-XSS-Protection'], '1; mode=block');
    assert.ok(res.headers['Strict-Transport-Security'].includes('max-age=31536000'));
    assert.equal(res.headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
    assert.equal(res.headers['Strict-Transport-Security'], 'max-age=31536000; includeSubDomains; preload');
    assert.equal(res.headers['Content-Security-Policy'], "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self';");
    assert.equal(res.headers['X-XSS-Protection'], '1; mode=block');
    assert.equal(res.headers['X-Download-Options'], 'noopen');
    assert.equal(res.headers['X-Permitted-Cross-Domain-Policies'], 'none');
  });

  it('allows custom CSP and FrameGuard overrides', () => {
    const customCsp = "default-src 'self' https://trusted.api.com";
    const middleware = secureHeaders({
      contentSecurityPolicy: customCsp,
      frameGuard: 'SAMEORIGIN'
    });
    middleware(req, res, next);

    assert.equal(res.headers['Content-Security-Policy'], customCsp);
    assert.equal(res.headers['X-Frame-Options'], 'SAMEORIGIN');
  });
});
