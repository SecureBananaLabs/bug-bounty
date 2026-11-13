import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PORT, resolvePort } from "../config/env.js";

test("resolvePort keeps a valid numeric PORT", () => {
  assert.equal(resolvePort("8080"), 8080);
});

test("resolvePort falls back to the default for an unset PORT", () => {
  assert.equal(resolvePort(undefined), DEFAULT_PORT);
  assert.equal(resolvePort(""), DEFAULT_PORT);
});

test("resolvePort falls back to the default for a non-numeric PORT", () => {
  assert.equal(resolvePort("not-a-port"), DEFAULT_PORT);
  assert.equal(resolvePort("30.5"), DEFAULT_PORT);
  assert.equal(resolvePort("-1"), DEFAULT_PORT);
});

test("env.port is always a usable integer", async () => {
  const { env } = await import("../config/env.js");
  assert.equal(Number.isInteger(env.port), true);
  assert.ok(env.port > 0);
});
