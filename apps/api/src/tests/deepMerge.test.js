import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { deepMerge, isPlainObject, isUnsafeKey, cloneDeep } from "../utils/deepMerge.js";

test("deepMerge - basic plain object merging", async (t) => {
  await t.test("merges flat plain objects into target", () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = deepMerge(target, source);

    assert.equal(result, target);
    assert.deepEqual(result, { a: 1, b: 3, c: 4 });
  });

  await t.test("recursively merges nested plain objects", () => {
    const target = {
      user: {
        name: "Alice",
        settings: { theme: "light", notifications: true }
      }
    };
    const source = {
      user: {
        settings: { theme: "dark" },
        role: "admin"
      }
    };
    const result = deepMerge(target, source);

    assert.deepEqual(result, {
      user: {
        name: "Alice",
        role: "admin",
        settings: { theme: "dark", notifications: true }
      }
    });
  });

  await t.test("merges multi-level deeply nested objects (3+ levels)", () => {
    const target = { a: { b: { c: { d: 1, e: 2 } } } };
    const source = { a: { b: { c: { e: 99, f: 100 } } } };
    const result = deepMerge(target, source);

    assert.deepEqual(result, {
      a: { b: { c: { d: 1, e: 99, f: 100 } } }
    });
  });

  await t.test("creates intermediate objects when target lacks nested paths", () => {
    const target = {};
    const source = { deep: { nested: { value: 42 } } };
    const result = deepMerge(target, source);

    assert.deepEqual(result, { deep: { nested: { value: 42 } } });
  });

  await t.test("preserves unaffected target and source properties", () => {
    const target = { keepTarget: true, shared: { a: 1 } };
    const source = { keepSource: true, shared: { b: 2 } };
    const result = deepMerge(target, source);

    assert.deepEqual(result, {
      keepTarget: true,
      keepSource: true,
      shared: { a: 1, b: 2 }
    });
  });
});

test("deepMerge - prototype pollution mitigation (CWE-1321)", async (t) => {
  await t.test("rejects __proto__ pollution via parsed JSON payload", () => {
    const payload = JSON.parse('{"__proto__": {"polluted": true, "role": "admin"}}');
    const target = {};

    deepMerge(target, payload);

    assert.equal(target.polluted, undefined);
    assert.equal(target.role, undefined);
    assert.equal(({}).polluted, undefined);
    assert.equal(({}).role, undefined);
    assert.equal(Object.prototype.polluted, undefined);
    assert.equal(Object.prototype.role, undefined);
  });

  await t.test("rejects __proto__ pollution via direct computed key", () => {
    const target = {};
    const source = { ["__proto__"]: { injected: true } };

    deepMerge(target, source);

    assert.equal(target.injected, undefined);
    assert.equal(({}).injected, undefined);
    assert.equal(Object.prototype.injected, undefined);
  });

  await t.test("rejects constructor.prototype pollution attack", () => {
    const target = {};
    const payload = JSON.parse('{"constructor": {"prototype": {"isAdmin": true}}}');

    deepMerge(target, payload);

    assert.equal(target.isAdmin, undefined);
    assert.equal(({}).isAdmin, undefined);
    assert.equal(Object.prototype.isAdmin, undefined);
    assert.equal(target.constructor.prototype.isAdmin, undefined);
  });

  await t.test("rejects direct prototype property assignment", () => {
    const target = {};
    const payload = JSON.parse('{"prototype": {"hacked": true}}');

    deepMerge(target, payload);

    assert.equal(target.hacked, undefined);
    assert.equal(({}).hacked, undefined);
    assert.equal(Object.prototype.hacked, undefined);
  });

  await t.test("rejects uppercase and mixed-case dangerous keys", () => {
    const target = {};
    const payload = {
      __PROTO__: { bad: true },
      Constructor: { prototype: { bad: true } },
      Prototype: { bad: true }
    };

    deepMerge(target, payload);

    assert.equal(target.bad, undefined);
    assert.equal(({}).bad, undefined);
    assert.equal(Object.prototype.bad, undefined);
  });

  await t.test("rejects nested __proto__ and constructor attacks", () => {
    const target = { options: { debug: false } };
    const payload = JSON.parse('{"options": {"__proto__": {"evil": true}, "constructor": {"prototype": {"evil": true}}}}');

    deepMerge(target, payload);

    assert.equal(target.options.debug, false);
    assert.equal(target.evil, undefined);
    assert.equal(({}).evil, undefined);
    assert.equal(Object.prototype.evil, undefined);
  });

  await t.test("safely handles Object.create(null) target and source", () => {
    const nullProtoTarget = Object.create(null);
    const nullProtoSource = Object.create(null);
    nullProtoSource.safe = 123;
    nullProtoSource.__proto__ = { evil: true };

    const result = deepMerge(nullProtoTarget, nullProtoSource);

    assert.equal(result.safe, 123);
    assert.equal(({}).evil, undefined);
    assert.equal(Object.prototype.evil, undefined);
  });

  await t.test("safely merges source with overridden hasOwnProperty", () => {
    const target = { existing: 1 };
    const source = { hasOwnProperty: "bad_override", newProp: "ok" };

    const result = deepMerge(target, source);

    assert.equal(result.newProp, "ok");
    assert.equal(result.existing, 1);
  });

  await t.test("does not tamper with Object.prototype builtins when merging toString/valueOf", () => {
    const target = {};
    const source = { toString: "custom_string", valueOf: 42 };

    const result = deepMerge(target, source);

    assert.equal(result.toString, "custom_string");
    assert.equal(result.valueOf, 42);
    // Global Object.prototype methods remain untampered
    assert.equal(typeof ({}).toString, "function");
    assert.equal(typeof ({}).valueOf, "function");
  });

  await t.test("prevents Prototype Setter Hijacking when target prototype has a setter", () => {
    let setterInvoked = false;
    const proto = {
      set compromised(val) {
        setterInvoked = true;
      }
    };
    const target = Object.create(proto);
    const source = { compromised: "safe_value" };

    const result = deepMerge(target, source);

    assert.equal(setterInvoked, false);
    assert.equal(Object.prototype.hasOwnProperty.call(result, "compromised"), true);
    assert.equal(result.compromised, "safe_value");
  });

  await t.test("assigns own property without throwing when target prototype has inherited getter", () => {
    const proto = {
      get readOnlyProp() {
        return "inherited_value";
      }
    };
    const target = Object.create(proto);
    const source = { readOnlyProp: "merged_value" };

    const result = deepMerge(target, source);

    assert.equal(Object.prototype.hasOwnProperty.call(result, "readOnlyProp"), true);
    assert.equal(result.readOnlyProp, "merged_value");
  });
});

