import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSvgContent } from '../utils/sanitizeSvg.js';

describe('SVG Content Sanitizer for Stored XSS Prevention', () => {
  it('preserves clean standard SVG elements and attributes', () => {
    const cleanSvg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';
    assert.equal(sanitizeSvgContent(cleanSvg), cleanSvg);
  });

  it('strips embedded script tags', () => {
    const dirty = '<svg><script>alert("XSS")</script><circle cx="10" cy="10" r="5"/></svg>';
    const cleaned = sanitizeSvgContent(dirty);
    assert.equal(cleaned.includes('<script>'), false);
    assert.equal(cleaned.includes('alert("XSS")'), false);
    assert.equal(cleaned.includes('<circle'), true);
  });

  it('strips inline onload and onerror event handlers', () => {
    const dirty = '<svg onload="alert(1)" onerror=alert(2)><rect width="10" height="10"/></svg>';
    const cleaned = sanitizeSvgContent(dirty);
    assert.equal(cleaned.includes('onload'), false);
    assert.equal(cleaned.includes('onerror'), false);
    assert.equal(cleaned.includes('<rect'), true);
  });

  it('strips javascript: pseudo-protocol URIs in links', () => {
    const dirty = '<svg><a href="javascript:alert(1)"><text>Click me</text></a></svg>';
    const cleaned = sanitizeSvgContent(dirty);
    assert.equal(cleaned.includes('javascript:'), false);
  });
});
