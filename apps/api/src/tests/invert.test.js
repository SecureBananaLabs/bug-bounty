import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { invert, invertBy } from "../utils/invert.js";

describe("invert and invertBy Utilities", () => {
    it("inverts keys and values of an object", () => {
        const object = { a: 1, b: 2, c: 1 };
        assert.deepEqual(invert({ a: 1, b: 2 }), { 1: "a", 2: "b" });
        assert.equal(invert(object)["1"], "c"); // Subsequent overwrite
    });

    it("prevents prototype pollution on invert", () => {
        const malicious = { safeKey: "__proto__" };
        const res = invert(malicious);
        assert.equal({}.polluted, undefined);
        assert.equal(Object.prototype.polluted, undefined);
    });

    it("invertBy groups inverted keys into arrays", () => {
        const object = { a: 1, b: 2, c: 1 };
        assert.deepEqual(invertBy(object), { 1: ["a", "c"], 2: ["b"] });
    });

    it("invertBy transforms values with custom iteratee", () => {
        const object = { a: 1, b: 2, c: 1 };
        const res = invertBy(object, (v) => "group_" + v);
        assert.deepEqual(res, { group_1: ["a", "c"], group_2: ["b"] });
    });

    it("handles null and undefined safely", () => {
        assert.deepEqual(invert(null), {});
        assert.deepEqual(invertBy(undefined), {});
    });
});