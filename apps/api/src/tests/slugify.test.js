import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../utils/slugify.js';

test('slugify - converts standard strings to lowercase hyphenated format', () => {
  assert.equal(slugify('Senior React & Node Developer'), 'senior-react-node-developer');
  assert.equal(slugify('Decentralized Autonomous Organization 2026'), 'decentralized-autonomous-organization-2026');
});

test('slugify - normalizes NFKD and strips accents and diacritics', () => {
  assert.equal(slugify('Crème Brûlée & Café'), 'creme-brulee-cafe');
  assert.equal(slugify('Hélène déjà vu façade Niño'), 'helene-deja-vu-facade-nino');
});

test('slugify - replaces underscores and whitespace with hyphens and collapses duplicates', () => {
  assert.equal(slugify('user_profile___settings  page'), 'user-profile-settings-page');
  assert.equal(slugify('Hello! @World #2026 --- test'), 'hello-world-2026-test');
});

test('slugify - trims leading and trailing hyphens and spaces', () => {
  assert.equal(slugify('   --Important Notice--   '), 'important-notice');
  assert.equal(slugify('---hello---world---'), 'hello-world');
  assert.equal(slugify('   '), '');
  assert.equal(slugify('---'), '');
});

test('slugify - supports customizable options (custom separator and lowercase preservation)', () => {
  assert.equal(slugify('Hello World 2026', { separator: '_' }), 'hello_world_2026');
  assert.equal(slugify('CamelCase and PascalCase', { lowercase: false }), 'CamelCase-and-PascalCase');
  assert.equal(slugify('Web3 DeFi Liquidity', { separator: '.', lowercase: true }), 'web3.defi.liquidity');
});

test('slugify - defensively handles non-string inputs', () => {
  assert.equal(slugify(null), '');
  assert.equal(slugify(undefined), '');
  assert.equal(slugify(12345), '');
  assert.equal(slugify(true), '');
  assert.equal(slugify({}), '');
  assert.equal(slugify([]), '');
});

test('slugify - handles optional maxLength truncation cleanly without dangling separators', () => {
  const longTitle = 'A very long job post title that should be truncated to prevent URL overflow issues';
  const slug = slugify(longTitle, { maxLength: 20 });
  assert.ok(slug.length <= 20);
  assert.equal(slug, 'a-very-long-job-post');
});
