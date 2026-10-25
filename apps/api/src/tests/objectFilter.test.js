import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickBy, omitBy } from "../utils/objectFilter.js";

describe("objectFilter Utility", () => {
    it("pickBy filters object by value predicate", () => {
        const input = { a: 1, b: "2", c: 3, d: false };
        const result = pickBy(input, (val) => typeof val === "number");
        assert.deepEqual(result, { a: 1, c: 3 });
    });

    it("omitBy filters object by inverted value predicate", () => {
        const input = { a: 1, b: "2", c: 3, d: false };
        const result = omitBy(input, (val) => typeof val === "number");
        assert.deepEqual(result, { b: "2", d: false });
    });

    it("handles null and non-object inputs gracefully", () => {
        assert.deepEqual(pickBy(null), {});
        assert.deepEqual(omitBy(undefined), {});
        assert.deepEqual(pickBy("string"), {});
    });

    it("prevents prototype pollution keys", () => {
        const evil = JSON.parse('{"__proto__": {"polluted": true}, "valid": 123}');
        const picked = pickBy(evil, () => true);
        const omitted = omitBy(evil, () => false);

        assert.equal(picked.__proto__, Object.prototype);
        assert.equal(omitted.__proto__, Object.prototype);
        assert.equal({}.polluted, undefined);
    });
});