test("deepMerge - array handling", async (t) => {
  await t.test("replaces target array with cloned source array by default", () => {
    const target = { tags: ["a", "b"] };
    const source = { tags: ["c", "d"] };
    const result = deepMerge(target, source);

    assert.deepEqual(result.tags, ["c", "d"]);
    // Verifies clone independence
    assert.notEqual(result.tags, source.tags);
  });

  await t.test("clones array elements so mutating result does not mutate source", () => {
    const source = { items: [{ id: 1 }, { id: 2 }] };
    const target = {};
    const result = deepMerge(target, source);

    result.items[0].id = 999;
    assert.equal(source.items[0].id, 1);
  });

  await t.test("supports arrayMode: 'concat' option", () => {
    const target = { nums: [1, 2] };
    const source = { nums: [3, 4] };
    const result = deepMerge(target, source, { arrayMode: "concat" });

    assert.deepEqual(result.nums, [1, 2, 3, 4]);
  });

  await t.test("supports custom arrayMerge function option", () => {
    const target = { list: [1, 2, 3] };
    const source = { list: [2, 3, 4, 5] };
    const customMerger = (targetArr, sourceArr) => Array.from(new Set([...targetArr, ...sourceArr]));
    const result = deepMerge(target, source, { arrayMerge: customMerger });

    assert.deepEqual(result.list, [1, 2, 3, 4, 5]);
  });

  await t.test("handles root arrays as target and source", () => {
    const arr1 = [1, 2];
    const arr2 = [3, 4];
    const result = deepMerge(arr1, arr2);

    assert.deepEqual(result, [3, 4]);
  });

  await t.test("passes options consistently to custom arrayMerge in nested object structures", () => {
    let receivedOptions;
    const customMerger = (targetArr, sourceArr, opts) => {
      receivedOptions = opts;
      return [...targetArr, ...sourceArr];
    };
    const target = { deep: { items: [1] } };
    const source = { deep: { items: [2] } };
    const opts = { arrayMerge: customMerger, customFlag: true };

    const result = deepMerge(target, source, opts);
    assert.deepEqual(result.deep.items, [1, 2]);
    assert.equal(typeof receivedOptions, "object");
    assert.equal(receivedOptions.arrayMerge, customMerger);
  });
});

