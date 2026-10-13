import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMatch, matches } from "../utils/isMatch.js";

describe("isMatch and matches Utilities", () => {
    const object = { a: 1, b: 2, c: { d: 3, e: 4 } };

    it("isMatch performs partial deep matching", () => {
        assert.equal(isMatch(object, { b: 2 }), true);
        assert.equal(isMatch(object, { c: { d: 3 } }), true);
        assert.equal(isMatch(object, { b: 3 }), false);
        assert.equal(isMatch(object, { c: { d: 5 } }), false);
    });

    it("matches returns a reusable matching predicate function", () => {
        const matcher = matches({ a: 1, c: { e: 4 } });
        assert.equal(matcher(object), true);
        assert.equal(matcher({ a: 2 }), false);
    });

    it("protects against prototype pollution comparisons", () => {
        const evil = JSON.parse('{"__proto__": {"polluted": true}}');
        assert.equal(isMatch({}, evil), true);
        assert.equal({}.polluted, undefined);
    });

    it("handles null and undefined safely", () => {
        assert.equal(isMatch(null, { a: 1 }), false);
        assert.equal(isMatch(object, null), false);
    });
});