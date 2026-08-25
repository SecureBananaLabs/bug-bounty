import test from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../config/env.js";

test("parsePort falls back to the default when PORT is missing or invalid", () => {
  assert.equal(parsePort(undefined), 4000);
  assert.equal(parsePort("abc"), 4000);
  assert.equal(parsePort(""), 4000);
  assert.equal(parsePort("1.5"), 4000);
  assert.equal(parsePort("-1"), 4000);
  assert.equal(parsePort("65536"), 4000);
});

test("parsePort preserves valid explicit ports", () => {
  assert.equal(parsePort("0"), 0);
  assert.equal(parsePort("8080"), 8080);
  assert.equal(parsePort(3000), 3000);
});
