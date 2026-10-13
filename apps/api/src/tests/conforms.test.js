import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { conforms, conformsTo } from "../utils/conforms.js";

describe("conforms and conformsTo Utilities", () => {
    const object = { a: 1, b: 2, c: "hello" };

    it("conformsTo checks if object satisfies predicate map", () => {
        const pass = conformsTo(object, {
            a: (n) => n > 0,
            b: (n) => n === 2,
            c: (s) => typeof s === "string",
        });
        assert.equal(pass, true);

        const fail = conformsTo(object, {
            b: (n) => n > 10,
        });
        assert.equal(fail, false);
    });

    it("conforms creates a reusable curried predicate function", () => {
        const isEligible = conforms({
            a: (n) => n >= 1,
            b: (n) => n % 2 === 0,
        });
        assert.equal(isEligible(object), true);
        assert.equal(isEligible({ a: 0, b: 2 }), false);
    });

    it("handles null and undefined safely", () => {
        assert.equal(conformsTo(null, { a: () => true }), false);
        assert.equal(conformsTo(object, null), false);
        assert.equal(conforms(null)(object), false);
    });
});