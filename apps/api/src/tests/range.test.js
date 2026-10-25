import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { range, rangeRight } from "../utils/range.js";

describe("range and rangeRight Utilities", () => {
    it("creates range with single argument (0..end)", () => {
        assert.deepEqual(range(4), [0, 1, 2, 3]);
        assert.deepEqual(range(-4), [0, -1, -2, -3]);
    });

    it("creates range with start and end", () => {
        assert.deepEqual(range(1, 5), [1, 2, 3, 4]);
        assert.deepEqual(range(0, 20, 5), [0, 5, 10, 15]);
    });

    it("handles custom positive and negative steps", () => {
        assert.deepEqual(range(0, -4, -1), [0, -1, -2, -3]);
        assert.deepEqual(range(1, 4, 0), [1, 1, 1]);
    });

    it("rangeRight populates in descending order", () => {
        assert.deepEqual(rangeRight(4), [3, 2, 1, 0]);
        assert.deepEqual(rangeRight(1, 5), [4, 3, 2, 1]);
        assert.deepEqual(rangeRight(0, 20, 5), [15, 10, 5, 0]);
    });
});