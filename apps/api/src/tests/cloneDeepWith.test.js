import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cloneWith, cloneDeepWith } from "../utils/cloneDeepWith.js";

describe("cloneWith and cloneDeepWith Utilities", () => {
    it("cloneWith clones with customizer override", () => {
        const res = cloneWith(10, (val) => (typeof val === "number" ? val * 2 : undefined));
        assert.equal(res, 20);

        const customObj = cloneWith({ a: 1 }, (val) => {
            if (typeof val === "object") return { cloned: true };
        });
        assert.deepEqual(customObj, { cloned: true });
    });

    it("cloneDeepWith recursively clones with customizer and cycle safety", () => {
        const object = { a: 1, nested: { b: 2 } };
        const res = cloneDeepWith(object, (val, key) => {
            if (key === "b") return val + 100;
        });
        assert.deepEqual(res, { a: 1, nested: { b: 102 } });
        assert.notEqual(res.nested, object.nested);
    });

    it("handles circular references safely without stack overflows", () => {
        const circular = { a: 1 };
        circular.self = circular;

        const cloned = cloneDeepWith(circular);
        assert.equal(cloned.a, 1);
        assert.equal(cloned.self, cloned);
        assert.notEqual(cloned, circular);
    });

    it("handles dates, regex, maps, and sets cleanly", () => {
        const d = new Date(123456789);
        const r = /abc/gi;
        assert.equal(cloneDeepWith(d).getTime(), 123456789);
        assert.equal(cloneDeepWith(r).source, "abc");
    });
});