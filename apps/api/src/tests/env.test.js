import test from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../config/env.js";

test("parsePort preserves valid explicit ports", () => {
  assert.equal(parsePort("0"), 0);
  assert.equal(parsePort("8080"), 8080);
});

test("parsePort falls back to default for invalid ports", () => {
  assert.equal(parsePort(undefined), 4000);
  assert.equal(parsePort(""), 4000);
  assert.equal(parsePort("abc"), 4000);
  assert.equal(parsePort("12.5"), 4000);
  assert.equal(parsePort("-1"), 4000);
  assert.equal(parsePort("65536"), 4000);
});
