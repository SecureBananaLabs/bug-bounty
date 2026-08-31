import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { difference } from "../utils/difference.js";

describe("difference Utility", () => {
    it("returns elements not present in exclusion arrays", () => {
        assert.deepEqual(difference([2, 1, 3], [2, 3]), [1]);
    });

    it("handles multiple exclusion arrays", () => {
        assert.deepEqual(difference([2, 1, 3, 4], [2], [3]), [1, 4]);
    });

    it("preserves order and duplicates if not in exclusion array", () => {
        assert.deepEqual(difference([1, 2, 1, 3, 2], [2]), [1, 1, 3]);
    });

    it("handles non-array inputs safely", () => {
        assert.deepEqual(difference(null, [1]), []);
        assert.deepEqual(difference(undefined, [1]), []);
        assert.deepEqual(difference([1, 2], null, undefined, [2]), [1]);
    });
});