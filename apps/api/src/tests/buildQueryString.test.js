import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildQueryString } from '../utils/buildQueryString.js';

describe('buildQueryString utility', () => {
  it('serializes standard key-value pairs with alphabetical key sorting by default', () => {
    const input = { z: 'last', a: 'first', m: 'middle' };
    const qs = buildQueryString(input);
    assert.strictEqual(qs, 'a=first&m=middle&z=last');
  });

  it('supports custom sorting comparator and sort: false preserving insertion order', () => {
    const input = { b: '2', a: '1', c: '3' };
    const preserveOrder = buildQueryString(input, { sort: false });
    assert.strictEqual(preserveOrder, 'b=2&a=1&c=3');

    const descOrder = buildQueryString(input, {
      sort: (x, y) => y.localeCompare(x),
    });
    assert.strictEqual(descOrder, 'c=3&b=2&a=1');
  });

  it('serializes arrays with brackets format by default (brackets)', () => {
    const input = { tag: ['alpha', 'beta'] };
    const qs = buildQueryString(input);
    assert.strictEqual(qs, 'tag%5B%5D=alpha&tag%5B%5D=beta');
  });

  it('serializes arrays with indices format (indices)', () => {
    const input = { items: ['apple', 'banana'] };
    const qs = buildQueryString(input, { arrayFormat: 'indices' });
    assert.strictEqual(qs, 'items%5B0%5D=apple&items%5B1%5D=banana');
  });

  it('serializes arrays with repeat format (repeat)', () => {
    const input = { role: ['admin', 'moderator'] };
    const qs = buildQueryString(input, { arrayFormat: 'repeat' });
    assert.strictEqual(qs, 'role=admin&role=moderator');
  });

  it('serializes arrays with comma-separated format (comma)', () => {
    const input = { filter: ['one', 'two', 'three'] };
    const qs = buildQueryString(input, { arrayFormat: 'comma' });
    assert.strictEqual(qs, 'filter=one%2Ctwo%2Cthree');
  });

  it('omits empty arrays cleanly', () => {
    const input = { tags: [], active: true };
    const qs = buildQueryString(input);
    assert.strictEqual(qs, 'active=true');
  });

  it('handles null, undefined, and empty string options properly', () => {
    const input = {
      empty: '',
      nullVal: null,
      undefVal: undefined,
      valid: 'ok',
    };

    // Default: skipUndefined=true, skipNull=false, skipEmptyString=false
    const def = buildQueryString(input);
    assert.strictEqual(def, 'empty=&nullVal=&valid=ok');

    // skipNull: true
    const skippedNull = buildQueryString(input, { skipNull: true });
    assert.strictEqual(skippedNull, 'empty=&valid=ok');

    // skipEmptyString: true
    const skippedEmpty = buildQueryString(input, { skipEmptyString: true, skipNull: true });
    assert.strictEqual(skippedEmpty, 'valid=ok');

    // strictNullHandling: true
    const strictNull = buildQueryString(input, { strictNullHandling: true, skipEmptyString: true });
    assert.strictEqual(strictNull, 'nullVal&valid=ok');
  });

  it('prepends query prefix ? when addQueryPrefix: true and result is non-empty', () => {
    const qs = buildQueryString({ q: 'search' }, { addQueryPrefix: true });
    assert.strictEqual(qs, '?q=search');

    const emptyQs = buildQueryString({}, { addQueryPrefix: true });
    assert.strictEqual(emptyQs, '');
  });

  it('defends against Prototype Pollution (CWE-1321) by omitting dangerous keys', () => {
    const malicious = JSON.parse(
      '{"__proto__":{"polluted":true},"constructor":{"prototype":{"injected":true}},"prototype":"evil","safe":"yes"}'
    );

    const safeQs = buildQueryString(malicious);
    assert.strictEqual(safeQs, 'safe=yes');
    assert.strictEqual(Object.prototype.polluted, undefined);
  });

  it('throws TypeError when prototypeProtection: "throw" encounters forbidden keys', () => {
    const malicious = JSON.parse('{"__proto__":{"admin":true}}');
    assert.throws(
      () => buildQueryString(malicious, { prototypeProtection: 'throw' }),
      /Prototype pollution key detected/
    );
  });

  it('prevents call stack exhaustion on circular references (CWE-400)', () => {
    const circular = { name: 'cyclic' };
    circular.self = circular;

    const qs = buildQueryString(circular);
    assert.strictEqual(qs, 'name=cyclic');
  });

  it('serializes nested objects using bracket notation and dot notation', () => {
    const nested = {
      user: {
        address: {
          city: 'London',
        },
        name: 'Alice',
      },
    };

    const bracketQs = buildQueryString(nested);
    assert.strictEqual(
      bracketQs,
      'user%5Baddress%5D%5Bcity%5D=London&user%5Bname%5D=Alice'
    );

    const dotQs = buildQueryString(nested, { allowDots: true, encodeValuesOnly: true });
    assert.strictEqual(dotQs, 'user.address.city=London&user.name=Alice');
  });

  it('serializes Date objects to ISO 8601 strings', () => {
    const d = new Date('2026-10-24T12:00:00.000Z');
    const qs = buildQueryString({ from: d });
    assert.strictEqual(qs, 'from=2026-10-24T12%3A00%3A00.000Z');
  });

  it('supports custom encode hooks and encode: false', () => {
    const input = { greeting: 'hello world', num: 42 };

    const raw = buildQueryString(input, { encode: false });
    assert.strictEqual(raw, 'greeting=hello world&num=42');

    const custom = buildQueryString(input, {
      encode: (val) => String(val).toUpperCase(),
    });
    assert.strictEqual(custom, 'GREETING=HELLO WORLD&NUM=42');
  });

  it('supports encodeValuesOnly to leave parameter keys unescaped', () => {
    const input = { 'filter[status]': 'active pending' };
    const qs = buildQueryString(input, { encodeValuesOnly: true });
    assert.strictEqual(qs, 'filter[status]=active%20pending');
  });

  it('gracefully handles non-object, null, and empty inputs without error', () => {
    assert.strictEqual(buildQueryString(null), '');
    assert.strictEqual(buildQueryString(undefined), '');
    assert.strictEqual(buildQueryString('string'), '');
    assert.strictEqual(buildQueryString(12345), '');
    assert.strictEqual(buildQueryString({}), '');
  });

  it('ignores prototype-inherited properties enforcing own-property isolation', () => {
    const proto = { inherited: 'leak', evil: true };
    const obj = Object.create(proto);
    obj.ownProp = 'clean';

    const qs = buildQueryString(obj);
    assert.strictEqual(qs, 'ownProp=clean');
  });

  it('serializes arrays containing nested objects properly', () => {
    const input = {
      items: [{ id: 1 }, { id: 2 }],
    };
    const qs = buildQueryString(input, { encodeValuesOnly: true });
    assert.strictEqual(qs, 'items[][id]=1&items[][id]=2');
  });

  it('serializes arrays with comma-separated format and encode: false as literal commas', () => {
    const input = { tags: ['dev', 'prod'] };
    const qs = buildQueryString(input, { arrayFormat: 'comma', encode: false });
    assert.strictEqual(qs, 'tags=dev,prod');
  });

  it('validates options parameter types', () => {
    assert.throws(() => buildQueryString({ a: 1 }, 'invalid-options'), TypeError);
    assert.throws(
      () => buildQueryString({ a: 1 }, { arrayFormat: 'invalid_mode' }),
      TypeError
    );
    assert.throws(
      () => buildQueryString({ a: 1 }, { sort: 'not-valid' }),
      TypeError
    );
    assert.throws(
      () => buildQueryString({ a: 1 }, { prototypeProtection: 'invalid' }),
      TypeError
    );
  });

  it('screens segmented prototype pollution keys in bracket and dot notation', () => {
    const malicious = {
      'a[__proto__]': 'polluted',
      'b.constructor': 'polluted',
      'c[prototype][key]': 'polluted',
      'user[constructor][name]': 'evil',
      validKey: 'allowed',
    };
    const qs = buildQueryString(malicious);
    assert.strictEqual(qs, 'validKey=allowed');

    assert.throws(
      () => buildQueryString({ 'a[__proto__]': 'evil' }, { prototypeProtection: 'throw' }),
      /Prototype pollution key detected/
    );
    assert.throws(
      () => buildQueryString({ 'user.constructor.prototype': 'evil' }, { prototypeProtection: 'throw' }),
      /Prototype pollution key detected/
    );
  });

  it('does not falsely strip valid keys starting with constructor or prototype substrings', () => {
    const input = {
      constructorName: 'MyClass',
      prototypeChain: 'valid',
      constructionYear: 2026,
    };
    const qs = buildQueryString(input);
    assert.strictEqual(
      qs,
      'constructionYear=2026&constructorName=MyClass&prototypeChain=valid'
    );
  });

  it('handles invalid Date objects gracefully without throwing RangeError', () => {
    const invalidDate = new Date('invalid');
    const qs = buildQueryString({ d: invalidDate, ok: 1 });
    assert.strictEqual(qs, 'd=&ok=1');

    const skipped = buildQueryString({ d: invalidDate, ok: 1 }, { skipEmptyString: true });
    assert.strictEqual(skipped, 'ok=1');
  });

  it('omits comma array when all items are filtered out', () => {
    const qs = buildQueryString({ tags: [undefined, undefined] }, { arrayFormat: 'comma' });
    assert.strictEqual(qs, '');
  });
});
