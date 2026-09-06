import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { roundTo } from "../utils/roundTo.js";

describe("roundTo Utility", () => {
    it("accurately rounds floating point binary edge cases", () => {
        // Standard Math.round(1.005 * 100) / 100 results in 1 due to 1.005*100 = 100.49999999999999
        assert.equal(roundTo(1.005, 2), 1.01);
        assert.equal(roundTo(1.055, 2), 1.06);
        assert.equal(roundTo(35.855, 2), 35.86);
    });

    it("supports integer rounding with negative precision", () => {
        assert.equal(roundTo(1234, -2), 1200);
        assert.equal(roundTo(1250, -2), 1300);
        assert.equal(roundTo(56789, -3), 57000);
    });

    it("accurately handles negative values", () => {
        assert.equal(roundTo(-1.005, 2), -1.01);
        assert.equal(roundTo(-1234, -2), -1200);
    });

    it("handles zero and invalid non-finite numbers safely", () => {
        assert.equal(roundTo(0, 2), 0);
        assert.ok(Number.isNaN(roundTo("invalid", 2)));
        assert.ok(Number.isNaN(roundTo(Number.POSITIVE_INFINITY, 2)));
    });
});