import test from 'node:test';
import assert from 'node:assert/strict';
import { pick, omit } from '../utils/pickOmit.js';

test('pick selects only the specified keys from object', () => {
  const source = { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user' };
  assert.deepEqual(pick(source, ['id', 'email']), { id: 1, email: 'alice@example.com' });
  assert.deepEqual(pick(source, 'name'), { name: 'Alice' });
});

test('pick ignores keys that do not exist on object', () => {
  const source = { id: 10, title: 'Job' };
  assert.deepEqual(pick(source, ['id', 'nonexistent']), { id: 10 });
});

test('pick defensively handles non-object and null inputs', () => {
  assert.deepEqual(pick(null, ['id']), {});
  assert.deepEqual(pick(undefined, ['id']), {});
  assert.deepEqual(pick('string', ['id']), {});
  assert.deepEqual(pick(12345, ['id']), {});
  assert.deepEqual(pick([1, 2, 3], ['0']), {});
});

test('omit excludes specified keys from object', () => {
  const source = { id: 1, passwordHash: 'secret', salt: 'xyz', role: 'admin' };
  assert.deepEqual(omit(source, ['passwordHash', 'salt']), { id: 1, role: 'admin' });
  assert.deepEqual(omit(source, 'passwordHash'), { id: 1, salt: 'xyz', role: 'admin' });
});

test('omit leaves object intact when none of the keys match', () => {
  const source = { a: 1, b: 2 };
  assert.deepEqual(omit(source, ['c', 'd']), { a: 1, b: 2 });
});

test('omit defensively handles non-object and null inputs', () => {
  assert.deepEqual(omit(null, ['id']), {});
  assert.deepEqual(omit(undefined, ['id']), {});
  assert.deepEqual(omit('test', ['id']), {});
  assert.deepEqual(omit(100, ['id']), {});
  assert.deepEqual(omit([1, 2], ['0']), {});
});
