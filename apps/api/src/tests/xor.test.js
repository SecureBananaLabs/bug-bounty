import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { xor, xorBy } from "../utils/xor.js";

describe("xor and xorBy Utilities", () => {
    it("computes symmetric difference between arrays", () => {
        assert.deepEqual(xor([2, 1], [2, 3]), [1, 3]);
        assert.deepEqual(xor([1, 2], [2, 3], [3, 4]), [1, 4]);
    });

    it("xorBy computes symmetric difference with iteratee function", () => {
        const res = xorBy([2.1, 1.2], [2.3, 3.4], Math.floor);
        assert.deepEqual(res, [1.2, 3.4]);
    });

    it("xorBy computes symmetric difference with property shorthand", () => {
        const res = xorBy([{ x: 1 }], [{ x: 2 }, { x: 1 }], "x");
        assert.deepEqual(res, [{ x: 2 }]);
    });

    it("handles empty and non-array inputs safely", () => {
        assert.deepEqual(xor(), []);
        assert.deepEqual(xor([], []), []);
        assert.deepEqual(xor(null, undefined, [1, 2]), [1, 2]);
    });
});