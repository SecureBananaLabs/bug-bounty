import test from "node:test";
import assert from "node:assert/strict";
import { refreshSchema } from "../validators/auth.js";

test("refreshSchema accepts a well-formed refreshToken", () => {
  const result = refreshSchema.parse({ refreshToken: "abcdefghijklmnopqrstuvwxyz0123456789" });
  assert.ok(result.refreshToken.length >= 20);
});

test("refreshSchema trims surrounding whitespace from the token", () => {
  const result = refreshSchema.parse({ refreshToken: "  abcdefghijklmnopqrst  " });
  assert.equal(result.refreshToken, "abcdefghijklmnopqrst");
});

test("refreshSchema rejects missing refreshToken", () => {
  const result = refreshSchema.safeParse({});
  assert.equal(result.success, false);
});

test("refreshSchema rejects empty refreshToken", () => {
  const result = refreshSchema.safeParse({ refreshToken: "" });
  assert.equal(result.success, false);
});

test("refreshSchema rejects whitespace-only refreshToken", () => {
  const result = refreshSchema.safeParse({ refreshToken: "      " });
  assert.equal(result.success, false);
});

test("refreshSchema rejects refreshToken shorter than 20 chars", () => {
  const result = refreshSchema.safeParse({ refreshToken: "short" });
  assert.equal(result.success, false);
});

test("refreshSchema rejects refreshToken longer than 4096 chars", () => {
  const long = "x".repeat(4097);
  const result = refreshSchema.safeParse({ refreshToken: long });
  assert.equal(result.success, false);
});

test("refreshSchema rejects non-string refreshToken", () => {
  const result = refreshSchema.safeParse({ refreshToken: 12345 });
  assert.equal(result.success, false);
});
