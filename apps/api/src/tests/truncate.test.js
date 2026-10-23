import test from 'node:test';
import assert from 'node:assert/strict';
import { truncate } from '../utils/truncate.js';

test('truncate - basic string truncation with default omission', () => {
  const text = 'Autonomous Revenue Generation Agent for Web3 Ecosystems';
  const result = truncate(text, 25);
  assert.equal(result, 'Autonomous Revenue Gen...');
  assert.equal(result.length, 25);
});

test('truncate - string shorter than or equal to length', () => {
  assert.equal(truncate('Short text', 20), 'Short text');
  assert.equal(truncate('Exact length!', 13), 'Exact length!');
});

test('truncate - custom omission indicator', () => {
  const text = 'Deep flashloan arbitrage keeper for Base network';
  assert.equal(truncate(text, 20, { omission: '…' }), 'Deep flashloan arbi…');
  assert.equal(truncate(text, 25, { omission: ' [read more]' }), 'Deep flashloa [read more]');
});

test('truncate - word boundary preservation with string separator', () => {
  const text = 'The quick brown fox jumps over the lazy dog';
  // Without separator, target 24 - 3 = 21 chars: 'The quick brown fox j...'
  // With ' ' separator, stops before 'jumps': 'The quick brown fox...'
  const result = truncate(text, 24, { separator: ' ' });
  assert.equal(result, 'The quick brown fox...');
});

test('truncate - word boundary preservation with RegExp separator', () => {
  const text = 'USDC,WETH,WBTC,SOL,AVAX,MATIC';
  const result = truncate(text, 18, { separator: /,/ });
  assert.equal(result, 'USDC,WETH,WBTC...');
});

test('truncate - middle truncation for Web3 addresses and tx hashes', () => {
  const wallet = '0xE5Ab26877172254B72f3AE6DA5789D2468B7B282';
  const shortened = truncate(wallet, 14, { middle: true });
  assert.equal(shortened.length, 14);
  assert.ok(shortened.startsWith('0xE5A'));
  assert.ok(shortened.endsWith('B282'));
  assert.ok(shortened.includes('...'));

  const txHash = '0x3a4b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b';
  const truncatedHash = truncate(txHash, 16, { middle: true });
  assert.equal(truncatedHash.length, 16);
  assert.ok(truncatedHash.startsWith('0x3a4b'));
  assert.ok(truncatedHash.endsWith('1a0b'));
});

test('truncate - unicode, emoji and surrogate pairs preservation', () => {
  const emojiStr = '🚀🔥💰⚡💎🎉🛡️✨';
  const truncated = truncate(emojiStr, 5, { omission: '…' });
  // 5 code points total: 4 emojis + '…'
  assert.ok(truncated.endsWith('…'));
  // Ensure surrogate pairs aren't sliced in half
  assert.doesNotThrow(() => {
    encodeURIComponent(truncated);
  });
});

test('truncate - edge cases: length <= omission length and empty strings', () => {
  assert.equal(truncate('Hello World', 3), '...');
  assert.equal(truncate('Hello World', 2), '..');
  assert.equal(truncate('Hello World', 1), '.');
  assert.equal(truncate('Hello World', 0), '');
  assert.equal(truncate('Hello World', -5), '');
  assert.equal(truncate('', 10), '');
});

test('truncate - non-string input coercion', () => {
  assert.equal(truncate(null, 10), '');
  assert.equal(truncate(undefined, 10), '');
  assert.equal(truncate(1234567890, 8), '12345...');
  assert.equal(truncate(true, 10), 'true');
  assert.equal(truncate(false, 10), 'false');
});
