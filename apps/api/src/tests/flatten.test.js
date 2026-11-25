import test from "node:test";
import assert from "node:assert/strict";
import { flatten, flattenDeep } from "../utils/flatten.js";

test("flatten defaults to a single depth level", () => {
  assert.deepEqual(flatten([1, [2, 3], [4, [5, 6]]]), [1, 2, 3, 4, [5, 6]]);
});

test("flatten respects an explicit depth", () => {
  assert.deepEqual(flatten([1, [2, [3, [4]]]], 2), [1, 2, 3, [4]]);
});

test("flattenDeep flattens arbitrarily nested arrays", () => {
  assert.deepEqual(flattenDeep([1, [2, [3, [4, [5]]]]]), [1, 2, 3, 4, 5]);
});

test("flatten returns [] for null, undefined, and non-array input", () => {
  assert.deepEqual(flatten(null), []);
  assert.deepEqual(flatten(undefined), []);
  assert.deepEqual(flatten("not an array"), []);
  assert.deepEqual(flatten({ foo: "bar" }), []);
});

test("flatten throws TypeError for non-array input when strict is true", () => {
  assert.throws(() => flatten(null, 1, { strict: true }), TypeError);
  assert.throws(() => flatten({}, 1, { strict: true }), TypeError);
});

test("flatten floors fractional depths", () => {
  assert.deepEqual(flatten([1, [2, [3, [4]]]], 2.9), [1, 2, 3, [4]]);
});

test("flatten safely parses invalid depth values", () => {
  assert.deepEqual(flatten([1, [2, [3]]], "not-a-number"), [1, 2, [3]]);
  assert.deepEqual(flatten([1, [2, [3]]], NaN), [1, 2, [3]]);
});

test("flatten with depth <= 0 safely returns a shallow copy", () => {
  const input = [1, [2, 3], 4];
  const zeroDepth = flatten(input, 0);
  const negativeDepth = flatten(input, -5);

  assert.deepEqual(zeroDepth, input);
  assert.deepEqual(negativeDepth, input);
  assert.notEqual(zeroDepth, input);
});

test("flatten caps recursion at the default maxDepth to guard the call stack", () => {
  let deeplyNested = [];
  const root = deeplyNested;
  for (let i = 0; i < 1500; i += 1) {
    const next = [];
    deeplyNested.push(next);
    deeplyNested = next;
  }
  deeplyNested.push("bottom");

  const result = flattenDeep(root);
  const arraysRemaining = result.filter((item) => Array.isArray(item));

  assert.ok(arraysRemaining.length > 0);
});

test("flatten honors a configurable maxDepth lower than the requested depth", () => {
  assert.deepEqual(flatten([1, [2, [3, [4]]]], 10, { maxDepth: 1 }), [1, 2, [3, [4]]]);
});

test("flatten preserves circular references by default without overflowing the stack", () => {
  const circular = [1, 2];
  circular.push(circular);

  const result = flatten(circular, Infinity);

  assert.equal(result[0], 1);
  assert.equal(result[1], 2);
  assert.equal(result[2], circular);
});

test("flatten skips circular references when onCircular is 'skip'", () => {
  const circular = [1, 2];
  circular.push(circular);

  const result = flatten(circular, Infinity, { onCircular: "skip" });

  assert.deepEqual(result, [1, 2]);
});

test("flatten throws when onCircular is 'throw' and a cycle is found", () => {
  const circular = [1, 2];
  circular.push(circular);

  assert.throws(() => flatten(circular, Infinity, { onCircular: "throw" }), /circular reference/);
});

test("flatten does not treat duplicate sibling array references as circular", () => {
  const shared = [1, 2];
  const input = [shared, shared];

  assert.deepEqual(flatten(input, 1), [1, 2, 1, 2]);
});

test("flatten throws TypeError for an invalid onCircular option", () => {
  assert.throws(() => flatten([1, [2]], 1, { onCircular: "explode" }), TypeError);
});

test("flatten fills sparse array holes with undefined instead of reading them", () => {
  const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays
  const result = flatten(sparse, 1);

  assert.deepEqual(result, [1, undefined, 3]);
  assert.ok(Object.prototype.hasOwnProperty.call(result, 1));
});

test("flatten omits sparse array holes when skipHoles is true", () => {
  const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays
  const result = flatten(sparse, 1, { skipHoles: true });

  assert.deepEqual(result, [1, 3]);
});

test("flatten does not leak values injected onto Array.prototype via sparse holes", () => {
  Array.prototype[1] = "polluted";

  try {
    const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays
    assert.equal(sparse[1], "polluted");

    const result = flatten(sparse, 1);
    assert.deepEqual(result, [1, undefined, 3]);

    const skipped = flatten(sparse, 1, { skipHoles: true });
    assert.deepEqual(skipped, [1, 3]);
  } finally {
    delete Array.prototype[1];
  }
});

test("flattenDeep accepts options like flatten does", () => {
  const circular = [1, [2]];
  circular[1].push(circular);

  assert.throws(() => flattenDeep(circular, { onCircular: "throw" }), /circular reference/);
  assert.deepEqual(flattenDeep(circular, { onCircular: "skip" }), [1, 2]);
});
