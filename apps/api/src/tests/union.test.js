import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { union, unionBy } from "../utils/union.js";

describe("union and unionBy Utilities", () => {
    it("creates an array of unique values from all given arrays", () => {
        assert.deepEqual(union([2], [1, 2]), [2, 1]);
        assert.deepEqual(union([2, 1], [2, 3], [4, 1]), [2, 1, 3, 4]);
    });

    it("unionBy computes uniqueness based on iteratee function", () => {
        const res = unionBy([2.1], [1.2, 2.3], Math.floor);
        assert.deepEqual(res, [2.1, 1.2]);
    });

    it("unionBy computes uniqueness based on property shorthand", () => {
        const res = unionBy([{ x: 1 }], [{ x: 2 }, { x: 1 }], "x");
        assert.deepEqual(res, [{ x: 1 }, { x: 2 }]);
    });

    it("handles null, undefined, or empty arrays safely", () => {
        assert.deepEqual(union(), []);
        assert.deepEqual(union(null, undefined, [1, 2]), [1, 2]);
    });
});