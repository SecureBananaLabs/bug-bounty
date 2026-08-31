import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findKey, findLastKey } from "../utils/findKey.js";

describe("findKey and findLastKey Utilities", () => {
    const users = {
        barney: { age: 36, active: true },
        fred: { age: 40, active: false },
        pebbles: { age: 1, active: true },
    };

    it("findKey finds first key matching predicate function", () => {
        assert.equal(findKey(users, (o) => o.age < 40), "barney");
    });

    it("findLastKey finds last key matching predicate function", () => {
        assert.equal(findLastKey(users, (o) => o.age < 40), "pebbles");
    });

    it("supports object matches property shorthand", () => {
        assert.equal(findKey(users, { age: 1, active: true }), "pebbles");
        assert.equal(findKey(users, ["active", false]), "fred");
        assert.equal(findKey(users, "active"), "barney");
        assert.equal(findLastKey(users, "active"), "pebbles");
    });

    it("returns undefined when no matches found or invalid object", () => {
        assert.equal(findKey(users, (o) => o.age > 100), undefined);
        assert.equal(findKey(null), undefined);
        assert.equal(findLastKey(undefined), undefined);
    });
});