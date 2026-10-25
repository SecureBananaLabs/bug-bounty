import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chunk } from "../utils/chunk.js";

describe("chunk Utility", () => {
    it("chunks arrays evenly", () => {
        const arr = ["a", "b", "c", "d"];
        assert.deepEqual(chunk(arr, 2), [["a", "b"], ["c", "d"]]);
    });

    it("chunks arrays unevenly with remainder", () => {
        const arr = ["a", "b", "c", "d", "e"];
        assert.deepEqual(chunk(arr, 2), [["a", "b"], ["c", "d"], ["e"]]);
        assert.deepEqual(chunk(arr, 3), [["a", "b", "c"], ["d", "e"]]);
    });

    it("defaults to size 1", () => {
        const arr = [1, 2, 3];
        assert.deepEqual(chunk(arr), [[1], [2], [3]]);
    });

    it("handles zero or negative sizes", () => {
        assert.deepEqual(chunk([1, 2, 3], 0), []);
        assert.deepEqual(chunk([1, 2, 3], -1), []);
    });

    it("handles null, undefined, or empty arrays safely", () => {
        assert.deepEqual(chunk(null), []);
        assert.deepEqual(chunk(undefined), []);
        assert.deepEqual(chunk([]), []);
    });
});