import test from "node:test";
import assert from "node:assert/strict";
import { timingSafeEqual } from "../utils/timingSafe.js";

test("timingSafeEqual returns true for identical strings", () => {
  assert.equal(timingSafeEqual("my-secret-key-12345", "my-secret-key-12345"), true);
});

test("timingSafeEqual returns false for different strings of same length", () => {
  assert.equal(timingSafeEqual("my-secret-key-12345", "my-secret-key-54321"), false);
});

test("timingSafeEqual returns false for different strings of different length without throwing", () => {
  assert.equal(timingSafeEqual("short", "much-longer-secret-token"), false);
});

test("timingSafeEqual returns false for non-string inputs", () => {
  assert.equal(timingSafeEqual(null, "secret"), false);
  assert.equal(timingSafeEqual("secret", undefined), false);
  assert.equal(timingSafeEqual(12345, 12345), false);
  assert.equal(timingSafeEqual({}, {}), false);
});

test("timingSafeEqual handles long secrets accurately", () => {
  const secretA = "a".repeat(256);
  const secretB = "a".repeat(255) + "b";
  assert.equal(timingSafeEqual(secretA, secretA), true);
  assert.equal(timingSafeEqual(secretA, secretB), false);
});
