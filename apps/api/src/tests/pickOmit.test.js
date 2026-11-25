import test from "node:test";
import assert from "node:assert/strict";
import { pick, omit, pickBy, omitBy } from "../utils/pickOmit.js";

test("pick selects only the requested own keys", () => {
  const result = pick({ a: 1, b: 2, c: 3 }, ["a", "c"]);
  assert.deepEqual(result, { a: 1, c: 3 });
});

test("pick accepts a single key without wrapping in an array", () => {
  const result = pick({ a: 1, b: 2 }, "a");
  assert.deepEqual(result, { a: 1 });
});

test("pick accepts a Set of keys", () => {
  const result = pick({ a: 1, b: 2, c: 3 }, new Set(["a", "b"]));
  assert.deepEqual(result, { a: 1, b: 2 });
});

test("pick accepts an arbitrary iterable of keys", () => {
  function* keys() {
    yield "a";
    yield "c";
  }
  const result = pick({ a: 1, b: 2, c: 3 }, keys());
  assert.deepEqual(result, { a: 1, c: 3 });
});

test("pick ignores inherited (non-own) properties", () => {
  const base = { inherited: "nope" };
  const obj = Object.create(base);
  obj.own = "yes";
  const result = pick(obj, ["inherited", "own"]);
  assert.deepEqual(result, { own: "yes" });
});

test("pick supports Symbol keys without string coercion", () => {
  const sym = Symbol("id");
  const obj = { visible: 1, [sym]: "secret" };
  const result = pick(obj, [sym]);
  assert.equal(result[sym], "secret");
  assert.equal(Object.prototype.hasOwnProperty.call(result, "visible"), false);
});

test("pick ignores an inherited Symbol property", () => {
  const sym = Symbol("shared");
  const base = { [sym]: "inherited" };
  const obj = Object.create(base);
  obj.own = 1;
  const result = pick(obj, [sym, "own"]);
  assert.deepEqual(result, { own: 1 });
  assert.equal(Object.prototype.hasOwnProperty.call(result, sym), false);
});

test("pick returns an empty object for null, undefined, and primitive input", () => {
  assert.deepEqual(pick(null, ["a"]), {});
  assert.deepEqual(pick(undefined, ["a"]), {});
  assert.deepEqual(pick(42, ["a"]), {});
  assert.deepEqual(pick("str", ["a"]), {});
  assert.deepEqual(pick(true, ["a"]), {});
});

test("pick returns a null-prototype object when nullPrototype is enabled", () => {
  const result = pick({ a: 1 }, ["a"], { nullPrototype: true });
  assert.equal(Object.getPrototypeOf(result), null);
  assert.equal(result.a, 1);

  const empty = pick(null, ["a"], { nullPrototype: true });
  assert.equal(Object.getPrototypeOf(empty), null);
});

test("pick skips __proto__ pollution attempts by default and leaves the result's prototype untouched", () => {
  const payload = JSON.parse('{"__proto__": {"polluted": "yes"}, "name": "ok"}');
  const result = pick(payload, ["__proto__", "name"]);

  assert.equal(result.name, "ok");
  assert.equal(Object.prototype.hasOwnProperty.call(result, "__proto__"), false);
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(({}).polluted, undefined);
});

test("pick skips an explicit own 'constructor' key by default", () => {
  const obj = { constructor: "evil", name: "safe" };
  const result = pick(obj, ["constructor", "name"]);
  assert.deepEqual(result, { name: "safe" });
});

test("pick throws on a dangerous key when dangerAction is 'throw'", () => {
  const payload = JSON.parse('{"__proto__": {"polluted": "yes"}}');
  assert.throws(() => pick(payload, ["__proto__"], { dangerAction: "throw" }));
});

test("omit removes only the specified own keys", () => {
  const result = omit({ a: 1, b: 2, c: 3 }, ["b"]);
  assert.deepEqual(result, { a: 1, c: 3 });
});

