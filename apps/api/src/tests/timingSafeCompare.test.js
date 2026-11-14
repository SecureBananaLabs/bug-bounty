import test from "node:test";
import assert from "node:assert/strict";
import { timingSafeEqual } from "../utils/timingSafeCompare.js";

test("Timing-safe comparison security suite", async (t) => {
  await t.test("Returns true for strictly equal strings", () => {
    assert.equal(
      timingSafeEqual("wh_sec_93849182390182309182", "wh_sec_93849182390182309182"),
      true
    );
    assert.equal(timingSafeEqual("super-secret-token", "super-secret-token"), true);
  });

  await t.test("Returns true for identical Buffer inputs", () => {
    const buf1 = Buffer.from("signature-hash-data", "utf8");
    const buf2 = Buffer.from("signature-hash-data", "utf8");
    assert.equal(timingSafeEqual(buf1, buf2), true);
  });

  await t.test("Returns false for strings of identical length but differing characters", () => {
    assert.equal(
      timingSafeEqual("token_abcdef123456", "token_abcdef123457"),
      false
    );
  });

  await t.test("Returns false for strings of differing lengths without throwing", () => {
    assert.equal(timingSafeEqual("short", "much_longer_secret_string"), false);
    assert.equal(timingSafeEqual("longer_string", "short"), false);
  });

  await t.test("Handles empty strings correctly", () => {
    assert.equal(timingSafeEqual("", ""), true);
    assert.equal(timingSafeEqual("", "non-empty"), false);
    assert.equal(timingSafeEqual("non-empty", ""), false);
  });

  await t.test("Handles null, undefined, and non-string inputs safely without exceptions", () => {
    assert.equal(timingSafeEqual(null, "secret"), false);
    assert.equal(timingSafeEqual("secret", undefined), false);
    assert.equal(timingSafeEqual(null, null), false);
    assert.equal(timingSafeEqual(undefined, undefined), false);
    assert.equal(timingSafeEqual(12345, 12345), true);
    assert.equal(timingSafeEqual(12345, 54321), false);
  });
});
