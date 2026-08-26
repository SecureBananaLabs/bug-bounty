import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { over, overEvery, overSome } from "../utils/over.js";

describe("over, overEvery, and overSome Utilities", () => {
    it("over invokes all iteratees and collects results into an array", () => {
        const func = over(Math.max, Math.min);
        assert.deepEqual(func(1, 2, 3, 4), [4, 1]);

        const arrayForm = over([Math.max, Math.min]);
        assert.deepEqual(arrayForm(10, 20), [20, 10]);
    });

    it("overEvery checks if all predicates pass with short-circuiting", () => {
        let secondCalled = false;
        const allPositiveEven = overEvery(
            (n) => n > 0,
            (n) => {
                secondCalled = true;
                return n % 2 === 0;
            }
        );

        assert.equal(allPositiveEven(4), true);
        assert.equal(secondCalled, true);

        secondCalled = false;
        assert.equal(allPositiveEven(-2), false);
        assert.equal(secondCalled, false); // Short-circuited
    });

    it("overSome checks if any predicate passes with short-circuiting", () => {
        let secondCalled = false;
        const isOddOrNegative = overSome(
            (n) => n % 2 !== 0,
            (n) => {
                secondCalled = true;
                return n < 0;
            }
        );

        assert.equal(isOddOrNegative(3), true);
        assert.equal(secondCalled, false); // Short-circuited on first true

        assert.equal(isOddOrNegative(-4), true);
        assert.equal(secondCalled, true);

        assert.equal(isOddOrNegative(4), false);
    });

    it("preserves `this` context binding cleanly", () => {
        const obj = {
            base: 10,
            compute: over(
                function (n) { return this.base + n; },
                function (n) { return this.base * n; }
            ),
        };
        assert.deepEqual(obj.compute(5), [15, 50]);
    });
});