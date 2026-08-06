import { test } from "node:test";
import assert from "node:assert";
import { parsePort } from "../config/env.js";

test("env port parsing", () => {
  // Default values
  assert.strictEqual(parsePort(undefined), 4000);
  assert.strictEqual(parsePort(null), 4000);
  assert.strictEqual(parsePort(""), 4000);

  // Valid values
  assert.strictEqual(parsePort("4000"), 4000);
  assert.strictEqual(parsePort("80"), 80);
  assert.strictEqual(parsePort("65535"), 65535);
  assert.strictEqual(parsePort(3000), 3000);

  // Invalid values
  assert.throws(() => parsePort("invalid"), /Invalid PORT/);
  assert.throws(() => parsePort("0"), /Invalid PORT/);
  assert.throws(() => parsePort("-100"), /Invalid PORT/);
  assert.throws(() => parsePort("65536"), /Invalid PORT/);
  assert.throws(() => parsePort("80.5"), /Invalid PORT/);
});
