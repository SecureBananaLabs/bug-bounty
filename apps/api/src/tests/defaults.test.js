import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaults } from "../utils/defaults.js";

describe("defaults Utility", () => {
    it("fills in undefined properties from sources", () => {
        const target = { a: 1 };
        const res = defaults(target, { b: 2 }, { a: 3, c: 4 });
        assert.deepEqual(res, { a: 1, b: 2, c: 4 });
    });

    it("respects left-to-right source precedence", () => {
        const target = {};
        const res = defaults(target, { a: 1 }, { a: 2 });
        assert.equal(res.a, 1);
    });

    it("prevents prototype pollution", () => {
        const target = {};
        const evil = JSON.parse('{"__proto__": {"polluted": true}}');
        defaults(target, evil);
        assert.equal({}.polluted, undefined);
    });

    it("handles null and undefined sources safely", () => {
        const target = { a: 1 };
        assert.deepEqual(defaults(target, null, undefined, { b: 2 }), { a: 1, b: 2 });
    });
});