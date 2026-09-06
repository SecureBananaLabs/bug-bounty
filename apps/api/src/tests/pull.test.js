import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pull, pullAll } from "../utils/pull.js";

describe("pull and pullAll Utilities", () => {
    it("mutates array in-place removing specified values", () => {
        const arr = ["a", "b", "c", "a", "b", "c"];
        const res = pull(arr, "a", "c");
        assert.equal(res, arr); // in-place
        assert.deepEqual(arr, ["b", "b"]);
    });

    it("pullAll removes all elements from values array", () => {
        const arr = [1, 2, 3, 1, 2, 3];
        pullAll(arr, [2, 3]);
        assert.deepEqual(arr, [1, 1]);
    });

    it("handles non-array or empty inputs safely", () => {
        const arr = [1, 2];
        pullAll(arr, []);
        assert.deepEqual(arr, [1, 2]);
        assert.equal(pullAll(null, [1]), null);
        assert.deepEqual(pull(arr), [1, 2]);
    });
});