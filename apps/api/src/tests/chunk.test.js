import test from "node:test";
import assert from "node:assert/strict";
import { chunk } from "../utils/chunk.js";

test("splits an array into evenly sized chunks", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5, 6], 2), [
    [1, 2],
    [3, 4],
    [5, 6],
  ]);
});

test("final chunk contains the remainder when size does not divide evenly", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

test("returns a single chunk when size exceeds array length", () => {
  assert.deepEqual(chunk([1, 2, 3], 10), [[1, 2, 3]]);
});

test("returns [] for an empty array", () => {
  assert.deepEqual(chunk([], 3), []);
});

test("sanitizes floating-point sizes with Math.floor", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2.9), [[1, 2], [3, 4], [5]]);
});

test("returns [] for a zero size", () => {
  assert.deepEqual(chunk([1, 2, 3], 0), []);
});

test("returns [] for a negative size", () => {
  assert.deepEqual(chunk([1, 2, 3], -2), []);
});

test("returns [] for a NaN size", () => {
  assert.deepEqual(chunk([1, 2, 3], NaN), []);
});

test("clamps an Infinity size down to a single chunk instead of hanging", () => {
  assert.deepEqual(chunk([1, 2, 3], Infinity), [[1, 2, 3]]);
});

test("returns [] for null input", () => {
  assert.deepEqual(chunk(null, 2), []);
});

test("returns [] for undefined input", () => {
  assert.deepEqual(chunk(undefined, 2), []);
});

test("returns [] for primitive input", () => {
  assert.deepEqual(chunk("abcdef", 2), []);
  assert.deepEqual(chunk(42, 2), []);
});

test("returns [] for a plain object input", () => {
  assert.deepEqual(chunk({ 0: "a", 1: "b", length: 2 }, 2), []);
});

test("throws for non-array input when strict is enabled", () => {
  assert.throws(() => chunk(null, 2, { strict: true }), TypeError);
  assert.throws(() => chunk({}, 2, { strict: true }), TypeError);
});

test("does not throw in strict mode for a valid array", () => {
  assert.deepEqual(chunk([1, 2, 3], 2, { strict: true }), [[1, 2], [3]]);
});

test("preserves holes as undefined without skipHoles, without inheriting Array.prototype pollution", () => {
  Array.prototype.polluted = "evil"; // eslint-disable-line no-extend-native
  try {
    const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays
    const result = chunk(sparse, 2);
    assert.deepEqual(result, [[1, undefined], [3]]);
  } finally {
    delete Array.prototype.polluted;
  }
});

test("skipHoles option omits missing indices entirely from the output", () => {
  const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays
  const result = chunk(sparse, 2, { skipHoles: true });
  assert.deepEqual(result, [[1], [3]]);
});

test("maxChunks caps the number of chunks produced", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5, 6], 2, { maxChunks: 2 }), [
    [1, 2],
    [3, 4],
  ]);
});

test("maxChunks of 0 returns an empty array", () => {
  assert.deepEqual(chunk([1, 2, 3], 1, { maxChunks: 0 }), []);
});

test("maxChunks larger than the natural chunk count has no effect", () => {
  assert.deepEqual(chunk([1, 2, 3], 2, { maxChunks: 100 }), [[1, 2], [3]]);
});
