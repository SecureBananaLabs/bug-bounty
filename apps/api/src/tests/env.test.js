import test from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../config/env.js";

test("parsePort defaults correctly on undefined, null, or empty string", () => {
  assert.equal(parsePort(undefined), 4000);
  assert.equal(parsePort(null), 4000);
  assert.equal(parsePort(""), 4000);
});

test("parsePort parses valid port numbers", () => {
  assert.equal(parsePort("3000"), 3000);
  assert.equal(parsePort("8080"), 8080);
  assert.equal(parsePort("1"), 1);
  assert.equal(parsePort("65535"), 65535);
});

test("parsePort throws error on port 0", () => {
  assert.throws(() => parsePort("0"), /Invalid PORT/);
});

test("parsePort throws error on negative numbers or out of range", () => {
  assert.throws(() => parsePort("-1"), /Invalid PORT/);
  assert.throws(() => parsePort("65536"), /Invalid PORT/);
  assert.throws(() => parsePort("100000"), /Invalid PORT/);
});

test("parsePort throws error on non-numeric or float inputs", () => {
  assert.throws(() => parsePort("abc"), /Invalid PORT/);
  assert.throws(() => parsePort("4000.5"), /Invalid PORT/);
});
