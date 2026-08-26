import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { invoke, invokeMap } from "../utils/invoke.js";

describe("invoke and invokeMap Utilities", () => {
    const object = {
        a: [{ b: { sort: function (fn) { return [3, 1, 2].sort(fn); } } }],
    };

    it("invoke calls method at nested path with arguments", () => {
        const res = invoke(object, "a[0].b.sort", (a, b) => a - b);
        assert.deepEqual(res, [1, 2, 3]);
    });

    it("invokeMap invokes method on each item in array", () => {
        const arrays = [[5, 1, 7], [3, 2, 1]];
        const res = invokeMap(arrays, "sort");
        assert.deepEqual(res, [[1, 5, 7], [1, 2, 3]]);
    });

    it("invokeMap accepts a direct function with item context", () => {
        const numbers = [123, 456];
        const res = invokeMap(numbers, String.prototype.split, "");
        assert.deepEqual(res, [["1", "2", "3"], ["4", "5", "6"]]);
    });

    it("prevents prototype pollution exploration", () => {
        assert.equal(invoke({}, "__proto__.toString"), undefined);
        assert.equal(invoke({}, "constructor.prototype.toString"), undefined);
    });

    it("handles null and undefined safely", () => {
        assert.equal(invoke(null, "a.b"), undefined);
        assert.deepEqual(invokeMap(null, "sort"), []);
    });
});