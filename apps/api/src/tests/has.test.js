import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { has, hasIn } from "../utils/has.js";

describe("has and hasIn Utilities", () => {
    const object = { a: { b: 2 } };
    const other = Object.create({ a: { b: 2 } });
    other.direct = true;

    it("has checks for direct nested properties", () => {
        assert.equal(has(object, "a.b"), true);
        assert.equal(has(object, ["a", "b"]), true);
        assert.equal(has(object, "a.c"), false);
    });

    it("has vs hasIn on inherited properties", () => {
        assert.equal(has(other, "direct"), true);
        assert.equal(has(other, "a.b"), false); // inherited on root
        assert.equal(hasIn(other, "a.b"), true);
    });

    it("prevents prototype pollution exploration", () => {
        assert.equal(has({}, "__proto__"), false);
        assert.equal(hasIn({}, "__proto__"), false);
    });

    it("handles null and undefined safely", () => {
        assert.equal(has(null, "a.b"), false);
        assert.equal(hasIn(undefined, "a.b"), false);
    });
});