import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { result, update } from "../utils/result.js";

describe("result and update Utilities", () => {
    const object = {
        a: [{ b: { c1: 3, c2: function () { return this.c1 * 2; } } }],
        multiplier: 10,
        compute: function () { return this.multiplier * 5; },
    };

    it("result invokes functions with their parent context", () => {
        assert.equal(result(object, "a[0].b.c1"), 3);
        assert.equal(result(object, "a[0].b.c2"), 6);
        assert.equal(result(object, "compute"), 50);
    });

    it("result returns defaultValue when path resolves to undefined", () => {
        assert.equal(result(object, "a.b.c", "fallback"), "fallback");
        assert.equal(result(object, "missing", () => "dynamic"), "dynamic");
    });

    it("update sets values via updater function", () => {
        const target = { a: [{ b: { count: 1 } }] };
        update(target, "a[0].b.count", (n) => (n || 0) + 5);
        assert.equal(target.a[0].b.count, 6);
    });

    it("prevents prototype pollution on update and result", () => {
        const evil = {};
        update(evil, "__proto__.polluted", () => "yes");
        assert.equal({}.polluted, undefined);
        assert.equal(result(evil, "__proto__.polluted", "safe"), "safe");
    });

    it("handles null and undefined safely", () => {
        assert.equal(result(null, "a.b", "fallback"), "fallback");
        assert.equal(update(null, "a.b", (x) => x), null);
    });
});