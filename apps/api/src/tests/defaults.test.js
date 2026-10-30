import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaults, isUnsafeKey, isPlainObject } from '../utils/defaults.js';

describe('defaults defensive utility (ref #743)', () => {
  it('applies default properties from source to target without overwriting defined properties', () => {
    const target = { a: 1 };
    const source1 = { b: 2, a: 10 };
    const source2 = { c: 3, b: 20 };

    const result = defaults(target, source1, source2);
    assert.strictEqual(result, target);
    assert.deepStrictEqual(result, { a: 1, b: 2, c: 3 });
  });

  it('preserves existing falsey values (false, 0, "", null, NaN)', () => {
    const target = {
      isReady: false,
      count: 0,
      title: '',
      payload: null,
      score: NaN,
    };
    const source = {
      isReady: true,
      count: 100,
      title: 'Default Title',
      payload: { data: 'ok' },
      score: 50,
    };

    const result = defaults(target, source);
    assert.strictEqual(result.isReady, false);
    assert.strictEqual(result.count, 0);
    assert.strictEqual(result.title, '');
    assert.strictEqual(result.payload, null);
    assert.ok(Number.isNaN(result.score));
  });

  it('populates properties that are explicitly set to undefined', () => {
    const target = { a: undefined };
    const source = { a: 'populated', b: 'new' };

    defaults(target, source);
    assert.strictEqual(target.a, 'populated');
    assert.strictEqual(target.b, 'new');
  });

  it('defends against Prototype Pollution (CWE-1321) by skipping dangerous keys by default', () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": "yes"}, "constructor": {"prototype": {"admin": true}}, "prototype": {"hacked": true}, "safe": "ok"}');

    const beforePolluted = Object.prototype.polluted;
    const target = {};

    defaults(target, malicious);

    assert.strictEqual(target.safe, 'ok');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(target, '__proto__'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(target, 'constructor'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(target, 'prototype'), false);
    assert.strictEqual(Object.prototype.polluted, beforePolluted);
    assert.strictEqual({}.polluted, undefined);
  });

  it('throws on dangerous prototype keys when dangerAction is "throw"', () => {
    const mal1 = JSON.parse('{"__proto__": {"bad": 1}}');
    const mal2 = { constructor: 'bad' };
    const mal3 = { prototype: 'bad' };

    assert.throws(
      () => defaults({}, mal1, { dangerAction: 'throw' }),
      /Disallowed dangerous prototype key/
    );
    assert.throws(
      () => defaults({}, mal2, { dangerAction: 'throw' }),
      /Disallowed dangerous prototype key/
    );
    assert.throws(
      () => defaults({}, mal3, { dangerAction: 'throw' }),
      /Disallowed dangerous prototype key/
    );
  });

  it('supports Symbol keys from sources', () => {
    const symA = Symbol('symA');
    const symB = Symbol('symB');
    const target = { [symA]: 'original' };
    const source = { [symA]: 'default', [symB]: 'added' };

    defaults(target, source);

    assert.strictEqual(target[symA], 'original');
    assert.strictEqual(target[symB], 'added');
  });

  it('enforces own-property isolation and ignores inherited properties from source prototype', () => {
    const proto = { inheritedValue: 'fromProto' };
    const source = Object.create(proto);
    source.ownValue = 'fromOwn';

    const target = {};
    defaults(target, source);

    assert.strictEqual(target.ownValue, 'fromOwn');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(target, 'inheritedValue'), false);
    assert.strictEqual(target.inheritedValue, undefined);
  });

  it('handles null, undefined, and primitive targets and sources gracefully', () => {
    assert.deepStrictEqual(defaults(null), {});
    assert.deepStrictEqual(defaults(undefined), {});
    assert.deepStrictEqual(defaults(null, { a: 1 }), { a: 1 });
    assert.deepStrictEqual(defaults(undefined, { b: 2 }), { b: 2 });

    const target = { a: 1 };
    const res = defaults(target, null, undefined, 'ignored', 123, true);
    assert.strictEqual(res, target);
    assert.deepStrictEqual(res, { a: 1 });
  });

  it('supports nullPrototype option for safe dictionary creation', () => {
    const res = defaults(null, { key: 'val' }, { nullPrototype: true });
    assert.strictEqual(Object.getPrototypeOf(res), null);
    assert.strictEqual(res.key, 'val');
  });

  it('performs nested defaults recursively with deep: true option', () => {
    const target = {
      db: { host: 'localhost', auth: { user: 'admin' } },
      cache: { enabled: true },
    };
    const source = {
      db: { host: 'remote-host', port: 5432, auth: { user: 'guest', pass: 'secret' } },
      cache: { ttl: 3600 },
      server: { port: 8080 },
    };

    defaults(target, source, { deep: true });

    assert.strictEqual(target.db.host, 'localhost');
    assert.strictEqual(target.db.port, 5432);
    assert.strictEqual(target.db.auth.user, 'admin');
    assert.strictEqual(target.db.auth.pass, 'secret');
    assert.strictEqual(target.cache.enabled, true);
    assert.strictEqual(target.cache.ttl, 3600);
    assert.deepStrictEqual(target.server, { port: 8080 });
  });

  it('supports defaults.deep helper for clean nested defaulting', () => {
    const target = { theme: { primary: '#fff' } };
    const defaultsObj = { theme: { primary: '#000', secondary: '#aaa' } };

    const res = defaults.deep(target, defaultsObj);
    assert.strictEqual(res.theme.primary, '#fff');
    assert.strictEqual(res.theme.secondary, '#aaa');
  });

  it('protects against circular references in nested defaults without stack overflow (CWE-400)', () => {
    const target = { config: { name: 'app' } };
    const circularSource = { config: { timeout: 5000 } };
    circularSource.self = circularSource;

    assert.doesNotThrow(() => {
      defaults(target, circularSource, { deep: true });
    });
    assert.strictEqual(target.config.name, 'app');
    assert.strictEqual(target.config.timeout, 5000);
  });

  it('supports defaults.withOptions helper for pre-configured defaults pipelines', () => {
    const strictDefaults = defaults.withOptions({ dangerAction: 'throw' });
    assert.throws(
      () => strictDefaults({}, JSON.parse('{"__proto__": {"a": 1}}')),
      /Disallowed dangerous prototype key/
    );

    const safeDefaults = defaults.withOptions({ nullPrototype: true });
    const res = safeDefaults(null, { a: 1 });
    assert.strictEqual(Object.getPrototypeOf(res), null);
    assert.strictEqual(res.a, 1);
  });

  it('supports defaults.all for sequence array defaulting', () => {
    const items = [
      { a: 1 },
      { b: 2, a: 10 },
      { c: 3, b: 20 },
    ];
    const res = defaults.all(items);
    assert.deepStrictEqual(res, { a: 1, b: 2, c: 3 });

    assert.deepStrictEqual(defaults.all([]), {});
  });

  it('neutralizes prototype setter traps and prototype read-only shadowing', () => {
    let setterInvoked = false;
    Object.defineProperty(Object.prototype, 'customDefaultsTrapKey', {
      get() { return 'trap'; },
      set() { setterInvoked = true; },
      configurable: true,
    });
    Object.defineProperty(Object.prototype, 'customDefaultsReadOnly', {
      value: 'readOnly',
      writable: false,
      configurable: true,
    });

    try {
      const target = {};
      const source = {
        customDefaultsTrapKey: 'safeVal1',
        customDefaultsReadOnly: 'safeVal2',
      };

      defaults(target, source);

      assert.strictEqual(setterInvoked, false);
      assert.strictEqual(Object.prototype.hasOwnProperty.call(target, 'customDefaultsTrapKey'), true);
      assert.strictEqual(target.customDefaultsTrapKey, 'safeVal1');
      assert.strictEqual(Object.prototype.hasOwnProperty.call(target, 'customDefaultsReadOnly'), true);
      assert.strictEqual(target.customDefaultsReadOnly, 'safeVal2');
    } finally {
      delete Object.prototype.customDefaultsTrapKey;
      delete Object.prototype.customDefaultsReadOnly;
    }
  });

  it('supports customizer option to intercept and customize assignment', () => {
    const target = { a: [1, 2] };
    const source = { a: [3, 4], b: 5 };

    defaults(target, source, {
      customizer: (targetVal, sourceVal) => {
        if (Array.isArray(targetVal) && Array.isArray(sourceVal)) {
          return targetVal.concat(sourceVal);
        }
      },
    });

    assert.deepStrictEqual(target.a, [1, 2, 3, 4]);
    assert.strictEqual(target.b, 5);
  });

  it('handles frozen or non-extensible targets safely with cloneTarget option', () => {
    const frozenTarget = Object.freeze({ a: 1 });
    const source = { b: 2 };

    const res = defaults(frozenTarget, source, { cloneTarget: true });
    assert.notStrictEqual(res, frozenTarget);
    assert.deepStrictEqual(res, { a: 1, b: 2 });
  });

  it('validates helper functions isUnsafeKey and isPlainObject directly', () => {
    assert.strictEqual(isUnsafeKey('__proto__'), true);
    assert.strictEqual(isUnsafeKey('constructor'), true);
    assert.strictEqual(isUnsafeKey('prototype'), true);
    assert.strictEqual(isUnsafeKey('safeKey'), false);
    assert.strictEqual(isUnsafeKey(Symbol('test')), false);

    assert.strictEqual(isPlainObject({}), true);
    assert.strictEqual(isPlainObject(Object.create(null)), true);
    assert.strictEqual(isPlainObject([]), false);
    assert.strictEqual(isPlainObject(null), false);
    assert.strictEqual(isPlainObject('str'), false);
    assert.strictEqual(isPlainObject(new Date()), false);
  });

  it('correctly treats a single source with option-like keys as data rather than options', () => {
    const res1 = defaults({}, { deep: true });
    assert.deepStrictEqual(res1, { deep: true });

    const res2 = defaults({}, { ownOnly: false, nullPrototype: true });
    assert.deepStrictEqual(res2, { ownOnly: false, nullPrototype: true });
  });

  it('correctly defaults shared DAG sub-objects across distinct branches without omitting data', () => {
    const sharedConfig = { timeout: 1000, retry: 3 };
    const target = {};
    defaults(target, { db: sharedConfig }, { api: sharedConfig }, { deep: true });

    assert.deepStrictEqual(target.db, { timeout: 1000, retry: 3 });
    assert.deepStrictEqual(target.api, { timeout: 1000, retry: 3 });
  });

  it('resolves circular references back to target ancestor without infinite loops', () => {
    const cyclicSource = { name: 'root', child: {} };
    cyclicSource.child.parent = cyclicSource;

    const target = {};
    defaults(target, cyclicSource, { deep: true });

    assert.strictEqual(target.name, 'root');
    assert.strictEqual(target.child.parent, target);
  });
});
