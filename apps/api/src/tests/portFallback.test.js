import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parsePort } from "../config/env.js";

describe("Safe PORT Environment Variable Parsing (parsePort)", () => {
  it("returns default port 4000 when PORT is undefined, null, or empty", () => {
    assert.equal(parsePort(undefined), 4000);
    assert.equal(parsePort(null), 4000);
    assert.equal(parsePort(""), 4000);
    assert.equal(parsePort("   "), 4000);
  });

  it("parses valid TCP port numbers between 1 and 65535", () => {
    assert.equal(parsePort("3000"), 3000);
    assert.equal(parsePort("8080"), 8080);
    assert.equal(parsePort(65535), 65535);
    assert.equal(parsePort(1), 1);
  });

  it("falls back to 4000 and logs a warning when PORT is non-numeric or out of range", () => {
    const warnings = [];
    const origWarn = console.warn;
    console.warn = (msg) => warnings.push(msg);

    try {
      assert.equal(parsePort("invalid_port"), 4000);
      assert.equal(parsePort("0"), 4000);
      assert.equal(parsePort("-80"), 4000);
      assert.equal(parsePort("70000"), 4000);
      assert.equal(parsePort("3000.5"), 4000);
      assert.equal(warnings.length, 5);
    } finally {
      console.warn = origWarn;
    }
  });
});
