import test from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../config/env.js";

test("parsePort defaults only when PORT is unset", () => {
  assert.equal(parsePort(undefined), 4000);
});

test("parsePort accepts valid TCP port integers", () => {
  assert.equal(parsePort("1"), 1);
  assert.equal(parsePort("4000"), 4000);
  assert.equal(parsePort("65535"), 65535);
  assert.equal(parsePort(" 8080 "), 8080);
});

test("parsePort rejects invalid configured values", () => {
  for (const value of ["", " ", "not-a-number", "3.14", "0", "-1", "65536"]) {
    assert.throws(
      () => parsePort(value),
      /PORT must be an integer between 1 and 65535/,
      value,
    );
  }
});
