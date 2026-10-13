import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { without, withoutBy } from "../utils/without.js";

describe("without and withoutBy Utilities", () => {
    it("creates a new array excluding specified values without mutating original", () => {
        const original = [2, 1, 2, 3];
        const res = without(original, 1, 2);
        assert.deepEqual(res, [3]);
        assert.deepEqual(original, [2, 1, 2, 3]); // Non-mutating
    });

    it("withoutBy filters values using iteratee function", () => {
        const res = withoutBy([2.1, 1.2, 3.4], [1.9, 2.8], Math.floor);
        assert.deepEqual(res, [3.4]);
    });

    it("withoutBy filters values using property shorthand", () => {
        const res = withoutBy([{ x: 1 }, { x: 2 }, { x: 3 }], [{ x: 2 }], "x");
        assert.deepEqual(res, [{ x: 1 }, { x: 3 }]);
    });

    it("handles null, undefined, or empty inputs safely", () => {
        assert.deepEqual(without(null, 1), []);
        assert.deepEqual(without([1, 2]), [1, 2]);
        assert.deepEqual(withoutBy(null, [1]), []);
    });
});