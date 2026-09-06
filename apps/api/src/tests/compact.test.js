import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compact } from "../utils/compact.js";

describe("compact Utility", () => {
    it("filters out falsy values", () => {
        const input = [0, 1, false, 2, "", 3, "a", Number.NaN, "s", 34, null, undefined];
        const expected = [1, 2, 3, "a", "s", 34];
        assert.deepEqual(compact(input), expected);
    });

    it("returns an empty array when all elements are falsy", () => {
        assert.deepEqual(compact([0, false, "", null, undefined, NaN]), []);
    });

    it("handles non-array inputs safely", () => {
        assert.deepEqual(compact(null), []);
        assert.deepEqual(compact(undefined), []);
        assert.deepEqual(compact("string"), []);
        assert.deepEqual(compact(123), []);
    });
});