import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isEqual } from "../utils/isEqual.js";

describe("isEqual Utility", () => {
    it("compares primitives", () => {
        assert.equal(isEqual(1, 1), true);
        assert.equal(isEqual(1, "1"), false);
        assert.equal(isEqual(null, null), true);
        assert.equal(isEqual(undefined, undefined), true);
        assert.equal(isEqual(null, undefined), false);
        assert.equal(isEqual(true, true), true);
        assert.equal(isEqual(true, false), false);
    });

    it("compares arrays deeply", () => {
        assert.equal(isEqual([1, 2, 3], [1, 2, 3]), true);
        assert.equal(isEqual([1, 2, 3], [1, 2, 4]), false);
        assert.equal(isEqual([1, 2, [3, 4]], [1, 2, [3, 4]]), true);
        assert.equal(isEqual([1, 2], [1, 2, 3]), false);
    });

    it("compares objects deeply", () => {
        assert.equal(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 }), true);
        assert.equal(isEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
        assert.equal(isEqual({ a: 1, b: { c: 3 } }, { a: 1, b: { c: 3 } }), true);
        assert.equal(isEqual({ a: 1 }, { a: 1, b: 2 }), false);
    });

    it("compares Date and RegExp", () => {
        assert.equal(isEqual(new Date("2026-01-01"), new Date("2026-01-01")), true);
        assert.equal(isEqual(new Date("2026-01-01"), new Date("2026-01-02")), false);
        
        assert.equal(isEqual(/abc/g, /abc/g), true);
        assert.equal(isEqual(/abc/g, /abc/i), false);
    });
});