test("deepMerge - null, undefined, and non-object inputs", async (t) => {
  await t.test("handles null target by returning cloned source", () => {
    const source = { a: 1, nested: { b: 2 } };
    const result = deepMerge(null, source);

    assert.deepEqual(result, { a: 1, nested: { b: 2 } });
    assert.notEqual(result, source);
  });

  await t.test("handles undefined target by returning cloned source", () => {
    const source = { x: 10 };
    const result = deepMerge(undefined, source);

    assert.deepEqual(result, { x: 10 });
  });

  await t.test("handles null or undefined source by returning target safely", () => {
    const target = { a: 1 };
    assert.deepEqual(deepMerge(target, null), { a: 1 });
    assert.deepEqual(deepMerge(target, undefined), { a: 1 });
  });

  await t.test("handles both target and source as null/undefined without throwing", () => {
    assert.deepEqual(deepMerge(null, null), {});
    assert.deepEqual(deepMerge(undefined, undefined), {});
    assert.deepEqual(deepMerge(null, undefined), {});
  });

  await t.test("handles non-object primitive inputs safely", () => {
    assert.deepEqual(deepMerge(42, { a: 1 }), { a: 1 });
    assert.deepEqual(deepMerge("string", { b: 2 }), { b: 2 });
    assert.deepEqual(deepMerge(true, { c: 3 }), { c: 3 });
    assert.deepEqual(deepMerge({ a: 1 }, 42), { a: 1 });
  });

  await t.test("replaces nested object with null when source value is null", () => {
    const target = { metadata: { key: "value" } };
    const source = { metadata: null };
    const result = deepMerge(target, source);

    assert.equal(result.metadata, null);
  });

  await t.test("replaces nested object with primitive when source value is primitive", () => {
    const target = { config: { timeout: 5000 } };
    const source = { config: "disabled" };
    const result = deepMerge(target, source);

    assert.equal(result.config, "disabled");
  });

  await t.test("replaces primitive with object when source value is object", () => {
    const target = { config: "disabled" };
    const source = { config: { timeout: 5000 } };
    const result = deepMerge(target, source);

    assert.deepEqual(result.config, { timeout: 5000 });
  });

  await t.test("respects ignoreUndefined: true option", () => {
    const target = { a: 1, b: 2 };
    const source = { a: undefined, b: 3 };
    const result = deepMerge(target, source, { ignoreUndefined: true });

    assert.deepEqual(result, { a: 1, b: 3 });
  });
});

test("deepMerge - advanced edge cases and robustness", async (t) => {
  await t.test("handles frozen target objects without throwing TypeError", () => {
    const target = Object.freeze({ a: 1, nested: { b: 2 } });
    const source = { a: 10, c: 3 };

    assert.doesNotThrow(() => {
      const result = deepMerge(target, source);
      assert.deepEqual(result, { a: 10, nested: { b: 2 }, c: 3 });
    });
  });

  await t.test("prevents stack overflow on circular reference structures", () => {
    const circularSource = { a: 1 };
    circularSource.self = circularSource;

    const target = {};
    assert.doesNotThrow(() => {
      const result = deepMerge(target, circularSource);
      assert.equal(result.a, 1);
      assert.equal(result.self, result);
    });
  });

  await t.test("clones Date and RegExp objects as independent instances", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    const regex = /pattern/gi;
    const target = {};
    const source = { date, regex };

    const result = deepMerge(target, source);

    assert.deepEqual(result.date, date);
    assert.notEqual(result.date, date);
    assert.equal(result.regex.source, "pattern");
    assert.equal(result.regex.flags, "gi");
    assert.notEqual(result.regex, regex);
  });

  await t.test("supports clone: true option to prevent mutating target", () => {
    const originalTarget = { a: { b: 1 } };
    const source = { a: { c: 2 } };

    const result = deepMerge(originalTarget, source, { clone: true });

    assert.notEqual(result, originalTarget);
    assert.deepEqual(originalTarget, { a: { b: 1 } });
    assert.deepEqual(result, { a: { b: 1, c: 2 } });
  });

  await t.test("merges multiple sources in sequence", () => {
    const target = { a: 1 };
    const src1 = { b: 2 };
    const src2 = { c: 3 };
    const src3 = { a: 10, d: 4 };

    const result = deepMerge(target, src1, src2, src3);

    assert.deepEqual(result, { a: 10, b: 2, c: 3, d: 4 });
  });

  await t.test("supports deepMerge.all helper method", () => {
    const objects = [
      { a: 1, shared: { x: 1 } },
      { b: 2, shared: { y: 2 } },
      { c: 3, shared: { z: 3 } }
    ];

    const result = deepMerge.all(objects);

    assert.deepEqual(result, {
      a: 1,
      b: 2,
      c: 3,
      shared: { x: 1, y: 2, z: 3 }
    });
  });

  await t.test("deepMerge.all does not mutate elements of the input array", () => {
    const first = { a: 1, nested: { count: 10 } };
    const second = { b: 2, nested: { count: 20 } };
    const input = [first, second];

    const result = deepMerge.all(input);

    assert.notEqual(result, first);
    assert.deepEqual(first, { a: 1, nested: { count: 10 } });
    assert.deepEqual(second, { b: 2, nested: { count: 20 } });
    assert.deepEqual(result, { a: 1, b: 2, nested: { count: 20 } });
  });

  await t.test("correctly merges data objects having option-like keys with non-boolean values", () => {
    const target = { service: "api" };
    const src = { clone: "production", inPlace: 42 };

    const result = deepMerge(target, src);

    assert.equal(result.service, "api");
    assert.equal(result.clone, "production");
    assert.equal(result.inPlace, 42);
  });

  await t.test("clones cross-realm Date and RegExp objects into independent host instances", () => {
    const context = vm.createContext();
    const script = new vm.Script(`
      const d = new Date(1700000000000);
      const r = /cross_realm/gi;
      [d, r];
    `);
    const [vmDate, vmRegExp] = script.runInContext(context);

    const target = {};
    const result = deepMerge(target, { date: vmDate, regex: vmRegExp });

    assert.equal(result.date instanceof Date, true);
    assert.equal(result.date.getTime(), vmDate.getTime());
    assert.notEqual(result.date, vmDate);
    assert.equal(result.regex instanceof RegExp, true);
    assert.equal(result.regex.source, "cross_realm");
    assert.equal(result.regex.flags, "gi");
    assert.notEqual(result.regex, vmRegExp);
  });

  await t.test("merges enumerable symbol properties safely", () => {
    const sym1 = Symbol("sym1");
    const sym2 = Symbol("sym2");
    const target = { a: 1 };
    const source = { [sym1]: "val1", [sym2]: { nested: true } };

    const result = deepMerge(target, source);

    assert.equal(result[sym1], "val1");
    assert.deepEqual(result[sym2], { nested: true });
  });

  await t.test("safely skips non-writable properties without throwing", () => {
    const target = {};
    Object.defineProperty(target, "readOnly", {
      value: "original",
      writable: false,
      configurable: false,
      enumerable: true
    });
    const source = { readOnly: "attempt_override", other: "ok" };

    assert.doesNotThrow(() => {
      const result = deepMerge(target, source);
      assert.equal(result.readOnly, "original");
      assert.equal(result.other, "ok");
    });
  });
});

