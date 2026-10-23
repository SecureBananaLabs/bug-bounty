import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { safeJsonParse, safeJsonStringify } from "../utils/safeJsonParse.js";

describe("safeJsonParse & safeJsonStringify Utility (CWE-1321)", () => {
  it("parses valid JSON strings into objects, arrays, and primitives", () => {
    assert.deepEqual(safeJsonParse('{"status":"ok","count":3}'), { status: "ok", count: 3 });
    assert.deepEqual(safeJsonParse("[1, 2, 3]"), [1, 2, 3]);
    assert.equal(safeJsonParse("true"), true);
    assert.equal(safeJsonParse("42"), 42);
  });

  it("returns fallback value on malformed JSON, empty strings, or non-string inputs", () => {
    assert.equal(safeJsonParse("{bad json"), null);
    assert.deepEqual(safeJsonParse("{bad json", { default: true }), { default: true });
    assert.equal(safeJsonParse("   ", "empty"), "empty");
    assert.equal(safeJsonParse(null, "fallback"), "fallback");
    assert.equal(safeJsonParse(undefined, "fallback"), "fallback");
    assert.equal(safeJsonParse(12345, "fallback"), "fallback");
  });

  it("strips __proto__, constructor, and prototype keys to prevent prototype pollution (CWE-1321)", () => {
    const malicious = '{"ok":1,"__proto__":{"polluted":true},"constructor":{"prototype":{"hacked":true}}}';
    const parsed = safeJsonParse(malicious, {});

    assert.equal(parsed.ok, 1);
    assert.equal(({}).polluted, undefined);
    assert.equal(({}).hacked, undefined);
    assert.equal(Object.prototype.hasOwnProperty.call(parsed, "__proto__"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(parsed, "constructor"), false);
  });

  it("enforces maxLength guard and supports custom reviver callbacks", () => {
    const payload = '{"name":"freelancer"}';
    assert.equal(safeJsonParse(payload, "too_long", { maxLength: 5 }), "too_long");

    const revived = safeJsonParse('{"amount":100}', null, {
      reviver: (k, v) => (k === "amount" ? v * 2 : v)
    });
    assert.deepEqual(revived, { amount: 200 });
  });

  it("safeJsonStringify handles BigInt and circular references without throwing", () => {
    const obj = { id: 10n, name: "node" };
    obj.self = obj;

    const serialized = safeJsonStringify(obj);
    assert.deepEqual(JSON.parse(serialized), {
      id: "10",
      name: "node",
      self: "[Circular]"
    });
  });
});
