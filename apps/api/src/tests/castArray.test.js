import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { castArray, toArray } from "../utils/castArray.js";

describe("castArray and toArray Utilities", () => {
    it("castArray wraps non-array values into an array", () => {
        assert.deepEqual(castArray(1), [1]);
        assert.deepEqual(castArray({ a: 1 }), [{ a: 1 }]);
        assert.deepEqual(castArray("abc"), ["abc"]);
        assert.deepEqual(castArray(null), [null]);
        assert.deepEqual(castArray(undefined), [undefined]);
        assert.deepEqual(castArray(), []);
    });

    it("castArray returns array directly without re-wrapping", () => {
        const array = [1, 2, 3];
        assert.equal(castArray(array), array);
    });

    it("toArray converts strings, maps, sets, and objects to arrays", () => {
        assert.deepEqual(toArray("foo"), ["f", "o", "o"]);
        assert.deepEqual(toArray({ a: 1, b: 2 }), [1, 2]);
        assert.deepEqual(toArray(new Set([1, 2, 3])), [1, 2, 3]);

        const map = new Map([["a", 1], ["b", 2]]);
        assert.deepEqual(toArray(map), [["a", 1], ["b", 2]]);
    });

    it("toArray handles null, undefined, or primitives safely", () => {
        assert.deepEqual(toArray(null), []);
        assert.deepEqual(toArray(undefined), []);
        assert.deepEqual(toArray(123), []);
    });
});