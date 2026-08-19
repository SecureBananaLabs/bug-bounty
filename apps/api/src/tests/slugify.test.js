import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../utils/slugify.js';

describe('Deterministic URL Slug Generator Utility', () => {
  it('converts standard text to lowercase hyphenated slug', () => {
    assert.equal(slugify('Full Stack Senior Developer'), 'full-stack-senior-developer');
  });

  it('normalizes diacritics and accented characters correctly', () => {
    assert.equal(slugify('Programación Web en Español y Francés'), 'programacion-web-en-espanol-y-frances');
  });

  it('strips special symbols and collapses duplicate separators', () => {
    assert.equal(slugify('API v2.0: Bug-Bounty @ 2026! --- #Web3'), 'api-v20-bug-bounty-2026-web3');
  });

  it('respects maxLength and trims trailing separator', () => {
    const longText = 'This is a very long title designed to test bounded slug length constraint';
    const slug = slugify(longText, { maxLength: 20 });
    assert.ok(slug.length <= 20);
    assert.equal(slug.endsWith('-'), false);
  });

  it('gracefully handles empty, non-string, or undefined inputs', () => {
    assert.equal(slugify(null), '');
    assert.equal(slugify(''), '');
    assert.equal(slugify(undefined), '');
  });
});
