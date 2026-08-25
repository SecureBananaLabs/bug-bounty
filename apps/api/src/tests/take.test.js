import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { take, takeRight } from "../utils/take.js";

describe("take and takeRight Utilities", () => {
    it("takes n elements from the beginning of an array", () => {
        assert.deepEqual(take([1, 2, 3]), [1]);
        assert.deepEqual(take([1, 2, 3], 2), [1, 2]);
        assert.deepEqual(take([1, 2, 3], 5), [1, 2, 3]);
    });

    it("takes n elements from the end of an array", () => {
        assert.deepEqual(takeRight([1, 2, 3]), [3]);
        assert.deepEqual(takeRight([1, 2, 3], 2), [2, 3]);
        assert.deepEqual(takeRight([1, 2, 3], 5), [1, 2, 3]);
    });

    it("returns empty array for n <= 0", () => {
        assert.deepEqual(take([1, 2, 3], 0), []);
        assert.deepEqual(take([1, 2, 3], -2), []);
        assert.deepEqual(takeRight([1, 2, 3], 0), []);
        assert.deepEqual(takeRight([1, 2, 3], -2), []);
    });

    it("handles null, undefined, or empty arrays safely", () => {
        assert.deepEqual(take(null), []);
        assert.deepEqual(take(undefined), []);
        assert.deepEqual(takeRight([]), []);
        assert.deepEqual(takeRight(null), []);
    });
});