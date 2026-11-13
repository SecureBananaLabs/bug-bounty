import test from "node:test";
import assert from "node:assert/strict";
import { deepMerge } from "../utils/deepMerge.js";

test("deepMerge - merges flat objects correctly", () => {
  const target = { a: 1, b: 2 };
  const source = { b: 3, c: 4 };
  const result = deepMerge(target, source);

  assert.deepEqual(result, { a: 1, b: 3, c: 4 });
  // Ensure target was not mutated
  assert.deepEqual(target, { a: 1, b: 2 });
});

test("deepMerge - recursively merges nested objects", () => {
  const target = {
    user: {
      profile: {
        name: "Alice",
        theme: "dark",
      },
      notifications: {
        email: true,
      },
    },
  };

  const source = {
    user: {
      profile: {
        theme: "light",
        locale: "en-US",
      },
      notifications: {
        sms: true,
      },
    },
  };

  const result = deepMerge(target, source);

  assert.deepEqual(result, {
    user: {
      profile: {
        name: "Alice",
        theme: "light",
        locale: "en-US",
      },
      notifications: {
        email: true,
        sms: true,
      },
    },
  });
});

test("deepMerge - clones arrays without shared references", () => {
  const target = { tags: ["a", "b"] };
  const source = { tags: ["c", "d"] };
  const result = deepMerge(target, source);

  assert.deepEqual(result, { tags: ["c", "d"] });
  assert.notEqual(result.tags, source.tags);
});

test("deepMerge - prevents prototype pollution via __proto__", () => {
  const maliciousPayload = JSON.parse('{"__proto__": {"pollutedKey": "compromised"}}');
  const target = { safe: true };

  const result = deepMerge(target, maliciousPayload);

  assert.equal(result.safe, true);
  assert.equal(result.pollutedKey, undefined);
  assert.equal({}.pollutedKey, undefined);
  assert.equal(Object.prototype.pollutedKey, undefined);
});

test("deepMerge - prevents prototype pollution via constructor and prototype keys", () => {
  const target = {};
  const maliciousConstructor = {
    constructor: {
      prototype: {
        injected: true,
      },
    },
  };
  const maliciousProto = {
    prototype: {
      injected: true,
    },
  };

  deepMerge(target, maliciousConstructor);
  deepMerge(target, maliciousProto);

  assert.equal({}.injected, undefined);
  assert.equal(Object.prototype.injected, undefined);
});

test("deepMerge - handles non-object edge cases gracefully", () => {
  assert.deepEqual(deepMerge(null, { a: 1 }), { a: 1 });
  assert.deepEqual(deepMerge({ a: 1 }, null), { a: 1 });
  assert.deepEqual(deepMerge(undefined, { b: 2 }), { b: 2 });
  assert.deepEqual(deepMerge("string", { c: 3 }), { c: 3 });
});
