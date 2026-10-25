import test from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../config/env.js";

test("parsePort validates and fallbacks correctly", () => {
  // Valid integer port numbers
  assert.equal(parsePort(3000), 3000);
  assert.equal(parsePort("8080"), 8080);
  assert.equal(parsePort(80), 80);
  assert.equal(parsePort(65535), 65535);

  // Missing or empty values fallback to default (4000)
  assert.equal(parsePort(undefined), 4000);
  assert.equal(parsePort(null), 4000);
  assert.equal(parsePort(""), 4000);

  // Non-numeric strings fallback to default
  assert.equal(parsePort("invalid"), 4000);
  assert.equal(parsePort("NaN"), 4000);
  assert.equal(parsePort("3000abc"), 4000);

  // Out of range ports fallback to default
  assert.equal(parsePort(-1), 4000);
  assert.equal(parsePort(0), 4000);
  assert.equal(parsePort(65536), 4000);
  assert.equal(parsePort(70000), 4000);

  // Non-integer floats fallback to default
  assert.equal(parsePort(3000.5), 4000);

  // Custom default port
  assert.equal(parsePort("invalid", 5000), 5000);
});
