import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { flattenCompact } from "../utils/flattenCompact.js";

describe("flattenCompact Utility", () => {
    it("flattens 1 level and removes falsy values", () => {
        const input = [1, [2, null, 3], false, [4, 0, "", [5]]];
        const result = flattenCompact(input, 1);
        assert.deepEqual(result, [1, 2, 3, 4, [5]]);
    });

    it("deep flattens when depth is Infinity or 'deep'", () => {
        const input = [1, [2, [3, [null, 4, false, [5, undefined, 6]]]]];
        const resultDeep = flattenCompact(input, "deep");
        const resultInf = flattenCompact(input, Number.POSITIVE_INFINITY);

        assert.deepEqual(resultDeep, [1, 2, 3, 4, 5, 6]);
        assert.deepEqual(resultInf, [1, 2, 3, 4, 5, 6]);
    });

    it("handles non-array and empty inputs safely", () => {
        assert.deepEqual(flattenCompact(null), []);
        assert.deepEqual(flattenCompact(undefined), []);
        assert.deepEqual(flattenCompact(12345), []);
        assert.deepEqual(flattenCompact([]), []);
    });

    it("retains truthy objects and symbols", () => {
        const sym = Symbol("test");
        const obj = { key: "val" };
        const input = [null, obj, false, sym, undefined];
        const result = flattenCompact(input);

        assert.deepEqual(result, [obj, sym]);
    });
});