test("utility helpers - isPlainObject and isUnsafeKey", async (t) => {
  await t.test("isPlainObject correctly validates plain objects", () => {
    assert.equal(isPlainObject({}), true);
    assert.equal(isPlainObject({ a: 1 }), true);
    assert.equal(isPlainObject(Object.create(null)), true);
    assert.equal(isPlainObject(new Object()), true);

    assert.equal(isPlainObject(null), false);
    assert.equal(isPlainObject(undefined), false);
    assert.equal(isPlainObject([]), false);
    assert.equal(isPlainObject(42), false);
    assert.equal(isPlainObject("string"), false);
    assert.equal(isPlainObject(true), false);
    assert.equal(isPlainObject(new Date()), false);
    assert.equal(isPlainObject(/regex/), false);
    assert.equal(isPlainObject(new Map()), false);
    assert.equal(isPlainObject(new Set()), false);
    assert.equal(isPlainObject(new Error()), false);
    assert.equal(isPlainObject(() => {}), false);
  });

  await t.test("isPlainObject rejects objects created with multi-level null prototype hierarchy", () => {
    const nullProto = Object.create(null);
    const inheritedFromNull = Object.create(nullProto);
    assert.equal(isPlainObject(nullProto), true);
    assert.equal(isPlainObject(inheritedFromNull), false);
  });

  await t.test("isUnsafeKey correctly flags dangerous property keys", () => {
    assert.equal(isUnsafeKey("__proto__"), true);
    assert.equal(isUnsafeKey("__PROTO__"), true);
    assert.equal(isUnsafeKey("constructor"), true);
    assert.equal(isUnsafeKey("Constructor"), true);
    assert.equal(isUnsafeKey("CONSTRUCTOR"), true);
    assert.equal(isUnsafeKey("prototype"), true);
    assert.equal(isUnsafeKey("Prototype"), true);
    assert.equal(isUnsafeKey("PROTOTYPE"), true);

    assert.equal(isUnsafeKey("safeKey"), false);
    assert.equal(isUnsafeKey("id"), false);
    assert.equal(isUnsafeKey("name"), false);
    assert.equal(isUnsafeKey(Symbol("sym")), false);
    assert.equal(isUnsafeKey(123), false);
  });

  await t.test("isUnsafeKey handles String wrapper objects safely", () => {
    assert.equal(isUnsafeKey(new String("__proto__")), true);
    assert.equal(isUnsafeKey(new String("constructor")), true);
    assert.equal(isUnsafeKey(new String("prototype")), true);
    assert.equal(isUnsafeKey(new String("safeKey")), false);
  });
});
