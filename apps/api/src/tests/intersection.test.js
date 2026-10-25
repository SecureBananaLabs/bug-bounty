import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { intersection } from "../utils/intersection.js";

describe("intersection Utility", () => {
    it("returns unique common elements across arrays", () => {
        assert.deepEqual(intersection([2, 1], [2, 3]), [2]);
    });

    it("handles multiple arrays", () => {
        assert.deepEqual(intersection([1, 2, 3, 4], [2, 3, 5], [2, 3, 6]), [2, 3]);
    });

    it("deduplicates result elements", () => {
        assert.deepEqual(intersection([2, 1, 2], [2, 3]), [2]);
    });

    it("returns empty array if no common elements or invalid inputs", () => {
        assert.deepEqual(intersection([1, 2], [3, 4]), []);
        assert.deepEqual(intersection([], [1, 2]), []);
        assert.deepEqual(intersection(null, [1, 2]), []);
        assert.deepEqual(intersection([1, 2], undefined), []);
    });
});