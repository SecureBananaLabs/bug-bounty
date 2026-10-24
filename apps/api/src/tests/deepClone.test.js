import test from "node:test";
import assert from "node:assert/strict";
import { deepClone } from "../utils/deepClone.js";

test("deepClone returns primitives unchanged", () => {
  assert.equal(deepClone(42), 42);
  assert.equal(deepClone("hello"), "hello");
  assert.equal(deepClone(true), true);
  assert.equal(deepClone(null), null);
  assert.equal(deepClone(undefined), undefined);
});

test("deepClone creates independent copies of nested objects and arrays", () => {
  const original = {
    user: "alice",
    details: { age: 30, skills: ["js", "rust"] },
    meta: [{ active: true }]
  };

  const cloned = deepClone(original);
  assert.deepEqual(cloned, original);
  assert.notEqual(cloned, original);
  assert.notEqual(cloned.details, original.details);
  assert.notEqual(cloned.details.skills, original.details.skills);
  assert.notEqual(cloned.meta[0], original.meta[0]);

  // Mutation check
  cloned.details.skills.push("python");
  assert.equal(original.details.skills.length, 2);
  assert.equal(cloned.details.skills.length, 3);
});

test("deepClone drops dangerous prototype pollution keys (__proto__, constructor, prototype)", () => {
  const malicious = JSON.parse('{"safe": "ok", "__proto__": {"polluted": true}, "constructor": {"evil": true}}');
  const cloned = deepClone(malicious);

  assert.equal(cloned.safe, "ok");
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(cloned.__proto__, Object.prototype);
  assert.equal(cloned.constructor, Object);
});

test("deepClone safely handles circular references without stack overflow", () => {
  const nodeA = { name: "A" };
  const nodeB = { name: "B", parent: nodeA };
  nodeA.child = nodeB;

  const clonedA = deepClone(nodeA);
  assert.equal(clonedA.name, "A");
  assert.equal(clonedA.child.name, "B");
  assert.equal(clonedA.child.parent, clonedA);
  assert.notEqual(clonedA, nodeA);
});

test("deepClone preserves Date and RegExp instances with fidelity", () => {
  const now = new Date();
  const pattern = /hello-[a-z]+/gi;

  const obj = { date: now, regex: pattern };
  const cloned = deepClone(obj);

  assert.ok(cloned.date instanceof Date);
  assert.equal(cloned.date.getTime(), now.getTime());
  assert.notEqual(cloned.date, now);

  assert.ok(cloned.regex instanceof RegExp);
  assert.equal(cloned.regex.source, pattern.source);
  assert.equal(cloned.regex.flags, pattern.flags);
  assert.notEqual(cloned.regex, pattern);
});

test("deepClone preserves Map and Set collections", () => {
  const map = new Map([["key1", { v: 1 }], ["key2", { v: 2 }]]);
  const set = new Set([{ id: 1 }, { id: 2 }]);

  const cloned = deepClone({ map, set });

  assert.ok(cloned.map instanceof Map);
  assert.equal(cloned.map.size, 2);
  assert.deepEqual(cloned.map.get("key1"), { v: 1 });
  assert.notEqual(cloned.map.get("key1"), map.get("key1"));

  assert.ok(cloned.set instanceof Set);
  assert.equal(cloned.set.size, 2);
});

test("deepClone supports TypedArrays", () => {
  const buffer = new Uint8Array([10, 20, 30, 40]);
  const cloned = deepClone(buffer);

  assert.ok(cloned instanceof Uint8Array);
  assert.deepEqual(Array.from(cloned), [10, 20, 30, 40]);
  assert.notEqual(cloned, buffer);
});
