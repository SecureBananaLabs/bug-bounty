import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deepClone } from "../utils/deepClone.js";

describe("deepClone Utility", () => {
    it("deeply clones nested objects and arrays", () => {
        const original = { a: 1, b: [2, 3, { c: 4 }] };
        const cloned = deepClone(original);

        assert.deepEqual(cloned, original);
        assert.notEqual(cloned, original);
        assert.notEqual(cloned.b, original.b);
        assert.notEqual(cloned.b[2], original.b[2]);
    });

    it("handles circular references without stack overflow", () => {
        const cycle = { name: "cycle" };
        cycle.self = cycle;

        const cloned = deepClone(cycle);
        assert.equal(cloned.name, "cycle");
        assert.equal(cloned.self, cloned);
        assert.notEqual(cloned, cycle);
    });

    it("clones Date, RegExp, Map, and Set correctly", () => {
        const date = new Date(1700000000000);
        const regex = /abc/gi;
        const map = new Map([["key", { val: 1 }]]);
        const set = new Set([1, { num: 2 }]);

        const clonedDate = deepClone(date);
        const clonedRegex = deepClone(regex);
        const clonedMap = deepClone(map);
        const clonedSet = deepClone(set);

        assert.equal(clonedDate.getTime(), date.getTime());
        assert.notEqual(clonedDate, date);

        assert.equal(clonedRegex.source, regex.source);
        assert.equal(clonedRegex.flags, regex.flags);

        assert.deepEqual(clonedMap.get("key"), { val: 1 });
        assert.notEqual(clonedMap.get("key"), map.get("key"));

        assert.equal(clonedSet.size, 2);
    });

    it("handles primitives and null safely", () => {
        assert.equal(deepClone(123), 123);
        assert.equal(deepClone("test"), "test");
        assert.equal(deepClone(null), null);
        assert.equal(deepClone(undefined), undefined);
    });
});