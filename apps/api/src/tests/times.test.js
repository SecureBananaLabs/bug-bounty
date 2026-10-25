import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { times } from "../utils/times.js";

describe("times Utility", () => {
    it("invokes iteratee n times with index", () => {
        const res = times(3, (i) => i * 2);
        assert.deepEqual(res, [0, 2, 4]);
    });

    it("defaults to identity function when iteratee is omitted", () => {
        assert.deepEqual(times(4), [0, 1, 2, 3]);
    });

    it("returns empty array for zero or negative numbers", () => {
        assert.deepEqual(times(0), []);
        assert.deepEqual(times(-5), []);
    });

    it("handles invalid or non-numeric n safely", () => {
        assert.deepEqual(times(null), []);
        assert.deepEqual(times(undefined), []);
        assert.deepEqual(times(NaN), []);
    });
});