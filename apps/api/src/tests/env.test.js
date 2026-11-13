import test from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../config/env.js";

test("parsePort falls back when PORT is not a valid listen port", () => {
  assert.equal(parsePort("not-a-port"), 4000);
  assert.equal(parsePort("65536"), 4000);
  assert.equal(parsePort("-1"), 4000);
});

test("parsePort preserves valid explicit ports", () => {
  assert.equal(parsePort("0"), 0);
  assert.equal(parsePort("8080"), 8080);
});
