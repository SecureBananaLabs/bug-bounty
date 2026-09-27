import test from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../config/env.js";

test("parsePort defaults only when PORT is unset", () => {
  assert.equal(parsePort(undefined), 4000);
});

test("parsePort accepts integer TCP ports", () => {
  assert.equal(parsePort("1"), 1);
  assert.equal(parsePort("4000"), 4000);
  assert.equal(parsePort("65535"), 65535);
});

test("parsePort rejects invalid PORT values", () => {
  for (const value of ["", "0", "-1", "3.14", "abc", "65536", " 4000 "]) {
    assert.throws(
      () => parsePort(value),
      /PORT must be an integer between 1 and 65535/
    );
  }
});
