import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { set, setWith } from "../utils/set.js";

describe("set and setWith Utilities", () => {
    it("sets nested values creating intermediate objects", () => {
        const object = { a: { b: 2 } };
        set(object, "a.b", 3);
        assert.equal(object.a.b, 3);

        set(object, "x[0].y.z", 5);
        assert.equal(object.x[0].y.z, 5);
        assert.ok(Array.isArray(object.x));
    });

    it("prevents prototype pollution attacks", () => {
        const evil = {};
        set(evil, "__proto__.polluted", "yes");
        set(evil, "constructor.prototype.polluted", "yes");
        assert.equal({}.polluted, undefined);
        assert.equal(Object.prototype.polluted, undefined);
    });

    it("setWith allows customizer to instantiate custom objects", () => {
        const object = {};
        setWith(object, "[0][1]", "val", Object);
        assert.deepEqual(object, { "0": { "1": "val" } });
    });

    it("handles null or non-object root safely", () => {
        assert.equal(set(null, "a.b", 1), null);
        assert.equal(set(123, "a.b", 1), 123);
    });
});