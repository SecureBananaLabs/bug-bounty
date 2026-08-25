const { pickBy, omitBy } = require('../utils/filterObject');

// Helper to check if object has null prototype
function hasNullPrototype(obj) {
  return Object.getPrototypeOf(obj) === null;
}

describe('filterObject utilities', () => {
  describe('pickBy', () => {
    test('filters object by predicate returning truthy', () => {
      const input = { a: 1, b: '2', c: 3, d: '4' };
      const result = pickBy(input, (value) => typeof value === 'number');
      expect(result).toEqual({ a: 1, c: 3 });
    });

    test('predicate receives value, key, and object', () => {
      const input = { a: 1, b: 2 };
      const received = [];
      pickBy(input, (value, key, object) => {
        received.push({ value, key, object });
        return true;
      });
      expect(received).toHaveLength(2);
      expect(received[0]).toEqual({ value: 1, key: 'a', object: input });
      expect(received[1]).toEqual({ value: 2, key: 'b', object: input });
    });

    test('returns object with null prototype', () => {
      const result = pickBy({ a: 1 }, () => true);
      expect(hasNullPrototype(result)).toBe(true);
    });

    test('does not include prototype properties', () => {
      const proto = { protoProp: 'polluted' };
      const input = Object.create(proto);
      input.ownProp = 'own';
      const result = pickBy(input, () => true);
      expect(result).toEqual({ ownProp: 'own' });
      expect('protoProp' in result).toBe(false);
    });

    test('handles null input', () => {
      const result = pickBy(null, () => true);
      expect(result).toEqual({});
      expect(hasNullPrototype(result)).toBe(true);
    });

    test('handles undefined input', () => {
      const result = pickBy(undefined, () => true);
      expect(result).toEqual({});
      expect(hasNullPrototype(result)).toBe(true);
    });

    test('handles non-object input', () => {
      const result = pickBy('string', () => true);
      expect(result).toEqual({});
      expect(hasNullPrototype(result)).toBe(true);
    });

    test('handles array input', () => {
      const result = pickBy([1, 2, 3], (v, k) => k === '1');
      expect(result).toEqual({ '1': 2 });
      expect(hasNullPrototype(result)).toBe(true);
    });

    test('throws TypeError when predicate is not a function', () => {
      expect(() => pickBy({ a: 1 }, 'not a function')).toThrow(TypeError);
      expect(() => pickBy({ a: 1 }, null)).toThrow(TypeError);
      expect(() => pickBy({ a: 1 }, 123)).toThrow(TypeError);
    });

    test('returns empty object when no properties match', () => {
      const result = pickBy({ a: 1, b: 2 }, () => false);
      expect(result).toEqual({});
      expect(hasNullPrototype(result)).toBe(true);
    });

    test('preserves original object', () => {
      const input = { a: 1, b: 2 };
      pickBy(input, () => false);
      expect(input).toEqual({ a: 1, b: 2 });
    });

    test('works with nested objects', () => {
      const input = { a: { nested: 1 }, b: { nested: 2 } };
      const result = pickBy(input, (v) => v.nested === 1);
      expect(result).toEqual({ a: { nested: 1 } });
    });

    test('works with symbol keys', () => {
      const sym = Symbol('test');
      const input = { [sym]: 'value', regular: 'key' };
      const result = pickBy(input, (v, k) => k === sym);
      expect(result[sym]).toBe('value');
      expect('regular' in result).toBe(false);
    });
  });

  describe('omitBy', () => {
    test('filters object by predicate returning falsy', () => {
      const input = { a: 1, b: '2', c: 3, d: '4' };
      const result = omitBy(input, (value) => typeof value === 'number');
      expect(result).toEqual({ b: '2', d: '4' });
    });

    test('predicate receives value, key, and object', () => {
      const input = { a: 1, b: 2 };
      const received = [];
      omitBy(input, (value, key, object) => {
        received.push({ value, key, object });
        return false;
      });
      expect(received).toHaveLength(2);
      expect(received[0]).toEqual({ value: 1, key: 'a', object: input });
      expect(received[1]).toEqual({ value: 2, key: 'b', object: input });
    });

    test('returns object with null prototype', () => {
      const result = omitBy({ a: 1 }, () => false);
      expect(hasNullPrototype(result)).toBe(true);
    });

    test('does not include prototype properties', () => {
      const proto = { protoProp: 'polluted' };
      const input = Object.create(proto);
      input.ownProp = 'own';
      const result = omitBy(input, () => false);
      expect(result).toEqual({ ownProp: 'own' });
      expect('protoProp' in result).toBe(false);
    });

    test('handles null input', () => {
      const result = omitBy(null, () => false);
      expect(result).toEqual({});
      expect(hasNullPrototype(result)).toBe(true);
    });

    test('handles undefined input', () => {
      const result = omitBy(undefined, () => false);
      expect(result).toEqual({});
      expect(hasNullPrototype(result)).toBe(true);
    });

    test('handles non-object input', () => {
      const result = omitBy('string', () => false);
      expect(result).toEqual({});
      expect(hasNullPrototype(result)).toBe(true);
    });

    test('handles array input', () => {
      const result = omitBy([1, 2, 3], (v, k) => k === '1');
      expect(result).toEqual({ '0': 1, '2': 3 });
      expect(hasNullPrototype(result)).toBe(true);
    });

    test('throws TypeError when predicate is not a function', () => {
      expect(() => omitBy({ a: 1 }, 'not a function')).toThrow(TypeError);
      expect(() => omitBy({ a: 1 }, null)).toThrow(TypeError);
      expect(() => omitBy({ a: 1 }, 123)).toThrow(TypeError);
    });

    test('returns empty object when all properties match', () => {
      const result = omitBy({ a: 1, b: 2 }, () => true);
      expect(result).toEqual({});
      expect(hasNullPrototype(result)).toBe(true);
    });

    test('preserves original object', () => {
      const input = { a: 1, b: 2 };
      omitBy(input, () => true);
      expect(input).toEqual({ a: 1, b: 2 });
    });

    test('works with nested objects', () => {
      const input = { a: { nested: 1 }, b: { nested: 2 } };
      const result = omitBy(input, (v) => v.nested === 1);
      expect(result).toEqual({ b: { nested: 2 } });
    });

    test('works with symbol keys', () => {
      const sym = Symbol('test');
      const input = { [sym]: 'value', regular: 'key' };
      const result = omitBy(input, (v, k) => k === sym);
      expect(result.regular).toBe('key');
      expect(sym in result).toBe(false);
    });
  });

  describe('prototype pollution prevention', () => {
    test('pickBy result cannot be polluted via __proto__', () => {
      const malicious = { __proto__: { polluted: true }, a: 1 };
      const result = pickBy(malicious, () => true);
      expect(result.polluted).toBeUndefined();
      expect({}.polluted).toBeUndefined();
    });

    test('omitBy result cannot be polluted via __proto__', () => {
      const malicious = { __proto__: { polluted: true }, a: 1 };
      const result = omitBy(malicious, () => false);
      expect(result.polluted).toBeUndefined();
      expect({}.polluted).toBeUndefined();
    });

    test('pickBy result cannot be polluted via constructor.prototype', () => {
      const malicious = { constructor: { prototype: { polluted: true } }, a: 1 };
      const result = pickBy(malicious, () => true);
      expect(result.polluted).toBeUndefined();
      expect({}.polluted).toBeUndefined();
    });

    test('omitBy result cannot be polluted via constructor.prototype', () => {
      const malicious = { constructor: { prototype: { polluted: true } }, a: 1 };
      const result = omitBy(malicious, () => false);
      expect(result.polluted).toBeUndefined();
      expect({}.polluted).toBeUndefined();
    });

    test('multiple operations do not leak pollution', () => {
      const obj1 = { __proto__: { x: 1 }, a: 1 };
      const obj2 = { __proto__: { y: 2 }, b: 2 };
      
      const picked = pickBy(obj1, () => true);
      const omitted = omitBy(obj2, () => false);
      
      expect(picked.x).toBeUndefined();
      expect(omitted.y).toBeUndefined();
      expect({}.x).toBeUndefined();
      expect({}.y).toBeUndefined();
    });
  });

  describe('real-world use cases', () => {
    test('stripping sensitive fields from user object', () => {
      const user = {
        id: 1,
        username: 'john',
        email: 'john@example.com',
        passwordHash: 'secret123',
        salt: 'salt123',
        apiKey: 'key123',
        createdAt: '2024-01-01',
      };
      
      const publicUser = omitBy(user, (_, key) => 
        ['passwordHash', 'salt', 'apiKey'].includes(key)
      );
      
      expect(publicUser).toEqual({
        id: 1,
        username: 'john',
        email: 'john@example.com',
        createdAt: '2024-01-01',
      });
      expect(hasNullPrototype(publicUser)).toBe(true);
    });

    test('picking only allowed fields for API response', () => {
      const apiResponse = {
        data: { id: 1, name: 'Test' },
        meta: { timestamp: Date.now() },
        internal: { debug: true, traceId: 'abc' },
        errors: null,
      };
      
      const filtered = pickBy(apiResponse, (_, key) => 
        ['data', 'meta', 'errors'].includes(key)
      );
      
      expect(filtered).toEqual({
        data: { id: 1, name: 'Test' },
        meta: { timestamp: apiResponse.meta.timestamp },
        errors: null,
      });
      expect(hasNullPrototype(filtered)).toBe(true);
    });

    test('filtering undefined values', () => {
      const input = { a: 1, b: undefined, c: 3, d: null };
      const result = pickBy(input, (v) => v !== undefined);
      expect(result).toEqual({ a: 1, c: 3, d: null });
    });

    test('filtering falsy values', () => {
      const input = { a: 1, b: 0, c: '', d: false, e: null, f: undefined };
      const result = pickBy(input, Boolean);
      expect(result).toEqual({ a: 1 });
    });
  });
});
