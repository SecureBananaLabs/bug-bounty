import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sample, sampleSize } from "../utils/sample.js";

describe("sample and sampleSize Utilities", () => {
    it("gets a random element from an array", () => {
        const arr = [1, 2, 3, 4];
        const res = sample(arr);
        assert.ok(arr.includes(res));
    });

    it("returns undefined when sampling empty or non-arrays", () => {
        assert.equal(sample([]), undefined);
        assert.equal(sample(null), undefined);
        assert.equal(sample(undefined), undefined);
    });

    it("gets n random elements without replacement", () => {
        const arr = [1, 2, 3, 4, 5];
        const res = sampleSize(arr, 3);
        assert.equal(res.length, 3);
        assert.equal(new Set(res).size, 3);
        res.forEach((item) => assert.ok(arr.includes(item)));
    });

    it("clamps sample size to array length", () => {
        const arr = [1, 2];
        const res = sampleSize(arr, 10);
        assert.equal(res.length, 2);
    });

    it("returns empty array for invalid inputs or n <= 0", () => {
        assert.deepEqual(sampleSize([1, 2], 0), []);
        assert.deepEqual(sampleSize([1, 2], -5), []);
        assert.deepEqual(sampleSize(null, 2), []);
    });
});