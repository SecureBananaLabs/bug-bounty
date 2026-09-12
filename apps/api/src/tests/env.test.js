import test from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../config/env.js";

test("parsePort returns the default port when PORT is unset", () => {
  assert.equal(parsePort(undefined), 4000);
});

test("parsePort accepts valid integer TCP ports", () => {
  assert.equal(parsePort("1"), 1);
  assert.equal(parsePort("4000"), 4000);
  assert.equal(parsePort("65535"), 65535);
});

test("parsePort rejects invalid PORT values", () => {
  for (const value of ["", "abc", "12.5", "0", "-1", "65536"]) {
    assert.throws(
      () => parsePort(value),
      /Invalid PORT: expected an integer between 1 and 65535/
    );
  }
});
