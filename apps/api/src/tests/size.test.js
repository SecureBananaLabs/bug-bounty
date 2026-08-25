import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { size } from "../utils/size.js";

describe("size Utility", () => {
    it("returns correct length for arrays and strings", () => {
        assert.equal(size([1, 2, 3]), 3);
        assert.equal(size("hello"), 5);
        assert.equal(size([]), 0);
        assert.equal(size(""), 0);
    });

    it("returns correct number of keys for plain objects", () => {
        assert.equal(size({ a: 1, b: 2, c: 3 }), 3);
        assert.equal(size({}), 0);
    });

    it("returns correct size for Map and Set instances", () => {
        const map = new Map([["a", 1], ["b", 2]]);
        const set = new Set([1, 2, 3, 4]);
        assert.equal(size(map), 2);
        assert.equal(size(set), 4);
    });

    it("returns 0 for null, undefined, numbers, and booleans", () => {
        assert.equal(size(null), 0);
        assert.equal(size(undefined), 0);
        assert.equal(size(123), 0);
        assert.equal(size(true), 0);
    });
});