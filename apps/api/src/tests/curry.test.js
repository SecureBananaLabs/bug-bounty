import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { curry } from "../utils/curry.js";

describe("curry Utility", () => {
    it("curries functions with multiple arguments", () => {
        const abc = (a, b, c) => [a, b, c];
        const curried = curry(abc);

        assert.deepEqual(curried(1)(2)(3), [1, 2, 3]);
        assert.deepEqual(curried(1, 2)(3), [1, 2, 3]);
        assert.deepEqual(curried(1, 2, 3), [1, 2, 3]);
    });

    it("respects custom arity parameter", () => {
        const fn = (...args) => args.reduce((a, b) => a + b, 0);
        const curried = curry(fn, 3);

        assert.equal(curried(1)(2)(3), 6);
        assert.equal(curried(1, 2)(3), 6);
    });

    it("throws TypeError if target is not a function", () => {
        assert.throws(() => curry(null), TypeError);
        assert.throws(() => curry("not_a_func"), TypeError);
    });
});