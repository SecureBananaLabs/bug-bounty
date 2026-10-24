import test from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../config/env.js";

test("parsePort parses valid port numbers correctly", () => {
  assert.equal(parsePort("3000"), 3000);
  assert.equal(parsePort("8080"), 8080);
  assert.equal(parsePort(5000), 5000);
});

test("parsePort falls back to default on empty string or null/undefined", () => {
  assert.equal(parsePort(""), 4000);
  assert.equal(parsePort(undefined), 4000);
  assert.equal(parsePort(null), 4000);
});

test("parsePort falls back to default on invalid or out-of-bound values", () => {
  assert.equal(parsePort("0"), 4000);
  assert.equal(parsePort("-10"), 4000);
  assert.equal(parsePort("70000"), 4000);
  assert.equal(parsePort("invalid"), 4000);
  assert.equal(parsePort("3000.5"), 4000);
});
