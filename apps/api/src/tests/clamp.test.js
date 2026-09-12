import test from "node:test";
import assert from "node:assert/strict";
import { clamp } from "../utils/clamp.js";
import defaultClamp from "../utils/clamp.js";

test("clamp: basic clamping within inclusive bounds", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(0, 0, 10), 0);
  assert.equal(clamp(10, 0, 10), 10);
  assert.equal(defaultClamp(7.5, 0, 10), 7.5);
});

test("clamp: values below minimum return minimum", () => {
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(-100, -50, 50), -50);
  assert.equal(clamp(0, 10, 20), 10);
});

test("clamp: values above maximum return maximum", () => {
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(100, -50, 50), 50);
  assert.equal(clamp(25, 10, 20), 20);
});

test("clamp: inverted bounds (min > max) are normalized safely", () => {
  assert.equal(clamp(15, 20, 10), 15);
  assert.equal(clamp(5, 20, 10), 10);
  assert.equal(clamp(25, 20, 10), 20);
  assert.equal(clamp(-15, -5, -20), -15);
  assert.equal(clamp(-30, -5, -20), -20);
  assert.equal(clamp(0, -5, -20), -5);
});

test("clamp: handles NaN inputs with defaultValue fallback", () => {
  assert.equal(clamp(NaN, 0, 10, 5), 5);
  assert.equal(clamp(NaN, 0, 10, 15), 10); // defaultValue clamped to max
  assert.equal(clamp(NaN, 0, 10, -5), 0);  // defaultValue clamped to min
  assert.equal(clamp(NaN, 0, 10), 0);     // default 0 clamped between 0 and 10
  assert.equal(clamp(NaN, 5, 10), 5);     // default 0 clamped to min 5
});

test("clamp: handles infinite inputs safely", () => {
  assert.equal(clamp(Infinity, 0, 100), 100);
  assert.equal(clamp(-Infinity, 0, 100), 0);
  assert.equal(clamp(Infinity, -50, 50), 50);
  assert.equal(clamp(-Infinity, -50, 50), -50);
});

test("clamp: handles non-numeric and string inputs safely", () => {
  assert.equal(clamp("50", 0, 100), 50);
  assert.equal(clamp("150", 0, 100), 100);
  assert.equal(clamp("-20", 0, 100), 0);
  assert.equal(clamp("invalid", 0, 100, 25), 25);
  assert.equal(clamp(null, 10, 20, 15), 15);
  assert.equal(clamp(undefined, 0, 100, 42), 42);
  assert.equal(clamp({}, 0, 100, 50), 50);
});

test("clamp: handles negative and fractional bounds", () => {
  assert.equal(clamp(-7.25, -10.5, -5.5), -7.25);
  assert.equal(clamp(-12, -10.5, -5.5), -10.5);
  assert.equal(clamp(-2, -10.5, -5.5), -5.5);
  assert.equal(clamp(0.555, 0.1, 0.9), 0.555);
});
