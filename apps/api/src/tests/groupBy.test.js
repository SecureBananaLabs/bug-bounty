import test from "node:test";
import assert from "node:assert/strict";
import { groupBy } from "../utils/groupBy.js";

test("groups items using a callback iteratee", () => {
  const result = groupBy([1, 2, 3, 4, 5], (n) => (n % 2 === 0 ? "even" : "odd"));
  assert.deepEqual(result, { odd: [1, 3, 5], even: [2, 4] });
});

test("groups items using a string property iteratee", () => {
  const items = [{ type: "a" }, { type: "b" }, { type: "a" }];
  const result = groupBy(items, "type");
  assert.deepEqual(result, { a: [items[0], items[2]], b: [items[1]] });
});

test("groups items using a Symbol property-key iteratee", () => {
  const sym = Symbol("kind");
  const a = { [sym]: "x" };
  const b = { [sym]: "y" };
  const c = { [sym]: "x" };
  const result = groupBy([a, b, c], sym);
  assert.deepEqual(result, { x: [a, c], y: [b] });
});

test("keeps Symbol values returned by the iteratee as Symbol keys without stringification", () => {
  const catA = Symbol("catA");
  const catB = Symbol("catB");
  const result = groupBy([1, 2, 3], (n) => (n === 2 ? catB : catA));
  assert.deepEqual(result[catA], [1, 3]);
  assert.deepEqual(result[catB], [2]);
  assert.deepEqual(Object.keys(result), []);
  assert.deepEqual(new Set(Object.getOwnPropertySymbols(result)), new Set([catA, catB]));
});

test("falls back to identity when no iteratee is provided", () => {
  const result = groupBy(["a", "b", "a"]);
  assert.deepEqual(result, { a: ["a", "a"], b: ["b"] });
});

test("coerces non-symbol primitive keys to strings", () => {
  const result = groupBy([1, "1", true], (v) => v);
  assert.deepEqual(Object.keys(result), ["1", "true"]);
  assert.deepEqual(result["1"], [1, "1"]);
  assert.deepEqual(result["true"], [true]);
});

test("returns {} for null, undefined, empty array, and non-array input", () => {
  assert.deepEqual(groupBy(null, (x) => x), {});
  assert.deepEqual(groupBy(undefined, (x) => x), {});
  assert.deepEqual(groupBy([], (x) => x), {});
  assert.deepEqual(groupBy("not-an-array", (x) => x), {});
  assert.deepEqual(groupBy({ not: "array" }, (x) => x), {});
});

test("returns Object.create(null) for empty/invalid input when nullPrototype is enabled", () => {
  const result = groupBy(null, (x) => x, { nullPrototype: true });
  assert.equal(Object.getPrototypeOf(result), null);
  assert.deepEqual({ ...result }, {});
});

test("uses Object.create(null) container for valid input when nullPrototype is enabled", () => {
  const result = groupBy([1, 2], (n) => (n % 2 === 0 ? "even" : "odd"), { nullPrototype: true });
  assert.equal(Object.getPrototypeOf(result), null);
  assert.deepEqual(result.odd, [1]);
  assert.deepEqual(result.even, [2]);
});

test("neutralizes __proto__ keys without polluting Object.prototype", () => {
  const result = groupBy(["x"], () => "__proto__");
  assert.deepEqual(result["$__proto__"], ["x"]);
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(Object.getPrototypeOf({}), Object.prototype);
  assert.equal(({}).polluted, undefined);
});

test("neutralizes constructor and prototype keys without collision", () => {
  const result = groupBy(["x", "y"], (v) => (v === "x" ? "constructor" : "prototype"));
  assert.deepEqual(result["$constructor"], ["x"]);
  assert.deepEqual(result["$prototype"], ["y"]);
  assert.equal(typeof ({}).constructor, "function");
});

test("safeguards against collision with inherited Object.prototype methods", () => {
  const result = groupBy(["a", "b", "c"], (v) => (v === "c" ? "valueOf" : "toString"));
  assert.deepEqual(result.toString, ["a", "b"]);
  assert.deepEqual(result.valueOf, ["c"]);
});

test("attempting prototype pollution via a crafted key does not affect other objects", () => {
  groupBy(["payload"], () => "__proto__");
  const freshObject = {};
  assert.equal(freshObject.polluted, undefined);
  assert.equal(Object.getPrototypeOf(freshObject), Object.prototype);
});

test("wraps iteratee exceptions with index details and cause by default", () => {
  const boom = new Error("boom");
  assert.throws(
    () => {
      groupBy([1, 2], (n) => {
        if (n === 2) throw boom;
        return "ok";
      });
    },
    (error) => {
      assert.match(error.message, /index 1/);
      assert.equal(error.cause, boom);
      return true;
    },
  );
});

test("suppressErrors skips items whose iteratee throws", () => {
  const result = groupBy([1, 2, 3], (n) => {
    if (n === 2) throw new Error("boom");
    return "ok";
  }, { suppressErrors: true });
  assert.deepEqual(result.ok, [1, 3]);
});

test("onError recovers a key for items whose iteratee throws", () => {
  const result = groupBy([1, 2, 3], (n) => {
    if (n === 2) throw new Error("boom");
    return "ok";
  }, { onError: () => "recovered" });
  assert.deepEqual(result.ok, [1, 3]);
  assert.deepEqual(result.recovered, [2]);
});

test("onError returning undefined skips the item", () => {
  const result = groupBy([1, 2, 3], (n) => {
    if (n === 2) throw new Error("boom");
    return "ok";
  }, { onError: () => undefined });
  assert.deepEqual(result.ok, [1, 3]);
  assert.equal(hasOwnKey(result, "recovered"), false);
});

test("defends against sparse array holes that inherit from a polluted Array.prototype", () => {
  Array.prototype[1] = "polluted-hole-value";
  try {
    const sparse = [1, , 3];
    const result = groupBy(sparse, (n) => (typeof n === "number" ? "num" : "other"));
    assert.deepEqual(result.num, [1, 3]);
    assert.equal(hasOwnKey(result, "other"), false);
  } finally {
    delete Array.prototype[1];
  }
});

function hasOwnKey(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
