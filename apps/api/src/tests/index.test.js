import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('synchronous passing test', (t) => {
  assert.strictEqual(1, 1);
});