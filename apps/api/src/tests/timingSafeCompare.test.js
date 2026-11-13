import test from "node:test";
import assert from "node:assert/strict";
import { timingSafeEqual } from "../utils/timingSafeCompare.js";

test("timingSafeEqual - returns true for identical strings", () => {
  const secret = "super_secret_webhook_token_999";
  assert.equal(timingSafeEqual(secret, secret), true);
  assert.equal(timingSafeEqual("abc", "abc"), true);
  assert.equal(timingSafeEqual("", ""), true);
});

test("timingSafeEqual - returns false for different strings of same length", () => {
  assert.equal(timingSafeEqual("abcdef", "abcdeg"), false);
  assert.equal(timingSafeEqual("secret1", "secret2"), false);
});

test("timingSafeEqual - returns false for different strings of different length without throwing", () => {
  assert.equal(timingSafeEqual("short", "much_longer_string_value"), false);
  assert.equal(timingSafeEqual("prefix_token", "prefix"), false);
  assert.equal(timingSafeEqual("", "non_empty"), false);
});

test("timingSafeEqual - supports Buffer comparison", () => {
  const buf1 = Buffer.from("hello world");
  const buf2 = Buffer.from("hello world");
  const buf3 = Buffer.from("hello other");

  assert.equal(timingSafeEqual(buf1, buf2), true);
  assert.equal(timingSafeEqual(buf1, buf3), false);
});

test("timingSafeEqual - rejects invalid non-string non-buffer inputs gracefully", () => {
  assert.equal(timingSafeEqual(null, "secret"), false);
  assert.equal(timingSafeEqual("secret", undefined), false);
  assert.equal(timingSafeEqual({}, {}), false);
  assert.equal(timingSafeEqual(12345, 12345), false);
});
