import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { at, get } from "../utils/at.js";

describe("at and get Utilities", () => {
    const object = { a: [{ b: { c: 3 } }, 4], x: { y: "hello" } };

    it("get resolves nested dot and bracket notation paths", () => {
        assert.equal(get(object, "a[0].b.c"), 3);
        assert.equal(get(object, ["a", "0", "b", "c"]), 3);
        assert.equal(get(object, "x.y"), "hello");
    });

    it("get returns defaultValue for undefined or missing paths", () => {
        assert.equal(get(object, "a.b.c", "default"), "default");
        assert.equal(get(object, "nonexistent", null), null);
    });

    it("get protects against prototype pollution access", () => {
        assert.equal(get(object, "__proto__.polluted", "safe"), "safe");
        assert.equal(get(object, "constructor.prototype", "safe"), "safe");
    });

    it("at extracts multiple paths into an array", () => {
        const res = at(object, "a[0].b.c", "a[1]", "x.y");
        assert.deepEqual(res, [3, 4, "hello"]);
    });

    it("handles null and undefined safely", () => {
        assert.equal(get(null, "a.b", "fallback"), "fallback");
        assert.deepEqual(at(null, "a.b"), []);
    });
});