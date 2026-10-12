import test from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../config/env.js";

test("parsePort keeps a valid numeric PORT", () => {
  assert.equal(parsePort("3000"), 3000);
  assert.equal(parsePort(8080), 8080);
});

test("parsePort falls back to 4000 when PORT is unset or blank", () => {
  assert.equal(parsePort(undefined), 4000);
  assert.equal(parsePort(""), 4000);
  assert.equal(parsePort("   "), 4000);
});

test("parsePort falls back to 4000 for non-numeric or out-of-range PORT", () => {
  assert.equal(parsePort("not-a-port"), 4000);
  assert.equal(parsePort("0"), 4000);
  assert.equal(parsePort("-1"), 4000);
  assert.equal(parsePort("70000"), 4000);
  assert.equal(parsePort("3000.5"), 4000);
});

test("env.port is a usable integer even with a broken PORT value", async () => {
  process.env.PORT = "oops";
  const { env } = await import("../config/env.js?case=broken-port");
  assert.equal(env.port, 4000);
});
