import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";

describe('sanitizeHtml utility', () => {
  it('strips script blocks and dangerous tags', () => {
    const dirty = '<script>alert(1)</script><b>Hello</b>';
    const clean = sanitizeHtml(dirty);
    assert.ok(!clean.includes('<script>'));
    assert.ok(!clean.includes('alert(1)'));
    assert.ok(clean.includes('&lt;b&gt;Hello&lt;/b&gt;'));
  });

  it('disarms inline event handlers', () => {
    const dirty = '<img src="x" onerror="stealCookies()">';
    const clean = sanitizeHtml(dirty);
    assert.ok(!clean.includes('onerror'));
    assert.ok(!clean.includes('stealCookies'));
  });

  it('neutralizes javascript: URIs', () => {
    const dirty = '<a href="javascript:doEvil()">Click</a>';
    const clean = sanitizeHtml(dirty);
    assert.ok(!clean.includes('javascript:doEvil()'));
  });

  it('safely handles non-string inputs', () => {
    assert.equal(sanitizeHtml(null), '');
    assert.equal(sanitizeHtml(undefined), '');
    assert.equal(sanitizeHtml(123), '');
  });

  it('keeps malformed markup and encoded entities inert', () => {
    for (const input of ['<scr<script>ipt>alert(1)</scr</script>ipt>',
      '<svg/onload=alert(1)>', '&lt;script&gt;alert(1)&lt;/script&gt;']) {
      const output = sanitizeHtml(input);
      assert.ok(!output.includes('<'));
      assert.ok(!output.includes('>'));
      assert.ok(!output.includes('onload='));
    }
    assert.equal(sanitizeHtml('&"\''), '&amp;&quot;&#x27;');
  });
});