test("omit ignores inherited (non-own) properties", () => {
  const base = { inherited: "nope" };
  const obj = Object.create(base);
  obj.own = "yes";
  const result = omit(obj, []);
  assert.deepEqual(result, { own: "yes" });
});

test("omit supports Symbol keys", () => {
  const sym = Symbol("id");
  const obj = { visible: 1, [sym]: "secret" };
  const result = omit(obj, ["visible"]);
  assert.equal(result[sym], "secret");
  assert.equal(Object.prototype.hasOwnProperty.call(result, "visible"), false);
});

test("omit returns an empty object for null, undefined, and primitive input", () => {
  assert.deepEqual(omit(null, ["a"]), {});
  assert.deepEqual(omit(undefined, ["a"]), {});
  assert.deepEqual(omit(3.14, ["a"]), {});
});

test("omit returns a null-prototype object when nullPrototype is enabled", () => {
  const result = omit({ a: 1, b: 2 }, ["b"], { nullPrototype: true });
  assert.equal(Object.getPrototypeOf(result), null);
  assert.equal(result.a, 1);
});

test("omit strips dangerous own keys (constructor/prototype) from the result by default", () => {
  const obj = { constructor: "evil", prototype: "evil2", safe: 1 };
  const result = omit(obj, ["safe"]);
  assert.deepEqual(result, {});
});

test("omit throws on a dangerous own key when dangerAction is 'throw'", () => {
  const obj = { constructor: "evil", safe: 1 };
  assert.throws(() => omit(obj, ["safe"], { dangerAction: "throw" }));
});

test("omit does not throw when the dangerous key is itself explicitly excluded", () => {
  const obj = { constructor: "evil", prototype: "evil2", safe: 1 };
  assert.doesNotThrow(() => {
    const result = omit(obj, ["constructor", "prototype", "safe"], { dangerAction: "throw" });
    assert.deepEqual(result, {});
  });
});

test("omit neutralizes a real own '__proto__' property created via defineProperty", () => {
  const malicious = {};
  Object.defineProperty(malicious, "__proto__", {
    value: "polluted",
    enumerable: true,
    configurable: true,
  });
  malicious.safe = 1;

  const result = omit(malicious, ["safe"]);
  assert.deepEqual(result, {});
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
});

test("pickBy keeps own properties matching the predicate", () => {
  const result = pickBy({ a: 1, b: 2, c: 3 }, (value) => value > 1);
  assert.deepEqual(result, { b: 2, c: 3 });
});

test("pickBy ignores inherited properties", () => {
  const base = { inherited: 99 };
  const obj = Object.create(base);
  obj.own = 5;
  const result = pickBy(obj, (value) => value > 0);
  assert.deepEqual(result, { own: 5 });
});

test("pickBy invokes the predicate with (value, key, obj)", () => {
  const obj = { a: 1 };
  const seen = [];
  pickBy(obj, (value, key, source) => {
    seen.push([value, key, source]);
    return true;
  });
  assert.deepEqual(seen, [[1, "a", obj]]);
});

test("pickBy returns an empty object for non-object input", () => {
  assert.deepEqual(pickBy(null, () => true), {});
});

test("omitBy removes own properties matching the predicate", () => {
  const result = omitBy({ a: 1, b: 2, c: 3 }, (value) => value > 1);
  assert.deepEqual(result, { a: 1 });
});

test("omitBy returns an empty object for non-object input", () => {
  assert.deepEqual(omitBy(undefined, () => false), {});
});

test("pickBy and omitBy never surface dangerous own keys even if the predicate allows them", () => {
  const obj = { constructor: "evil", safe: 1 };
  const picked = pickBy(obj, () => true);
  const omitted = omitBy(obj, () => false);
  assert.deepEqual(picked, { safe: 1 });
  assert.deepEqual(omitted, { safe: 1 });
});
