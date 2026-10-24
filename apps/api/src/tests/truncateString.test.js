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

test('truncateString - defensively returns empty string for negative, zero, or non-numeric maxLength', () => {
  assert.equal(truncateString('Hello world', 0), '');
  assert.equal(truncateString('Hello world', -5), '');
  assert.equal(truncateString('Hello world', NaN), '');
  assert.equal(truncateString('Hello world', '10'), '');
  assert.equal(truncateString('Hello world', null), '');
});

test('truncateString - preserves unicode character boundaries and emojis without splitting surrogate pairs', () => {
  const emojiStr = '🚀🔥💰⚡💎🎉🛡️✨';
  const result = truncateString(emojiStr, 5, '...');
  // 5 code points: 2 emojis + 3 dots
  assert.equal(Array.from(result).length, 5);
  assert.ok(result.endsWith('...'));
  // Ensure surrogate pairs are not broken into invalid lone surrogates
  assert.doesNotThrow(() => {
    encodeURIComponent(result);
  });

  const singleSurrogate = '⚡🚀🔥';
  assert.equal(truncateString(singleSurrogate, 2, ''), '⚡🚀');
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
