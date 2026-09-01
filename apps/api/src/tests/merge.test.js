import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { merge } from "../utils/merge.js";

describe("merge Utility", () => {
    it("merges objects deeply", () => {
        const target = { a: 1, b: { c: 2 } };
        const source = { b: { d: 3 }, e: 4 };
        const expected = { a: 1, b: { c: 2, d: 3 }, e: 4 };

        assert.deepEqual(merge(target, source), expected);
    });

    it("merges multiple objects", () => {
        const target = { a: 1 };
        const source1 = { b: 2 };
        const source2 = { c: 3 };
        const expected = { a: 1, b: 2, c: 3 };

        assert.deepEqual(merge(target, source1, source2), expected);
    });

    it("concatenates arrays", () => {
        const target = { arr: [1, 2] };
        const source = { arr: [3, 4] };
        const expected = { arr: [1, 2, 3, 4] };

        assert.deepEqual(merge(target, source), expected);
    });

    it("prevents prototype pollution", () => {
        const target = {};
        const payload = JSON.parse('{"__proto__":{"polluted":true}}');
        
        merge(target, payload);
        
        assert.equal({}.polluted, undefined);
    });
});