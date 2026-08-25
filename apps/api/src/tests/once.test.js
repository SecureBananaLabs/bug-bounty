import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { once } from "../utils/once.js";

describe("once Utility", () => {
    it("invokes the target function exactly once and caches the result", () => {
        let callCount = 0;
        const initialize = once((x) => {
            callCount++;
            return x * 2;
        });

        assert.equal(initialize(5), 10);
        assert.equal(callCount, 1);

        assert.equal(initialize(10), 10);
        assert.equal(initialize(20), 10);
        assert.equal(callCount, 1);
    });

    it("preserves `this` binding on invocation", () => {
        const context = {
            multiplier: 3,
            calc: once(function (n) {
                return n * this.multiplier;
            }),
        };

        assert.equal(context.calc(4), 12);
        assert.equal(context.calc(10), 12);
    });

    it("throws TypeError if target is not a function", () => {
        assert.throws(() => once(null), TypeError);
        assert.throws(() => once(123), TypeError);
    });
});