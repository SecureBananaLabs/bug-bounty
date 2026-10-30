import test from 'node:test';
import assert from 'node:assert/strict';
import { truncateString } from '../utils/truncateString.js';

test('truncateString - basic truncation with default suffix', () => {
  const input = 'Autonomous Revenue Generation Agent for Web3 Ecosystems';
  const result = truncateString(input, 25);
  assert.equal(result, 'Autonomous Revenue Gen...');
  assert.equal(Array.from(result).length, 25);
});

test('truncateString - strings shorter than or equal to maxLength return original string', () => {
  assert.equal(truncateString('Hello world', 20), 'Hello world');
  assert.equal(truncateString('Exact length!', 13), 'Exact length!');
  assert.equal(truncateString('', 10), '');
});

test('truncateString - defensively returns empty string for non-string inputs', () => {
  assert.equal(truncateString(null, 10), '');
  assert.equal(truncateString(undefined, 10), '');
  assert.equal(truncateString(12345, 10), '');
  assert.equal(truncateString(true, 10), '');
  assert.equal(truncateString({}, 10), '');
  assert.equal(truncateString([], 10), '');
});

test('truncateString - defensively returns empty string for negative, zero, non-finite, or non-numeric maxLength', () => {
  assert.equal(truncateString('Hello world', 0), '');
  assert.equal(truncateString('Hello world', -5), '');
  assert.equal(truncateString('Hello world', NaN), '');
  assert.equal(truncateString('Hello world', Infinity), '');
  assert.equal(truncateString('Hello world', -Infinity), '');
  assert.equal(truncateString('Hello world', '10'), '');
  assert.equal(truncateString('Hello world', null), '');
});

test('truncateString - handles fractional maxLength with Math.floor normalization', () => {
  assert.equal(truncateString('Hello world', 0.5), '');
  assert.equal(truncateString('Hello world', 0.9), '');
  // 5.8 floored to 5: 2 characters + '...'
  assert.equal(truncateString('Hello world', 5.8), 'He...');
});

test('truncateString - preserves unicode character boundaries and emojis without splitting surrogate pairs', () => {
  const emojiStr = '🚀🔥💰⚡💎🎉🛡️✨';
  const result = truncateString(emojiStr, 5, '...');
  assert.ok(result.endsWith('...'));
  // Ensure surrogate pairs are not broken into invalid lone surrogates
  assert.doesNotThrow(() => {
    encodeURIComponent(result);
  });

  const singleSurrogate = '⚡🚀🔥';
  assert.equal(truncateString(singleSurrogate, 2, ''), '⚡🚀');
});

test('truncateString - preserves complex Unicode grapheme clusters (ZWJ sequences, skin tones, flags, combining marks)', () => {
  // Family emoji ZWJ compound: 1 grapheme cluster
  const familyStr = '👨‍👩‍👧‍👦🚀🔥';
  const truncatedFamily = truncateString(familyStr, 2, '');
  assert.equal(truncatedFamily, '👨‍👩‍👧‍👦🚀');

  // Skin tone modifier: 1 grapheme cluster
  const thumbsUp = '👍🏽👍🏻👍🏿';
  assert.equal(truncateString(thumbsUp, 2, ''), '👍🏽👍🏻');

  // Country flags (regional indicator pairs): 1 grapheme cluster each
  const flags = '🇺🇸🇬🇧🇯🇵🇩🇪';
  assert.equal(truncateString(flags, 2, ''), '🇺🇸🇬🇧');

  // Combining diacritic marks (cafe + combining acute accent): 4 graphemes
  const combiningCafe = 'cafe\u0301';
  assert.equal(truncateString(combiningCafe, 4, ''), 'cafe\u0301');
});

test('truncateString - customizable suffix handling', () => {
  const text = 'Base Arbitrum Optimism Ethereum Polygon';
  assert.equal(truncateString(text, 15, ' [more]'), 'Base Arb [more]');
  assert.equal(truncateString(text, 10, ''), 'Base Arbit');
  assert.equal(truncateString(text, 12, '…'), 'Base Arbitr…');
});

test('truncateString - maxLength less than or equal to suffix length', () => {
  assert.equal(truncateString('Hello World', 3, '...'), '...');
  assert.equal(truncateString('Hello World', 2, '...'), '..');
  assert.equal(truncateString('Hello World', 1, '...'), '.');
});
