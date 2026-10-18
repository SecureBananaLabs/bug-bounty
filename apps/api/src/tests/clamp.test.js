import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clamp } from "../utils/clamp.js";

describe("clamp Utility", () => {
    it("clamps numbers within bounds", () => {
        assert.equal(clamp(10, -5, 5), 5);
        assert.equal(clamp(-10, -5, 5), -5);
        assert.equal(clamp(0, -5, 5), 0);
    });

    it("handles swapped bounds gracefully", () => {
        assert.equal(clamp(10, 5, -5), 5);
        assert.equal(clamp(-10, 5, -5), -5);
    });

    it("handles string numbers", () => {
        assert.equal(clamp("10", "-5", "5"), 5);
        assert.equal(clamp("-10", -5, 5), -5);
    });

    it("returns NaN for invalid numbers", () => {
        assert.ok(isNaN(clamp(NaN, -5, 5)));
        assert.ok(isNaN(clamp(undefined, -5, 5)));
        assert.ok(isNaN(clamp("invalid", -5, 5)));
    });
});