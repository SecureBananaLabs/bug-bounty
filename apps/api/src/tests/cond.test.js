import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cond } from "../utils/cond.js";

describe("cond Utility", () => {
    const evaluator = cond([
        [(x) => typeof x === "string", (x) => `string:${x}`],
        [(x) => typeof x === "number" && x > 0, (x) => `pos_number:${x * 2}`],
        [(x) => typeof x === "number" && x <= 0, (x) => `non_pos_number:${x}`],
        [(x) => Array.isArray(x), (x) => `array_length:${x.length}`],
        [() => true, () => "default"],
    ]);

    it("executes the transform of the first truthy predicate", () => {
        assert.equal(evaluator("hello"), "string:hello");
        assert.equal(evaluator(5), "pos_number:10");
        assert.equal(evaluator(-3), "non_pos_number:-3");
        assert.equal(evaluator([1, 2, 3]), "array_length:3");
        assert.equal(evaluator(null), "default");
    });

    it("preserves `this` context binding during predicate and transform calls", () => {
        const contextObj = {
            multiplier: 5,
            eval: cond([
                [
                    function (n) { return n > 0; },
                    function (n) { return n * this.multiplier; }
                ],
            ]),
        };
        assert.equal(contextObj.eval(4), 20);
    });

    it("forwards multiple arguments cleanly to both predicate and transform", () => {
        const comparator = cond([
            [(a, b) => a === b, (a, b) => `${a} equals ${b}`],
            [(a, b) => a > b, (a, b) => `${a} greater than ${b}`],
            [() => true, (a, b) => `${a} less than ${b}`],
        ]);
        assert.equal(comparator(2, 2), "2 equals 2");
        assert.equal(comparator(5, 2), "5 greater than 2");
        assert.equal(comparator(1, 4), "1 less than 4");
    });

    it("handles null, undefined, or empty pairs safely", () => {
        assert.equal(cond(null)(1), undefined);
        assert.equal(cond([])(1), undefined);
        assert.equal(cond([[null, null]])(1), undefined);
    });
});