import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { unset } from "../utils/unset.js";

describe("unset Utility", () => {
    it("unsets nested properties on an object", () => {
        const object = { a: [{ b: { c: 7 } }] };
        const res = unset(object, "a[0].b.c");
        assert.equal(res, true);
        assert.deepEqual(object, { a: [{ b: {} }] });
    });

    it("prevents prototype pollution attempts", () => {
        const object = {};
        const res = unset(object, "__proto__.polluted");
        assert.equal(res, false);
    });

    it("returns true on nonexistent paths", () => {
        const object = { a: 1 };
        assert.equal(unset(object, "a.b.c"), true);
        assert.equal(unset(object, "b"), true);
    });

    it("handles null and undefined safely", () => {
        assert.equal(unset(null, "a.b"), true);
        assert.equal(unset(undefined, "a.b"), true);
    });
});