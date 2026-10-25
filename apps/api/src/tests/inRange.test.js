import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inRange } from "../utils/inRange.js";

describe("inRange Utility", () => {
    it("checks if a number is inside standard range", () => {
        assert.equal(inRange(3, 2, 4), true);
        assert.equal(inRange(4, 8), true); // 0 to 8
        assert.equal(inRange(4, 2), false); // 0 to 2
        assert.equal(inRange(2, 2), false); // end is exclusive
    });

    it("handles swapped start and end parameters", () => {
        assert.equal(inRange(3, 4, 2), true);
        assert.equal(inRange(5, 4, 2), false);
    });

    it("handles negative ranges", () => {
        assert.equal(inRange(-3, -2, -6), true);
        assert.equal(inRange(-2, -2, -6), false);
    });

    it("handles floats and edge cases safely", () => {
        assert.equal(inRange(1.2, 2), true);
        assert.equal(inRange(5.2, 4), false);
        assert.equal(inRange(NaN, 1, 5), false);
        assert.equal(inRange(undefined, 1, 5), false);
    });
});