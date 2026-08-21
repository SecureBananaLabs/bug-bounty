import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getNested } from '../utils/getNested.js';

describe('Safe Deeply Nested Property Getter Utility', () => {
  const sample = {
    user: {
      profile: {
        name: 'Alice',
        addresses: [{ city: 'Nairobi', country: 'Kenya' }],
      },
      roles: ['admin', 'developer'],
    },
  };

  it('retrieves nested string properties with dot-notation', () => {
    assert.equal(getNested(sample, 'user.profile.name'), 'Alice');
  });

  it('retrieves nested properties with array notation', () => {
    assert.equal(getNested(sample, ['user', 'profile', 'name']), 'Alice');
  });

  it('returns fallback default value when path does not exist', () => {
    assert.equal(getNested(sample, 'user.profile.age', 30), 30);
    assert.equal(getNested(sample, 'nonexistent.deep.path', 'fallback'), 'fallback');
  });

  it('blocks prototype pollution and sensitive prototype keys', () => {
    assert.equal(getNested(sample, '__proto__.polluted', 'safe'), 'safe');
    assert.equal(getNested(sample, 'constructor.name', 'safe'), 'safe');
  });

  it('handles null, undefined, or primitive root objects gracefully', () => {
    assert.equal(getNested(null, 'user.name', 'default'), 'default');
    assert.equal(getNested(undefined, 'user.name', 'default'), 'default');
    assert.equal(getNested(12345, 'user.name', 'default'), 'default');
  });
});
